import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubscriptionPlan = 'free' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'none';

export interface IUser extends Document {
    githubId: string;
    username: string;
    email: string;
    name: string;
    avatarUrl: string;
    githubAccessToken: string;
    refreshToken: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        githubId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            default: '',
        },
        name: {
            type: String,
            default: '',
        },
        avatarUrl: {
            type: String,
            default: '',
        },
        githubAccessToken: {
            type: String,
            default: '',
        },
        refreshToken: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

