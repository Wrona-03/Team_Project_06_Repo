require("dotenv").config();

console.log(process.env.MONGO_URI);

const express = require("express"); //  Express for server
const xml2js = require("xml2js"); // Parsing XML from Irish Rail API
const cors = require("cors"); // Allows requests from frontend
const path = require("path");
const { connectToDatabase, getDB } = require("./ConnectionDB");

//json files
const stations = require("./stations.json"); // List of stations with codes and names

//Routes
const bikesRouter = require("./routes/bikeRoutes");
const stopsRouter = require("./routes/stopsRoutes");

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

// Get list of stations
app.get("/api/stations", (req, res) => {
  res.json(stations);
});

// Get stop names from MongoDB for fare calculator autocomplete
app.get("/api/fare-stops", async (req, res) => {
  try {
    const stops = await db.collection("Stops").find({}, { projection: { name: 1, _id: 0 } }).toArray();
    res.json(stops.map(s => s.name).sort());
  } catch (err) {
    res.status(500).json({ error: "Could not fetch stops" });
  }
});

// Taking user selection of station and displaying live train data from Irish Rail API
app.get("/api/station/:code", async (req, res) => {
  const stationCode = req.params.code.toUpperCase();
  try {
    const response = await fetch(
      `https://api.irishrail.ie/realtime/realtime.asmx/getStationDataByCodeXML?StationCode=${stationCode}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/xml",
        },
      },
    );

    const xml = await response.text();

    // Parse XML response
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    const trains = result?.ArrayOfObjStationData?.objStationData;

    // If trains are not available return empty array
    if (!trains) return res.json([]);

    const trainArray = Array.isArray(trains) ? trains : [trains];

    // Formating of the train data for table
    const formatted = trainArray.map((train) => {
      const scheduled = train.Schdepart;
      const expdepart = train.Expdepart;
      // Expdepart is "00:00" for trains not yet at the station, fall back to scheduled
      const expected =
        !expdepart || expdepart === "00:00" ? scheduled : expdepart;
      return {
        station: train.Stationfullname,
        destination: train.Destination,
        scheduled,
        expected,
        dueIn: parseInt(train.Duein, 10) || 0, // converts DueIn to int
        trainCode: train.Traincode,
        lastLocation: train.Lastlocation,
      };
    });

    // Sort by earliest due
    formatted.sort((a, b) => a.dueIn - b.dueIn);

    // Limit to first 10 results
    const limitedResults = formatted.slice(0, 10);

    res.json(limitedResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch train data" });
  }
});

app.post("/api/chat", async (req, res) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    }
  );
  const data = await response.json();
  res.json(data);
});

app.use("/", bikesRouter);
app.use("/", stopsRouter);

//DB section

let db;

// Connect to MongoDB before starting the server
connectToDatabase()
  .then((database) => {
    db = database;

    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => console.error("MongoDB connection failed:", err));

// Fare calculator route
app.post("/calculate-fare", async (req, res) => {
  const { stopName, destinationName, cardType } = req.body;

  try {
    const safeOrigin = stopName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let origin = await db.collection("Stops").findOne({
      name: { $regex: `^${safeOrigin}$`, $options: "i" },
    });

    if (!origin) {
      origin = await db.collection("Stops").findOne({
        name: { $regex: safeOrigin, $options: "i" },
      });
    }

    let destination = null;

    if (destinationName && destinationName.trim() !== "") {
      const safeDestination = destinationName
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      destination = await db
        .collection("Stops")
        .findOne({ name: { $regex: safeDestination, $options: "i" } });

      if (!destination)
        return res.status(404).json({ error: "Destination stop not found." });
    }

    // Map No Leap Card selection to DB value
    let mongoCardType = cardType;

    if (cardType.startsWith("NoLeapCard-")) {
      const ageGroup = cardType.split("-")[1]; // "Child", "Student", etc.
      mongoCardType = `Unavailable ${ageGroup}`;
    }

    // Case-insensitive search in MongoDB
    const card = await db
      .collection("Ticket_Types")
      .findOne({ CardType: cardType });
    if (!card) return res.status(404).json({ error: "Card type not found." });

    // Calculate final zone fare if user entered destination stop
    const originZone = Number(origin.zone_Number);
    let finalZone = originZone;

    // Check the zone number for the fares.
    if (destination) {
      const destinationZone = Number(destination.zone_Number);
      finalZone = Math.max(originZone, destinationZone);
    }

    // Console logs which zone fare is being applied
    console.log("Origin zone:", origin.zone_Number);
    if (destination) console.log("Destination zone:", destination.zone_Number);
    else console.log("No destination found or entered.");
    console.log("Final zone being charged:", finalZone);

    // Return everything
    res.json({
      origin: origin.name,
      destination: destination ? destination.name : null,
      zoneCharged: finalZone,
      cardType: card.CardType,
      singleFare: card[`Zone ${finalZone} fare`],
      weeklyFare: card[`Zone ${finalZone} weekly`],
      monthlyFare: card[`Zone ${finalZone} monthly`],
      dailyCap: card["Daily Cap"], 
      weeklyCap: card["Weekly Cap"], 
    });
  } catch (err) {
    console.error("Error calculating fare:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});
