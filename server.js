const express = require("express");
const path = require("path");
const { connectToDatabase, getDB } = require("./ConnectionDB");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // makes public folder accessible

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

      if (!destination) {
        destination = await db
          .collection("Stops")
          .findOne({ name: { $regex: safeDestination, $options: "i" } });
      }
    }

    const card = await db
      .collection("Ticket_Types")
      .findOne({ CardType: cardType });

    if (!card) return res.status(404).json({ error: "Card type not found." });

    // Calculate final zone fare if user entered destination stop
    const originZone = Number(origin.zone_Number);
    let finalZone = originZone;

    // Check the zones of origin and destination: the one with the higher zone number is the fare the user will be charged
    if (destination) {
      const destinationZone = Number(destination.zone_Number);
      finalZone = Math.max(originZone, destinationZone);
    }

    // Log the origin zone number
    console.log("Origin zone:", origin.zone_Number);

    // If there is a destination, check it's zone number
    if (destination) {
      console.log("Destination zone:", destination.zone_Number);
    } else {
      console.log("No destination found or entered.");
    }
    // Log the final fare; checks if the fare is correctly being calculated.
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
    });
  } catch (err) {
    console.error("Error calculating fare:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});
