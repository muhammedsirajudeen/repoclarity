import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Repository from '@/lib/models/Repository';
import Diagram from '@/lib/models/Diagram';
import DiagramUsage from '@/lib/models/DiagramUsage';
import { getAuthenticatedUser } from '@/lib/auth/getUser';
import { parseMongooseSchemas, isModelFile, hasSchemaContent } from '@/lib/utils/schemaParser';
import { getPlanLimits } from '@/lib/utils/subscriptionPlans';

interface GitHubTreeItem {
    path: string;
    type: string;
    sha: string;
    url: string;
}

/**
 * Fetch all file paths from a GitHub repo using the Trees API.
 */
async function fetchRepoTree(
    owner: string,
    repo: string,
    branch: string,
    token: string
): Promise<GitHubTreeItem[]> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        }
    );

    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
    }

    const data = await res.json();
    return data.tree || [];
}

/**
 * Fetch file content from GitHub.
 */
async function fetchFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string,
    token: string
): Promise<string> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        }
    );

    if (!res.ok) return '';

    const data = await res.json();
    if (data.encoding === 'base64' && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return '';
}

/**
 * POST /api/diagrams/generate
 * Scans a connected repo for Mongoose schemas and generates a diagram.
 */
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
        const { repoId } = body;

        if (!repoId) {
            return NextResponse.json(
                { error: 'Missing repoId' },
                { status: 400 }
            );
        }

        await dbConnect();

        const repo = await Repository.findOne({
            _id: repoId,
            userId: user._id,
        });

        if (!repo) {
            return NextResponse.json(
                { error: 'Repository not found' },
                { status: 404 }
            );
        }

        // Only Mongoose is supported for now
        if (repo.orm !== 'mongoose') {
            return NextResponse.json({
                supported: false,
                message: `Diagram generation for "${repo.orm}" is coming soon.`,
            });
        }

        // Check daily diagram generation limit
        const plan = user.subscriptionPlan || 'free';
        const limits = getPlanLimits(plan);
        const today = new Date().toISOString().split('T')[0];

        if (limits.diagramsPerDay !== -1) {
            const usage = await DiagramUsage.findOne({
                userId: user._id,
                date: today,
            });

            if (usage && usage.count >= limits.diagramsPerDay) {
                return NextResponse.json(
                    {
                        error: 'DIAGRAM_LIMIT_REACHED',
                        message: `Your ${plan} plan allows ${limits.diagramsPerDay} diagram generation(s) per day. Upgrade to generate more.`,
                        limit: limits.diagramsPerDay,
                        current: usage.count,
                        plan,
                    },
                    { status: 403 }
                );
            }
        }

        // Fetch the repo tree
        const tree = await fetchRepoTree(
            repo.owner,
            repo.name,
            repo.defaultBranch,
            user.githubAccessToken
        );

        // Get all JS/TS blobs
        const jsFiles = tree.filter((item) => {
            if (item.type !== 'blob') return false;
            const ext = item.path.split('.').pop()?.toLowerCase();
            return ext ? ['js', 'ts', 'mjs', 'cjs'].includes(ext) : false;
        });

        // Phase 1: files in model directories (always scan)
        const modelDirFiles = jsFiles.filter((f) => isModelFile(f.path));

        // Phase 2: other files — fetch and check for schema content
        const otherFiles = jsFiles.filter(
            (f) => !isModelFile(f.path)
        ).slice(0, 40); // cap to avoid excessive API calls

        // Fetch model-dir files first
        const modelDirContents = await Promise.all(
            modelDirFiles.slice(0, 30).map(async (file) => ({
                path: file.path,
                content: await fetchFileContent(
                    repo.owner, repo.name, file.path,
                    repo.defaultBranch, user.githubAccessToken
                ),
            }))
        );

        // Fetch other files and only keep those with schema content
        const otherContents = await Promise.all(
            otherFiles.map(async (file) => ({
                path: file.path,
                content: await fetchFileContent(
                    repo.owner, repo.name, file.path,
                    repo.defaultBranch, user.githubAccessToken
                ),
            }))
        );
        const extraSchemaFiles = otherContents.filter(
            (f) => f.content.length > 0 && hasSchemaContent(f.content)
        );

        const allFiles = [
            ...modelDirContents.filter((f) => f.content.length > 0),
            ...extraSchemaFiles,
        ];

        // Parse Mongoose schemas
        const models = parseMongooseSchemas(allFiles);

        if (models.length === 0) {
            return NextResponse.json({
                supported: true,
                models: [],
                message: 'No Mongoose schemas were found in the repository.',
            });
        }

        // Upsert diagram
        const diagram = await Diagram.findOneAndUpdate(
            { repositoryId: repo._id, userId: user._id },
            {
                $set: {
                    models,
                    repositoryId: repo._id,
                    userId: user._id,
                },
            },
            { upsert: true, new: true }
        );

        // Mark repo as having a diagram
        await Repository.updateOne(
            { _id: repo._id },
            { $set: { hasDiagram: true } }
        );

        // Increment daily diagram usage
        await DiagramUsage.findOneAndUpdate(
            { userId: user._id, date: today },
            { $inc: { count: 1 } },
            { upsert: true }
        );

        return NextResponse.json({
            supported: true,
            diagram,
        });
    } catch (err) {
        console.error('Error generating diagram:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
