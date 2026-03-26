#include <iostream>
#include <vector>
#include <cmath>
#include <iomanip>
#include <fstream>
#include <sstream>
#include <string>
#include <map>
#include <algorithm>
#include <numeric>

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
std::map<int, double> readDataForCountry(const std::string& filePath, const std::string& country) {
    std::ifstream file(filePath);
    if (!file.is_open()) {
        std::cerr << "Error: Unable to open file: " << filePath << std::endl;
        return {};
    }

    std::string line;
    std::map<int, std::vector<double>> yearlyTemps;

    // Parse the header row to find the column for the specified country
    std::getline(file, line);
    std::stringstream headerStream(line);
    std::string columnName;
    int countryColumnIndex = -1;
    int currentIndex = 0;

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

    // Process the data for the selected country
    while (std::getline(file, line)) {
        std::stringstream lineStream(line);
        std::string date, tempStr;
        std::getline(lineStream, date, ',');

        int year = std::stoi(date.substr(0, 4));
        for (int i = 0; i <= countryColumnIndex; ++i) {
            std::getline(lineStream, tempStr, ',');
        }

        double temperature = safeStringToDouble(tempStr);
        if (!std::isnan(temperature)) {
            yearlyTemps[year].push_back(temperature);
        }
    }

    // Calculate the average temperature per year
    std::map<int, double> avgTemps;
    for (const auto& entry : yearlyTemps) {
        const auto& temps = entry.second;
        avgTemps[entry.first] = std::accumulate(temps.begin(), temps.end(), 0.0) / temps.size();
    }

    return avgTemps;
}

// Function to compute polynomial regression coefficients
std::vector<double> fitPolynomial(const std::vector<int>& x, const std::vector<double>& y, int degree) {
    int n = x.size();
    int d = degree + 1;

    // Initialize matrices
    std::vector<std::vector<double>> X(d, std::vector<double>(d, 0));
    std::vector<double> Y(d, 0);

    // Compute X matrix (sum of powers of x)
    for (int i = 0; i < d; ++i) {
        for (int j = 0; j < d; ++j) {
            for (int k = 0; k < n; ++k) {
                X[i][j] += std::pow(x[k], i + j);
            }
        }
    }

    // Compute Y vector (sum of x^i * y)
    for (int i = 0; i < d; ++i) {
        for (int k = 0; k < n; ++k) {
            Y[i] += std::pow(x[k], i) * y[k];
        }
    }

    // Solve for coefficients using Gaussian elimination
    std::vector<double> coefficients(d, 0);
    for (int i = 0; i < d; ++i) {
        // Normalize the pivot row
        double pivot = X[i][i];
        for (int j = 0; j < d; ++j) {
            X[i][j] /= pivot;
        }
        Y[i] /= pivot;

        // Eliminate other rows
        for (int k = 0; k < d; ++k) {
            if (k != i) {
                double factor = X[k][i];
                for (int j = 0; j < d; ++j) {
                    X[k][j] -= factor * X[i][j];
                }
                Y[k] -= factor * Y[i];
            }
        }
    }

    // Extract coefficients
    for (int i = 0; i < d; ++i) {
        coefficients[i] = Y[i];
    }

    return coefficients;
}

// Function to predict temperature using polynomial regression
double predictPolynomial(const std::vector<double>& coefficients, int x) {
    double prediction = 0.0;
    for (size_t i = 0; i < coefficients.size(); ++i) {
        prediction += coefficients[i] * std::pow(x, i);
    }
    return prediction;
}

// Function to plot the predictions
void plotPredictions(const std::vector<std::pair<int, double>>& predictions) {
    if (predictions.empty()) {
        std::cout << "No predictions to plot.\n";
        return;
    }

    // Determine min and max temperature and round to nearest multiples of 0.05
    double minTemp = std::numeric_limits<double>::max();
    double maxTemp = std::numeric_limits<double>::lowest();
    for (const auto& p : predictions) {
        minTemp = std::min(minTemp, p.second);
        maxTemp = std::max(maxTemp, p.second);
    }
    double roundedMinTemp = std::floor(minTemp / 0.05) * 0.05;
    double roundedMaxTemp = std::ceil(maxTemp / 0.05) * 0.05;

    // Ensure a consistent tick interval of 0.05
    double tickInterval = 0.05;

    // Calculate the number of rows for the y-axis
    int numTicks = static_cast<int>((roundedMaxTemp - roundedMinTemp) / tickInterval) + 1;

    // Create a grid for the plot
    const int columnWidth = 8;
    const int plotHeight = numTicks - 1;

    for (int row = plotHeight; row >= 0; --row) {
        double currentValue = roundedMinTemp + row * tickInterval;

        // Print y-axis label
        std::cout << std::setw(6) << std::fixed << std::setprecision(2) << currentValue << " |";

        // Plot the points for each year
        for (const auto& p : predictions) {
            // Calculate the row for this prediction
            int predictedRow = static_cast<int>((p.second - roundedMinTemp) / tickInterval + 0.5);

            // Prepare column for alignment
            std::string column(columnWidth, ' ');
            if (row == predictedRow) {
                column[columnWidth / 2] = '*'; // Place the '*' in the middle
            }
            std::cout << column;
        }
        std::cout << "\n";
    }

    // Print the x-axis (year labels)
    std::cout << "       "; // Offset for y-axis labels
    for (const auto& p : predictions) {
        std::cout << std::setw(columnWidth) << p.first;
    }
    std::cout << "\n";
}

int main() {
    std::string filePath = "weather_data_EU_1980-2019_temp_only.csv";
    std::string country;

    std::cout << "Enter the countrycode_temperature (e.g., GB_temperature): ";
    std::cin >> country;

    auto avgTemps = readDataForCountry(filePath, country);

    if (avgTemps.empty()) {
        std::cerr << "No data available for the selected country.\n";
        return 1;
    }

    std::vector<int> years;
    std::vector<double> temperatures;
    for (const auto& entry : avgTemps) {
        years.push_back(entry.first);
        temperatures.push_back(entry.second);
    }

    int degree = 2; // Degree of the polynomial
    auto coefficients = fitPolynomial(years, temperatures, degree);

    int startYear, endYear;
    std::cout << "Enter start year for prediction: ";
    std::cin >> startYear;
    std::cout << "Enter end year for prediction: ";
    std::cin >> endYear;

    // Check if the year range exceeds 10
    if (endYear - startYear > 10) {
        std::cout << "Year range exceeds 10 years.\n";
        return 0;
    }

    if (startYear <= 2019) {
    std::cout << "Cannot predict: Year range includes 2019 or earlier.\n";
    return 0;
    }

    // Perform predictions if range is valid
    std::vector<std::pair<int, double>> predictions;
    for (int year = startYear; year <= endYear; ++year) {
        double predictedTemp = predictPolynomial(coefficients, year);
        predictions.emplace_back(year, predictedTemp);
    }

    std::cout << "\nPredicted Temperatures:\n";
    for (const auto& p : predictions) {
        std::cout << "Year: " << p.first << ", Predicted Avg Temp: " << p.second << "°C\n";
    }

    std::cout << "\nPrediction Plot:\n";
    plotPredictions(predictions);

    return 0;
}
