
document.addEventListener("DOMContentLoaded", function () {

    // INTERACTION 1: Mobile navigation menu

    const menuButton = document.getElementById("menu-toggle");
    const navList = document.getElementById("nav-list");

    if (menuButton && navList) {
        menuButton.addEventListener("click", function () {
            const isOpen = menuButton.getAttribute("aria-expanded") === "true";

            menuButton.setAttribute("aria-expanded", String(!isOpen));

            if (isOpen) {
                navList.classList.remove("mobile-visible");
            } else {
                navList.classList.add("mobile-visible");
            }
        });
    }


    // INTERACTION 2: Contact form validation

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

            if (errorMessage !== "") {
                input.classList.add("invalid");
                input.setAttribute("aria-invalid", "true");
                return false;
            } else {
                input.classList.remove("invalid");
                input.setAttribute("aria-invalid", "false");
                return true;
            }
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            let formIsValid = true;
            let firstInvalidField = null;

            fields.forEach(function (field) {
                const isValid = validateField(field);

                if (!isValid) {
                    formIsValid = false;

                    if (!firstInvalidField) {
                        firstInvalidField = document.getElementById(field.id);
                    }
                }
            });

            if (!formIsValid) {
                status.textContent = "Please correct the errors above.";
                firstInvalidField.focus();
            } else {
                status.textContent = "All fields are valid! Thank you.";
                form.reset();

                fields.forEach(function (field) {
                    const input = document.getElementById(field.id);
                    const error = document.getElementById(field.errorId);

                    input.classList.remove("invalid");
                    input.removeAttribute("aria-invalid");
                    error.textContent = "";
                });
            }
        });

        fields.forEach(function (field) {
            const input = document.getElementById(field.id);

            input.addEventListener("input", function () {
                validateField(field);
                status.textContent = "";
            });
        });
    }


    // INTERACTION 3: Dog of the Day API

    const dogButton = document.getElementById("new-dog-button");
    const dogImage = document.getElementById("dog-image");
    const dogStatus = document.getElementById("dog-status");

    if (dogButton && dogImage && dogStatus) {

        async function getRandomDog() {
            dogButton.disabled = true;
            dogImage.hidden = true;
            dogStatus.textContent = "Finding a furry friend...";

            try {
                const response = await fetch(
                    "https://dog.ceo/api/breeds/image/random",
                    { signal: AbortSignal.timeout(15000) }
                );

                if (!response.ok) {
                    throw new Error("Unable to retrieve a dog image.");
                }

                const data = await response.json();

                if (data.status !== "success" || !data.message) {
                    throw new Error("The dog image could not be found.");
                }

                // Wait for the dog image to load before displaying it.

                const imageLoaded = new Promise(function (resolve, reject) {
                    dogImage.onload = resolve;
                    dogImage.onerror = reject;
                });

                dogImage.alt = "A randomly selected dog";
                dogImage.src = data.message;

                await Promise.race([
                    imageLoaded,
                    new Promise(function (_, reject) {
                        setTimeout(function () {
                            reject(new Error("Image loading timed out."));
                        }, 15000);
                    })
                ]);

                dogImage.hidden = false;
                dogStatus.textContent = "Look at this adorable dog!";

            } catch (error) {
                dogImage.hidden = true;
                dogStatus.textContent =
                    "Sorry, we couldn't load a dog right now. Please try again.";

            } finally {
                dogButton.disabled = false;
            }
        }

        dogButton.addEventListener("click", getRandomDog);
    }

});
