
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // MOBILE NAVIGATION MENU
    // ==========================================

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("active");

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }


    // ==========================================
    // WORLDWIDE WEATHER SEARCH
    // ==========================================

    const weatherForm = document.getElementById("weather-form");
    const citySearch = document.getElementById("city-search");
    const suggestions = document.getElementById("city-suggestions");
    const weatherStatus = document.getElementById("weather-status");
    const weatherResults = document.getElementById("weather-results");
    const searchButton = document.getElementById("weather-search-button");
    const refreshButton = document.getElementById("weather-refresh-button");

    let selectedCity = null;
    let lastWeatherLocation = null;
    let suggestionCities = [];
    let activeSuggestion = -1;
    let searchTimer;
    let latestSearchId = 0;

    const weatherCodes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Moderate drizzle", "🌦️"],
        55: ["Dense drizzle", "🌧️"],
        56: ["Freezing drizzle", "🌧️"],
        57: ["Heavy freezing drizzle", "🌧️"],
        61: ["Slight rain", "🌧️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        66: ["Freezing rain", "🌧️"],
        67: ["Heavy freezing rain", "🌧️"],
        71: ["Slight snow", "🌨️"],
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
        activeSuggestion = -1;
    }

    function updateSuggestionSelection() {
        const buttons = suggestions.querySelectorAll("button");

        buttons.forEach((button, index) => {
            button.setAttribute(
                "aria-selected",
                String(index === activeSuggestion)
            );
        });
    }

    function showSuggestions(cities) {
        closeSuggestions();

        if (!cities.length) return;

        suggestionCities = cities;

        cities.forEach((city, index) => {
            const item = document.createElement("li");
            const button = document.createElement("button");

            button.type = "button";
            button.setAttribute("role", "option");

            button.textContent = [
                city.name,
                city.admin1,
                city.country
            ].filter(Boolean).join(", ");

            button.addEventListener("click", () => {
                selectCity(index);
            });

            item.appendChild(button);
            suggestions.appendChild(item);
        });

        suggestions.hidden = false;
    }

    function selectCity(index) {
        const city = suggestionCities[index];

        if (!city) return;

        selectedCity = city;

        citySearch.value = [
            city.name,
            city.admin1,
            city.country
        ].filter(Boolean).join(", ");

        closeSuggestions();
        loadWeather(city);
    }

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

            showSuggestions(data.results || []);

            if (!data.results || data.results.length === 0) {
                showWeatherStatus("No matching cities found.");
            }

        } catch (error) {
            if (searchId === latestSearchId) {
                closeSuggestions();
                showWeatherStatus(
                    "Unable to search cities. Please try again.",
                    true
                );
            }
        }
    }

    if (
        weatherForm &&
        citySearch &&
        suggestions &&
        weatherStatus &&
        weatherResults &&
        searchButton &&
        refreshButton
    ) {

        // CITY AUTOCOMPLETE

        citySearch.addEventListener("input", () => {
            selectedCity = null;
            clearTimeout(searchTimer);

            const query = citySearch.value.trim();

            if (query.length < 2) {
                latestSearchId++;
                closeSuggestions();
                showWeatherStatus("Enter at least two letters to search.");
                return;
            }

            showWeatherStatus("Searching for cities...");

            searchTimer = setTimeout(() => {
                findCities(query);
            }, 350);
        });


        // KEYBOARD NAVIGATION AND ENTER KEY

        citySearch.addEventListener("keydown", event => {

            if (event.key === "Enter") {
                event.preventDefault();

                clearTimeout(searchTimer);

                if (!suggestions.hidden && suggestionCities.length > 0) {
                    selectCity(activeSuggestion >= 0 ? activeSuggestion : 0);
                } else {
                    weatherForm.requestSubmit();
                }

                return;
            }

            if (event.key === "ArrowDown" && !suggestions.hidden) {
                event.preventDefault();

                activeSuggestion = Math.min(
                    activeSuggestion + 1,
                    suggestionCities.length - 1
                );

                updateSuggestionSelection();
            }

            if (event.key === "ArrowUp" && !suggestions.hidden) {
                event.preventDefault();

                activeSuggestion = Math.max(
                    activeSuggestion - 1,
                    0
                );

                updateSuggestionSelection();
            }

            if (event.key === "Escape") {
                closeSuggestions();
            }
        });


        // CLOSE DROPDOWN WHEN CLICKING OUTSIDE

        document.addEventListener("click", event => {
            if (!weatherForm.contains(event.target)) {
                closeSuggestions();
            }
        });


        // LOAD WEATHER

        async function loadWeather(city) {

            if (
                !city ||
                !Number.isFinite(city.latitude) ||
                !Number.isFinite(city.longitude)
            ) {
                showWeatherStatus("Please select a valid city.", true);
                return;
            }

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
                        "precipitation",
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

                displayWeather(city, data.current);

                showWeatherStatus("Weather successfully updated.");

            } catch (error) {
                showWeatherStatus(
                    "Unable to load weather. Please check your connection and try again.",
                    true
                );

            } finally {
                searchButton.disabled = false;
                refreshButton.disabled = false;
            }
        }


        // DISPLAY WEATHER INFORMATION

        function displayWeather(city, current) {

            const weather = weatherCodes[current.weather_code] ||
                ["Unknown conditions", "🌡️"];

            document.getElementById("weather-city").textContent =
                [
                    city.name,
                    city.admin1,
                    city.country
                ].filter(Boolean).join(", ");

            document.getElementById("weather-description").textContent =
                weather[0];

            document.getElementById("weather-icon").textContent =
                weather[1];

            document.getElementById("weather-temperature").textContent =
                `${Math.round(current.temperature_2m)}°F`;

            document.getElementById("weather-feels-like").textContent =
                `${Math.round(current.apparent_temperature)}°F`;

            document.getElementById("weather-humidity").textContent =
                `${current.relative_humidity_2m}%`;

            document.getElementById("weather-wind").textContent =
                `${Math.round(current.wind_speed_10m)} mph`;

            document.getElementById("weather-updated").textContent =
                `Local observation time: ${current.time.replace("T", " ")}`;

            weatherResults.hidden = false;
        }


        // WEATHER FORM SUBMISSION

        weatherForm.addEventListener("submit", async event => {

            event.preventDefault();

            const query = citySearch.value.trim();

            if (!query) {
                showWeatherStatus("Please enter a city name.", true);
                return;
            }

            clearTimeout(searchTimer);

            if (selectedCity) {
                closeSuggestions();
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
                    throw new Error("City not found. Try another spelling.");
                }

                selectedCity = data.results[0];

                citySearch.value = [
                    selectedCity.name,
                    selectedCity.admin1,
                    selectedCity.country
                ].filter(Boolean).join(", ");

                closeSuggestions();

                await loadWeather(selectedCity);

            } catch (error) {
                showWeatherStatus(error.message, true);

            } finally {
                searchButton.disabled = false;
            }
        });


        // REFRESH WEATHER

        refreshButton.addEventListener("click", () => {
            if (lastWeatherLocation) {
                loadWeather(lastWeatherLocation);
            }
        });
    }


    // ==========================================
    // DOM MANIPULATION ASSIGNMENT
    // ==========================================

    // REQUIREMENT 1: BUTTON CHANGES CONTENT

    const messageButton = document.getElementById("message-button");
    const welcomeMessage = document.getElementById("welcome-message");

    if (messageButton && welcomeMessage) {
        messageButton.addEventListener("click", () => {
            welcomeMessage.textContent =
                "Thanks for visiting! JavaScript is working successfully.";
        });
    }


    // REQUIREMENT 2: INTERACTIVE CSS STYLING

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


    // REQUIREMENT 3: DYNAMIC LIST
    // Uses createElement() and appendChild().

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
