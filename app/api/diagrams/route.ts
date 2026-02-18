import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Diagram from '@/lib/models/Diagram';
import { getAuthenticatedUser } from '@/lib/auth/getUser';

/**
 * GET /api/diagrams
 * List all diagrams for the authenticated user.
 * Optional query: ?repoId=<repositoryId> to filter by repository.
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const repoId = searchParams.get('repoId');

        const query: Record<string, unknown> = { userId: user._id };
        if (repoId) {
            query.repositoryId = repoId;
        }

        const diagrams = await Diagram.find(query)
            .sort({ updatedAt: -1 })
            .populate('repositoryId', 'name fullName owner orm dbType')
            .lean();

        return NextResponse.json({ diagrams });
    } catch (err) {
        console.error('Error fetching diagrams:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
