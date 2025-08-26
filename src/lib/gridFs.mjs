import { MongoClient, GridFSBucket } from "mongodb";
import config from "../config/config.mjs";

let gridFSBucket;

const initializeGridFS = async () => {
  const client = new MongoClient(
    `mongodb+srv://${config.DB_USER}:${config.DB_PASSWORD}@cluster0.rczok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  );
  await client.connect();
  const db = client.db();
  gridFSBucket = new GridFSBucket(db);
};

export { gridFSBucket, initializeGridFS };
