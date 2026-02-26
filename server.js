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
  const { stopName, cardType } = req.body;

  try {
    const stop = await db
      .collection("Stops")
      .findOne({ name: new RegExp(`^${stopName}$`, "i") });
    if (!stop) return res.status(404).json({ error: "Stop not found." });

    const card = await db
      .collection("Ticket_Types")
      .findOne({ Cardtype: cardType });
    if (!card) return res.status(404).json({ error: "Card type not found." });

    // Calculate fare based on zone and card type
    const zone = stop.zone_number;

    // This code looks at the zone number and displays the fare for that zone and card type.
    res.json({
      stop: stop.name,
      zone,
      cardType: card.Cardtype,
      singleFare: card[`Zone ${zone} fare`],
      weeklyFare: card[`Zone ${zone} weekly fare`],
      monthlyFare: card[`Zone ${zone} monthly fare`],
    });
  } catch (err) {
    console.error("Error calculating fare:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});
