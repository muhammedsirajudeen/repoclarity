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
 * Returns the current active plan for a user, or 'free' if none.
 */
SubscriptionSchema.statics.getActivePlan = async function (
    userId: Types.ObjectId | string
): Promise<PlanId> {
    const sub = await this.findOne({
        userId,
        status: { $in: ['active', 'renewed'] },
    })
        .sort({ createdAt: -1 })
        .lean();

    return (sub?.plan as PlanId) || 'free';
};

/**
 * Returns the latest active subscription document for a user.
 */
SubscriptionSchema.statics.getActiveSubscription = async function (
    userId: Types.ObjectId | string
): Promise<ISubscription | null> {
    return this.findOne({
        userId,
        status: { $in: ['active', 'renewed'] },
    })
        .sort({ createdAt: -1 })
        .lean();
};

const Subscription: SubscriptionModel =
    (mongoose.models.Subscription as SubscriptionModel) ||
    mongoose.model<ISubscription, SubscriptionModel>(
        'Subscription',
        SubscriptionSchema
    );

export default Subscription;
