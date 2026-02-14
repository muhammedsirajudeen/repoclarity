import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { setAuthCookies } from '@/lib/auth/cookies';

interface GitHubTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
}

interface GitHubUser {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
}

interface GitHubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
}

async function exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }),
    });

    const data = await response.json();

    if (!data.access_token) {
        console.error('GitHub token exchange failed:', JSON.stringify(data));
        throw new Error(`Failed to exchange code for access token: ${data.error_description || data.error || 'Unknown error'}`);
    }

    return data.access_token;
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch GitHub user');
    }

    return response.json();
}

async function fetchGitHubEmail(accessToken: string): Promise<string> {
    const response = await fetch('https://api.github.com/user/emails', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });

    if (!response.ok) return '';

    const emails: GitHubEmail[] = await response.json();
    const primaryEmail = emails.find((e) => e.primary && e.verified);
    return primaryEmail?.email || emails[0]?.email || '';
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/login?error=access_denied', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    try {
        const githubAccessToken = await exchangeCodeForToken(code);
        const [githubUser, email] = await Promise.all([
            fetchGitHubUser(githubAccessToken),
            fetchGitHubEmail(githubAccessToken),
        ]);

        await dbConnect();

        const refreshToken = signRefreshToken(String(githubUser.id));

        const user = await User.findOneAndUpdate(
            { githubId: String(githubUser.id) },
            {
                $set: {
                    username: githubUser.login,
                    name: githubUser.name || githubUser.login,
                    email: email || githubUser.email || '',
                    avatarUrl: githubUser.avatar_url,
                    githubAccessToken,
                    refreshToken,
                },
                $setOnInsert: {
                    githubId: String(githubUser.id),
                },
            },
            { upsert: true, new: true }
        );

        const accessToken = signAccessToken(user._id.toString());
        const jwtRefreshToken = signRefreshToken(user._id.toString());

        // Update the refresh token with the one tied to our user _id
        await User.findByIdAndUpdate(user._id, { refreshToken: jwtRefreshToken });

        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        setAuthCookies(response, accessToken, jwtRefreshToken);

        return response;
    } catch (err) {
        console.error('GitHub OAuth callback error:', err);
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
}
