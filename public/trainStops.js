const stopsTitle = document.getElementById("stops-title");
const stopsList = document.getElementById("stops-list");

//Show the stops of each train using train code
async function viewStops(trainID, stationCode) {
  //Fetch train movements data for selected train
  try {
    //fetch train movements from api endpoint
    const response = await fetch(`/api/trainMovements/${trainID}`);
    const stops = await response.json();
    console.log(stops);
    if (stops.length === 0) {
      alert("No stops found.");
      return;
    }
    //fetch last location from stations api endpoint
    const stationRes = await fetch(`/api/station/${stationCode}`);
    const trains = await stationRes.json();
    const currentTrain = trains.find(t => t.trainCode.trim() === trainID.trim());
    const lastLocation = currentTrain?.lastLocation || "";


    stopsList.textContent = "";
    //Append each ride stop as list item
    stops.forEach((stop) => {
      const listItem = document.createElement("li");
      //show only stops that are "S" (passenger stops) or "O" (origin) or "D" (destination)
      if (stop.locationType === "S" || stop.locationType === "O" || stop.locationType === "D" ) { 
        listItem.innerHTML = `${stop.location}`;
        stopsList.appendChild(listItem);
          if(lastLocation.includes(stop.location)){
            listItem.style.fontWeight = "bold";
          }
      }
    });



    stopsTitle.textContent = `Train service for ${trainID}`;

  } catch (error) {
    console.log(error);
    errorMsg.textContent += " Error loading stops data.";
  }
}

