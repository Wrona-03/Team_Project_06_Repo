
const express = require("express");
require("dotenv").config();



const app = express();
const PORT = 3000;





app.get("/bikes", async (req, res)=>{


    try{
        const response = await fetch(`https://api.jcdecaux.com/vls/v1/stations?contract=Dublin&apiKey=${process.env.APIKey}`) 
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


app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
    });