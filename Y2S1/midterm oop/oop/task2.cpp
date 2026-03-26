#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include <string>
#include <algorithm>
#include <limits>
#include <numeric>
#include <cmath>
#include <map>
#include <iomanip>

// Define the Candlestick class
class Candlestick {
public:
    double open;
    double close;
    double high;
    double low;
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
    } catch (...) {
        return std::numeric_limits<double>::quiet_NaN();
    }
}

// Function to compute candlestick data from the CSV file
std::vector<Candlestick> computeCandlestickData(const std::string& location, const std::string& filePath) {
    std::vector<Candlestick> candlesticks;
    std::ifstream file(filePath);

    if (!file.is_open()) {
        std::cerr << "Error: Unable to open file: " << filePath << std::endl;
        return candlesticks;
    }

    std::string line;
    std::map<std::string, int> locationColumnIndex;
    std::vector<double> previousYearTemps, currentYearTemps;
    int currentYear = 0;
    double yearlyHigh = std::numeric_limits<double>::lowest();
    double yearlyLow = std::numeric_limits<double>::max();

    // Parse header row to get column indices
    if (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string columnName;
        int index = 0;
        while (std::getline(ss, columnName, ',')) {
            locationColumnIndex[columnName] = index++;
        }
    }

    if (locationColumnIndex.find(location) == locationColumnIndex.end()) {
        std::cerr << "Error: Location '" << location << "' not found in the dataset.\n";
        return candlesticks;
    }

    int columnIndex = locationColumnIndex[location];

    // Read data rows
    while (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string date, temperatureStr;
        double temperature;

        std::getline(ss, date, ',');  // Parse date

        // Parse the specified location's temperature column
        for (int i = 0; i <= columnIndex; ++i) {
            std::getline(ss, temperatureStr, ',');
        }

        temperature = safeStringToDouble(temperatureStr);
        if (std::isnan(temperature)) continue;

        int year = std::stoi(date.substr(0, 4));
        if (currentYear != year) {
            if (!currentYearTemps.empty()) {
                double open = previousYearTemps.empty() ? std::numeric_limits<double>::quiet_NaN()
                                                        : std::accumulate(previousYearTemps.begin(), previousYearTemps.end(), 0.0) / previousYearTemps.size();
                double close = std::accumulate(currentYearTemps.begin(), currentYearTemps.end(), 0.0) / currentYearTemps.size();
                candlesticks.emplace_back(currentYear, open, close, yearlyHigh, yearlyLow);
            }
            previousYearTemps = currentYearTemps;
            currentYearTemps.clear();
            currentYear = year;
            yearlyHigh = std::numeric_limits<double>::lowest();
            yearlyLow = std::numeric_limits<double>::max();
        }

        currentYearTemps.push_back(temperature);
        yearlyHigh = std::max(yearlyHigh, temperature);
        yearlyLow = std::min(yearlyLow, temperature);
    }

    // Process the final year
    if (!currentYearTemps.empty()) {
        double open = previousYearTemps.empty() ? std::numeric_limits<double>::quiet_NaN()
                                                : std::accumulate(previousYearTemps.begin(), previousYearTemps.end(), 0.0) / previousYearTemps.size();
        double close = std::accumulate(currentYearTemps.begin(), currentYearTemps.end(), 0.0) / currentYearTemps.size();
        candlesticks.emplace_back(currentYear, open, close, yearlyHigh, yearlyLow);
    }

    return candlesticks;
}

// Function to print vertical candlestick plot with values
void printVerticalCandlestickPlot(const std::vector<Candlestick>& candlesticks) {
    const int plotHeight = 10;

    for (const auto& c : candlesticks) {
        // Print the legend for this year's data
        std::cout << "Legend:\n";
        std::cout << "  H - High temperature\n";
        std::cout << "  O - Open (average temperature of the previous year)\n";
        std::cout << "  C - Close (average temperature of the current year)\n";
        std::cout << "  L - Low temperature\n";
        std::cout << std::string(30, '-') << "\n";
   
        std::cout << "Year " << c.year << ":\n";
        std::cout << "  Open: " << c.open << " | Close: " << c.close 
                  << " | High: " << c.high << " | Low: " << c.low << "\n";

        double range = c.high - c.low;
        int openPos = static_cast<int>((c.open - c.low) / range * (plotHeight - 1));
        int closePos = static_cast<int>((c.close - c.low) / range * (plotHeight - 1));
        int highPos = 0;
        int lowPos = plotHeight - 1;

        if (openPos == closePos) {
            if (openPos < plotHeight - 1) {
                ++closePos;
            } else {
                --openPos;
            }
        }

        // Adjust min and max temperatures to the nearest multiples of 10
        int minTemp = static_cast<int>(std::floor(c.low / 10.0)) * 10;
        int maxTemp = static_cast<int>(std::ceil(c.high / 10.0)) * 10;

        // Generate temperature values for the scale
        std::vector<int> tempScale;
        for (int temp = maxTemp; temp >= minTemp; temp -= 10) {
            tempScale.push_back(temp);
        }

        // Map temperature values to their respective rows
        std::map<int, int> tempRows;
        for (size_t i = 0; i < tempScale.size(); ++i) {
            int row = static_cast<int>((c.high - tempScale[i]) / range * (plotHeight - 1));
            tempRows[row] = tempScale[i];
        }

        for (int i = 0; i < plotHeight; ++i) {
            // Print temperature value if it matches the row
            if (tempRows.find(i) != tempRows.end()) {
                std::cout << std::setw(4) << tempRows[i] << " ";
            } else {
                std::cout << "     "; // Empty space for alignment
            }

            // Display candlestick representation
            if (i == openPos) std::cout << " O  ";
            else if (i == closePos) std::cout << " C  ";
            else if (i == highPos) std::cout << " H  ";
            else if (i == lowPos) std::cout << " L  ";
            else std::cout << " |  ";
            std::cout << '\n';
        }

        std::cout << '\n';
    }
}

// Main function
int main() {
    std::string filePath = "weather_data_EU_1980-2019_temp_only.csv";

    // Get the country code from the user
    std::string location;
    std::cout << "Enter the country code (e.g., GB_temperature): ";
    std::cin >> location;

    auto candlestickData = computeCandlestickData(location, filePath);

    if (candlestickData.empty()) {
        std::cerr << "No data available for the specified country." << std::endl;
        return 1;
    }

    printVerticalCandlestickPlot(candlestickData);

    return 0;
}