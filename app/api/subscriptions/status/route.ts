import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/getUser';
import { getPlanLimits } from '@/lib/utils/subscriptionPlans';
import dbConnect from '@/lib/db';
import Repository from '@/lib/models/Repository';
import DiagramUsage from '@/lib/models/DiagramUsage';
import Subscription from '@/lib/models/Subscription';

/**
 * GET /api/subscriptions/status
 * Returns the current user's subscription info and usage.
 */
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

        const plan = await Subscription.getActivePlan(user._id);
        const activeSub = await Subscription.getActiveSubscription(user._id);
        const limits = getPlanLimits(plan);

        // Count connected repos
        const repoCount = await Repository.countDocuments({
            userId: user._id,
        });

        // Get today's diagram usage
        const today = new Date().toISOString().split('T')[0];
        const usage = await DiagramUsage.findOne({
            userId: user._id,
            date: today,
        });

        return NextResponse.json({
            plan,
            status: activeSub ? 'active' : 'none',
            subscriptionId: activeSub?.dodoSubscriptionId || '',
            limits: {
                repoLimit: limits.repoLimit,
                diagramsPerDay: limits.diagramsPerDay,
            },
            usage: {
                reposConnected: repoCount,
                diagramsToday: usage?.count || 0,
            },
        });
    } catch (err) {
        console.error('Error fetching subscription status:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

