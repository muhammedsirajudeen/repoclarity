import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRepository extends Document {
    userId: mongoose.Types.ObjectId;
    githubRepoId: number;
    fullName: string;
    name: string;
    owner: string;
    description: string;
    language: string;
    defaultBranch: string;
    isPrivate: boolean;
    url: string;
    connectedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const RepositorySchema = new Schema<IRepository>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        githubRepoId: {
            type: Number,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        owner: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        language: {
            type: String,
            default: '',
        },
        defaultBranch: {
            type: String,
            default: 'main',
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        url: {
            type: String,
            required: true,
        },
        connectedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

RepositorySchema.index({ userId: 1, githubRepoId: 1 }, { unique: true });

const Repository: Model<IRepository> =
    mongoose.models.Repository ||
    mongoose.model<IRepository>('Repository', RepositorySchema);

export default Repository;
