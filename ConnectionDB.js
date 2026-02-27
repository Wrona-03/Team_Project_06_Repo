const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://wiktoriasocha236_db_user:eTBMXMvI1pc4eyBk@easyfaredatabase.trjnuqe.mongodb.net/?appName=EasyFareDatabase";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db("EasyFareDB");
    console.log("Connected to MongoDB");
  }
  return db;
}

function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return db;
}
module.exports = { connectToDatabase, getDB };

// original code from MongoDB website, for testing connection

/* async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir); */
