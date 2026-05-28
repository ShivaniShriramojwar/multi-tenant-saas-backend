import mongoose, { Schema, Document } from "mongoose";

interface ITenant extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Tenant = mongoose.model<ITenant>("Tenant", tenantSchema);

export { Tenant, ITenant };
