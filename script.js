
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
            input.setAttribute(
                "aria-invalid",
                String(errorMessage !== "")
            );

            return errorMessage === "";
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            let formIsValid = true;
            let firstInvalidField = null;

            fields.forEach(function (field) {
                const valid = validateField(field);

                if (!valid) {
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
                status.textContent =
                    "All fields are valid! Thank you.";

                form.reset();

                fields.forEach(function (field) {
                    const input =
                        document.getElementById(field.id);
                    const error =
                        document.getElementById(field.errorId);

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
    // 3. PORT ST. LUCIE WEATHER
    // ==========================================

    const weatherButton =
        document.getElementById("weather-refresh");

    const weatherStatus =
        document.getElementById("weather-status");

    const weatherDetails =
        document.getElementById("weather-details");

    if (weatherButton && weatherStatus && weatherDetails) {

        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=27.2730" +
            "&longitude=-80.3582" +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
            "&temperature_unit=fahrenheit" +
            "&wind_speed_unit=mph" +
            "&timezone=America%2FNew_York";

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

        async function getWeather() {
            weatherButton.disabled = true;
            weatherStatus.textContent =
                "Loading Port St. Lucie weather...";

            weatherDetails.hidden = true;

            try {
                const response = await fetch(weatherURL);

                if (!response.ok) {
                    throw new Error("Weather service unavailable.");
                }

                const data = await response.json();

                if (!data.current) {
                    throw new Error("Weather data is missing.");
                }

                const current = data.current;

                const weatherInfo =
                    weatherDescriptions[current.weather_code] ||
                    ["Current conditions", "🌤️"];

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
                    "Humidity: " +
                    current.relative_humidity_2m + "%";

                document.getElementById("weather-wind").textContent =
                    "Wind: " +
                    Math.round(current.wind_speed_10m) + " mph";

                const updatedTime = new Date(current.time);

                document.getElementById("weather-updated").textContent =
                    "Last updated: " +
                    updatedTime.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit"
                    });

                weatherDetails.hidden = false;

                weatherStatus.textContent =
                    "Current weather in Port St. Lucie, Florida";

            } catch (error) {
                weatherStatus.textContent =
                    "Weather could not load. Please check your connection and try again.";

            } finally {
                weatherButton.disabled = false;
            }
        }

        weatherButton.addEventListener("click", getWeather);

        // Load weather automatically when the page opens.
        getWeather();
    }

});
