
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

    if (!form) {
        return;
    }

    const status = document.getElementById("form-status");

    const fields = [
        {
            id: "name",
            errorId: "name-error",
            message: "Please enter your full name."
        },
        {
            id: "email",
            errorId: "email-error",
            message: "Please enter a valid email address."
        },
        {
            id: "subject",
            errorId: "subject-error",
            message: "Please enter a subject."
        },
        {
            id: "message",
            errorId: "message-error",
            message: "Please enter a message."
        }
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

});
