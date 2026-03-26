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
#include <iomanip> // For std::setw

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

// Function to read and process the file for a specific country
std::vector<Candlestick> readAndProcessFile(const std::string& filePath, const std::string& country) {
    std::ifstream file(filePath);
    if (!file.is_open()) {
        std::cerr << "Error: Unable to open file: " << filePath << std::endl;
        return {};
    }

    std::string line;
    std::vector<Candlestick> candlesticks;
    std::map<int, std::vector<double>> yearlyTemps;

    std::getline(file, line); // Read the header
    std::stringstream headerStream(line);
    std::string columnName;
    int countryColumnIndex = -1, currentIndex = 0;

    while (std::getline(headerStream, columnName, ',')) {
        if (columnName == country) {
            countryColumnIndex = currentIndex;
            break;
        }
        currentIndex++;
    }

    if (countryColumnIndex == -1) {
        std::cerr << "Error: Country not found in the dataset.\n";
        return {};
    }

    while (std::getline(file, line)) {
        std::stringstream lineStream(line);
        std::string date, tempStr;
        std::getline(lineStream, date, ','); // Extract date

        int year = std::stoi(date.substr(0, 4));

        for (int i = 0; i <= countryColumnIndex; ++i) {
            std::getline(lineStream, tempStr, ',');
        }

        double temperature = safeStringToDouble(tempStr);
        if (!std::isnan(temperature)) {
            yearlyTemps[year].push_back(temperature);
        }
    }

    std::vector<double> prevYearTemps;

    for (const auto& pair : yearlyTemps) {
        int year = pair.first;
        const auto& temps = pair.second;

        if (!temps.empty()) {
            // Calculate average mean temperatures
            double currentYearAvg = std::accumulate(temps.begin(), temps.end(), 0.0) / temps.size();
            double prevYearAvg = prevYearTemps.empty() ? std::numeric_limits<double>::quiet_NaN()
                                                       : std::accumulate(prevYearTemps.begin(), prevYearTemps.end(), 0.0) / prevYearTemps.size();

            double high = *std::max_element(temps.begin(), temps.end());
            double low = *std::min_element(temps.begin(), temps.end());

            // Add the candlestick
            candlesticks.emplace_back(year, prevYearAvg, currentYearAvg, high, low);

            // Save current year temps for the next iteration
            prevYearTemps = temps;
        }
    }

    return candlesticks;
}

// Function to filter candlestick data by date range
std::vector<Candlestick> filterByDateRange(const std::vector<Candlestick>& data, int startYear, int endYear) {
    std::vector<Candlestick> filteredData;
    for (const auto& c : data) {
        if (c.year >= startYear && c.year <= endYear) {
            filteredData.push_back(c);
        }
    }
    return filteredData;
}

// Function to filter candlestick data by temperature range
std::vector<Candlestick> filterByTemperatureRange(const std::vector<Candlestick>& data, double minTemp, double maxTemp) {
    std::vector<Candlestick> filteredData;
    for (const auto& c : data) {
        if (c.high <= maxTemp && c.low >= minTemp) {
            filteredData.push_back(c);
        }
    }
    return filteredData;
}

// Function to create a text-based graph
void plotTextGraph(const std::vector<Candlestick>& data, int plotHeight = 10) {
    if (data.empty()) {
        std::cout << "No data to plot.\n";
        return;
    }

    // Determine the global min and max temperatures for scaling
    double globalMin = std::numeric_limits<double>::max();
    double globalMax = std::numeric_limits<double>::lowest();

    for (const auto& c : data) {
        globalMin = std::min(globalMin, c.low);
        globalMax = std::max(globalMax, c.high);
    }

    // Adjust globalMin and globalMax to the nearest multiple of 5
    int roundedMin = static_cast<int>(std::floor(globalMin / 5.0)) * 5;
    int roundedMax = static_cast<int>(std::ceil(globalMax / 5.0)) * 5;

    // Ensure the tick interval is 5
    int tickInterval = 5;

    // Display temperature values above the graph
    std::cout << "\nTemperature Values:\n";
    for (const auto& c : data) {
        std::cout << "Year " << c.year << ": "
                  << "Open: " << std::fixed << std::setprecision(1) << c.open << " | "
                  << "Close: " << c.close << " | "
                  << "High: " << c.high << " | "
                  << "Low: " << c.low << "\n";
    }
    std::cout << "\n";

    // Create a grid to store characters at each row and column
    std::vector<std::vector<std::string>> grid(plotHeight + 1, std::vector<std::string>(data.size(), " "));

    // Populate the grid with H, C, O, L based on actual values
    for (size_t i = 0; i < data.size(); ++i) {
        const auto& c = data[i];

        // Calculate positions on the grid
        int highRow = static_cast<int>(std::round((c.high - roundedMin) / (roundedMax - roundedMin) * plotHeight));
        int closeRow = static_cast<int>(std::round((c.close - roundedMin) / (roundedMax - roundedMin) * plotHeight));
        int openRow = static_cast<int>(std::round((c.open - roundedMin) / (roundedMax - roundedMin) * plotHeight));
        int lowRow = static_cast<int>(std::round((c.low - roundedMin) / (roundedMax - roundedMin) * plotHeight));

        // Insert characters into the grid, ensuring no overlap
        if (grid[highRow][i] == " ") {
            grid[highRow][i] = "  H  ";
        }
        if (grid[closeRow][i] == " ") {
            grid[closeRow][i] = "  C  ";
        } else if (closeRow > 0 && c.close > c.high) {
            grid[closeRow - 1][i] = "  C  "; // Shift up
        }
        if (grid[openRow][i] == " ") {
            grid[openRow][i] = "  O  ";
        } else if (openRow > 0 && c.open > c.close) {
            grid[openRow - 1][i] = "  O  "; // Shift up
        }
        if (grid[lowRow][i] == " ") {
            grid[lowRow][i] = "  L  ";
        } else if (lowRow > 0 && c.low > c.open) {
            grid[lowRow - 1][i] = "  L  "; // Shift up
        }
    }

    // Generate the graph
    for (int row = plotHeight; row >= 0; --row) {
        int currentValue = roundedMin + (row * tickInterval);

        std::cout << std::setw(6) << currentValue << " |";
        for (size_t col = 0; col < data.size(); ++col) {
            // Print centered characters in the grid
            std::cout << std::setw(6) << grid[row][col];
        }
        std::cout << "\n";

        // Add an empty row for spacing, except for the last row
        if (row > 0) {
            std::cout << std::setw(6) << " " << " |";
            for (size_t col = 0; col < data.size(); ++col) {
                std::cout << std::setw(6) << " ";
            }
            std::cout << "\n";
        }
    }

    // Print year labels centered below the graph
    std::cout << "       "; // Space before year labels
    for (const auto& c : data) {
        std::cout << std::setw(6) << c.year;
    }
    std::cout << "\n";
}

// Function to display candlestick data in a tabular format
void displayCandlestickData(const std::vector<Candlestick>& data) {
    if (data.empty()) {
        std::cout << "No data to display.\n";
        return;
    }

    // Print table header
    std::cout << std::setw(8) << "Year" << std::setw(12) << "Open"
              << std::setw(12) << "Close" << std::setw(12) << "High"
              << std::setw(12) << "Low" << "\n";
    std::cout << std::string(56, '-') << "\n";

    // Print data rows
    for (const auto& c : data) {
        std::cout << std::setw(8) << c.year
                  << std::setw(12) << std::fixed << std::setprecision(2) << c.open
                  << std::setw(12) << std::fixed << std::setprecision(2) << c.close
                  << std::setw(12) << std::fixed << std::setprecision(2) << c.high
                  << std::setw(12) << std::fixed << std::setprecision(2) << c.low
                  << "\n";
    }
}

int main() {
    // Path to the dataset
    std::string filePath = "weather_data_EU_1980-2019_temp_only.csv";
    std::string country;

    std::cout << "Enter the countrycode_temperature (e.g., GB_temperature): ";
    std::cin >> country;

    // Read and process the file for the selected country
    std::vector<Candlestick> candlesticks = readAndProcessFile(filePath, country);

    if (candlesticks.empty()) {
        std::cerr << "No data available for the selected country.\n";
        return 1;
    }

    std::vector<Candlestick> filteredData = candlesticks;

    while (true) {
        // Display filter options
        std::cout << "\nFilter Options:\n";
        std::cout << "1. Filter by Date Range\n";
        std::cout << "2. Filter by Temperature Range\n";
        std::cout << "3. Reset Filters\n";
        std::cout << "4. Plot Data\n";
        std::cout << "5. Display Data\n";
        std::cout << "6. Exit\n";
        std::cout << "Enter your choice: ";

        int choice;
        std::cin >> choice;

        if (choice == 1) {
            int startYear, endYear;
            std::cout << "Enter start year: ";
            std::cin >> startYear;
            std::cout << "Enter end year: ";
            std::cin >> endYear;
            filteredData = filterByDateRange(filteredData, startYear, endYear);
            std::cout << "Data filtered by date range.\n";
        } else if (choice == 2) {
            double minTemp, maxTemp;
            std::cout << "Enter minimum temperature: ";
            std::cin >> minTemp;
            std::cout << "Enter maximum temperature: ";
            std::cin >> maxTemp;
            filteredData = filterByTemperatureRange(filteredData, minTemp, maxTemp);
            std::cout << "Data filtered by temperature range.\n";
        } else if (choice == 3) {
            filteredData = candlesticks;  // Reset filters
            std::cout << "Filters reset.\n";
        } else if (choice == 4) {
            // Check if the year range exceeds 10 years
        if (!filteredData.empty()) {
            int startYear = filteredData.front().year;
            int endYear = filteredData.back().year;

            if (endYear - startYear > 10) {
                std::cout << "Cannot display: Year range exceeds 10 years.\n";
            } else {
                plotTextGraph(filteredData);
            }
        } else {
            std::cout << "Cannot display: No data available for the current filters.\n";
        }
        } else if (choice == 5) {
            displayCandlestickData(filteredData); // Display data in aligned format
        } else if (choice == 6) {
            std::cout << "Exiting.\n";
            break;
        } else {
            std::cout << "Invalid choice. Please try again.\n";
        }
    }

    return 0;
}