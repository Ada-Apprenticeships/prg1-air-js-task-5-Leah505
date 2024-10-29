const fs = require('fs');

// Function to read CSV files
function readCsv(filename, delimiter = ',') {
    try {
        const fileContent = fs.readFileSync(filename, { encoding: 'utf-8' });
        const rows = fileContent.split('\n');
        const data = [];

        for (let i = 1; i < rows.length; i++) { // Skip header
            const row = rows[i].trim();
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
    const totalIncome = ((econSeats) * (econPrice)) +
                        ((busSeats) * (busPrice)) +
                        ((firstSeats) * (firstPrice));

    // Calculate costs
    const costPerSeat = runningCost * distance;
    const totalCost = costPerSeat * totalSeatsBooked;

    // Calculate profit
    const profit = totalIncome - totalCost;

    return {
        
    };
}

// Function to process flight data
function processFlights(flights, airports, aeroplanes) {
    const results = [];
    const errorMessages = []; // error messages for invalid flights

    flights.forEach(flight => {
        try {
            const result = validateAndCalculateProfit(flight, airports, aeroplanes);
            results.push(result);
        }
    });

    return { results,  };
}

// Function to write results to a text file
function writeResultsToFile(results, filename) {
    const output = results

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
            results.forEach(result)

            // Write results to a text file
            writeResultsToFile(results, 'flight_profitability_report.txt');

            
            }
        }

        // Process invalid flight data
        if (airportsData && aeroplanesData && invalidFlightData) {
            const { results: invalidResults, errorMessages: invalidErrorMessages } = processFlights(invalidFlightData, airportsData, aeroplanesData);


            }

        }

    } catch (err) {
        console.error(err.message); // Handle any errors that occur
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