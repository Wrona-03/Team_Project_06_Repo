const stopsInput = document.getElementById("stopsInput");
const bikesBtn = document.getElementById("bikes-btn");
const allBikesBtn = document.getElementById("all-bikes-btn");
const errorMsg = document.getElementById("error-msg");
const bikesTable = document.getElementById("bikes-table");
const tableBody = document.getElementById("table-body");

const bikeStationInput = document.getElementById("bike-station-input");
const bikeStationBtn = document.getElementById("bike-station-btn");
const favStationBtn = document.getElementById("fav-station-btn");
const favStationDiv = document.getElementById("fav-station-div")

let selectedStop = "";
let selectedStation = "";

function autocomplete(inp, stopsArr, onSelect) {
    let currentFocus;

    inp.addEventListener("input", function() {
        closeAllLists();
        const val = this.value;
        // selectedStop = "";
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
                    onSelect(stop);
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
autocomplete(stopsInput, zone1Stops, (val) => selectedStop = val);
    } catch (error) {
        console.log(error);
    }
}

async function searchBikes() {
    //clear error message and table
    errorMsg.textContent = "";
    bikesTable.style.display = "none";
    tableBody.innerHTML = "";

    //fallback if user does not click autocomplete options
    if (!selectedStop) {
        selectedStop = stopsInput.value.trim();
    }
    //if user enters no input
    if (!selectedStop) {
        errorMsg.textContent = "Please select a stop.";
        return;
    }
    try {
        //fetch station names and coordinates from irish rail api
        const response = await fetch("/api/stationLocations");
        const allStations = await response.json();
        //find input in station names
        const station = allStations.find(s => s.name === selectedStop);
        // console.log("selected:", selectedStop);
        // console.log("found:", station);

        if (!station) {
            errorMsg.textContent = "Station not found.";
            return;
        }
        //fetch nearby bikes endpoint that filters the nearest bikes, pass in station coordinates
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


async function searchBikeStation() {
    errorMsg.textContent = "";
    bikesTable.style.display = "none";
    tableBody.innerHTML = "";

    //fallback if user does not click autocomplete options
    if (!selectedStation) {
        selectedStation = bikeStationInput.value.trim().toUpperCase();
    }

    if (!selectedStation) {
        errorMsg.textContent = "Please select a bike station.";
        return;
    }

    try {
        const response = await fetch("/api/bikes");
        const bikes = await response.json();
        const results = bikes.filter(bike => bike.name === selectedStation);

         if (results.length === 0) {
            errorMsg.textContent = "Bike station not found.";
            return;
        }
        bikesTable.style.display = "table";
        results.forEach(bike => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${bike.name}</td>
                <td>${bike.available_bikes}</td>
                <td>${bike.available_bike_stands}</td>
                <td>-</td>`;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.log(error);
    }
}

async function loadBikeStations() {
    try {
        const response = await fetch("/api/bikes");
        const bikes = await response.json();
        const bikeNames = bikes.map(bike => bike.name).sort();
        autocomplete(bikeStationInput, bikeNames, (val) => selectedStation = val);
    } catch (error) {
        console.log(error);
    }
}

function saveFavouriteStation(){
    console.log("selectedStation:", selectedStation);
    if(!selectedStation){
        errorMsg.textContent = "Please select a bike station first.";
        return;
    }
    let favs = JSON.parse(localStorage.getItem('favBikeStations')) || [];
    if(favs.length >= 5){
        errorMsg.textContent = "Maximum 5 saved stations reached.";
        return;
    }

    favs.push({ name: selectedStation });
    localStorage.setItem('favBikeStations', JSON.stringify(favs));
    favStationBtn.textContent = "Saved!";
    loadFavouriteStation();

}

function loadFavouriteStation(){
    let favs = JSON.parse(localStorage.getItem('favBikeStations')) || [];
    favStationBtn.textContent = "Save Station";
    if(favs.length === 0){
        favStationDiv.style.display = "none";
        return;
    }

    favStationDiv.style.display = "block";
    favStationDiv.innerHTML = "<p class='user_guide'>Saved bike stations:</p>";

    favs.forEach((fav, index) => {
        const btn = document.createElement("button");
        btn.textContent = fav.name;
        btn.classList.add("fav-station-btn");
        btn.addEventListener("click", () => {
            bikeStationInput.value = fav.name;
            selectedStation = fav.name;
            searchBikeStation();
        });
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.classList.add("fav-delete-btn");
        deleteBtn.addEventListener("click", () => {
            favs.splice(index, 1);
            localStorage.setItem('favBikeStations', JSON.stringify(favs));
            loadFavouriteStation();
        });
        favStationDiv.appendChild(btn);
        favStationDiv.appendChild(deleteBtn);

    });

}


bikesBtn.addEventListener("click", searchBikes);
allBikesBtn.addEventListener("click", getAllBikes);
bikeStationBtn.addEventListener("click", searchBikeStation);
loadStops();
loadBikeStations();
favStationBtn.addEventListener("click", saveFavouriteStation);
loadFavouriteStation();

