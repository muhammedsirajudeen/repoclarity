import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_PATHS = ['/dashboard'];

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (!isProtectedPath(pathname)) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    let isAuthValid = false;

    if (accessToken) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
            await jwtVerify(accessToken, secret);
            isAuthValid = true;
        } catch {
            // Access token invalid or expired
        }
    }

    if (!isAuthValid && refreshToken) {
        try {
            const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
            await jwtVerify(refreshToken, refreshSecret);
            isAuthValid = true;
        } catch {
            // Refresh token invalid or expired
        }
    }

    if (!isAuthValid) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
