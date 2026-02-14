import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Repository from '@/lib/models/Repository';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getTokensFromCookies } from '@/lib/auth/cookies';

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
    description: string | null;
    language: string | null;
    default_branch: string;
    private: boolean;
    html_url: string;
    updated_at: string;
}

async function getAuthenticatedUser() {
    const { accessToken } = await getTokensFromCookies();
    if (!accessToken) return null;

    try {
        const payload = verifyAccessToken(accessToken);
        await dbConnect();
        return await User.findById(payload.userId);
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        if (!user.githubAccessToken) {
            return NextResponse.json(
                { error: 'No GitHub token found' },
                { status: 400 }
            );
        }

        // Fetch all repos from GitHub (paginated)
        const allRepos: GitHubRepo[] = [];
        let page = 1;
        const perPage = 100;

        while (true) {
            const response = await fetch(
                `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
                {
                    headers: {
                        Authorization: `Bearer ${user.githubAccessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('GitHub API error:', errorData);
                return NextResponse.json(
                    { error: 'Failed to fetch GitHub repos' },
                    { status: response.status }
                );
            }

            const repos: GitHubRepo[] = await response.json();
            allRepos.push(...repos);

            if (repos.length < perPage) break;
            page++;

            // Safety cap at 500 repos
            if (allRepos.length >= 500) break;
        }

        // Get connected repo IDs for this user
        const connectedRepos = await Repository.find(
            { userId: user._id },
            { githubRepoId: 1 }
        );
        const connectedIds = new Set(
            connectedRepos.map((r) => r.githubRepoId)
        );

        const repos = allRepos.map((repo) => ({
            githubRepoId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            owner: repo.owner.login,
            description: repo.description || '',
            language: repo.language || '',
            defaultBranch: repo.default_branch,
            isPrivate: repo.private,
            url: repo.html_url,
            updatedAt: repo.updated_at,
            connected: connectedIds.has(repo.id),
        }));

        return NextResponse.json({ repos });
    } catch (err) {
        console.error('Error fetching GitHub repos:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
