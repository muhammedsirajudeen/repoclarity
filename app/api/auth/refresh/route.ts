import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import {
    verifyRefreshToken,
    signAccessToken,
    signRefreshToken,
} from '@/lib/auth/jwt';
import { getTokensFromCookies, setAuthCookies } from '@/lib/auth/cookies';

export async function POST() {
    try {
        const { refreshToken } = await getTokensFromCookies();

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        const payload = verifyRefreshToken(refreshToken);

        await dbConnect();

        const user = await User.findById(payload.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Validate stored refresh token matches (token rotation security)
        if (user.refreshToken !== refreshToken) {
            // Possible token reuse attack — clear user's refresh token
            await User.findByIdAndUpdate(user._id, { refreshToken: '' });
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        // Rotate tokens
        const newAccessToken = signAccessToken(user._id.toString());
        const newRefreshToken = signRefreshToken(user._id.toString());

        await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

        const response = NextResponse.json({ success: true });
        setAuthCookies(response, newAccessToken, newRefreshToken);

        return response;
    } catch {
        return NextResponse.json(
            { error: 'Invalid or expired refresh token' },
            { status: 401 }
        );
    }
}
