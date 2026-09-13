import mongoose, { Schema, type Model } from "mongoose";
import { FLIGHT_TYPE_VALUES, type NetworkAirport } from "./types";

const NetworkSchema = new Schema<NetworkAirport>(
  {
    airportCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    region: { type: String, required: true },
    flightType: { type: String, enum: FLIGHT_TYPE_VALUES, required: true },
  },
  { timestamps: true, collection: "network" }
);

export const NetworkModel: Model<NetworkAirport> =
  (mongoose.models.Network as Model<NetworkAirport>) ??
  mongoose.model<NetworkAirport>("Network", NetworkSchema);
