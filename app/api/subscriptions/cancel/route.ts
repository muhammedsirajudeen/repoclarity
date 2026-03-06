import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/getUser';
import envConfig from '@/lib/utils/env.config';
import dbConnect from '@/lib/db';
import Subscription from '@/lib/models/Subscription';

/**
 * POST /api/subscriptions/cancel
 * Cancels a Dodo Payments subscription.
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

        await dbConnect();

        // 1. Get user's active subscription
        const activeSub = await Subscription.getActiveSubscription(user._id);

        if (!activeSub || !activeSub.dodoSubscriptionId) {
            return NextResponse.json(
                { error: 'No active subscription found to cancel' },
                { status: 404 }
            );
        }

        if (!envConfig.dodoPaymentsKey) {
            return NextResponse.json(
                { error: 'Payment provider not configured' },
                { status: 500 }
            );
        }

        // 2. Call Dodo Payments API to cancel the subscription
        const response = await fetch(
            `https://test.dodopayments.com/subscriptions/${activeSub.dodoSubscriptionId}`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${envConfig.dodoPaymentsKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'cancelled'
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Dodo Payments cancellation error:', errorData);
            return NextResponse.json(
                { error: 'Failed to cancel subscription with payment provider' },
                { status: 502 }
            );
        }

        const data = await response.json();
        console.log('Dodo Payments logic response:', JSON.stringify(data, null, 2));

        // 3. Keep the db in sync (the webhook should also handle this eventually, 
        //    but doing it here directly makes the UI feel more responsive)
        await Subscription.create({
            userId: user._id,
            dodoSubscriptionId: activeSub.dodoSubscriptionId,
            plan: activeSub.plan,
            status: 'cancelled',
            productId: activeSub.productId,
            metadata: { source: 'api_cancel' },
        });

        return NextResponse.json({
            success: true,
            subscriptionId: data.subscription_id,
        });
    } catch (err) {
        console.error('Error cancelling subscription:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
