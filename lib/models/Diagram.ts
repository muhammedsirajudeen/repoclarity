import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFieldDef {
    name: string;
    type: string;
    required: boolean;
    ref?: string;
    isArray: boolean;
    defaultValue?: string;
    enumValues?: string[];
}

export interface IModelDef {
    name: string;
    filePath: string;
    fields: IFieldDef[];
}

export interface IDiagram extends Document {
    repositoryId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    models: IModelDef[];
    createdAt: Date;
    updatedAt: Date;
}

const FieldDefSchema = new Schema<IFieldDef>(
    {
        name: { type: String, required: true },
        type: { type: String, required: true },
        required: { type: Boolean, default: false },
        ref: { type: String },
        isArray: { type: Boolean, default: false },
        defaultValue: { type: String },
        enumValues: [{ type: String }],
    },
    { _id: false }
);

const ModelDefSchema = new Schema<IModelDef>(
    {
        name: { type: String, required: true },
        filePath: { type: String, required: true },
        fields: [FieldDefSchema],
    },
    { _id: false }
);

const DiagramSchema = new Schema<IDiagram>(
    {
        repositoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Repository',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        models: [ModelDefSchema],
    },
    {
        timestamps: true,
    }
);

DiagramSchema.index({ userId: 1, repositoryId: 1 });

const Diagram: Model<IDiagram> =
    mongoose.models.Diagram ||
    mongoose.model<IDiagram>('Diagram', DiagramSchema);

export default Diagram;
