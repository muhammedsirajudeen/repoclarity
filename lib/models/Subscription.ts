import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { PlanId } from '@/lib/utils/subscriptionPlans';

export type SubscriptionEvent =
    | 'active'
    | 'created'
    | 'renewed'
    | 'cancelled'
    | 'expired'
    | 'failed';

export interface ISubscription extends Document {
    userId: Types.ObjectId;
    dodoSubscriptionId: string;
    plan: PlanId;
    status: SubscriptionEvent;
    productId: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

interface SubscriptionModel extends Model<ISubscription> {
    getActivePlan(userId: Types.ObjectId | string): Promise<PlanId>;
    getActiveSubscription(
        userId: Types.ObjectId | string
    ): Promise<ISubscription | null>;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        dodoSubscriptionId: {
            type: String,
            default: '',
            index: true,
        },
        plan: {
            type: String,
            enum: ['free', 'pro', 'business'],
            required: true,
        },
        status: {
            type: String,
            enum: [
                'active',
                'created',
                'renewed',
                'cancelled',
                'expired',
                'failed',
            ],
            required: true,
        },
        productId: {
            type: String,
            default: '',
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Returns the latest active subscription document for a user.
 * A subscription is considered active if its latest event is 'active', 'renewed',
 * or 'cancelled' (since cancelled means it's pending cancellation at period end).
 * It will become inactive when an 'expired' or 'failed' event arrives, or if
 * the current date passes the next billing date of the latest active/renewed event.
 */
SubscriptionSchema.statics.getActiveSubscription = async function (
    userId: Types.ObjectId | string
): Promise<ISubscription | null> {
    // Get the absolutely latest record for this user
    const latestSub = await this.findOne({ userId })
        .sort({ createdAt: -1 })
        .lean();

    if (!latestSub) return null;

    if (['expired', 'failed'].includes(latestSub.status)) {
        return null; // Explicitly dead
    }

    // Even if it's 'cancelled', find the most recent 'active' or 'renewed' record 
    // to confidently check its next_billing_date or creation time.
    const lastActive = await this.findOne({
        userId,
        status: { $in: ['active', 'renewed'] }
    })
        .sort({ createdAt: -1 })
        .lean();

    if (!lastActive) return null;

    // Determine the true expiry date
    let expiryDate: Date;
    if (lastActive.metadata?.next_billing_date) {
        expiryDate = new Date(lastActive.metadata.next_billing_date as string);
        // Add a small 2-day grace period for webhooks to arrive
        expiryDate.setDate(expiryDate.getDate() + 2);
    } else {
        // Fallback: 32 days from the last active record
        expiryDate = new Date(lastActive.createdAt);
        expiryDate.setDate(expiryDate.getDate() + 32);
    }

    if (new Date() > expiryDate) {
        return null; // The billing period has expired
    }

    // Still valid
    return latestSub;
};

/**
 * Returns the current active plan for a user, or 'free' if none.
 */
SubscriptionSchema.statics.getActivePlan = async function (
    userId: Types.ObjectId | string
): Promise<PlanId> {
    const activeSub = await (this as SubscriptionModel).getActiveSubscription(userId);
    return activeSub ? activeSub.plan : 'free';
};

// For Next.js HMR: delete the existing model if we're hot-reloading
if (mongoose.models.Subscription) {
    delete mongoose.models.Subscription;
}

const Subscription: SubscriptionModel = mongoose.model<ISubscription, SubscriptionModel>(
    'Subscription',
    SubscriptionSchema
);

export default Subscription;
