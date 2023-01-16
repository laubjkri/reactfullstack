import { MongoClient } from "mongodb";

let db;
let collection;

async function connectToDb(address, dbName, collectionName) {
  const client = new MongoClient(address);
  await client.connect();  
  db = client.db(dbName); 
  collection = db.collection(collectionName);
  console.log("Successfully connected to database!");  
}

export {
  connectToDb,
  db,
  collection
};