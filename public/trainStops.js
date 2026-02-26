
//Show the stops of each train using train code
async function viewStops(trainID) {
  //Fetch train movements data for selected train
  try {
    const response = await fetch(`/api/trainMovements/${trainID}`);
    const stops = await response.json();
    
    if (stops.length === 0) {
      alert("No stops found.");
      return;
    }

    stopsList.textContent = "";
    //Append each ride stop as list item
    stops.forEach((stop) => {
      const listItem = document.createElement("li");
      //show only stops that are "S" (passenger stops) or "O" (origin) or "D" (destination)
      if (stop.locationType === "S" || stop.locationType === "O" || stop.locationType === "D" ) { 
        listItem.innerHTML = `${stop.location}`;
        stopsList.appendChild(listItem);
        
      }
    });

    stopsTitle.textContent = `Train service for ${trainID}`;

  } catch (error) {
    console.log(error);
    errorMsg.textContent += " Error loading stops data.";
  }
}

