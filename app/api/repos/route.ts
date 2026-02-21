import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Repository from '@/lib/models/Repository';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getTokensFromCookies } from '@/lib/auth/cookies';
import { getPlanLimits } from '@/lib/utils/subscriptionPlans';

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

        await dbConnect();
        const repos = await Repository.find({ userId: user._id })
            .sort({ connectedAt: -1 })
            .lean();

        return NextResponse.json({ repos });
    } catch (err) {
        console.error('Error fetching connected repos:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            githubRepoId,
            name,
            fullName,
            owner,
            description,
            language,
            defaultBranch,
            isPrivate,
            url,
            dbType,
            backendLanguage,
            orm,
        } = body;

        if (!githubRepoId || !fullName || !name || !owner || !url) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check subscription repo limit
        const plan = user.subscriptionPlan || 'free';
        const limits = getPlanLimits(plan);

        if (limits.repoLimit !== -1) {
            const existing = await Repository.findOne({
                userId: user._id,
                githubRepoId,
            });

            // Only enforce limit for NEW repos, not re-connections
            if (!existing) {
                const repoCount = await Repository.countDocuments({
                    userId: user._id,
                });

                if (repoCount >= limits.repoLimit) {
                    return NextResponse.json(
                        {
                            error: 'REPO_LIMIT_REACHED',
                            message: `Your ${plan} plan allows up to ${limits.repoLimit} repository. Upgrade your plan to connect more.`,
                            limit: limits.repoLimit,
                            current: repoCount,
                            plan,
                        },
                        { status: 403 }
                    );
                }
            }
        }

        const repo = await Repository.findOneAndUpdate(
            { userId: user._id, githubRepoId },
            {
                $set: {
                    name,
                    fullName,
                    owner,
                    description: description || '',
                    language: language || '',
                    defaultBranch: defaultBranch || 'main',
                    isPrivate: isPrivate || false,
                    url,
                    dbType: dbType || '',
                    backendLanguage: backendLanguage || '',
                    orm: orm || '',
                },
                $setOnInsert: {
                    userId: user._id,
                    githubRepoId,
                    connectedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ repo }, { status: 201 });
    } catch (err) {
        console.error('Error connecting repo:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const githubRepoId = searchParams.get('githubRepoId');

        if (!githubRepoId) {
            return NextResponse.json(
                { error: 'Missing githubRepoId' },
                { status: 400 }
            );
        }

        await dbConnect();

        await Repository.findOneAndDelete({
            userId: user._id,
            githubRepoId: Number(githubRepoId),
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error disconnecting repo:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
