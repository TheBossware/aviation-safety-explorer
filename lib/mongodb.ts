import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is not set. Add it to .env.local before using the Sources API."
  );
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Reuse a single connection across hot reloads in dev and across module
// instances in prod (standard Next.js singleton pattern).
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
