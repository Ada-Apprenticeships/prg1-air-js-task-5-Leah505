const fs = require('fs');
const {
  readCsv,
  validateAndCalculateProfit,
  processFlights,
  writeResultsToFile,
  generateFlightReport
} = require('./planning.js');

jest.mock('fs');

const airportsData = [
  ["JFK", "John F Kennedy International", "5376", "5583"],
  ["ORY", "Paris-Orly", "610", "325"]
];

const aeroplanesData = [
  ["Medium narrow body", "£8", "2650", "160", "12", "0"],
  ["Large narrow body", "£7", "5600", "180", "20", "4"]
];

const validFlightData = [
  ["MAN", "JFK", "Large narrow body", "150", "12", "2", "399", "999", "1899"],
  ["LGW", "ORY", "Medium narrow body", "120", "8", "0", "150", "450", "0"]
];

const invalidFlightData = [
  ["MAN", "JFK", "Medium narrow body", "150", "12", "2", "399", "999", "1899"], // range issue
  ["LGW", "ORY", "Large narrow body", "200", "25", "5", "450", "1200", "2500"], // seat overbooking
  ["LGW", "INVALID", "Medium narrow body", "120", "8", "0", "150", "450", "0"] // invalid airport code
];

// Testing readCsv function
describe("readCsv", () => {
  it("should read and parse the CSV file correctly", () => {
    fs.readFileSync.mockReturnValue("header1,header2\nvalue1,value2");
    const data = readCsv("dummy.csv");
    expect(data).toEqual([["value1", "value2"]]);
  });

  it("should return an empty array if the file is empty", () => {
    fs.readFileSync.mockReturnValue("");
    const data = readCsv("dummy.csv");
    expect(data).toEqual([]);
  });

  it("should throw an error if the file does not exist", () => {
    fs.readFileSync.mockImplementation(() => { throw new Error("File not found"); });
    expect(() => readCsv("non_existent.csv")).toThrow("Error reading file: File not found");
  });
});

// Testing validateAndCalculateProfit function
describe("validateAndCalculateProfit", () => {
  it("should calculate profit correctly for a valid flight", () => {
    const flight = validFlightData[0];
    const result = validateAndCalculateProfit(flight, airportsData, aeroplanesData);

    expect(result.income).toBe("75636.00");
    expect(result.cost).toBe("61716.48");
    expect(result.profit).toBe("13919.52");
  });

  it("should throw an error for invalid airport code", () => {
    const invalidFlight = ["MAN", "INVALID", "Large narrow body", "150", "12", "2", "399", "999", "1899"];
    expect(() => validateAndCalculateProfit(invalidFlight, airportsData, aeroplanesData)).toThrow("Invalid airport code: INVALID");
  });

  it("should throw an error if aircraft range is insufficient", () => {
    const flight = invalidFlightData[0]; // Range issue for Medium narrow body to JFK
    expect(() => validateAndCalculateProfit(flight, airportsData, aeroplanesData)).toThrow("Medium narrow body doesn't have the range to fly to JFK");
  });

  it("should throw an error for overbooked seats", () => {
    const flight = invalidFlightData[1]; // Too many seats booked for Large narrow body
    expect(() => validateAndCalculateProfit(flight, airportsData, aeroplanesData)).toThrow("Too many total seats booked (230 > 204)");
  });
});

// Testing processFlights function
describe("processFlights", () => {
  it("should process valid flights and calculate profit without errors", () => {
    const { results, errorMessages } = processFlights(validFlightData, airportsData, aeroplanesData);
    
    expect(results).toHaveLength(2);
    expect(errorMessages).toHaveLength(0);
  });

  it("should collect error messages for invalid flights", () => {
    const { results, errorMessages } = processFlights(invalidFlightData, airportsData, aeroplanesData);

    expect(results).toHaveLength(0);
    expect(errorMessages).toHaveLength(3);
    expect(errorMessages[0]).toContain("range to fly");
    expect(errorMessages[1]).toContain("Too many total seats");
    expect(errorMessages[2]).toContain("Invalid airport code");
  });
});

// Testing writeResultsToFile function
describe("writeResultsToFile", () => {
  it("should write the correct content to the file", () => {
    const sampleResults = [
      { flightDetails: validFlightData[0], income: "75636.00", cost: "61732.80", profit: "13903.20" },
      { flightDetails: validFlightData[1], income: "27600.00", cost: "12032.00", profit: "15568.00" }
    ];

    writeResultsToFile(sampleResults, "output.txt");

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "output.txt",
      "Flight: MAN, JFK, Large narrow body, 150, 12, 2, 399, 999, 1899 | Income: £75636.00 | Cost: £61732.80 | Profit: £13903.20\n" +
      "Flight: LGW, ORY, Medium narrow body, 120, 8, 0, 150, 450, 0 | Income: £27600.00 | Cost: £12032.00 | Profit: £15568.00"
    );
  });
});

// End-to-end test for generateFlightReport function
describe("generateFlightReport", () => {
  beforeEach(() => {
    fs.readFileSync.mockImplementation((filename) => {
      if (filename.includes("airports")) return "code,full name,distanceMAN,distanceLGW\nJFK,John F Kennedy International,5376,5583\nORY,Paris-Orly,610,325";
      if (filename.includes("aeroplanes")) return "type,runningcostperseatper100km,maxflightrange(km),economyseats,businessseats,firstclassseats\nMedium narrow body,£8,2650,160,12,0\nLarge narrow body,£7,5600,180,20,4";
      if (filename.includes("valid")) return "UK airport,Overseas airport,Type of aircraft,Number of economy seats booked,Number of business seats booked,Number of first class seats booked,Price of a economy class seat,Price of a business class seat,Price of a first class seat\nMAN,JFK,Large narrow body,150,12,2,399,999,1899\nLGW,ORY,Medium narrow body,120,8,0,150,450,0";
      if (filename.includes("invalid")) return "UK airport,Overseas airport,Type of aircraft,Number of economy seats booked,Number of business seats booked,Number of first class seats booked,Price of a economy class seat,Price of a business class seat,Price of a first class seat\nMAN,JFK,Medium narrow body,150,12,2,399,999,1899\nLGW,ORY,Large narrow body,200,25,5,450,1200,2500\nLGW,INVALID,Medium narrow body,120,8,0,150,450,0";
    });

    fs.writeFileSync.mockClear();
  });

  it("should run end-to-end without errors and write results to a file", () => {
    generateFlightReport();

    // Check the correct output file was created
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "flight_profitability_report.txt",
      expect.stringContaining("Flight: MAN, JFK, Large narrow body, 150, 12, 2, 399, 999, 1899 | Income: £75636.00 | Cost: £61716.48 | Profit: £13919.52")
    );
  });
});