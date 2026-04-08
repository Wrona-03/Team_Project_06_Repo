require("dotenv").config();

const express = require("express"); //  Express for server
const cors = require("cors"); // Allows requests from frontend
const path = require("path");
const { connectToDatabase, getDB } = require("./db/ConnectionDB");

//Routes
const bikesRouter = require("./routes/bikeRoutes");
const stopsRouter = require("./routes/stopsRoutes");
const trainRouter = require("./routes/trainRoutes");
const fareRouter = require("./routes/fareRoutes");

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data

// Test to see if it runs better
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

//Use routes
app.use("/", bikesRouter);
app.use("/", stopsRouter);
app.use("/", trainRouter);
app.use("/", fareRouter);

//AI chatbot
app.post("/api/chat", async (req, res) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    },
  );
  const data = await response.json();
  res.json(data);
});

//DB section
let db;
// Connect to MongoDB before starting the server
connectToDatabase()
  .then((database) => {
    db = database;

    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => console.error("MongoDB connection failed:", err));
