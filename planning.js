const fs = require('fs');

// Function to read CSV files
function readCsv(filename, delimiter = ',') {
    try {
        const fileContent = fs.readFileSync(filename, { encoding: 'utf-8' });
        const rows = fileContent.split('\n');
        const data = [];

        for (let i = 1; i < rows.length; i++) { // Skip header
            let row = rows[i].trim();

            if (row.includes('#')) {
                row = row.split('#')[0].trim();
            }
            
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

// Function to validate flight data and calculate profit
function validateAndCalculateProfit(flight, airports, aeroplanes) {
    const [ukAirportCode, overseasAirportCode, aircraftType, econSeats, busSeats, firstSeats, econPrice, busPrice, firstPrice] = flight;

    // Find distance from airports data
    const airportData = airports.find(row => row[0] === overseasAirportCode);
    if (!airportData) throw new Error(`Invalid airport code: ${overseasAirportCode}`);

    const distance = (ukAirportCode === 'MAN') ? parseFloat(airportData[2]) : parseFloat(airportData[3]);

    // Find aircraft data
    const aircraftData = aeroplanes.find(row => row[0] === aircraftType);
    if (!aircraftData) throw new Error(`Invalid aircraft type: ${aircraftType}`);

    const runningCost = parseFloat(aircraftData[1].replace('£', '')) / 100;
    const maxRange = parseFloat(aircraftData[2]);
    const economySeatsAvailable = parseInt(aircraftData[3]);
    const businessSeatsAvailable = parseInt(aircraftData[4]);
    const firstClassSeatsAvailable = parseInt(aircraftData[5]);
    const totalSeats = economySeatsAvailable + businessSeatsAvailable + firstClassSeatsAvailable;

    // Validate aircraft range
    if (distance > maxRange) {
        throw new Error(`${aircraftType} doesn't have the range to fly to ${overseasAirportCode}`);
    }

    // Validate seat bookings
    const totalSeatsBooked = parseInt(econSeats) + parseInt(busSeats) + parseInt(firstSeats);
    if (totalSeatsBooked > totalSeats) {
        throw new Error(`Too many total seats booked (${totalSeatsBooked} > ${totalSeats})`);
    }

    // Validate individual class seat bookings
    if (parseInt(econSeats) > economySeatsAvailable) {
        throw new Error(`Too many economy seats booked (${econSeats} > ${economySeatsAvailable})`);
    }
    if (parseInt(busSeats) > businessSeatsAvailable) {
        throw new Error(`Too many business seats booked (${busSeats} > ${businessSeatsAvailable})`);
    }
    if (parseInt(firstSeats) > firstClassSeatsAvailable) {
        throw new Error(`Too many first-class seats booked (${firstSeats} > ${firstClassSeatsAvailable})`);
    }

    // Calculate income
    const totalIncome = (parseInt(econSeats) * parseFloat(econPrice)) +
                        (parseInt(busSeats) * parseFloat(busPrice)) +
                        (parseInt(firstSeats) * parseFloat(firstPrice));

    // Calculate costs
    const costPerSeat = runningCost * distance;
    const totalCost = costPerSeat * totalSeatsBooked;

    // Calculate profit
    const profit = totalIncome - totalCost;

    return {
        flightDetails: flight,
        income: totalIncome.toFixed(2),
        cost: totalCost.toFixed(2),
        profit: profit.toFixed(2),
    };
}

// Function to process flight data
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

// Function to write results to a text file
function writeResultsToFile(results, filename) {
    const output = results.map(result => {
        return `Flight: ${result.flightDetails.join(', ')} | Income: £${result.income} | Cost: £${result.cost} | Profit: £${result.profit}`;
    }).join('\n');

    fs.writeFileSync(filename, output);
}

// Main function to execute the program
function generateFlightReport() {
    try {
        const airportsData = readCsv('airports.csv');
        const aeroplanesData = readCsv('aeroplanes.csv');

        // Read valid and invalid flight data separately
        const validFlightData = readCsv('valid_flight_data.csv');
        const invalidFlightData = readCsv('invalid_flight_data.csv');

        // Process valid flight data
        if (airportsData && aeroplanesData && validFlightData) {
            const { results, errorMessages } = processFlights(validFlightData, airportsData, aeroplanesData);
            
            // Display valid flight results on screen
            results.forEach(result => {
                console.log(`Valid Flight: ${result.flightDetails.join(', ')} | Income: £${result.income} | Cost: £${result.cost} | Profit: £${result.profit}`);
            });

            // Write results to a text file
            writeResultsToFile(results, 'flight_profitability_report.txt');

            // Display error messages for valid flights
            if (errorMessages.length > 0) {
                console.log("Errors encountered in valid flight processing:");
                errorMessages.forEach(error => console.error(error));
            }
        }

        // Process invalid flight data
        if (airportsData && aeroplanesData && invalidFlightData) {
            const { results: invalidResults, errorMessages: invalidErrorMessages } = processFlights(invalidFlightData, airportsData, aeroplanesData);

            // Display error messages for invalid flights
            if (invalidErrorMessages.length > 0) {
                console.log("Errors encountered in invalid flight processing:");
                invalidErrorMessages.forEach(error => console.error(error));
            }

        }

    } catch (err) {
        console.error(err.message); // Handle any errors that occur in main code
    }
}

// Run the main function
generateFlightReport();

module.exports = {
    readCsv,
    validateAndCalculateProfit,
    processFlights,
    writeResultsToFile,
    generateFlightReport,
};