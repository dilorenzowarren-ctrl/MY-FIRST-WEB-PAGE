
// JavaScript Interactivity Assignment
// Handles button events, input styling, and dynamic list updates.

document.addEventListener("DOMContentLoaded", function () {

    // Requirement 1: Change page content when a button is clicked.

    const messageButton = document.getElementById("message-button");
    const welcomeMessage = document.getElementById("welcome-message");

    messageButton.addEventListener("click", function () {
        welcomeMessage.textContent =
            "Thanks for visiting my website! JavaScript is working!";
    });


    // Requirement 2: Change input styling while the user types.

    const colorInput = document.getElementById("color-input");
    const inputFeedback = document.getElementById("input-feedback");

    colorInput.addEventListener("input", function () {

        if (colorInput.value.trim().length > 0) {
            colorInput.classList.add("input-active");

            inputFeedback.textContent =
                "Great! Your input is changing the field's appearance.";
        } else {
            colorInput.classList.remove("input-active");

            inputFeedback.textContent =
                "Your input will change the appearance of this field.";
        }

    });


    // Requirement 3: Add and remove items from a dynamic list.

    const itemInput = document.getElementById("item-input");
    const addItemButton = document.getElementById("add-item-button");
    const dynamicList = document.getElementById("dynamic-list");
    const listFeedback = document.getElementById("list-feedback");

    function addListItem() {

        const itemText = itemInput.value.trim();

        if (itemText === "") {
            listFeedback.textContent = "Please enter an item first.";
            itemInput.focus();
            return;
        }

        // Create a new list item.
        const newItem = document.createElement("li");

        // Set the text of the new item.
        newItem.textContent = itemText;

        // Create a remove button for the item.
        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.classList.add("remove-button");

        // Add an event listener to remove the item.
        removeButton.addEventListener("click", function () {
            newItem.remove();
            listFeedback.textContent = "Item removed successfully.";
        });

        // Add the remove button to the new list item.
        newItem.appendChild(removeButton);

        // Add the new item to the webpage.
        dynamicList.appendChild(newItem);

        listFeedback.textContent = "Item added successfully!";

        // Clear the input after adding the item.
        itemInput.value = "";
        itemInput.focus();
    }

    // Listen for button clicks.
    addItemButton.addEventListener("click", addListItem);

    // Also allow the Enter key to add an item.
    itemInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addListItem();
        }
    });

});
