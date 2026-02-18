import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Diagram from '@/lib/models/Diagram';
import Repository from '@/lib/models/Repository';
import { getAuthenticatedUser } from '@/lib/auth/getUser';

/**
 * GET /api/diagrams/[id]
 * Fetch a single diagram by ID.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { id } = await params;
        await dbConnect();

        const diagram = await Diagram.findOne({
            _id: id,
            userId: user._id,
        })
            .populate('repositoryId', 'name fullName owner orm dbType url')
            .lean();

        if (!diagram) {
            return NextResponse.json(
                { error: 'Diagram not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ diagram });
    } catch (err) {
        console.error('Error fetching diagram:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/diagrams/[id]
 * Delete a diagram and unset hasDiagram on the repository.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { id } = await params;
        await dbConnect();

        const diagram = await Diagram.findOne({
            _id: id,
            userId: user._id,
        });

        if (!diagram) {
            return NextResponse.json(
                { error: 'Diagram not found' },
                { status: 404 }
            );
        }

        // Unset hasDiagram on the repository
        await Repository.updateOne(
            { _id: diagram.repositoryId },
            { $set: { hasDiagram: false } }
        );

        await Diagram.deleteOne({ _id: diagram._id });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting diagram:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
