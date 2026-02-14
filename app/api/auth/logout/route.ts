import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyAccessToken } from '@/lib/auth/jwt';
import {
    getTokensFromCookies,
    clearAuthCookies,
} from '@/lib/auth/cookies';

export async function POST() {
    try {
        const { accessToken } = await getTokensFromCookies();

        if (accessToken) {
            try {
                const payload = verifyAccessToken(accessToken);
                await dbConnect();
                await User.findByIdAndUpdate(payload.userId, { refreshToken: '' });
            } catch {
                // Token may be expired — still clear cookies
            }
        }

        const response = NextResponse.json({ success: true });
        clearAuthCookies(response);
        return response;
    } catch {
        const response = NextResponse.json({ success: true });
        clearAuthCookies(response);
        return response;
    }
}
