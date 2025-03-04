window.efc = true;
window.configMode = false;
var currentDivId;
var menu;
var selectionData = {}; // Store selections by deviceType > deviceIndex > valueIndex
var saveButton = null;
var resetButton = null;
var toggleButton = null;
let efcArray = [];
const pointerEventsStyle = document.createElement("style");
var contextIsAlready = false;
let tempName = "";

function addContext() {

    // Handle right-click (contextmenu)
    document.addEventListener("contextmenu", handleRightClick, true);  // Use capturing phase for contextmenu
}

function handleRightClick(event) {
    event.preventDefault();
    removeHighlighting();

    //console.log("Right-clicked", event);
    let target = event.target.closest('div[id^="efc"]');
    addPointerEvents(); // Adds the style to access locked elements

    let target2;;
    // // If no target is found, process the parent and enable pointer-events on the children
    if (target === null) {
        target2 = event.target;
        // Enable pointer-events for all children of the target element that have the "efc" class
        const children = Array.from(target2.children);  // Convert HTMLCollection to an array
        console.log("Children:", children);
        if (children.length > 0) {
            // Only target the first child
            children.forEach(child => {

                if (child.id.includes("efc")) { // Check if the ID contains "efc"
                    const childUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
                    console.log("childUnderPointer:", childUnderPointer);
                    // Reassign the target to the child under the pointer

                    if (childUnderPointer) {
                        target = childUnderPointer;
                        if (target.classList.contains("sensors")) { target = childUnderPointer?.parentElement; }
                        if (target2.id.startsWith("sliderList")) { target = childUnderPointer?.parentElement?.parentElement };
                        //console.log("TargetChild:", target);
                    }
                }
            });
        }
    }


    // Only proceed if target is valid (i.e., not null or undefined)
    if (target && target.id.startsWith("efc")) {
        //console.log("Right-clicked on:", target.id);
        isittime = false;
        updateSaveButton();
        currentDivId = target.id;

        // Remove previous highlights

        //document.querySelectorAll('div[id^="efc"]').forEach(el => el.style.outline = "");

        // Apply highlight
        //target.style.outline = "2px solid #ffcc00"; // Yellow border
        //highlightMatchingDivs(target.id, target.className);

        // Clear and rebuild the context menu based on the device type
        rebuildContextMenu(target.id, target.className);

        if (event.detail.clientX) {
            xCoord = event.detail.clientX;
            yCoord = event.detail.clientY;
        } else {
            xCoord = event.clientX;
            yCoord = event.clientY;
        }

        // Position and show the menu
        menu.style.display = "block";

        // Check if the menu element exists and has a valid offsetWidth
        const menuElement = document.getElementById('custom-menu');
        if (menuElement && menuElement.offsetWidth > 0) {
            const menuWidth = menuElement.offsetWidth; // Get the menu width
            const menuHeight = menuElement.offsetHeight; // Get the menu height

            let xPosition = xCoord; // Start with the pointer's x-coordinate

            // Adjust x position if menu overflows on the right side
            if (xCoord + menuWidth > window.innerWidth) {
                xPosition = window.innerWidth - menuWidth; // Position it to the left edge of the screen
            }

            // Set the left position to the adjusted x-position
            menuElement.style.left = `${xPosition}px`;

            let yPosition = yCoord + 5; // Start with the pointer's y-coordinate with an offset

            // Adjust y position if menu overflows at the bottom
            if (yCoord + menuHeight > window.innerHeight) {
                yPosition = window.innerHeight - menuHeight - 5; // Position it above the pointer if it overflows
            }

            // Set the top position to the adjusted y-position
            menuElement.style.top = `${yPosition}px`;
        }
    } else if (target2.id.startsWith("allList") || target2.id.startsWith("container")) {
        updateSaveButton("hide");
        selectionData = {};
        runonce2 = true;
        console.log("No valid target found");
    }

}

function highlightMatchingDivs(elementId, elementClass) {
    // Extract everything before the last comma
    let baseId = elementId.substring(0, elementId.lastIndexOf(","));
    if (!baseId) return; // Exit if no valid baseId found
    console.log("baseId:", baseId);

    // Select all divs whose id starts with the extracted baseId
    document.querySelectorAll(`div[id*="${baseId.split("=")[1]}"]`).forEach(div => {
        div.style.outline = "2px solid #ffcc00"; // Default highlight for matching elements
    });

    // Select the div that exactly matches the given ID
    // let exactMatch = document.getElementById(elementId);

    // if (exactMatch) {
    //     if (elementClass.includes("bigNumWrap") && !elementClass.includes("bigSingles") && !contextIsAlready) {
    //         exactMatch.parentElement.style.setProperty("transition", "none", "important");
    //         exactMatch.parentElement.style.outline = "2px solid red"; // Different color for the exact match
    //     } else {
    //         exactMatch.style.outline = "2px solid red"; // Different color for the exact match

    //     }
    // }

    let exactMatches = document.querySelectorAll(`[id="${elementId}"]`);

    if (exactMatches.length > 0) { // Ensure elements exist
        exactMatches.forEach(match => {
            if ((elementClass.includes("bigNumWrap") ||
                elementClass.includes("bigSingles")) &&
                !contextIsAlready) {
                if (match.parentElement) { // Check before using parentElement
                    match.parentElement.style.setProperty("transition", "none", "important");
                    match.parentElement.style.outline = "2px solid red";
                }
            } else {
                match.style.outline = "2px solid red";
            }
        });
    }
}

function removeHighlighting() {
    // Select the container element
    const container = document.getElementById("allList");

    // Remove transition style to avoid any animation effects
    container.style.setProperty("transition-property", "none");

    // Select all divs within the container and remove their outline
    const divs = container.querySelectorAll('div');
    divs.forEach(div => div.style.outline = '');

    setTimeout(() => {
        container.style.removeProperty("transition");
    }, 50);

}


// **Extracts deviceName, deviceType, deviceIndex, and valueIndex from div ID**
function parseDivId(divId) {
    if (divId.startsWith("efc")) {
        let [deviceName, devIndex] = divId.split("=");
        let match = devIndex.match(/(\d+),(\d+),(\d+)([A-Z]?)$/); // Capture any capital letter at the end

        if (!match) return null;

        return {
            deviceName: deviceName.split(":")[1],
            deviceType: parseInt(match[1]),
            deviceIndex: match[2],
            valueIndex: match[4] || match[3]  // Use the letter if present, otherwise the third number
        };
    }
    return null;
}

// **Rebuilds context menu dynamically based on deviceType**
function rebuildContextMenu(tID, tClass) {
    let parsed = parseDivId(currentDivId);
    if (!parsed) return;

    let { deviceName, deviceType, deviceIndex, valueIndex } = parsed;
    const singleTile = [43, 1, 81].includes(deviceType); // Check if devicetype is in the array

    // Get the saved data for this deviceIndex and valueIndex
    let savedData = selectionData[deviceIndex] ? selectionData[deviceIndex][valueIndex] : {};
    let savedData2 = selectionData[deviceIndex]?.["A"]?.["val"];

    menu.innerHTML = ""; // Clear menu

    // **Dropdown for main selection**
    let dropdown = document.createElement("select");
    dropdown.id = "menu-main-select";
    dropdown.dataset.key = "val"; // Add data-key for the select element
    let options = "";

    // check if the context menu is already open when the bigVal is selected 
    // if true then give access to the underlying child
    if (savedData2 === "bigVal" || savedData?.val === "bigVS") {
        if (tempName !== deviceName) {
            contextIsAlready = false;
            tempName = deviceName
        }
        else {
            contextIsAlready = true;
        }
    } else {
        contextIsAlready = false;
        tempName = "";
    }
    highlightMatchingDivs(tID, tClass);

    // If deviceIndex ends with "A", add extra options
    if ((valueIndex === "A" && deviceType !== 1) || (savedData2 === "bigVal" && !contextIsAlready)) {
        options = `
            <option value="none">None</option>
            <option value="bigVal">big values</option>
        `;
        deviceType = "A";
    }
    else if (deviceName === "bigSingle" && !contextIsAlready) {
        deviceType = "S";
    }
    else if (deviceType === 33) {
        options = `
            <option value="none">None</option>
            <option value="dButtons">button</option>
            <option value="pButtons">push button</option>
            <option value="vInput">num input</option>
            <option value="vSlider">slider</option>
            <option value="nvSlider">no value Slider</option>
            <option value="tSlider">time slider</option>
            <option value="thSlider">thermo slider</option>
            <option value="nPix">neopixel slider</option>
        `;

        if (checkBigSinglesLength() < 4 || checkBigSinglesLength() == 4 && savedData?.val === "bigVS") {
            options += `<option value="bigVS">big value</option>`;
        }

    }
    else {
        options = `
            <option value="none">None</option>
            <option value="vSlider">slider</option>
            <option value="chart">chart</option>
        `;
        if (checkBigSinglesLength() < 4 || checkBigSinglesLength() == 4 && savedData?.val === "bigVS") {
            options += `<option value="bigVS">big value</option>`;
        }
    }

    dropdown.innerHTML = options;
    if (singleTile || (contextIsAlready && savedData2 === "bigVal") || deviceType === "S") { dropdown.style.display = "none"; }
    menu.appendChild(dropdown);
    menu.appendChild(document.createElement("br"));

    // **Detect dropdown changes**
    dropdown.addEventListener("change", (event) => {
        //console.log("Dropdown value changed:", event.target.value);
        updateMenuFields(deviceType, event.target.value, deviceName, deviceIndex);
        saveSelections(false);
    });

    let dropdownKey = dropdown.dataset.key;

    if (savedData2 === "bigVal" && deviceType === "A") {
        savedData = selectionData[deviceIndex]?.["A"]
    }

    if (savedData !== undefined && savedData[dropdownKey] !== undefined) {
        dropdown.value = savedData[dropdownKey];
        if (singleTile) { dropdown.value = ""; }
    }

    updateMenuFields(deviceType, dropdown.value, deviceName, deviceIndex, valueIndex, singleTile); // Initial call
}

// **Updates additional fields based on dropdown selection**
function updateMenuFields(deviceType, selectedOption, deviceName, deviceIndex, valueIndex, singleTile) {
    let formFields = document.getElementById("dynamic-fields");
    if (formFields) menu.removeChild(formFields);

    formFields = document.createElement("div");
    formFields.id = "dynamic-fields";
    formFields.style.display = "grid";

    // **DeviceType Specific Fields**
    if (deviceType === "S") {
        addColorPicker(formFields, "color: ", "SBC");
    }
    else {
        if (deviceType === "A") {
            if (["dButtons", "pButtons"].includes(selectedOption)) {
                addCheckbox(formFields, " no input", "noI");
            }
        }

        if (["vSlider", "nvSlider", "thSlider"].includes(selectedOption)) {
            addTextInput(formFields, "range: ", "range", selectedOption);
        }

        if (["dButtons", "vSlider"].includes(selectedOption) && deviceType === 33) {
            addCheckbox(formFields, " no input", "noI");
        }


        if (!["thSlider", "tSlider", "dButtons", "pButtons", "bigVal"].includes(selectedOption) && deviceType !== "A" && deviceType !== 1 || contextIsAlready && deviceType !== "A") {
            addTextInput(formFields, "unit: ", "unit");
            addCheckbox(formFields, " hide name", "noV");
        }

        //if (["dButtons", "pButtons", "vSlider", "nvSlider"].includes(selectedOption) && deviceType === 33) {
        if (["dButtons"].includes(selectedOption) && deviceType === 33) {
            addTextInput(formFields, "sendTo: ", "sendTo");
        }

        if (deviceType === "A" && !singleTile) {
            addCheckbox(formFields, "chart: ", "chart");
            addColorPicker(formFields, "color: ", "color");
        }

        if ((deviceType === "A" && !["bigVal"].includes(selectedOption)) || singleTile || contextIsAlready || selectedOption === "bigVS" || (deviceType === 33 && !["none"].includes(selectedOption))) {
            addNumberInput(formFields, "order: ", "order");
        }

        if ((selectedOption !== "none" || hasNonEmptyValues(selectionData, deviceIndex)) && !contextIsAlready) {
            addResetButton(formFields, deviceIndex, deviceName);
        }

        addCheckbox(formFields, " hide entry", "hide");
    }

    menu.appendChild(formFields);

    // **Populate the form fields with saved data (if any)**
    let parsed = parseDivId(currentDivId);
    if (parsed) {
        let { deviceIndex, valueIndex } = parsed;

        if (deviceType === "A") { valueIndex = "A"; }
        // Get the saved data for this deviceIndex and valueIndex
        let savedData
        if (deviceType !== "S") {
            savedData = selectionData[deviceIndex] ? selectionData[deviceIndex][valueIndex] : {};
        } else {
            savedData = selectionData?.["S"];
        }

        // Loop through the form fields and populate them with saved values
        formFields.querySelectorAll("input, select, button").forEach(input => {
            let key = input.dataset.key;

            if (savedData !== undefined && savedData[key] !== undefined) {
                if (input.type === "checkbox") {
                    // For checkbox, check or uncheck based on saved data
                    input.checked = savedData[key] === 1;
                } else if (input.type === "number") {
                    // For number inputs, set the saved number value
                    input.value = savedData[key];
                } else if (input.tagName.toLowerCase() === "val") {
                    // For dropdown, set the saved value
                    input.value = savedData[key];
                } else {
                    // For other inputs, set the saved value
                    input.value = savedData[key];
                }
            }
        });
    }

    // **Auto-save selections on change**
    formFields.addEventListener("input", () => saveSelections(false));
}

// **Helper functions to add form elements**
function addTextInput(container, label, key, selectedOption) {
    let labelEl = document.createElement("label");
    labelEl.innerText = label;
    let input = document.createElement("input");
    input.type = "text";
    if (key === "unit") {
        input.maxLength = 6;
        input.style.width = `6ch`;
    }
    if (key === "range") {

        if (["vSlider", "nvSlider"].includes(selectedOption)) {
            input.placeholder = "0,1024,1";
        } else if (["thSlider"].includes(selectedOption)) {
            input.placeholder = "5,35,1";
        }

        // Allow only numbers, dots, and commas while typing
        input.addEventListener("input", (event) => {
            input.value = input.value.replace(/[^0-9.,]/g, ""); // Remove invalid characters
        });

        // Validate on blur (losing focus)
        input.addEventListener("blur", () => {
            if (input.value.trim() === "") return; // Skip validation if the input is empty

            const validFormat = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
            if (!validFormat.test(input.value)) {
                alert("Invalid format! Please enter three values separated by two commas (e.g., 0,1024,0.5)");
                input.value = ""; // Clear invalid input
            }
        });
    }

    if (key === "sendTo") {
        input.placeholder = "nodeNR(,GPIO)";
        input.style.width = "15ch";
        // Allow only valid characters (numbers and commas)
        input.addEventListener("input", () => {
            input.value = input.value.replace(/[^0-9,]/g, ""); // Allow only numbers and commas
        });

        // Validate on blur (losing focus)
        input.addEventListener("blur", () => {
            if (input.value.trim() === "") return; // Skip validation if the input is empty

            const validFormat = /^\d+$|^\d+,?\d+$/; // Match either a number or "number,number"
            if (!validFormat.test(input.value)) {
                alert("Invalid format! Please enter either a nodenumber (e.g., 12) or a nodenumber + comma + the GPIO to toggle (e.g., 2,12).");
                input.value = ""; // Clear invalid input
            }
        });
    }
    input.dataset.key = key;
    container.appendChild(labelEl);
    container.appendChild(input);
    // container.appendChild(document.createElement("br"));
}


//##############################################################################################################
//      add options
//##############################################################################################################
function addNumberInput(container, label, key) {
    let labelEl = document.createElement("label");
    labelEl.innerText = label;
    labelEl.style.marginRight = "5px";

    let input = document.createElement("input");
    input.type = "number";
    input.dataset.key = key;
    input.style.width = "4ch";
    input.style.textAlign = "center";

    if (key === "order") {
        input.min = "0";
        input.max = "255";
        input.step = "1";
        input.value = "0";

        let inputWrapper = document.createElement("div");
        inputWrapper.style.display = "inline-flex";
        inputWrapper.style.alignItems = "center";
        inputWrapper.style.gap = "5px";

        let minusBtn = document.createElement("button");
        minusBtn.innerText = "−";
        minusBtn.type = "button";
        minusBtn.style.width = "25px";

        let plusBtn = document.createElement("button");
        plusBtn.innerText = "+";
        plusBtn.type = "button";
        plusBtn.style.width = "25px";

        // Helper function to update value and trigger input event
        function updateValue(change) {

            let newValue = parseInt(input.value) + change;
            input.value = newValue;
            // Trigger an 'input' event so external scripts detect the change
            //input.dispatchEvent(new Event("input"));
            saveSelections(false);
        }

        // increase value
        plusBtn.addEventListener("click", () => updateValue(1));

        // decrease value (allows going below 0)
        minusBtn.addEventListener("click", () => updateValue(-1));

        inputWrapper.appendChild(minusBtn);
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(plusBtn);

        container.appendChild(labelEl);
        container.appendChild(inputWrapper);
    } else {
        // For non-"order" keys, just append input normally
        container.appendChild(labelEl);
        container.appendChild(input);
    }
}

function addCheckbox(container, label, key) {
    let labelEl = document.createElement("label");
    let input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.key = key;
    labelEl.appendChild(input);
    labelEl.appendChild(document.createTextNode(label));
    container.appendChild(labelEl);
    //container.appendChild(document.createElement("br"));
}

function addColorPicker(container, label, key) {
    let labelEl = document.createElement("label");
    labelEl.innerText = label;
    let input = document.createElement("input");
    input.type = "color";
    input.dataset.key = key;
    container.appendChild(labelEl);
    container.appendChild(input);

    //container.appendChild(document.createElement("br"));
}

function addResetButton(container, deviceIndex, deviceName) {
    let buttonEl = document.createElement("button");
    // let labelEl = document.createElement("label");
    // labelEl.innerText = "device:";
    container.appendChild(document.createElement("br"));
    buttonEl.innerText = `reset ${deviceName}`; // Set button label to devicename
    buttonEl.style.backgroundColor = "#7d1414";
    buttonEl.style.color = "white";
    buttonEl.style.padding = "2px";
    buttonEl.addEventListener("click", () => deleteDevice(deviceIndex)); // Call deleteDevice with devicename

    container.appendChild(buttonEl);
}

//##############################################################################################################
//     
//##############################################################################################################
function hasNonEmptyValues(obj, key) {
    if (!obj[key] || typeof obj[key] !== "object") return false; // Ensure key exists and is an object

    return Object.values(obj[key]).some(subObj =>
        Object.values(subObj).some(value => value !== 0 && value !== "" && value !== undefined)
    );
}

function deleteDevice(deviceIndex) {
    // Remove the device from the selectionData
    console.log("Deleting device with index:", deviceIndex, selectionData[deviceIndex]);
    delete selectionData[deviceIndex];
    console.log("Deleting device with index after:", selectionData[deviceIndex]);
    saveSelections(true);
    menu.style.display = "none";
    removeHighlighting();
    //document.querySelectorAll('div[id^="efc"]').forEach(el => el.style.outline = "");
    isittime = true;
}
// **Save selections**
function saveSelections(ignoreDropdown) {
    let parsed = parseDivId(currentDivId);
    if (!parsed) return;

    let { deviceName, deviceIndex, valueIndex } = parsed;

    // Initialize selectionData structure if it doesn't exist
    if (!selectionData[deviceIndex]) {
        selectionData[deviceIndex] = {};  // Initialize deviceIndex if not present
    }

    if (!selectionData[deviceIndex][valueIndex]) {
        selectionData[deviceIndex][valueIndex] = {};  // Initialize valueIndex if not present
    }

    let formFields = document.getElementById("dynamic-fields");
    let formData = {};
    selectionData["unit"] = unit;
    selectionData["nr"] = unitNr;

    // **Handle select dropdown (menu-main-select)**
    let dropdown = document.getElementById("menu-main-select");

    if (dropdown) {
        let dropdownKey = dropdown.dataset.key;
        if (dropdownKey) {
            formData[dropdownKey] = dropdown.value;
            console.log("save DropValue:", dropdown.value); // Log the dropdown value
        }
    }

    // Loop through the inputs to get their values
    if (formFields) {
        formFields.querySelectorAll("input, select").forEach(input => {
            let key = input.dataset.key;
            //console.log(`Processing input with key: ${key}`);

            if (input.type === "checkbox") {
                // Checkbox input
                formData[key] = input.checked ? 1 : 0;
            } else if (input.type === "number") {
                // Ensure the number is stored as a number, not a string
                formData[key] = parseFloat(input.value) || 0;  // Default to 0 if invalid number
            } else if (input.type === "text") {
                // For text or other inputs, store the value as a string
                formData[key] = input.value;
            } else {
                // For other inputs, set the saved value
                if (key === "color" && input.value === "#000000") {
                    formData[key] = "";
                } else {
                    formData[key] = input.value;
                }
            }
        });
    }

    // Store the formData in the selectionData object
    if (selectionData[deviceIndex]?.["A"]?.["val"] === "bigVal" && !contextIsAlready) {
        valueIndex = "A";
    }
    if (!ignoreDropdown) {
        if (deviceName === "bigSingle" && !contextIsAlready) {
            selectionData["S"] = formData;
        } else {
            selectionData[deviceIndex][valueIndex] = formData;
        }
    }
    removeEmptyKeys(selectionData)
    console.log("Updated Selection Data:", selectionData);
    updateSaveButton();
}

function keepOnlyA(obj) {
    if (!obj || typeof obj !== "object") return; // Ensure it's an object
    for (const key in obj) {
        if (key !== "A") {
            delete obj[key]; // Remove all keys except "A"
        }
    }
}


// **Show or hide the save button based on selection data**
function updateSaveButton(param) {
    if (param !== "hide") {
        saveButton.style.display = "block";
        resetButton.style.display = "block";
        if (hasHiddenProperty(selectionData)) {
            toggleButton.style.display = "block";
        }
        window.configMode = true;
    } else {
        saveButton.style.display = "none";
        resetButton.style.display = "none";
        toggleButton.style.display = "none";
        window.configMode = false;
    }
}

//##############################################################################################################
//     create and insert the save button at the top of the page
//##############################################################################################################

// **Create and insert the save button at the top of the page**
function createSaveButton() {
    // Create Save Button
    saveButton = document.createElement("button");
    saveButton.innerText = "Save Settings";
    saveButton.style.position = "fixed";
    saveButton.style.top = "10px";
    saveButton.style.left = "calc(50% - 40px)";
    saveButton.style.transform = "translateX(-120px)";
    saveButton.style.padding = "10px 15px";
    saveButton.style.background = "#28a745";
    saveButton.style.color = "white";
    saveButton.style.border = "none";
    saveButton.style.borderRadius = "5px";
    saveButton.style.cursor = "pointer";
    saveButton.style.zIndex = "3";
    saveButton.style.display = "none"; // Initially hidden
    saveButton.addEventListener("click", saveToFile);
    document.body.appendChild(saveButton);

    // Create Reset Button
    resetButton = document.createElement("button");
    resetButton.innerText = "Reset File";
    resetButton.style.position = "fixed";
    resetButton.style.top = "10px";
    resetButton.style.left = "calc(50% + 30px)";  // Position it next to the save button
    resetButton.style.transform = "translateX(-50%)";
    resetButton.style.padding = "10px 15px";
    resetButton.style.background = "red";
    resetButton.style.color = "white";
    resetButton.style.border = "none";
    resetButton.style.borderRadius = "5px";
    resetButton.style.cursor = "pointer";
    resetButton.style.zIndex = "3";
    resetButton.style.display = "none"; // Initially hidden
    console.log("Reset Button Created");
    resetButton.addEventListener("click", () => saveToFile("del"));  // Add event listener to delete file
    document.body.appendChild(resetButton);

    // Create Show/Hide Toggle Button for hiddenOverride
    toggleButton = document.createElement("button");
    toggleButton.innerText = hiddenOverride ? "Hide" : "Show";  // Text based on hiddenOverride state
    toggleButton.style.position = "fixed";
    toggleButton.style.top = "10px";
    toggleButton.style.left = "calc(50% + 128px)"; // Position next to the reset button
    toggleButton.style.transform = "translateX(-50%)";
    toggleButton.style.padding = "10px 15px";
    toggleButton.style.background = "#007bff";
    toggleButton.style.color = "white";
    toggleButton.style.border = "none";
    toggleButton.style.borderRadius = "5px";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.zIndex = "3";
    toggleButton.style.display = "none"; // Initially hidden
    document.body.appendChild(toggleButton);

    // Toggle hiddenOverride on button click
    toggleButton.addEventListener("click", () => {
        hiddenOverride = !hiddenOverride;
        toggleButton.innerText = hiddenOverride ? "Hide" : "Show";  // Update button text
        console.log("hiddenOverride is now:", hiddenOverride);
        // You can also do something based on the hiddenOverride value here (like hiding/showing elements)
    });
}

// // Function to delete the file from the server
// function deleteFile() {
//     return;
//     const deleteUrl = '/delete-file'; // Adjust the URL as per your server route

//     fetch(deleteUrl, {
//         method: 'DELETE',  // Use the DELETE HTTP method
//     })
//         .then(response => {
//             if (response.ok) {
//                 console.log('File deleted successfully');
//                 // Optional: You can add some UI feedback or reset the button's state here
//             } else {
//                 console.error('Failed to delete file');
//             }
//         })
//         .catch(error => {
//             console.error('Error deleting file:', error);
//         });
// }


function saveToFile(param) {
    'use strict';
    updateJsonArray(selectionData);
    let dataStr = JSON.stringify(selectionData, null, 2);

    if (param === "del") {
        dataStr = "{}";
        if (selectionData.unit) {
            efcArray = efcArray.filter(item => item.unit !== selectionData.unit);
        }
        console.log("Deleting file...");
    }

    let dataStrArr = JSON.stringify(efcArray, null, 2);

    // Load pako and then process gzip files
    loadScript("https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js", function () {
        console.log("Pako loaded successfully.");

        // Compress efc.json
        const compressedDataEfc = pako.gzip(dataStr);
        console.log("Compressed efc.json:", compressedDataEfc);

        // Create gzipped File object for efc.json
        const fileEfc = new File([compressedDataEfc], 'efc.json.gz', { type: 'application/gzip' });

        // Create FormData and append efc.json.gz
        const formDataEfc = new FormData();
        formDataEfc.append('file', fileEfc);

        const uploadUrl = `${baseUrl}/upload`;

        console.log("uploadUrl:", unitNr, unitNr1);
        if (unitNr !== unitNr1) {
            fetchFile(uploadUrl, formDataEfc);
        }

        // Only compress and send main_efc.json.gz if isMain is false
        if (isMain) {
            console.log("Processing main_efc.json.gz ");

            // Compress main_efc.json
            const compressedDataMain = pako.gzip(dataStrArr);
            console.log("Compressed main_efc.json:", compressedDataMain);

            // Create gzipped File object for main_efc.json
            const fileMain = new File([compressedDataMain], 'main_efc.json.gz', { type: 'application/gzip' });

            // Create FormData and append main_efc.json.gz
            const formDataMain = new FormData();
            formDataMain.append('file', fileMain);

            // Upload main_efc.json.gz
            fetchFile(`/upload`, formDataMain);
        } else {
            console.log("Skipping main_efc.json.gz because isMain is true.");
        }
    });

    updateSaveButton("hide");
    runonce2 = true;
}


function fetchFile(uploadUrl, formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        signal: controller.signal
    })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            console.log("File uploaded successfully!");
        })
        .catch(error => {
            clearTimeout(timeoutId);
        });
}


// // Function to download the file
// function downloadFile(file) {
//     const url = URL.createObjectURL(file);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = file.name;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
// }

// **Initialize**
function createMenu() {

    document.getElementById('areaChart')?.addEventListener("resize", updateYAxisVisibility);

    // Handle touchstart to simulate right-click action with 2 fingers
    document.addEventListener('touchstart', function (e) {
        if (e.touches.length == 2) {
            if (saveButton.style.display === "none") {
                updateSaveButton();
                setLongPressDelay(200);
                document.addEventListener("long-press", handleRightClick, true);
            } else {
                updateSaveButton("hide");
                selectionData = {};
                runonce2 = true;
                setLongPressDelay(600);
                document.removeEventListener("long-press", handleRightClick, true);
            }
        }
    }, true); // Use capturing phase for touch events

    // **Close menu when clicking outside**
    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target) && !event.target.className.includes("vInputs")) {
            menu.style.display = "none";
            tempName = ""; // Reset the tempName variable for second right click bigVals
            removeHighlighting();
            removePointerEvents();
            //document.querySelectorAll('div[id^="efc"]').forEach(el => el.style.outline = "");
            isittime = true;
        }

    });

    menu = document.createElement("div");
    menu.id = "custom-menu";
    menu.style.position = "absolute";
    menu.style.display = "none";
    menu.style.background = "#3a3a3ad9";
    menu.style.border = "1px solid #ccc";
    menu.style.padding = "10px";
    menu.style.color = "white";
    document.body.appendChild(menu);
    createSaveButton();
    updateSaveButton("hide");   // Update the UI button
}

// function jsonpRequest(url, callback) {
//     let script = document.createElement('script');
//     script.src = `${url}?callback=${callback}`;
//     console.log("script.src:", script);
//     document.body.appendChild(script);
// }

// Define the callback function that will handle the response
function handleData(data) {
    console.log("Received data:", data);
    document.body.innerHTML += `<p>Received data: ${JSON.stringify(data)}</p>`;

}

function updateJsonArray(newData) {
    let existingIndex = efcArray.findIndex(item => item.unit === newData.unit);

    if (existingIndex !== -1) {
        console.log("update");
        // Merge the existing entry with the new data
        efcArray[existingIndex] = { ...efcArray[existingIndex], ...newData };
    } else {
        console.log("push");
        // Add new entry
        efcArray.push(newData);
    }
    console.log("Updated efcArray:", JSON.stringify(efcArray, null, 2));
}

//##############################################################################################################
//    getEfcData()
//##############################################################################################################

// async function getEfcData() {
//     if (runonce2) {
//         // If efc.json fetch fails, try to fetch mein_efc.json
//         try {
//             let response = await getUrl(`/main_efc.gz`);

//             // If fetching mein_efc.json fails, throw an error
//             if (!response || !response.ok) {
//                 throw new Error("Failed to fetch /main_efc.json");
//             }

//             // If mein_efc.json is fetched successfully, parse it
//             let mainEfcData = await response.json();
//             efcArray = mainEfcData;

//             // Fill selectionData with the entry matching the unitname key
//             selectionData = mainEfcData.find(entry => entry.unit === unit);
//             console.log("selectionData after matching unitname:", selectionData);

//         } catch (error) {
//             console.log("Error fetching /main_efc.json:", error.message);
//             try {
//                 // First, attempt to fetch efc.json
//                 let response = await getUrl(`${baseUrl}/efc.json`);

//                 // If fetching efc.json fails, throw an error and proceed to the next fetch
//                 if (!response || !response.ok) {
//                     throw new Error("Failed to fetch /efc.json");
//                 }

//                 // If efc.json is fetched successfully, parse and assign to selectionData
//                 selectionData = await response.json();
//                 console.log("selectionData from efc.json:", selectionData);

//             } catch (error) {
//                 console.log("Error fetching /efc.json:", error.message);
//             }
//         }
//         if (!selectionData) { selectionData = {}; }
//         // Finally, ensure runonce2 is set to false to prevent repeated execution
//         runonce2 = false;
//     }
// }

function removeEmptyKeys(obj) {
    // Iterate over each key in the object
    for (let key in obj) {
        // Check if the key is directly in the object (not in the prototype chain)
        if (obj.hasOwnProperty(key)) {
            // If the value is an object, recurse to remove empty keys in nested objects
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                removeEmptyKeys(obj[key]);
            }
            // Delete the key if the value is empty (null, undefined, or "")
            else if (obj[key] === "" || obj[key] === null || obj[key] === undefined) {
                delete obj[key];
            }
        }
    }
}

function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.onload = callback; // Run the callback after the script is loaded
    document.head.appendChild(script);
}

function addPointerEvents() {
    pointerEventsStyle.innerHTML = "#container * { pointer-events: all !important; }";
    document.head.appendChild(pointerEventsStyle);
}

function removePointerEvents() {
    if (pointerEventsStyle) {
        pointerEventsStyle.remove(); // Removes the style element from the document
        //pointerEventsStyle = null; // Reset the reference
    }
}

function hasHiddenProperty(obj) {
    for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
            if (value.hide === 1 || hasHiddenProperty(value)) {
                return true;
            }
        }
    }
    return false;
}

function checkBigSinglesLength() {
    return document.querySelectorAll(".bigSingles").length;
}

//##############################################################################################################
//      CHART FUNCTIONS
//##############################################################################################################

var chartInstances = {}; // Store chart instances uniquely
var colorArray;

function getColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return [
            "rgba(163, 255, 83, 0.3)",
            "rgba(71, 209, 255, 0.3)",
            "rgba(255, 75, 102, 0.3)",
            "rgba(255, 78, 255, 0.3)"
        ];
    } else {
        return [
            "rgba(34, 165, 89, 0.3)",
            "rgba(34, 36, 165, 0.3)",
            "rgba(255, 99, 133, 0.3)",
            "rgba(115, 46, 133, 0.3)"
        ];
    }
}

function makeChart() {
    loadScript("https://cdn.jsdelivr.net/npm/chart.js", function () {
        if (!cD) return;
        colorArray = getColorScheme();

        cD.forEach(chart => {
            if (!chart.chart) return;

            let cdD = chart.chart.data;
            let chartId = `${chart.device}chart`; // Unique ID for each chart
            let canvas = document.getElementById(chartId);

            if (!canvas) return; // Ensure the canvas exists
            // Apply colors
            cdD.datasets.forEach((dataset, index) => {
                const color = colorArray[index % colorArray.length];
                dataset.backgroundColor = color;
                dataset.borderColor = color;
                dataset.tension = 0.3;
                dataset.fill = true;
                dataset.pointRadius = 6;
                dataset.pointHoverRadius = 6;
                dataset.pointBackgroundColor = "rgba(0, 0, 0, 0)";
                dataset.pointBorderColor = "rgba(0, 0, 0, 0)";
                dataset.pointHoverBackgroundColor = color;
                dataset.pointHoverBorderColor = color;
            });

            if (!chartInstances[chartId]) {
                console.log("Creating new chart instance for", chartId);
                // Create a new chart instance for this device
                chartInstances[chartId] = new Chart(canvas.getContext('2d'), {
                    type: 'line',
                    data: cdD,
                    options: {
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true, displayColors: false },
                        },
                        scales: { x: { display: false } },
                        elements: {
                            line: { tension: 0.2 },
                            point: { radius: 0, hoverRadius: 6 }
                        }
                    }
                });

                updateYAxisVisibility();
            } else {
                console.log("Updating existing chart instance for", chartId);
                // Update existing chart data
                let existingChart = chartInstances[chartId];
                existingChart.data.labels = cdD.labels;
                existingChart.data.datasets = cdD.datasets;
                existingChart.update();
                updateYAxisVisibility();
            }
        });
    });
}

function updateYAxisVisibility() {
    Object.values(chartInstances).forEach(chart => {
        if (!chart) return;

        const shouldShow = document.getElementById('allList').offsetWidth > 400;

        // Loop through all Y-axes and update visibility
        Object.keys(chart.options.scales).forEach(scaleKey => {
            if (scaleKey.startsWith("y-")) { // Only target Y-axes
                chart.options.scales[scaleKey].display = shouldShow;
            }
            if (scaleKey.startsWith("y-r")) { // Only target Y-axes
                chart.options.scales[scaleKey].position = "right";
            }
        });

        chart.update();
    });
}
