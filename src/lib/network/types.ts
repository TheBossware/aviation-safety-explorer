import type { ObjectId } from "mongodb";

export type FlightType = "domestic" | "international" | "cargo" | "mixed";

export const FLIGHT_TYPE_VALUES: readonly FlightType[] = [
  "domestic",
  "international",
  "cargo",
  "mixed",
];

export interface NetworkAirport {
  _id: ObjectId | string;
  airportCode: string;
  city: string;
  country: string;
  region: string;
  flightType: FlightType;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type CreateNetworkAirportInput = Omit<NetworkAirport, "_id" | "createdAt" | "updatedAt">;
export type UpdateNetworkAirportInput = Partial<CreateNetworkAirportInput>;
