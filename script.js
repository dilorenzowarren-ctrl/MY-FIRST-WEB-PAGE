
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // WEATHER DASHBOARD - WORLDWIDE CITY SEARCH
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

    // Check that the weather HTML elements exist.
    if (
        weatherForm &&
        citySearch &&
        suggestions &&
        weatherStatus &&
        weatherResults &&
        searchButton &&
        refreshButton
    ) {

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

        // Build the city dropdown.
        function showSuggestions(cities) {
            closeSuggestions();

            suggestionCities = cities;

            if (!cities.length) {
                return;
            }

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

        // Select a city from the dropdown.
        function selectCity(index) {
            const city = suggestionCities[index];

            if (!city) {
                return;
            }

            selectedCity = city;

            citySearch.value = [
                city.name,
                city.admin1,
                city.country
            ].filter(Boolean).join(", ");

            closeSuggestions();
            loadWeather(city);
        }

        // Search for cities worldwide.
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

                // Ignore older searches that finish late.
                if (searchId !== latestSearchId) {
                    return;
                }

                showSuggestions(data.results || []);

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

        // Search while the user types.
        citySearch.addEventListener("input", () => {
            selectedCity = null;
            clearTimeout(searchTimer);

            const query = citySearch.value.trim();

            if (query.length < 2) {
                latestSearchId++;
                closeSuggestions();
                return;
            }

            showWeatherStatus("Searching for cities...");

            searchTimer = setTimeout(() => {
                findCities(query);
            }, 350);
        });

        // Keyboard controls for the dropdown.
        citySearch.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                event.preventDefault();

                if (!suggestions.hidden && suggestionCities.length > 0) {
                    selectCity(
                        activeSuggestion >= 0 ? activeSuggestion : 0
                    );
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
            }

            if (event.key === "ArrowUp" && !suggestions.hidden) {
                event.preventDefault();

                activeSuggestion = Math.max(
                    activeSuggestion - 1,
                    0
                );
            }

            if (event.key === "Escape") {
                closeSuggestions();
                return;
            }

            const buttons = suggestions.querySelectorAll("button");

            buttons.forEach((button, index) => {
                button.setAttribute(
                    "aria-selected",
                    String(index === activeSuggestion)
                );
            });
        });

        // Close dropdown when clicking outside the weather form.
        document.addEventListener("click", (event) => {
            if (!weatherForm.contains(event.target)) {
                closeSuggestions();
            }
        });

        // Load current weather for a selected city.
        async function loadWeather(city) {

            if (
                !city ||
                !Number.isFinite(city.latitude) ||
                !Number.isFinite(city.longitude)
            ) {
                showWeatherStatus("Please choose a valid city.", true);
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
                    throw new Error("Weather information is unavailable.");
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

        // Display weather information on the page.
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

        // Prevent the page from refreshing when the form is submitted.
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

            showWeatherStatus("Finding your city...");

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

                if (!data.results || !data.results.length) {
                    throw new Error(
                        "City not found. Try another spelling."
                    );
                }

                selectedCity = data.results[0];

                closeSuggestions();

                await loadWeather(selectedCity);

            } catch (error) {
                showWeatherStatus(
                    error.message || "Unable to find that city.",
                    true
                );
            }
        });

        // Refresh weather for the last selected city.
        refreshButton.addEventListener("click", () => {
            if (lastWeatherLocation) {
                loadWeather(lastWeatherLocation);
            }
        });
    }


    // ==========================================
    // DOM MANIPULATION & EVENTS ASSIGNMENT
    // ==========================================

    // Requirement 1: Button changes page content.

    const messageButton = document.getElementById("message-button");
    const welcomeMessage = document.getElementById("welcome-message");

    if (messageButton && welcomeMessage) {
        messageButton.addEventListener("click", () => {
            welcomeMessage.textContent =
                "Thanks for visiting! JavaScript is working successfully!";
        });
    }


    // Requirement 2: Interactive CSS styling.

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


    // Requirement 3: Dynamic list using createElement()
    // and appendChild().

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

        itemInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                addListItem();
            }
        });
    }


    // ==========================================
    // MOBILE NAVIGATION
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

        navLinks.querySelectorAll("a").forEach((link) => {

            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }


    // ==========================================
    // CONTACT FORM VALIDATION
    // ==========================================

    const contactForm = document.querySelector("#contact-form");

    if (contactForm) {

        contactForm.addEventListener("submit", (event) => {

            const name = contactForm.querySelector("#name");
            const email = contactForm.querySelector("#email");
            const message = contactForm.querySelector("#message");

            if (!name || !email || !message) {
                return;
            }

            if (
                !name.value.trim() ||
                !email.value.trim() ||
                !message.value.trim()
            ) {
                event.preventDefault();
                alert("Please complete all contact form fields.");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email.value.trim())) {
                event.preventDefault();
                alert("Please enter a valid email address.");
            }
        });
    }

});
