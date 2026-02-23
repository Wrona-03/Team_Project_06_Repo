const stationSelect = document.getElementById("stationSelect");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const resultsTable = document.getElementById("resultsTable");
const tableBody = resultsTable.querySelector("tbody");
// Load stations
async function loadStations() {
    try {
        const response = await fetch("/api/stations");
        const stations = await response.json();
        stationSelect.innerHTML = '<option value="">Select Station</option>';
        stations.forEach(station => {
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
        trains.forEach(train => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${train.station || "-"}</td>
                <td>${train.destination || "-"}</td>
                <td>${train.scheduled || "-"}</td>
                <td>${train.expected || "-"}</td>
                <td>${train.dueIn || "-"}</td>
            `;
            tableBody.appendChild(row);
        });
        resultsTable.style.display = "table";
    } catch (error) {
        errorMsg.textContent = "Error loading train data.";
    }
}
searchBtn.addEventListener("click", searchTrains);
loadStations();