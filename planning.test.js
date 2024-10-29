const fs = require('fs');
const path = require('path');

// Import the functions from your main file
const { readCsv, validateAndCalculateProfit, processFlights, writeResultsToFile } = require('./planning.js'); // Update the path as necessary



        // Check if file was written correctly
        expect(fs.writeFileSync).toHaveBeenCalledWith('flight_profitability_report.txt', expect.any(String));
    