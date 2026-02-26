const stopsSelect = document.getElementById("stops-select");
const bikesBtn = document.getElementById("bikes-btn");
const allBikesBtn = document.getElementById("all-bikes-btn");
const errorMsg = document.getElementById("error-msg");
const bikesTable = document.getElementById("bikes-table");
const resultsSection = document.getElementById("results-section");
const tableBody = document.getElementById("table-body");


//load train stops from zone 1
async function loadStops(){
     try {
    const response = await fetch("/api/stops");
    const stops = await response.json();
    stopsSelect.innerHTML = '<option value="">Select stop</option>';

    stops.forEach(stop => {
      if(stop.zone_Number === 1 && stop.modeID.includes(1)){
    const option = document.createElement("option");
      option.value = stop.name;
      option.textContent = stop.name;
      stopsSelect.appendChild(option);
      }
    });
     }
     catch(error){
        console.log(error)
     }
}
async function searchBikes(){
    errorMsg.textContent = "";
    bikesTable.style.display = "none";
    tableBody.innerHTML = "";

  //get selected train station
  const stationName = stopsSelect.value;
  //handle no input
  if(!stationName){
    errorMsg.textContent = "Please select a stop";
  }
  //get coordinates
  try {
    const response = await fetch('/api/stationLocations');
    const allStations = await response.json();
    const station = allStations.find(s => s.name === stationName);
    
    if (!station) {
      console.log("Station not found:", stationName);
      return;
    }

    //pass coordinates to bikes api
    const coordinates =  await fetch(`/api/bikes/nearby?lat=${station.latitude}&lng=${station.longitude}`);
    const bikeStations = await coordinates.json();
    if (bikeStations.length === 0) {
      errorMsg.textContent = "No bikes nearby";
      return;
    }
    else{
      bikesTable.style.display = "table";
      bikeStations.forEach(bikeStation=>{
        const row = document.createElement("tr");
          row.innerHTML = `
          <td>${bikeStation.name|| "-"}</td>
          <td>${bikeStation.available_bikes|| "-"}</td>
          <td>${bikeStation.available_stands|| "-"}</td>
          <td>${bikeStation.distance + " m"|| "-"}</td>`;
          tableBody.appendChild(row);

      });

    }
    console.log(bikeStations);
  }
  catch(error){
    console.log(error);
  }
}
async function getAllBikes(){
  errorMsg.textContent = "";
    bikesTable.style.display = "none";
    tableBody.innerHTML = "";

    try{
      const result =  await fetch(`/api/bikes`);
      const bikeStations = await result.json();
      console.log(bikeStations[0]);
      if (bikeStations.length === 0) {
        errorMsg.textContent = "No bikes nearby";
        return;
      }
      else{
          bikesTable.style.display = "table";
          bikeStations.forEach(bikeStation=>{
          const row = document.createElement("tr");
            row.innerHTML = `
            <td>${bikeStation.name|| "-"}</td>
            <td>${bikeStation.available_bikes|| "-"}</td>
            <td>${bikeStation.available_bike_stands|| "-"}</td>
            <td>${"Select a station"}</td>`;
            tableBody.appendChild(row);

          });
      }
    }
    catch(error){
    console.log(error);
  }
}


bikesBtn.addEventListener("click", searchBikes);
allBikesBtn.addEventListener("click", getAllBikes);
loadStops();