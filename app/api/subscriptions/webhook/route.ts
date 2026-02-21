import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import type { SubscriptionPlan } from '@/lib/models/User';

/**
 * POST /api/subscriptions/webhook
 * Handles Dodo Payments webhook events for subscription lifecycle.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const eventType = body.type || body.event_type;

        console.log('Webhook received:', eventType, JSON.stringify(body));

        await dbConnect();

        // Extract relevant data from the webhook payload
        const data = body.data || body;
        const metadata = data.metadata || {};
        const userId = metadata.userId;
        const subscriptionId = data.subscription_id || data.id;

        if (!userId) {
            // Try to find user by subscription ID if no userId in metadata
            if (subscriptionId) {
                const user = await User.findOne({ subscriptionId });
                if (user) {
                    return await handleEvent(eventType, user, data);
                }
            }
            console.warn('Webhook: no userId found in metadata');
            return NextResponse.json({ received: true });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.warn('Webhook: user not found:', userId);
            return NextResponse.json({ received: true });
        }

        return await handleEvent(eventType, user, data);
    } catch (err) {
        console.error('Webhook error:', err);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleEvent(
    eventType: string,
    user: InstanceType<typeof User>,
    data: Record<string, unknown>
) {
    const metadata = (data.metadata || {}) as Record<string, string>;
    const plan = (metadata.plan as SubscriptionPlan) || 'pro';
    const subscriptionId = (data.subscription_id || data.id) as string;

    switch (eventType) {
        case 'subscription.active':
        case 'subscription.created':
        case 'subscription.renewed': {
            user.subscriptionPlan = plan;
            user.subscriptionStatus = 'active';
            user.subscriptionId = subscriptionId || '';
            await user.save();
            break;
        }

        case 'subscription.cancelled': {
            user.subscriptionStatus = 'cancelled';
            await user.save();
            break;
        }

        case 'subscription.expired':
        case 'subscription.failed': {
            user.subscriptionPlan = 'free';
            user.subscriptionStatus = 'expired';
            user.subscriptionId = '';
            await user.save();
            break;
        }

        default:
            console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ received: true });
}
