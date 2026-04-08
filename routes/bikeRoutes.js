const express = require('express');
/* 
library for calculating distance
https://github.com/manuelbieh/geolib
*/
const geolib = require('geolib'); 

const xml2js = require('xml2js');
const stopsData = require('../stopsData.json'); //List of stations with names and assigned zones

const bikeRoutes = express.Router();


//Get Live Bikes api 
bikeRoutes.get("/api/bikes", async (req, res)=>{
    try{
        const response = await fetch(`https://api.jcdecaux.com/vls/v1/stations?contract=Dublin&apiKey=${process.env.bikes_APIKey}`) 
        if (!response.ok) {
            throw Error("Could not fetch data");
        }
    
        const data = await response.json();
        res.json(data)

    }
    catch(error){
        res.status(500).json({ error: error.message });
    }

}); 


bikeRoutes.get("/api/bikes/nearby", async (req, res) => {
    const { lat, lng } = req.query;

    const response = await fetch(`https://api.jcdecaux.com/vls/v1/stations?contract=Dublin&apiKey=${process.env.bikes_APIKey}`);
    const bikes = await response.json();

    const nearby = [];

    bikes.forEach(bike => {
        //use getDistance function from geolib to get distance between coordiantes
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
    //sort by distance descending
    nearby.sort((a, b) => a.distance - b.distance);
    res.json(nearby);
    
});

//export
module.exports = bikeRoutes;