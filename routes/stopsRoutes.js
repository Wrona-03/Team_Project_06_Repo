const express = require('express');
const xml2js = require('xml2js');
const stopsRoutes = express.Router();
const stopsData = require('../stopsData.json'); //List of stations with names and assigned zones



//Get a train's stops
stopsRoutes.get("/api/trainMovements/:trainCode", async (req, res)=>{
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
stopsRoutes.get("/api/stops", (req, res) => {
    res.json(stopsData);
});

//Get list of stations with coordinates included
stopsRoutes.get("/api/stationLocations", async (req,res) => {
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


module.exports = stopsRoutes;