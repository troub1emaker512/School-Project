#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include <string>
#include <map>
#include <algorithm>
#include <limits>
#include <numeric>
#include <cmath>
#include <iomanip> // For std::setw

// Define a Candlestick class
class Candlestick {
public:
    double open; // The average temperature of the previous year
    double close; // The average temperature of the current year
    double high; // The highest temperature of the current year
    double low; // The lowest temperature of the current year
    int year;

    // Constructor
    Candlestick(int yr, double op, double cl, double hi, double lo)
        : year(yr), open(op), close(cl), high(hi), low(lo) {}
};

// Function to safely convert a string to double
double safeStringToDouble(const std::string& str) {
    try {
        if (str.empty()) throw std::invalid_argument("Empty string");
        return std::stod(str);
    } catch (const std::exception&) {
        return std::numeric_limits<double>::quiet_NaN();
    }
}

// Function to compute candlestick data
std::vector<Candlestick> computeCandlestickData(const std::string& location, const std::string& filePath) {
    std::vector<Candlestick> candlesticks;
    std::ifstream file(filePath);

    if (!file.is_open()) {
        std::cerr << "Error: Unable to open file: " << filePath << std::endl;
        return candlesticks;
    }

    std::string line;
    std::map<std::string, int> locationColumnIndex;
    std::vector<double> previousYearTemps;
    std::vector<double> currentYearTemps;
    int currentYear = 0;
    double yearlyHigh = std::numeric_limits<double>::lowest();
    double yearlyLow = std::numeric_limits<double>::max();

    // Read the header line and map column indices
    if (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string columnName;
        int index = 0;
        while (std::getline(ss, columnName, ',')) {
            locationColumnIndex[columnName] = index++;
        }
    }

     // Ensure the specified location exists in the dataset
    if (locationColumnIndex.find(location) == locationColumnIndex.end()) {
        std::cerr << "Error: Location '" << location << "' not found in the dataset.\n";
        return candlesticks;
    }

    int columnIndex = locationColumnIndex[location];

    // Process each line of data
    while (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string date, temperatureStr;
        double temperature;
        int columnCounter = 0;

        // Parse date
        std::getline(ss, date, ',');

        // Locate the correct temperature column
        for (int i = 0; i <= columnIndex; ++i) {
            std::getline(ss, temperatureStr, ',');
        }

        temperature = safeStringToDouble(temperatureStr);
        if (std::isnan(temperature)) continue;

        // Extract the year from the date (format assumed: YYYY-MM-DD)
        int year = std::stoi(date.substr(0, 4));

        // Handle year change
        if (currentYear != year) {
            if (currentYear != 0 && !currentYearTemps.empty()) {
                 // Compute 'open' as the average temperature of the previous year
                double open = !previousYearTemps.empty() ?
                              std::accumulate(previousYearTemps.begin(), previousYearTemps.end(), 0.0) / previousYearTemps.size() :
                              std::numeric_limits<double>::quiet_NaN();
                 // Compute 'close' as the average temperature of the current year
                double close = std::accumulate(currentYearTemps.begin(), currentYearTemps.end(), 0.0) / currentYearTemps.size();

                // Add a new candlestick object for the completed year
                candlesticks.emplace_back(currentYear, open, close, yearlyHigh, yearlyLow);
            }

            // Transition to the new year: move current year's temperatures to the previous year
            previousYearTemps = currentYearTemps;
            currentYearTemps.clear();

            // Reset yearly high and low temperatures
            currentYear = year;
            yearlyHigh = std::numeric_limits<double>::lowest();
            yearlyLow = std::numeric_limits<double>::max();
        }

        // Add the current temperature to the list and update yearly high/low
        currentYearTemps.push_back(temperature);
        yearlyHigh = std::max(yearlyHigh, temperature);
        yearlyLow = std::min(yearlyLow, temperature);
    }

     // Handle the last year in the dataset
    if (!currentYearTemps.empty()) {
        double open = !previousYearTemps.empty() ?
                      std::accumulate(previousYearTemps.begin(), previousYearTemps.end(), 0.0) / previousYearTemps.size() :
                      std::numeric_limits<double>::quiet_NaN();
        double close = std::accumulate(currentYearTemps.begin(), currentYearTemps.end(), 0.0) / currentYearTemps.size();

        candlesticks.emplace_back(currentYear, open, close, yearlyHigh, yearlyLow);
    }

    return candlesticks;
}

// Helper function to print candlestick data
void printCandlestickData(const std::vector<Candlestick>& candlesticks) {
    std::cout << std::setw(8) << "Year" << std::setw(12) << "Open"
              << std::setw(12) << "Close" << std::setw(12) << "High"
              << std::setw(12) << "Low" << std::endl;
    std::cout << std::string(56, '-') << std::endl;

    for (const auto& c : candlesticks) {
        std::cout << std::setw(8) << c.year
                  << std::setw(12) << std::fixed << std::setprecision(2) << c.open
                  << std::setw(12) << c.close
                  << std::setw(12) << c.high
                  << std::setw(12) << c.low << std::endl;
    }
}

// Main function
int main() {
    std::string filePath = "weather_data_EU_1980-2019_temp_only.csv";

    // Get the country code from the user
    std::string location;
    std::cout << "Enter countrycode_temperature (e.g., GB_temperature): ";
    std::cin >> location;

    std::vector<Candlestick> candlestickData = computeCandlestickData(location, filePath);

    if (candlestickData.empty()) {
        std::cout << "No data available for the specified country." << std::endl;
        return 1;
    }

    printCandlestickData(candlestickData);

    return 0;
}
