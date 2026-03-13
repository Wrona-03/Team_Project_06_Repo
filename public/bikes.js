const stopsInput = document.getElementById("stopsInput");
const bikesBtn = document.getElementById("bikes-btn");
const allBikesBtn = document.getElementById("all-bikes-btn");
const errorMsg = document.getElementById("error-msg");
const bikesTable = document.getElementById("bikes-table");
const tableBody = document.getElementById("table-body");

let selectedStop = "";

function autocomplete(inp, stopsArr) {
    let currentFocus;

    inp.addEventListener("input", function() {
        closeAllLists();
        const val = this.value;
        selectedStop = "";
        if (!val) return;
        currentFocus = -1;

        const itemsDiv = document.createElement("div");
        itemsDiv.setAttribute("id", this.id + "autocomplete-list");
        itemsDiv.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(itemsDiv);

        stopsArr.forEach(stop => {
            if (stop.toLowerCase().includes(val.toLowerCase())) {
                const item = document.createElement("div");
                const i = stop.toLowerCase().indexOf(val.toLowerCase());
                item.innerHTML = stop.substring(0, i)
                    + "<strong>" + stop.substring(i, i + val.length) + "</strong>"
                    + stop.substring(i + val.length);
                item.addEventListener("click", function() {
                    inp.value = stop;
                    selectedStop = stop;
                    closeAllLists();
                });
                itemsDiv.appendChild(item);
            }
        });
    });

    inp.addEventListener("keydown", function(e) {
        let list = document.getElementById(this.id + "autocomplete-list");
        let items = list ? list.getElementsByTagName("div") : [];
        if (e.keyCode === 40) {
            currentFocus++;
            addActive(items);
        } else if (e.keyCode === 38) {
            currentFocus--;
            addActive(items);
        } else if (e.keyCode === 13) {
            e.preventDefault();
            if (currentFocus > -1 && items[currentFocus]) items[currentFocus].click();
        }
    });

    function addActive(items) {
        if (!items.length) return;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(items) {
        Array.from(items).forEach(item => item.classList.remove("autocomplete-active"));
    }

    function closeAllLists(elmnt) {
        Array.from(document.getElementsByClassName("autocomplete-items")).forEach(item => {
            if (elmnt !== item && elmnt !== inp) item.parentNode.removeChild(item);
        });
    }

    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}

async function loadStops() {
    try {
        const response = await fetch("/api/stops");
        const stops = await response.json();
        const zone1Stops = stops
            .filter(stop => stop.zone_Number === 1 && stop.modeID.includes(1))
            .map(stop => stop.name)
            .sort();
        autocomplete(stopsInput, zone1Stops);
    } catch (error) {
        console.log(error);
    }
}

async function searchBikes() {
    errorMsg.textContent = "";
    bikesTable.style.display = "none";
    tableBody.innerHTML = "";

    if (!selectedStop) {
        errorMsg.textContent = "Please select a stop.";
        return;
    }

    try {
        const response = await fetch("/api/stationLocations");
        const allStations = await response.json();
        const station = allStations.find(s => s.name === selectedStop);

        if (!station) {
            errorMsg.textContent = "Station not found.";
            return;
        }

        const coordinates = await fetch(`/api/bikes/nearby?lat=${station.latitude}&lng=${station.longitude}`);
        const bikeStations = await coordinates.json();

        if (bikeStations.length === 0) {
            errorMsg.textContent = "No bikes nearby.";
            return;
        }

        bikesTable.style.display = "table";
        bikeStations.forEach(bikeStation => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${bikeStation.name || "-"}</td>
                <td>${bikeStation.available_bikes || "-"}</td>
                <td>${bikeStation.available_stands || "-"}</td>
                <td>${bikeStation.distance + " m" || "-"}</td>`;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.log(error);
    }
}

async function getAllBikes() {
    errorMsg.textContent = "";
    bikesTable.style.display = "none";
    tableBody.innerHTML = "";

    try {
        const result = await fetch("/api/bikes");
        const bikeStations = await result.json();

        if (bikeStations.length === 0) {
            errorMsg.textContent = "No bike stations found.";
            return;
        }

        bikesTable.style.display = "table";
        bikeStations.forEach(bikeStation => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${bikeStation.name || "-"}</td>
                <td>${bikeStation.available_bikes || "-"}</td>
                <td>${bikeStation.available_bike_stands || "-"}</td>
                <td>Select a station</td>`;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.log(error);
    }
}

bikesBtn.addEventListener("click", searchBikes);
allBikesBtn.addEventListener("click", getAllBikes);
loadStops();
