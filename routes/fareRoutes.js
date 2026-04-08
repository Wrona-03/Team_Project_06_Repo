const express = require("express");
const { getDB } = require("../db/ConnectionDB");

const fareRouter = express.Router();

// Get stop names from MongoDB for fare calculator autocomplete
fareRouter.get("/api/fare-stops", async (req, res) => {
    const db = getDB();
  try {
    const stops = await db.collection("Stops").find({}, { projection: { name: 1, _id: 0 } }).toArray();
    res.json(stops.map(s => s.name).sort());
  } catch (err) {
    res.status(500).json({ error: "Could not fetch stops" });
  }
});


// Fare calculator route
fareRouter.post("/calculate-fare", async (req, res) => {
  const { stopName, destinationName, cardType } = req.body;
  const db = getDB();
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
      dailyCap: card["Daily Cap"], // <- add this
      weeklyCap: card["Weekly Cap"], // <- add this
    });
  } catch (err) {
    console.error("Error calculating fare:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


module.exports = fareRouter;
