import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/getUser';
import envConfig from '@/lib/utils/env.config';
import type { PlanId } from '@/lib/utils/subscriptionPlans';
import dbConnect from '@/lib/db';
import Subscription from '@/lib/models/Subscription';

/**
 * POST /api/subscriptions/checkout
 * Creates a Dodo Payments checkout session and returns the checkout URL.
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
        const { plan } = body as { plan: PlanId };

        if (!plan || !['pro', 'business'].includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan. Must be "pro" or "business".' },
                { status: 400 }
            );
        }

        const productId =
            plan === 'pro'
                ? envConfig.proProductId
                : envConfig.businessProductId;

        if (!productId) {
            return NextResponse.json(
                { error: 'Product not configured' },
                { status: 500 }
            );
        }

        if (!envConfig.dodoPaymentsKey) {
            return NextResponse.json(
                { error: 'Payment provider not configured' },
                { status: 500 }
            );
        }

        // Create checkout session via Dodo Payments REST API
        const response = await fetch(
            'https://test.dodopayments.com/subscriptions',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${envConfig.dodoPaymentsKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    billing: {
                        city: 'NA',
                        country: 'US',
                        state: 'NA',
                        street: 'NA',
                        zipcode: '00000',
                    },
                    customer: {
                        email: user.email || `${user.username}@github.com`,
                        name: user.name || user.username,
                    },
                    product_id: productId,
                    payment_link: true,
                    quantity: 1,
                    return_url: `${envConfig.appUrl}/dashboard?subscribed=true&plan=${plan}`,
                    metadata: {
                        userId: user._id.toString(),
                        plan,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Dodo Payments error:', errorData);
            return NextResponse.json(
                { error: 'Failed to create checkout session' },
                { status: 502 }
            );
        }

        const data = await response.json();
        console.log('Dodo Payments response:', JSON.stringify(data, null, 2));

        // Create a Subscription record immediately
        try {
            await dbConnect();
            await Subscription.create({
                userId: user._id,
                dodoSubscriptionId: data.subscription_id || '',
                plan,
                status: 'active',
                productId: productId || '',
                metadata: { source: 'checkout' },
            });
        } catch (dbErr) {
            console.error('Failed to create subscription record:', dbErr);
        }

        return NextResponse.json({
            checkoutUrl: data.payment_link,
            subscriptionId: data.subscription_id,
        });
    } catch (err) {
        console.error('Error creating checkout:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
