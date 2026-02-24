const stationSelect = document.getElementById("stationSelect");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const resultsTable = document.getElementById("resultsTable");
const tableBody = resultsTable.querySelector("tbody");

const stopsTitle = document.getElementById("stopsTitle");
const stopsList = document.getElementById("stopsList");

// Load stations
async function loadStations() {
  try {
    const response = await fetch("/api/stations");
    const stations = await response.json();
    stationSelect.innerHTML = '<option value="">Select Station</option>';
    stations.forEach((station) => {
      const option = document.createElement("option");
      option.value = station.code;
      option.textContent = station.name;
      stationSelect.appendChild(option);
    });
  } catch (error) {
    errorMsg.textContent = "Failed to load stations.";
  }
}
// Search stations and display results in table
async function searchTrains() {
  const code = stationSelect.value;
  errorMsg.textContent = "";
  tableBody.innerHTML = "";
  resultsTable.style.display = "none";
  if (!code) {
    errorMsg.textContent = "Please select a station.";
    return;
  }
  // Fetch train data for selected station
  try {
    const response = await fetch(`/api/station/${code}`);
    const trains = await response.json();
    if (!Array.isArray(trains) || trains.length === 0) {
      errorMsg.textContent = "No trains currently scheduled.";
      return;
    }
    trains.forEach((train) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${train.station || "-"}</td>
                <td>${train.destination || "-"}</td>
                <td>${train.scheduled || "-"}</td>
                <td>${train.expected || "-"}</td>
                <td>${train.dueIn || "-"}</td>
                <td><button onclick="viewStops('${train.trainCode}')">View Stops</button></td>
            `; //added button that shows train movement
      tableBody.appendChild(row);
    });
    resultsTable.style.display = "table";
  } catch (error) {
    errorMsg.textContent = "Error loading train data.";
  }
}
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

searchBtn.addEventListener("click", searchTrains);
loadStations();
