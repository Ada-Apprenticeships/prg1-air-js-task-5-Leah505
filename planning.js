const fs = require('fs');

/**
 * Reads a CSV file and parses it into a 2D array, allowing for custom delimiters.
 * Ignores lines that start with a '#' (comments) and skips the header row.
 * 
 * @param {string} filename - The name of the file to read.
 * @param {string} delimiter - The delimiter used in the CSV file (default is comma).
 * @returns {Array} - A 2D array of the CSV data, with each row as an array of strings.
 */
function readCsv(filename, delimiter = ',') {
    try {
        const fileContent = fs.readFileSync(filename, { encoding: 'utf-8' });
        const rows = fileContent.split('\n');
        const data = [];

        for (let i = 1; i < rows.length; i++) { // Skip header row
            let row = rows[i].trim();

            if (row.includes('#')) {
                row = row.split('#')[0].trim();
            }
            
            // Only process non-empty rows
            if (row) {
                const columns = row.split(delimiter);
                data.push(columns);
            }
        }
        return data;
    } catch (err) {
        throw new Error(`Error reading file: ${err.message}`);
    }
}

/**
 * Validates flight data and calculates profit based on seat bookings and aircraft details.
 * Ensures the aircraft can reach the destination and that seat bookings are within capacity.
 * 
 * @param {Array} flight - Flight details array [ukAirportCode, overseasAirportCode, ... seat/pricing data].
 * @param {Array} airports - Array of airports data containing distance info.
 * @param {Array} aeroplanes - Array of aircraft data with range and seating capacity.
 * @returns {Object} - An object with flight details, income, cost, and calculated profit.
 * @throws Will throw an error if validation fails (e.g., invalid airport code, overbooked seats).
 */
function validateAndCalculateProfit(flight, airports, aeroplanes) {
    const [ukAirportCode, overseasAirportCode, aircraftType, econSeats, busSeats, firstSeats, econPrice, busPrice, firstPrice] = flight;

    const airportData = airports.find(row => row[0] === overseasAirportCode);
    if (!airportData) throw new Error(`Invalid airport code: ${overseasAirportCode}`);

    // Determine the distance based on departure airport
    const distance = (ukAirportCode === 'MAN') ? parseFloat(airportData[2]) : parseFloat(airportData[3]);

    // Find the matching aircraft data
    const aircraftData = aeroplanes.find(row => row[0] === aircraftType);
    if (!aircraftData) throw new Error(`Invalid aircraft type: ${aircraftType}`);

    // Extract aircraft-specific data
    const runningCost = parseFloat(aircraftData[1].replace('£', '')) / 100; // cost per mile in £
    const maxRange = parseFloat(aircraftData[2]);
    const economySeatsAvailable = parseInt(aircraftData[3]);
    const businessSeatsAvailable = parseInt(aircraftData[4]);
    const firstClassSeatsAvailable = parseInt(aircraftData[5]);
    const totalSeats = economySeatsAvailable + businessSeatsAvailable + firstClassSeatsAvailable;

    if (distance > maxRange) {
        throw new Error(`${aircraftType} doesn't have the range to fly to ${overseasAirportCode}`);
    }

    // Calculate the total seats booked and validate against aircraft capacity
    const totalSeatsBooked = parseInt(econSeats) + parseInt(busSeats) + parseInt(firstSeats);
    if (totalSeatsBooked > totalSeats) {
        throw new Error(`Too many total seats booked (${totalSeatsBooked} > ${totalSeats})`);
    }

    // Validate seat bookings per class
    if (parseInt(econSeats) > economySeatsAvailable) {
        throw new Error(`Too many economy seats booked (${econSeats} > ${economySeatsAvailable})`);
    }
    if (parseInt(busSeats) > businessSeatsAvailable) {
        throw new Error(`Too many business seats booked (${busSeats} > ${businessSeatsAvailable})`);
    }
    if (parseInt(firstSeats) > firstClassSeatsAvailable) {
        throw new Error(`Too many first-class seats booked (${firstSeats} > ${firstClassSeatsAvailable})`);
    }

    // Calculate total income based on seats sold in each class
    const totalIncome = (parseInt(econSeats) * parseFloat(econPrice)) +
                        (parseInt(busSeats) * parseFloat(busPrice)) +
                        (parseInt(firstSeats) * parseFloat(firstPrice));

    const costPerSeat = runningCost * distance;
    const totalCost = costPerSeat * totalSeatsBooked;
    const profit = totalIncome - totalCost;

    return {
        flightDetails: flight,
        income: totalIncome.toFixed(2),
        cost: totalCost.toFixed(2),
        profit: profit.toFixed(2),
    };
}

/**
 * Processes a list of flights, validating and calculating profit for each flight.
 * Collects successful results and any errors encountered.
 * 
 * @param {Array} flights - Array of flight data.
 * @param {Array} airports - Array of airport data.
 * @param {Array} aeroplanes - Array of aircraft data.
 * @returns {Object} - An object with valid results and error messages.
 */
function processFlights(flights, airports, aeroplanes) {
    const results = [];
    const errorMessages = []; // Store error messages for invalid flights

    flights.forEach(flight => {
        try {
            const result = validateAndCalculateProfit(flight, airports, aeroplanes);
            results.push(result);
        } catch (error) {
            errorMessages.push(`Flight Data: ${flight.join(', ')} - Error: ${error.message}`);
        }
    });

    return { results, errorMessages };
}

/**
 * Writes the results of processed flights to a text file.
 * 
 * @param {Array} results - Array of processed flight results.
 * @param {string} filename - The name of the output file.
 */
function writeResultsToFile(results, filename) {
    const output = results.map(result => {
        return `Flight: ${result.flightDetails.join(', ')} | Income: £${result.income} | Cost: £${result.cost} | Profit: £${result.profit}`;
    }).join('\n');

    fs.writeFileSync(filename, output);
}

/**
 * Main function to run the program, generating a flight report.
 * Reads input data, processes flights, and handles both valid and invalid data.
 */
function generateFlightReport() {
    try {
        const airportsData = readCsv('airports.csv');
        const aeroplanesData = readCsv('aeroplanes.csv');
        const validFlightData = readCsv('valid_flight_data.csv');
        const invalidFlightData = readCsv('invalid_flight_data.csv');

        if (airportsData && aeroplanesData && validFlightData) {
            const { results, errorMessages } = processFlights(validFlightData, airportsData, aeroplanesData);
            
            // Display valid flight results on screen
            results.forEach(result => {
                console.log(`Valid Flight: ${result.flightDetails.join(', ')} | Income: £${result.income} | Cost: £${result.cost} | Profit: £${result.profit}`);
            });

            writeResultsToFile(results, 'flight_profitability_report.txt');

            // Display error messages for valid flights
            if (errorMessages.length > 0) {
                console.log("Errors encountered in valid flight processing:");
                errorMessages.forEach(error => console.error(error));
            }
        }

        if (airportsData && aeroplanesData && invalidFlightData) {
            const { results: invalidResults, errorMessages: invalidErrorMessages } = processFlights(invalidFlightData, airportsData, aeroplanesData);

            // Display error messages for invalid flights
            if (invalidErrorMessages.length > 0) {
                console.log("Errors encountered in invalid flight processing:");
                invalidErrorMessages.forEach(error => console.error(error));
            }
        }

    } catch (err) {
        console.error(err.message);
    }
}

generateFlightReport();

module.exports = {
    readCsv,
    validateAndCalculateProfit,
    processFlights,
    writeResultsToFile,
    generateFlightReport,
};