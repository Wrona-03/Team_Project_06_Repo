const stopsSelect = document.getElementById("stopsSelect");
const bikesBtn = document.getElementById("bikesBtn");
//load stops from zone 1
async function loadStops(){
     try {
    const response = await fetch("/api/stops");
    const stops = await response.json();
    stopsSelect.innerHTML = '<option value="">Select stop</option>';

    stops.forEach(stop => {
      if(stop.zone_Number === 1){
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
  //get selected station
  const stationName = stopsSelect.value;
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
    const bikes = await coordinates.json();

    if (bikes.length === 0) {
      console.log("No bikes nearby");
      return;
    }
    console.log(bikes);
  }
  catch(error){
    console.log(error);
  }
  
  
}


bikesBtn.addEventListener("click", searchBikes);
loadStops();