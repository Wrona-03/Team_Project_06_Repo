/* tests for autocomplete functionality, live departure display */
function filterStations(stations, val) {
    if (!val) return [];
    return stations.filter(station =>
        station.name.toLowerCase().includes(val.toLowerCase())
    );
}

function getExpectedDisplay(expected, scheduled) {
    return expected === scheduled ? "On Time" : expected;
}

function isValidCode(code) {
    return code !== "" && code !== null && code !== undefined;
}

/* mock data */
const mockStations = [
    { name: "Dublin Connolly", code: "DCON" },
    { name: "Dublin Pearse", code: "PEAR" },
    { name: "Coolmine", code: "COOL" },
    { name: "Maynooth", code: "MAYN" }
];



/* Autocomplete Tests */
/* test("returns matching stations when input matches station code") */
/* tests for station name matching */
test("returns matching stations when input matches station name", () => {
    const result = filterStations(mockStations, "Dublin");
    expect(result.length).toBe(2);
});

/* test("returns empty array when input does not match any station") */
/* tests for empty input */
test("returns empty array when input is empty", () => {
    const result = filterStations(mockStations, "");
    expect(result.length).toBe(0);
});

/* test("returns match regardless of input casing") */
/* tests for case insensitivity */
test("returns match regardless of input casing", () => {
    const result = filterStations(mockStations, "connolly");
    expect(result[0].name).toBe("Dublin Connolly");
});


/* testing for live departure */
/* test("displays On Time when expected time matches scheduled time") */
/* tests for expected time matching scheduled time */
test("displays On Time when expected time matches scheduled time", () => {
    const result = getExpectedDisplay("11:30", "11:30");
    expect(result).toBe("On Time");
});

/* test("displays expected time when it does not match scheduled time" */
/* tests for expected time not matching scheduled time */
test("displays actual time when train is delayed", () => {
    const result = getExpectedDisplay("11:45", "11:30");
    expect(result).toBe("11:45");
});

/* Valid Code Tests */
test("returns false when no station is selected", () => {
    const result = isValidCode("");
    expect(result).toBe(false);
});
