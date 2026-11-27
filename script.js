"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. NAVIGATION MENU
    // ==========================================

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("active");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // ==========================================
    // 2. WEATHER SEARCH ELEMENTS
    // ==========================================

    const weatherForm = document.getElementById("weather-form");
    const citySearch = document.getElementById("city-search");
    const suggestions = document.getElementById("city-suggestions");
    const weatherStatus = document.getElementById("weather-status");
    const weatherResults = document.getElementById("weather-results");
    const searchButton = document.getElementById("weather-search-button");
    const refreshButton = document.getElementById("weather-refresh-button");

    const weatherCity = document.getElementById("weather-city");
    const weatherDescription = document.getElementById("weather-description");
    const weatherIcon = document.getElementById("weather-icon");
    const weatherTemperature = document.getElementById("weather-temperature");
    const weatherFeelsLike = document.getElementById("weather-feels-like");
    const weatherHumidity = document.getElementById("weather-humidity");
    const weatherWind = document.getElementById("weather-wind");
    const weatherUpdated = document.getElementById("weather-updated");

    let selectedCity = null;
    let lastWeatherLocation = null;
    let suggestionCities = [];
    let searchTimer = null;
    let latestSearchId = 0;
    let weatherRequestId = 0;

    // ==========================================
    // 3. WEATHER CONDITIONS
    // ==========================================

    const weatherCodes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Moderate drizzle", "🌦️"],
        55: ["Heavy drizzle", "🌧️"],
        56: ["Freezing drizzle", "🌧️"],
        57: ["Heavy freezing drizzle", "🌧️"],
        61: ["Light rain", "🌧️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        66: ["Freezing rain", "🌧️"],
        67: ["Heavy freezing rain", "🌧️"],
        71: ["Light snow", "🌨️"],
        73: ["Moderate snow", "🌨️"],
        75: ["Heavy snow", "❄️"],
        77: ["Snow grains", "❄️"],
        80: ["Rain showers", "🌦️"],
        81: ["Moderate rain showers", "🌧️"],
        82: ["Heavy rain showers", "⛈️"],
        85: ["Snow showers", "🌨️"],
        86: ["Heavy snow showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with hail", "⛈️"],
        99: ["Severe thunderstorm", "⛈️"]
    };

    // ==========================================
    // 4. WEATHER HELPER FUNCTIONS
    // ==========================================

    function showWeatherStatus(message, isError = false) {
        if (!weatherStatus) return;

        weatherStatus.textContent = message;
        weatherStatus.classList.toggle("weather-error", isError);
    }

    function closeSuggestions() {
        if (!suggestions) return;

        suggestions.replaceChildren();
        suggestions.hidden = true;
        suggestionCities = [];
    }

    function cityLabel(city) {
        return [
            city.name,
            city.admin1,
            city.country
        ].filter(Boolean).join(", ");
    }

    // ==========================================
    // 5. CITY AUTOCOMPLETE SEARCH
    // ==========================================

    async function findCities(query) {
        const searchId = ++latestSearchId;

        try {
            const url = new URL(
                "https://geocoding-api.open-meteo.com/v1/search"
            );

            url.search = new URLSearchParams({
                name: query,
                count: "6",
                language: "en",
                format: "json"
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("City search is unavailable.");
            }

            const data = await response.json();

            if (searchId !== latestSearchId) return;

            const cities = data.results || [];

            closeSuggestions();

            if (cities.length === 0) {
                showWeatherStatus("No matching cities found.");
                return;
            }

            suggestionCities = cities;

            cities.forEach((city, index) => {
                const item = document.createElement("li");
                const button = document.createElement("button");

                button.type = "button";
                button.setAttribute("role", "option");
                button.textContent = cityLabel(city);

                button.addEventListener("click", () => {
                    selectCity(index);
                });

                item.appendChild(button);
                suggestions.appendChild(item);
            });

            suggestions.hidden = false;
            showWeatherStatus("Select a city or continue typing.");

        } catch (error) {
            if (searchId === latestSearchId) {
                closeSuggestions();
                showWeatherStatus(
                    "Unable to search cities. Check your internet connection.",
                    true
                );
            }
        }
    }

    // ==========================================
    // 6. SELECT A CITY
    // ==========================================

    function selectCity(index) {
        const city = suggestionCities[index];

        if (!city) return;

        selectedCity = city;
        citySearch.value = cityLabel(city);

        closeSuggestions();
        loadWeather(city);
    }

    // ==========================================
    // 7. LOAD WEATHER DATA
    // ==========================================

    async function loadWeather(city) {
        if (
            !city ||
            !Number.isFinite(city.latitude) ||
            !Number.isFinite(city.longitude)
        ) {
            showWeatherStatus("Please select a valid city.", true);
            return;
        }

        const requestId = ++weatherRequestId;

        lastWeatherLocation = city;
        weatherResults.hidden = true;

        showWeatherStatus("Loading current weather...");

        searchButton.disabled = true;
        refreshButton.disabled = true;

        try {
            const url = new URL(
                "https://api.open-meteo.com/v1/forecast"
            );

            url.search = new URLSearchParams({
                latitude: city.latitude,
                longitude: city.longitude,
                current: [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "weather_code",
                    "wind_speed_10m"
                ].join(","),
                temperature_unit: "fahrenheit",
                wind_speed_unit: "mph",
                timezone: "auto"
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Weather service is unavailable.");
            }

            const data = await response.json();

            if (!data.current) {
                throw new Error("Weather information was not returned.");
            }

            if (requestId !== weatherRequestId) return;

            displayWeather(city, data.current);

            showWeatherStatus("Weather successfully updated.");

        } catch (error) {
            if (requestId === weatherRequestId) {
                showWeatherStatus(
                    error.message || "Unable to load weather.",
                    true
                );
            }

        } finally {
            if (requestId === weatherRequestId) {
                searchButton.disabled = false;
                refreshButton.disabled = false;
            }
        }
    }

    // ==========================================
    // 8. DISPLAY WEATHER
    // ==========================================

    function displayWeather(city, current) {
        const weather = weatherCodes[current.weather_code] ||
            ["Unknown conditions", "🌡️"];

        weatherCity.textContent = cityLabel(city);
        weatherDescription.textContent = weather[0];
        weatherIcon.textContent = weather[1];

        weatherTemperature.textContent =
            `${Math.round(current.temperature_2m)}°F`;

        weatherFeelsLike.textContent =
            `${Math.round(current.apparent_temperature)}°F`;

        weatherHumidity.textContent =
            `${current.relative_humidity_2m}%`;

        weatherWind.textContent =
            `${Math.round(current.wind_speed_10m)} mph`;

        weatherUpdated.textContent =
            `Local observation time: ${current.time.replace("T", " ")}`;

        weatherResults.hidden = false;
    }

    // ==========================================
    // 9. CONNECT WEATHER FORM
    // ==========================================

    if (
        weatherForm &&
        citySearch &&
        suggestions &&
        weatherStatus &&
        weatherResults &&
        searchButton &&
        refreshButton
    ) {

        // Search cities as the user types.

        citySearch.addEventListener("input", () => {
            const query = citySearch.value.trim();

            selectedCity = null;
            closeSuggestions();

            clearTimeout(searchTimer);

            if (query.length < 2) {
                latestSearchId++;
                showWeatherStatus("Enter at least two letters to search.");
                return;
            }

            showWeatherStatus("Searching for cities...");

            searchTimer = setTimeout(() => {
                findCities(query);
            }, 350);
        });

        // Keyboard support for autocomplete.

        citySearch.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeSuggestions();
            }

            if (event.key === "ArrowDown" && !suggestions.hidden) {
                event.preventDefault();
                suggestions.querySelector("button")?.focus();
            }
        });

        // Prevent page refresh when submitting the weather form.

        weatherForm.addEventListener("submit", async event => {
            event.preventDefault();

            const query = citySearch.value.trim();

            if (!query) {
                showWeatherStatus("Please enter a city name.", true);
                return;
            }

            clearTimeout(searchTimer);
            latestSearchId++;

            if (selectedCity) {
                await loadWeather(selectedCity);
                return;
            }

            showWeatherStatus("Finding your city...");
            searchButton.disabled = true;

            try {
                const url = new URL(
                    "https://geocoding-api.open-meteo.com/v1/search"
                );

                url.search = new URLSearchParams({
                    name: query,
                    count: "1",
                    language: "en",
                    format: "json"
                });

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("City lookup failed.");
                }

                const data = await response.json();

                if (!data.results || data.results.length === 0) {
                    throw new Error(
                        "City not found. Check the spelling and try again."
                    );
                }

                selectedCity = data.results[0];
                citySearch.value = cityLabel(selectedCity);

                closeSuggestions();

                await loadWeather(selectedCity);

            } catch (error) {
                showWeatherStatus(error.message, true);
                searchButton.disabled = false;
            }
        });

        // Refresh the last searched city.

        refreshButton.addEventListener("click", () => {
            if (lastWeatherLocation) {
                loadWeather(lastWeatherLocation);
            }
        });

        // Close suggestions when clicking outside the weather form.

        document.addEventListener("click", event => {
            if (!weatherForm.contains(event.target)) {
                closeSuggestions();
            }
        });
    }

    // ==========================================
    // 10. INTERACTIVE MESSAGE BUTTON
    // ==========================================

    const messageButton = document.getElementById("message-button");
    const welcomeMessage = document.getElementById("welcome-message");

    if (messageButton && welcomeMessage) {
        messageButton.addEventListener("click", () => {
            welcomeMessage.textContent =
                "Thanks for visiting! JavaScript is working successfully.";
        });
    }

    // ==========================================
    // 11. INTERACTIVE INPUT STYLING
    // ==========================================

    const colorInput = document.getElementById("color-input");
    const inputFeedback = document.getElementById("input-feedback");

    if (colorInput && inputFeedback) {
        colorInput.addEventListener("input", () => {
            const hasText = colorInput.value.trim().length > 0;

            colorInput.classList.toggle("input-active", hasText);

            inputFeedback.textContent = hasText
                ? "Great! Your input has changed the field's appearance."
                : "The input field changes appearance when you type.";
        });
    }

    // ==========================================
    // 12. DYNAMIC LIST
    // ==========================================

    const itemInput = document.getElementById("item-input");
    const addItemButton = document.getElementById("add-item-button");
    const dynamicList = document.getElementById("dynamic-list");
    const listFeedback = document.getElementById("list-feedback");

    if (itemInput && addItemButton && dynamicList && listFeedback) {

        function addListItem() {
            const itemText = itemInput.value.trim();

            if (!itemText) {
                listFeedback.textContent = "Please enter an item first.";
                itemInput.focus();
                return;
            }

            const newItem = document.createElement("li");
            const itemLabel = document.createElement("span");
            const removeButton = document.createElement("button");

            itemLabel.textContent = itemText;

            removeButton.type = "button";
            removeButton.textContent = "Remove";
            removeButton.classList.add("remove-button");
            removeButton.setAttribute(
                "aria-label",
                `Remove ${itemText}`
            );

            removeButton.addEventListener("click", () => {
                newItem.remove();
                listFeedback.textContent = "Item removed successfully.";
            });

            newItem.appendChild(itemLabel);
            newItem.appendChild(removeButton);

            dynamicList.appendChild(newItem);

            itemInput.value = "";
            itemInput.focus();

            listFeedback.textContent = "Item added successfully!";
        }

        addItemButton.addEventListener("click", addListItem);

        itemInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                addListItem();
            }
        });
    }

});
