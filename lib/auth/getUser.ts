import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getTokensFromCookies } from '@/lib/auth/cookies';
import { IUser } from '@/lib/models/User';

/**
 * Shared helper to authenticate a user from cookies in API routes.
 * Returns the user document or null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<IUser | null> {
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
