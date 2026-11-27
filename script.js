
document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. MOBILE NAVIGATION
    // ==========================================

    const menuButton = document.getElementById("menu-toggle");
    const navList = document.getElementById("nav-list");

    if (menuButton && navList) {
        menuButton.addEventListener("click", function () {
            const isOpen =
                menuButton.getAttribute("aria-expanded") === "true";

            menuButton.setAttribute("aria-expanded", String(!isOpen));
            navList.classList.toggle("mobile-visible", !isOpen);
        });
    }


    // ==========================================
    // 2. CONTACT FORM VALIDATION
    // ==========================================

    const form = document.getElementById("contact-form");

    if (form) {
        const status = document.getElementById("form-status");

        const fields = [
            { id: "name", errorId: "name-error", message: "Please enter your full name." },
            { id: "email", errorId: "email-error", message: "Please enter a valid email address." },
            { id: "subject", errorId: "subject-error", message: "Please enter a subject." },
            { id: "message", errorId: "message-error", message: "Please enter a message." }
        ];

        function validateField(field) {
            const input = document.getElementById(field.id);
            const error = document.getElementById(field.errorId);

            if (!input || !error) return false;

            const value = input.value.trim();
            let errorMessage = "";

            if (value === "") {
                errorMessage = field.message;
            } else if (
                field.id === "email" &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ) {
                errorMessage = "Please enter a valid email address.";
            }

            error.textContent = errorMessage;
            input.classList.toggle("invalid", errorMessage !== "");
            input.setAttribute("aria-invalid", String(errorMessage !== ""));

            return errorMessage === "";
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            let formIsValid = true;
            let firstInvalidField = null;

            fields.forEach(function (field) {
                if (!validateField(field)) {
                    formIsValid = false;

                    if (!firstInvalidField) {
                        firstInvalidField =
                            document.getElementById(field.id);
                    }
                }
            });

            if (!formIsValid) {
                status.textContent = "Please correct the errors above.";

                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
            } else {
                status.textContent = "All fields are valid! Thank you.";
                form.reset();

                fields.forEach(function (field) {
                    const input = document.getElementById(field.id);
                    const error = document.getElementById(field.errorId);

                    if (input && error) {
                        input.classList.remove("invalid");
                        input.removeAttribute("aria-invalid");
                        error.textContent = "";
                    }
                });
            }
        });

        fields.forEach(function (field) {
            const input = document.getElementById(field.id);

            if (input) {
                input.addEventListener("input", function () {
                    validateField(field);
                    status.textContent = "";
                });
            }
        });
    }


    // ==========================================
    // 3. WORLDWIDE WEATHER AND CITY AUTOCOMPLETE
    // ==========================================

    const weatherForm = document.getElementById("weather-form");
    const cityInput = document.getElementById("city-search");
    const suggestions = document.getElementById("city-suggestions");
    const weatherButton = document.getElementById("weather-search-button");
    const refreshButton = document.getElementById("weather-refresh");
    const weatherStatus = document.getElementById("weather-status");
    const weatherDetails = document.getElementById("weather-details");
    const weatherSection = document.getElementById("weather-section");

    if (
        weatherForm &&
        cityInput &&
        suggestions &&
        weatherButton &&
        refreshButton &&
        weatherStatus &&
        weatherDetails
    ) {

        let currentLocation = {
            name: "Port St. Lucie",
            latitude: 27.2730,
            longitude: -80.3582,
            country: "United States"
        };

        let selectedLocation = null;
        let suggestionTimer = null;
        let searchNumber = 0;

        const weatherDescriptions = {
            0: ["Clear sky", "☀️"],
            1: ["Mainly clear", "🌤️"],
            2: ["Partly cloudy", "⛅"],
            3: ["Overcast", "☁️"],
            45: ["Foggy", "🌫️"],
            48: ["Foggy", "🌫️"],
            51: ["Light drizzle", "🌦️"],
            53: ["Drizzle", "🌦️"],
            55: ["Heavy drizzle", "🌧️"],
            61: ["Light rain", "🌧️"],
            63: ["Rain", "🌧️"],
            65: ["Heavy rain", "🌧️"],
            71: ["Light snow", "🌨️"],
            73: ["Snow", "🌨️"],
            75: ["Heavy snow", "❄️"],
            80: ["Rain showers", "🌦️"],
            81: ["Rain showers", "🌧️"],
            82: ["Heavy rain showers", "⛈️"],
            95: ["Thunderstorm", "⛈️"],
            96: ["Thunderstorm with hail", "⛈️"],
            99: ["Severe thunderstorm", "⛈️"]
        };


        // CITY AUTOCOMPLETE

        async function findCities(query) {
            const requestNumber = ++searchNumber;

            if (query.length < 2) {
                suggestions.hidden = true;
                suggestions.replaceChildren();
                return;
            }

            try {
                const url =
                    "https://geocoding-api.open-meteo.com/v1/search?name=" +
                    encodeURIComponent(query) +
                    "&count=8&language=en&format=json";

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("City search unavailable.");
                }

                const data = await response.json();

                if (requestNumber !== searchNumber) return;

                suggestions.replaceChildren();

                const cities = data.results || [];

                if (cities.length === 0) {
                    suggestions.hidden = true;
                    return;
                }

                cities.forEach(function (city) {
                    const item = document.createElement("li");

                    const details = [
                        city.admin1,
                        city.country
                    ].filter(Boolean).join(", ");

                    item.textContent = city.name +
                        (details ? ", " + details : "");

                    item.setAttribute("role", "option");
                    item.tabIndex = 0;

                    function chooseCity() {
                        selectedLocation = city;
                        cityInput.value = city.name;
                        suggestions.hidden = true;
                        suggestions.replaceChildren();
                        loadWeather(city);
                    }

                    item.addEventListener("click", chooseCity);

                    item.addEventListener("keydown", function (event) {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            chooseCity();
                        }
                    });

                    suggestions.appendChild(item);
                });

                suggestions.hidden = false;

            } catch (error) {
                if (requestNumber === searchNumber) {
                    suggestions.hidden = true;
                }
            }
        }


        cityInput.addEventListener("input", function () {
            clearTimeout(suggestionTimer);
            selectedLocation = null;

            suggestionTimer = setTimeout(function () {
                findCities(cityInput.value.trim());
            }, 350);
        });


        // WEATHER INFORMATION

        async function loadWeather(location) {
            weatherButton.disabled = true;
            refreshButton.disabled = true;

            weatherStatus.textContent = "Loading weather...";
            weatherDetails.hidden = true;
            suggestions.hidden = true;

            try {
                const url =
                    "https://api.open-meteo.com/v1/forecast" +
                    "?latitude=" + location.latitude +
                    "&longitude=" + location.longitude +
                    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
                    "&temperature_unit=fahrenheit" +
                    "&wind_speed_unit=mph" +
                    "&timezone=auto";

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("Weather service is unavailable.");
                }

                const data = await response.json();

                if (!data.current) {
                    throw new Error("Weather information is unavailable.");
                }

                const current = data.current;

                const weatherInfo =
                    weatherDescriptions[current.weather_code] ||
                    ["Current conditions", "🌤️"];

                document.getElementById("weather-city").textContent =
                    location.name +
                    (location.country ? ", " + location.country : "");

                document.getElementById("weather-icon").textContent =
                    weatherInfo[1];

                document.getElementById("weather-temperature").textContent =
                    Math.round(current.temperature_2m) + "°F";

                document.getElementById("weather-description").textContent =
                    weatherInfo[0];

                document.getElementById("weather-feels-like").textContent =
                    "Feels like: " +
                    Math.round(current.apparent_temperature) + "°F";

                document.getElementById("weather-humidity").textContent =
                    "Humidity: " + current.relative_humidity_2m + "%";

                document.getElementById("weather-wind").textContent =
                    "Wind: " + Math.round(current.wind_speed_10m) + " mph";

                document.getElementById("weather-updated").textContent =
                    "Last updated: " +
                    new Date(current.time).toLocaleString();

                currentLocation = location;
                weatherDetails.hidden = false;

                weatherStatus.textContent =
                    "Current weather successfully loaded!";

            } catch (error) {
                weatherStatus.textContent =
                    error.message || "Weather could not load. Please try again.";
            } finally {
                weatherButton.disabled = false;
                refreshButton.disabled = false;
            }
        }


        // SEARCH BUTTON

        async function searchCity(city) {
            weatherButton.disabled = true;
            weatherStatus.textContent = "Finding " + city + "...";
            suggestions.hidden = true;

            try {
                const url =
                    "https://geocoding-api.open-meteo.com/v1/search?name=" +
                    encodeURIComponent(city) +
                    "&count=1&language=en&format=json";

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("City search is unavailable.");
                }

                const data = await response.json();

                if (!data.results || data.results.length === 0) {
                    throw new Error("City not found. Please try another city.");
                }

                await loadWeather(data.results[0]);

            } catch (error) {
                weatherStatus.textContent = error.message;
                weatherButton.disabled = false;
            }
        }


       
weatherForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const city = cityInput.value.trim();

    if (!city) {
        weatherStatus.textContent = "Please enter a city name.";
        cityInput.focus();
        return;
    }

    suggestions.hidden = true;

    if (selectedLocation) {
        await loadWeather(selectedLocation);
    } else {
        await searchCity(city);
    }

    if (weatherSection) {
        weatherSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
});


        // REFRESH CURRENT CITY

        refreshButton.addEventListener("click", function () {
            loadWeather(currentLocation);
        });


        // HIDE SUGGESTIONS WHEN CLICKING OUTSIDE

        document.addEventListener("click", function (event) {
            if (
                !cityInput.contains(event.target) &&
                !suggestions.contains(event.target)
            ) {
                suggestions.hidden = true;
            }
        });


        // INITIAL WEATHER

        cityInput.value = "Port St. Lucie";
        loadWeather(currentLocation);

    }

});
