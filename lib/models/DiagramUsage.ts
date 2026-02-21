import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDiagramUsage extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD format
    count: number;
    createdAt: Date;
    updatedAt: Date;
}

const DiagramUsageSchema = new Schema<IDiagramUsage>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: String,
            required: true,
        },
        count: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

DiagramUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

const DiagramUsage: Model<IDiagramUsage> =
    mongoose.models.DiagramUsage ||
    mongoose.model<IDiagramUsage>('DiagramUsage', DiagramUsageSchema);

export default DiagramUsage;
