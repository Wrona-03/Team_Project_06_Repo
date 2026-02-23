const express = require("express"); //  Express for server
const xml2js = require("xml2js"); // Parsing XML from Irish Rail API
const cors = require("cors"); // Allows requests from frontend
const stations = require("./stations.json"); // List of stations with codes and names 

// Create Express app 
const app = express();

app.use(cors());
app.use(express.static("public"));

// Get list of stations
app.get("/api/stations", (req, res) => {
    res.json(stations);
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
                    "Accept": "application/xml"
                }
            }
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
        const formatted = trainArray.map(train => ({
            station: train.Stationfullname,
            destination: train.Destination,
            scheduled: train.Schdepart,
            expected: train.Expdepart,
            dueIn: parseInt(train.Duein, 10) || 0 // converts DueIn to int
        }));

// Sort by earliest due
formatted.sort((a, b) => a.dueIn - b.dueIn);

// Limit to first 10 results
const limitedResults = formatted.slice(0, 10);

res.json(limitedResults);
        res.json(formatted);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not fetch train data" });
    }
});

app.listen(3000, () => {    
    console.log("Server running at http://localhost:3000");
});