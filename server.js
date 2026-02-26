require("dotenv").config();


const express = require("express"); //  Express for server
const xml2js = require("xml2js"); // Parsing XML from Irish Rail API
const cors = require("cors"); // Allows requests from frontend
const path = require("path");

//json files
const stations = require("./stations.json"); // List of stations with codes and names


//Routes
const bikesRouter = require('./routes/bikeRoutes');
const stopsRouter = require('./routes/stopsRoutes');

// Create Express app
const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname,"public")));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/styles.css", (_req, res) => res.sendFile(path.join(__dirname, "styles.css")));
app.get("/app.js", (_req, res) => res.sendFile(path.join(__dirname, "app.js")));

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
        const formatted = trainArray.map(train => {
            const scheduled = train.Schdepart;
            const expdepart = train.Expdepart;
            // Expdepart is "00:00" for trains not yet at the station, fall back to scheduled
            const expected = (!expdepart || expdepart === "00:00") ? scheduled : expdepart;
            return {
                station: train.Stationfullname,
                destination: train.Destination,
                scheduled,
                expected,
                dueIn: parseInt(train.Duein, 10) || 0, // converts DueIn to int
                trainCode: train.Traincode
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


//Get bikes routes
app.use('/',bikesRouter);
//Get stops routes
app.use('/',stopsRouter);





app.listen(3000, () => {    
    console.log("Server running at http://localhost:3000");
});