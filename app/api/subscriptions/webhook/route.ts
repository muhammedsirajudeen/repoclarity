import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/lib/models/Subscription';
import User from '@/lib/models/User';
import type { SubscriptionEvent } from '@/lib/models/Subscription';
import type { PlanId } from '@/lib/utils/subscriptionPlans';

/**
 * POST /api/subscriptions/webhook
 * Handles Dodo Payments webhook events for subscription lifecycle.
 * Each event creates a new Subscription record for history.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const eventType = body.type || body.event_type;

        console.log('Webhook received:', eventType, JSON.stringify(body));

        await dbConnect();

        const data = body.data || body;
        const metadata = data.metadata || {};
        const userId = metadata.userId;
        const dodoSubscriptionId = data.subscription_id || data.id;

        let resolvedUserId = userId;

        // If no userId in metadata, find by subscription ID
        if (!resolvedUserId && dodoSubscriptionId) {
            const existingSub = await Subscription.findOne({
                dodoSubscriptionId,
            })
                .sort({ createdAt: -1 })
                .lean();

            if (existingSub) {
                resolvedUserId = existingSub.userId.toString();
            }
        }

        if (!resolvedUserId) {
            console.warn('Webhook: no userId found');
            return NextResponse.json({ received: true });
        }

        // Verify user exists
        const user = await User.findById(resolvedUserId);
        if (!user) {
            console.warn('Webhook: user not found:', resolvedUserId);
            return NextResponse.json({ received: true });
        }

        const plan = (metadata.plan as PlanId) || 'pro';

        // Map Dodo event types to our status
        const statusMap: Record<string, SubscriptionEvent> = {
            'subscription.active': 'active',
            'subscription.created': 'created',
            'subscription.renewed': 'renewed',
            'subscription.cancelled': 'cancelled',
            'subscription.expired': 'expired',
            'subscription.failed': 'failed',
        };

        const status = statusMap[eventType];
        if (!status) {
            console.log('Unhandled webhook event:', eventType);
            return NextResponse.json({ received: true });
        }

        // Create a new Subscription record for history
        await Subscription.create({
            userId: resolvedUserId,
            dodoSubscriptionId: dodoSubscriptionId || '',
            plan,
            status,
            productId: (data.product_id as string) || '',
            metadata: data,
        });

        console.log(
            `Subscription event recorded: ${status} for user ${resolvedUserId}`
        );

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
