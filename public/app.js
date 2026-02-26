const stationSelect = document.getElementById("stationSelect");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const resultsCon = document.getElementById("resultsCon");
const tableBody = resultsCon.querySelector("tbody");
// Load stations
async function loadStations() {
    try {
        const response = await fetch("/api/stations");
        const stations = await response.json();
        stations.sort((a, b) => a.name.localeCompare(b.name));
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
    resultsCon.style.display = "none";
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
            const expectedDisplay = train.expected === train.scheduled ? "On Time" : train.expected;
            row.innerHTML = `
                <td>${train.station || "-"}</td>
                <td>${train.destination || "-"}</td>
                <td>${train.scheduled || "-"}</td>
                <td>${expectedDisplay || "-"}</td>
                <td>${train.dueIn || "-"}</td>
                <td><button onclick="viewStops('${train.trainCode}')">View Stops</button></td>
            `;
            tableBody.appendChild(row);
        });
        resultsCon.style.display = "table";
    } catch (error) {
        errorMsg.textContent = "Error loading train data.";
    }
}
searchBtn.addEventListener("click", searchTrains);
loadStations();
