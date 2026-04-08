const stationInput = document.getElementById("stationInput");
const searchBtn = document.getElementById("searchBtn");
const errorMsg = document.getElementById("errorMsg");
const resultsCon = document.getElementById("resultsCon");
const tableBody = resultsCon.querySelector("tbody");
const favBtn = document.getElementById("fav-btn");
const favDiv = document.getElementById("fav-div");
let stations = [];
let selectedCode = "";

function autocomplete(inp, stationArr) {
    let currentFocus;

    inp.addEventListener("input", function() {
        closeAllLists();
        const val = this.value;
        selectedCode = "";
        if (!val) return;
        currentFocus = -1;

        const itemsDiv = document.createElement("div");
        itemsDiv.setAttribute("id", this.id + "autocomplete-list");
        itemsDiv.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(itemsDiv);

        stationArr.forEach(station => {
            if (station.name.toLowerCase().includes(val.toLowerCase())) {
                const item = document.createElement("div");
                const i = station.name.toLowerCase().indexOf(val.toLowerCase());
                item.innerHTML = station.name.substring(0, i)
                    + "<strong>" + station.name.substring(i, i + val.length) + "</strong>"
                    + station.name.substring(i + val.length);
                item.dataset.code = station.code;
                item.addEventListener("click", function() {
                    inp.value = station.name;
                    selectedCode = this.dataset.code;
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

async function loadStations() {
    try {
        const response = await fetch("/api/stations");
        stations = await response.json();
        stations.sort((a, b) => a.name.localeCompare(b.name));
        autocomplete(stationInput, stations);
    } catch (error) {
        errorMsg.textContent = "Failed to load stations.";
    }
}

async function searchTrains() {
    const code = selectedCode;
    errorMsg.textContent = "";
    tableBody.innerHTML = "";
    resultsCon.style.display = "none";

    if (!code) {
        errorMsg.textContent = "Please select a station.";
        return;
    }

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
                <td>${train.lastLocation || "-"}</td>
                <td><button id="view-stops-btn" onclick="viewStops('${train.trainCode}', '${code}')">View Stops</button></td>
            `;
            tableBody.appendChild(row);
        });
        resultsCon.style.display = "table";
    } catch (error) {
        errorMsg.textContent = "Error loading train data.";
    }
}

//bookmark station functions
function saveFavorite(){
    if(!selectedCode || !stationInput.value){
        errorMsg.textContent = "Please select a station first."
        return;
    }
    
    const fav = {name: stationInput.value, code: selectedCode};
    let favs = JSON.parse(localStorage.getItem('favStations')) || [];
    if (favs.length >= 5) {
    errorMsg.textContent = "Maximum 5 saved stations reached.";
    return;
}
    favs.push(fav);
    localStorage.setItem('favStations', JSON.stringify(favs));
    loadFavorite();
}

function loadFavorite(){
    let favs = JSON.parse(localStorage.getItem('favStations')) || [];
    if (favs.length === 0) {
        favDiv.style.display = "none";
        return;
    }
    favBtn.textContent = "Save Station";
    favDiv.style.display = "block";
    favDiv.innerHTML = "<p>Saved stations:</p>";

    favs.forEach((fav, index) => {
        const btn = document.createElement("button");
        btn.textContent = fav.name;
        btn.classList.add("fav-station-btn");
        btn.addEventListener("click", () => {
            stationInput.value = fav.name;
            selectedCode = fav.code;
            searchTrains();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.classList.add("fav-delete-btn");
        deleteBtn.addEventListener("click", () => {
            favs.splice(index, 1);
            localStorage.setItem('favStations', JSON.stringify(favs));
            loadFavorite();
        });

        favDiv.appendChild(btn);
        favDiv.appendChild(deleteBtn);
    });
}

searchBtn.addEventListener("click", searchTrains);
loadStations();
favBtn.addEventListener("click", saveFavorite);
loadFavorite();