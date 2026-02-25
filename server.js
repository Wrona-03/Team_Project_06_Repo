require("dotenv").config();
const geolib = require('geolib');

const express = require("express"); //  Express for server
const xml2js = require("xml2js"); // Parsing XML from Irish Rail API
const cors = require("cors"); // Allows requests from frontend
const stations = require("./stations.json"); // List of stations with codes and names 
const stopsData = require('./stopsData.json'); //List of stations with names and assigned zones

// Create Express app 
const app = express();

app.use(cors());
app.use(express.static("public"));


//Get a train's stops
app.get("/api/trainMovements/:trainCode", async (req, res)=>{
    const trainCode = req.params.trainCode;
   
   try {
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        const encodedDate = encodeURIComponent(formattedDate);
       
        const response = await fetch(
            `https://api.irishrail.ie/realtime/realtime.asmx/getTrainMovementsXML?TrainId=${trainCode}&TrainDate=${encodedDate}`
        );
     const xml = await response.text();

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xml);

        const movements = result?.ArrayOfObjTrainMovements?.objTrainMovements;

        if (!movements) return res.json([]);

        const movementArray = Array.isArray(movements) ? movements : [movements];

        const formattedStops = movementArray.map(stop => ({
            location: stop.LocationFullName,
            locationType: stop.LocationType
            // , arrival: stop.ExpectedArrival,
            // departure: stop.ExpectedDeparture
        }));
        res.json(formattedStops);
    }
catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not fetch train movements data" });
    }
});

//Get list of stops tagged by zone
app.get("/api/stops", (req, res) => {
    res.json(stopsData);
});

//Get list of stations with coordinates included
app.get("/api/stationLocations", async (req,res) => {
     try {
        const response = await fetch(
            `https://api.irishrail.ie/realtime/realtime.asmx/getAllStationsXML`,
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
        const stations = result?.ArrayOfObjStation?.objStation;
       const stationArray = Array.isArray(stations) ? stations : [stations];

        const formatted = stationArray.map(station => ({
            name: station.StationDesc,
            code:station.StationCode,
            latitude: parseFloat(station.StationLatitude), //convert coordinates to float
            longitude: parseFloat(station.StationLongitude)
        }));

        res.json(formatted);

    } catch (error) {
        res.status(500).json({ error: "Could not fetch station data" });
    }});



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
            dueIn: parseInt(train.Duein, 10) || 0, // converts DueIn to int
            trainCode: train.Traincode
        }));

// Sort by earliest due
formatted.sort((a, b) => a.dueIn - b.dueIn);

// Limit to first 10 results
const limitedResults = formatted.slice(0, 10);

res.json(limitedResults);
// res.json(formatted); Was giving http error

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not fetch train data" });
    }
});



//Get Live Bikes api 
app.get("/api/bikes", async (req, res)=>{
    try{
        const response = await fetch(`https://api.jcdecaux.com/vls/v1/stations?contract=Dublin&apiKey=${process.env.bikes_APIKey}`) 
        if (!response.ok) {
            throw Error("Could not fetch data");
        }
    
        const data = await response.json();
        res.json(data)
        console.log(data)

    }
    catch(error){
        res.status(500).json({ error: error.message });
    }

}); 


app.get("/api/bikes/nearby", async (req, res) => {
    const { lat, lng } = req.query;

    const response = await fetch(`https://api.jcdecaux.com/vls/v1/stations?contract=Dublin&apiKey=${process.env.bikes_APIKey}`);
    const bikes = await response.json();

    const nearby = [];

    bikes.forEach(bike => {
        const distance = geolib.getDistance({ latitude: lat, longitude: lng },
    { latitude: bike.position.lat, longitude: bike.position.lng });
        if (distance < 500) {
            nearby.push({
                name: bike.name,
                available_bikes: bike.available_bikes,
                available_stands: bike.available_bike_stands,
                distance: Math.round(distance)
            });
        }
    });

    res.json(nearby);
});

app.listen(3000, () => {    
    console.log("Server running at http://localhost:3000");
});