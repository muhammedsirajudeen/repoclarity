import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function setAuthCookies(
    response: NextResponse,
    accessToken: string,
    refreshToken: string
): void {
    response.cookies.set('access_token', accessToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

export function clearAuthCookies(response: NextResponse): void {
    response.cookies.set('access_token', '', {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    response.cookies.set('refresh_token', '', {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}

export async function getTokensFromCookies(): Promise<{
    accessToken: string | undefined;
    refreshToken: string | undefined;
}> {
    const cookieStore = await cookies();
    return {
        accessToken: cookieStore.get('access_token')?.value,
        refreshToken: cookieStore.get('refresh_token')?.value,
    };
}
