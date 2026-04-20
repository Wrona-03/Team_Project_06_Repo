//import functions from utils file
const {filterNearbyBikes, saveFavouriteStation, loadFavouriteStation} = require("./bikeUtils");

describe("filterNearbyBikes", () => {

  const mockBikeStations = [
    { name: "CLOSE BIKE STATION", available_bikes: 3, available_bike_stands: 2, position: { lat: 53.352, lng: -6.248 } },
    { name: "NEAR BIKE STATION", available_bikes: 5, available_bike_stands: 1, position: { lat: 53.3531, lng: -6.2459 } },
    { name: "OUT OF RANGE STATION", available_bikes: 2, available_bike_stands: 8, position: { lat: 53.9, lng: -6.5 } } 
  ];
  
  //coordinates of Connolly station
  const trainStation = { lat: 53.3531, lng: -6.24591 };

  describe("positive testing", () => {
    test("when bike station exists within 500m of train station -> returns found bike station", () => {
      const result = filterNearbyBikes(mockBikeStations, trainStation.lat, trainStation.lng);
      const withinRange = result.find((bikes) => bikes.name === "CLOSE BIKE STATION", );
      expect(withinRange).toBeDefined();
    });

    test("when multiple bike stations exist within 500m of train station -> returns found bike stations", () => {
      const result = filterNearbyBikes(mockBikeStations,trainStation.lat,trainStation.lng);
      expect(result).toHaveLength(2);
    });

    test("when multiple bike stations are fetched -> results are sorted nearest first", () => {
      const result = filterNearbyBikes(mockBikeStations, trainStation.lat, trainStation.lng);
      expect(result[0].distance).toBeLessThan(result[1].distance);
    });
  });

describe("negative testing", () => {
  test("when no bike station exists within 500m of train station -> returns empty array", () => {
    const result = filterNearbyBikes(mockBikeStations, 60, -6.5);
    expect(result).toHaveLength(0);
  });

  test("when a bike station is outside of 500m -> it is excluded from the result", () => {
    const result = filterNearbyBikes( mockBikeStations, trainStation.lat, trainStation.lng);
    const outOfRange = result.find((bikes) => bikes.name === "OUT OF RANGE STATION");
    expect(outOfRange).toBeUndefined();
  });
  
  test("when there are no bike stations to be fetched -> returns empty array", () => {
    const result = filterNearbyBikes([], trainStation.lat, trainStation.lng);
    expect(result).toHaveLength(0);
  });
});
});

describe("Bookmark feature", () => {
  beforeEach(() => localStorage.clear()); //set up
  describe("positive testing", () => {
    test("when a parameter is passed -> saves item to localStorage", () => {
      saveFavouriteStation("BIKE STATION A");
      expect(loadFavouriteStation()).toEqual([{ name: "BIKE STATION A" }]);
    });

    test("when there are already 4 items saved -> saves the 5th item successfully", () => {
      saveFavouriteStation("BIKE STATION A");
      saveFavouriteStation("BIKE STATION B");
      saveFavouriteStation("BIKE STATION C");
      saveFavouriteStation("BIKE STATION D");
      const result = saveFavouriteStation("BIKE STATION E");
      expect(result.ok).toBe(true);
    });
  });

  describe("negative testing", () => {
    //the selectedStation input is set and validated in the searchBikeStation function
    //invalid inputs would not reach searchFavouriteStation directly through the UI
    test("when no station is selected for saving -> returns error message", () => {
      const result = saveFavouriteStation("");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Please select a bike station first.");
    });
    //while this unit test fails, it should not present a problem in the actual website
    test("when invalid station name is entered for saving -> returns error message", () => {
      const result = saveFavouriteStation("hello");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Please select a bike station first.");
    });

    test("when more than 5 stations are saved-> returns error message", () => {
      saveFavouriteStation("BIKE STATION A");
      saveFavouriteStation("BIKE STATION B");
      saveFavouriteStation("BIKE STATION C");
      saveFavouriteStation("BIKE STATION D");
      saveFavouriteStation("BIKE STATION E");
      const result = saveFavouriteStation("BIKE STATION F");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Maximum 5 saved stations reached.");
    });

    test("when no favourite stations are saved -> returns empty array", () => {
      expect(loadFavouriteStation()).toHaveLength(0);
    });
  });
});
