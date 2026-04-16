const {
  filterNearbyBikes, saveFavourite, loadFavourites} = require("../utils/bikeUtils");

describe("filterNearbyBikes", () => {
  const mockBikeStations = [
    { name: "CLOSE BIKE STATION", available_bikes: 3, available_bike_stands: 2, position: { lat: 53.352, lng: -6.248 } },
    { name: "NEAR BIKE STATION", available_bikes: 5, available_bike_stands: 1, position: { lat: 53.3531, lng: -6.2459 } },
    {name: "OUT OF RANGE STATION", available_bikes: 2, available_bike_stands: 8, position: { lat: 53.9, lng: -6.5 } },
  ];

  // coordinates of Connolly station
  const trainStation = { lat: 53.3531, lng: -6.24591 };

  test("positive testing - when a bike station within 500m is found, it is included in the result", () => {
    const result = filterNearbyBikes(mockBikeStations, trainStation.lat, trainStation.lng);
    const withinRange = result.find((bikes) => bikes.name === "CLOSE BIKE STATION", );
    expect(withinRange).toBeDefined();
  });

  test("positive testing - from a list of multiple bike stations, only those within 500m are returned", () => {
    const result = filterNearbyBikes(mockBikeStations,trainStation.lat,trainStation.lng);
    expect(result).toHaveLength(2);
  });

  test("positive testing - when multiple bike stations are fetched, results are sorted nearest first", () => {
    const result = filterNearbyBikes( mockBikeStations, trainStation.lat, trainStation.lng);
    expect(result[0].distance).toBeLessThan(result[1].distance);
  });

  test("negative testing - when there are no bike stations within 500m, return empty array", () => {
    const result = filterNearbyBikes(mockBikeStations, 60, -6.5);
    expect(result).toHaveLength(0);
  });

  test("negative testing - when a bike station is outside of 500m, it is excluded from the result", () => {
    const result = filterNearbyBikes( mockBikeStations, trainStation.lat, trainStation.lng);
    const outOfRange = result.find((bikes) => bikes.name === "OUT OF RANGE STATION");
    expect(outOfRange).toBeUndefined();
  });

  test("negative testing - when no bike stations are fetched, return empty array", () => {
    const result = filterNearbyBikes([], trainStation.lat, trainStation.lng);
    expect(result).toHaveLength(0);
  });
});

describe("Bookmark feature", () => {
  beforeEach(() => localStorage.clear());

  test("positive testing - save item to localStorage", () => {
    saveFavourite("BIKE STATION A");
    expect(loadFavourites()).toEqual([{ name: "BIKE STATION A" }]);
  });

  test("positive testing - save up to 5 items", () => {
    saveFavourite("BIKE STATION A");
    saveFavourite("BIKE STATION B");
    saveFavourite("BIKE STATION C");
    saveFavourite("BIKE STATION D");
    const result = saveFavourite("BIKE STATION E");
    expect(result.ok).toBe(true);
  });

  test("negative testing - returns error message when no station is selected for saving", () => {
    const result = saveFavourite("");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Please select a bike station first.");
  });

  test("negative testing - returns error message when more than 5 stations are saved", () => {
    saveFavourite("BIKE STATION A");
    saveFavourite("BIKE STATION B");
    saveFavourite("BIKE STATION C");
    saveFavourite("BIKE STATION D");
    saveFavourite("BIKE STATION E");
    const result = saveFavourite("BIKE STATION F");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Maximum 5 saved stations reached.");
  });
});
