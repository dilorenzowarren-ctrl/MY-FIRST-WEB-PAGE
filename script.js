
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // WEATHER DASHBOARD - OPEN-METEO API
    // ==========================================

    const weatherForm = document.getElementById("weather-form");
    const citySearch = document.getElementById("city-search");
    const suggestions = document.getElementById("city-suggestions");
    const weatherStatus = document.getElementById("weather-status");
    const weatherResults = document.getElementById("weather-results");
    const searchButton = document.getElementById("weather-search-button");
    const refreshButton = document.getElementById("weather-refresh-button");

    let selectedCity = null;
    let searchTimer = null;
    let activeSuggestion = -1;
    let suggestionCities = [];
    let latestSearchId = 0;
    let lastWeatherLocation = null;

    const weatherCodes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Depositing rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Moderate drizzle", "🌦️"],
        55: ["Dense drizzle", "🌧️"],
        56: ["Light freezing drizzle", "🌧️"],
        57: ["Dense freezing drizzle", "🌧️"],
        61: ["Slight rain", "🌧️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        66: ["Light freezing rain", "🌧️"],
        67: ["Heavy freezing rain", "🌧️"],
        71: ["Slight snowfall", "🌨️"],
        73: ["Moderate snowfall", "🌨️"],
        75: ["Heavy snowfall", "❄️"],
        77: ["Snow grains", "❄️"],
        80: ["Slight rain showers", "🌦️"],
        81: ["Moderate rain showers", "🌧️"],
        82: ["Violent rain showers", "⛈️"],
        85: ["Snow showers", "🌨️"],
        86: ["Heavy snow showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with hail", "⛈️"],
        99: ["Severe thunderstorm with hail", "⛈️"]
    };

    function showWeatherStatus(message, isError = false) {
        weatherStatus.textContent = message;
        weatherStatus.classList.toggle("weather-error", isError);
    }

    function closeSuggestions() {
        suggestions.replaceChildren();
        suggestions.hidden = true;
        activeSuggestion = -1;
        suggestionCities = [];
    }

    function showSuggestions(cities) {
        closeSuggestions();
        suggestionCities = cities;

        if (!cities.length) return;

        cities.forEach((city, index) => {
            const item = document.createElement("li");
            const option = document.createElement("button");

            option.type = "button";
            option.setAttribute("role", "option");
            option.textContent = [
                city.name,
                city.admin1,
                city.country
            ].filter(Boolean).join(", ");

            option.addEventListener("click", () => {
                selectCity(index);
            });

            item.appendChild(option);
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
            const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
            url.search = new URLSearchParams({
                name: query,
                count: "6",
                language: "en",
                format: "json"
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("City search is temporarily unavailable.");
            }

            const data = await response.json();

            if (searchId !== latestSearchId) return;

            showSuggestions(data.results || []);

        } catch (error) {
            if (searchId === latestSearchId) {
                closeSuggestions();
                showWeatherStatus("Unable to search cities. Please try again.", true);
            }
        }
    }

    citySearch.addEventListener("input", () => {
        selectedCity = null;
        clearTimeout(searchTimer);

        const query = citySearch.value.trim();

        if (query.length < 2) {
            latestSearchId++;
            closeSuggestions();
            return;
        }

        searchTimer = setTimeout(() => findCities(query), 350);
    });

    citySearch.addEventListener("keydown", (event) => {
        if (suggestions.hidden || !suggestionCities.length) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            activeSuggestion = Math.min(
                activeSuggestion + 1,
                suggestionCities.length - 1
            );
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            activeSuggestion = Math.max(activeSuggestion - 1, 0);
        } else if (event.key === "Escape") {
            closeSuggestions();
            return;
        } else if (event.key === "Enter" && activeSuggestion >= 0) {
            event.preventDefault();
            selectCity(activeSuggestion);
            return;
        }

        if (activeSuggestion >= 0) {
            const buttons = suggestions.querySelectorAll("button");
            buttons.forEach((button, index) => {
                button.setAttribute(
                    "aria-selected",
                    String(index === activeSuggestion)
                );
            });
        }
    });

    document.addEventListener("click", (event) => {
        if (!weatherForm.contains(event.target)) {
            closeSuggestions();
        }
    });

    async function loadWeather(city) {
        if (!city || !Number.isFinite(city.latitude) ||
            !Number.isFinite(city.longitude)) {
            showWeatherStatus("Please choose a valid city.", true);
            return;
        }

        lastWeatherLocation = city;
        weatherResults.hidden = true;
        showWeatherStatus("Loading current weather...");
        searchButton.disabled = true;
        refreshButton.disabled = true;

        try {
            const url = new URL("https://api.open-meteo.com/v1/forecast");

            url.search = new URLSearchParams({
                latitude: city.latitude,
                longitude: city.longitude,
                current: [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "is_day",
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
                throw new Error("Weather service returned an error.");
            }

            const data = await response.json();

            if (!data.current) {
                throw new Error("Weather information was unavailable.");
            }

            displayWeather(city, data.current);
            showWeatherStatus("Weather successfully updated.");

        } catch (error) {
            showWeatherStatus(
                "Sorry, we couldn't load the weather. Check your connection and try again.",
                true
            );
        } finally {
            searchButton.disabled = false;
            refreshButton.disabled = false;
        }
    }

    function displayWeather(city, current) {
        const weather = weatherCodes[current.weather_code] ||
            ["Unknown conditions", "🌡️"];

        document.getElementById("weather-city").textContent =
            [city.name, city.admin1, city.country].filter(Boolean).join(", ");

        document.getElementById("weather-description").textContent = weather[0];
        document.getElementById("weather-icon").textContent = weather[1];

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

    weatherForm.addEventListener("submit", async (event) => {
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

        // Resolve the typed city even if the user did not select a suggestion.
        showWeatherStatus("Finding your city...");

        try {
            const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
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

            if (!data.results || !data.results.length) {
                throw new Error("City not found. Try another spelling.");
            }

            selectedCity = data.results[0];
            closeSuggestions();
            await loadWeather(selectedCity);

        } catch (error) {
            showWeatherStatus(
                error.message || "Unable to find that city. Please try again.",
                true
            );
        }
    });

    refreshButton.addEventListener("click", () => {
        if (lastWeatherLocation) {
            loadWeather(lastWeatherLocation);
        }
    });


    // ==========================================
    // DOM MANIPULATION & EVENTS ASSIGNMENT
    // ==========================================

    // Requirement 1: Change content after a button click.

    const messageButton = document.getElementById("message-button");
    const welcomeMessage = document.getElementById("welcome-message");

    messageButton.addEventListener("click", () => {
        welcomeMessage.textContent =
            "Thanks for visiting! JavaScript is working successfully!";
    });


    // Requirement 2: Change CSS styling based on user interaction.

    const colorInput = document.getElementById("color-input");
    const inputFeedback = document.getElementById("input-feedback");

    colorInput.addEventListener("input", () => {
        const hasText = colorInput.value.trim().length > 0;

        colorInput.classList.toggle("input-active", hasText);

        inputFeedback.textContent = hasText
            ? "Great! Your input has changed the field's appearance."
            : "The input field changes appearance when you type.";
    });


    // Requirement 3: Create and append dynamic list items.

    const itemInput = document.getElementById("item-input");
    const addItemButton = document.getElementById("add-item-button");
    const dynamicList = document.getElementById("dynamic-list");
    const listFeedback = document.getElementById("list-feedback");

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
        removeButton.setAttribute("aria-label", `Remove ${itemText}`);

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

    itemInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addListItem();
        }
    });

});
