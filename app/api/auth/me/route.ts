import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getTokensFromCookies } from '@/lib/auth/cookies';

export async function GET() {
    try {
        const { accessToken } = await getTokensFromCookies();

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const payload = verifyAccessToken(accessToken);

        await dbConnect();

        const user = await User.findById(payload.userId).select(
            '-githubAccessToken -refreshToken'
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user._id,
                githubId: user.githubId,
                username: user.username,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
            },
        });
    } catch {
        return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
        );
    }
}
