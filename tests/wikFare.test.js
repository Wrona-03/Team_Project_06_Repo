// Test 1 : Zone calculation when the user enters an origin AND a destination
const { calculateZone } = require("./wikFare");

test("returns higher zone when destination exists", () => {
  const result = calculateZone(1, 3);
  expect(result).toBe(3);
});

// Test 2 : Zone calculation when the user does NOT enter a destination
test("returns origin zone when there is no destination", () => {
  const result = calculateZone(2, null);
  expect(result).toBe(2);
});

// Test 3 : Fare extraction / checking if the expected data is the actual data
const { getFare } = require("./wikFare");

test("returns correct fare values for zone 2", () => {
  const card = {
    "Zone 2 fare": 3.3,
    "Zone 2 weekly": 10.6,
    "Zone 2 monthly": 46.2,
    "Daily Cap": 1.95,
    "Weekly Cap": 7.8,
  };

  const result = getFare(card, 2);

  expect(result.single).toBe(3.3);
  expect(result.weekly).toBe(10.6);
  expect(result.monthly).toBe(46.2);
  expect(result.dailyCap).toBe(1.95);
  expect(result.weeklyCap).toBe(7.8);
});

// Test 4 : Testing for zone 5 (which doesn't exist)
test("returns error for non-existant zone", () => {
  const card = {
    "Zone 2 fare": 3.3,
    "Zone 2 weekly": 10.6,
    "Zone 2 monthly": 46.2,
  };

  const result = getFare(card, 5);

  expect(result.single).toBeUndefined();
  expect(result.weekly).toBeUndefined();
  expect(result.monthly).toBeUndefined();
});
