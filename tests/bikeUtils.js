// for testing purposes
// import library for distance calculation
const geolib = require("geolib");

// mocks /api/bikes/nearby endpoint in bikeRoutes
function filterNearbyBikes(bikes, lat, lng) {
  const nearby = [];

  bikes.forEach((bike) => {
    const distance = geolib.getDistance(
      { latitude: lat, longitude: lng },
      { latitude: bike.position.lat, longitude: bike.position.lng },
    );
    if (distance < 500) {
      nearby.push({
        name: bike.name,
        available_bikes: bike.available_bikes,
        available_stands: bike.available_bike_stands,
        distance: Math.round(distance),
      });
    }
  });
  return nearby.sort((a, b) => a.distance - b.distance);
  // return nearby;
}

function saveFavouriteStation(selectedStation) {
  if (!selectedStation){
    return { ok: false, error: "Please select a bike station first." };
  }
  let favs = JSON.parse(localStorage.getItem("favBikeStations")) || [];

  if (favs.length >= 5){
    return { ok: false, error: "Maximum 5 saved stations reached." };
  }
  favs.push({ name: selectedStation });
  localStorage.setItem("favBikeStations", JSON.stringify(favs));
  return { ok: true };
}

function loadFavouriteStation() {
  return JSON.parse(localStorage.getItem("favBikeStations")) || [];
}

module.exports = { filterNearbyBikes, saveFavouriteStation, loadFavouriteStation };
