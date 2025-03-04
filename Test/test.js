var firstRun = 1;
//var wasUsed;
//var slA; //sliderAmount
var jsonPath;
var nNr; //nodeNr
var nP; //nodePath
var nP2;
var nN; //nodeName
var unitNr;
var unitNr1;
var fJ; //fetchJson interval
var nIV; //nodeinterval
var iIV; //InputInterV
var navOpen;
var myParam;
var hasParams = 1;
var isittime = 1;
//var NrofSlides = 0;
var currVal;
var html;
var tsX = 0; //startx
var teX = 0; //endx
var tsY = 0;
var teY = 0;
var msTs = 0; //start time
var msTe = 0;
var manNav;
var gesVal;
var iO;
var initIP;
const cmD = "control?cmd=";
var coloumnSet;
var myJson2;
var baseUrl = "";
var runonce2 = true;
var unit;
var hiddenOverride = false;
var isMain = true;
let diV = '</div>';
var cD = [];
let html2 = "";
let htmlold = "";
let shouldShowOld = false;
var selectionData = {}; // Store selections by deviceType > deviceIndex > valueIndex


//##############################################################################################################
//      FETCH AND MAKE TILES
//##############################################################################################################
async function fetchJson(gN) {
    //invert color scheme----------
    try {
        for (const styleSheet of document.styleSheets) {
            for (const rule of styleSheet.cssRules) {
                if (rule.conditionText?.includes("prefers-color-scheme")) {
                    const isLightMode = document.cookie.includes("Col=1");
                    rule.media.mediaText = `(prefers-color-scheme: ${isLightMode ? "light" : "dark"})`;
                }
            }
        }
    } catch (err) {
        //console.error("Error processing style sheets:", err);
    }
    if (!isittime) { return; }
    //-----------------------
    let urlParams = new URLSearchParams(window.location.search);
    myParam = urlParams.get('unit');
    if (urlParams.get('cmd') == "reboot") { window.location.href = window.location.origin + "/tools?cmd=reboot" }
    if (myParam == null) { hasParams = 0; }
    someoneEn = 0;

    let stats = window.efc ? "?showpluginstats=1" : "";
    if (!jsonPath) { jsonPath = `/json`; }

    let myJson;

    try {
        const response = await getUrl(jsonPath + stats);
        myJson = await response.json();
    } catch (error) {
        console.error("Error parsing JSON, falling back to empty stats", error);
        const response = await getUrl(jsonPath);
        myJson = await response.json();
    }

    unit = myJson.WiFi.Hostname;
    unitNr = myJson.System['Unit Number'];

    //----------------------------------------------------------------------------------------------------------get EFC Data

    await getEfcData(unit);

    //----------------------------------------------------------------------------------------------------------get EFC Data
    //console.log("selectionData", selectionData);
    if (!isittime) return;
    html = '';
    let html1 = '', html11 = '', html3 = '', htmlBigS = '';
    let htmlBigFirst = `<div class="bigNum">`
    let htmlBig1 = `<div class="valuesBig" style="font-weight:bold;text-align:left;">`;


    sysInfo = myJson.System

    const sysPairs = [
        { label: 'Sysinfo of', value: unit },
        { label: 'Local Time', value: sysInfo['Local Time'] },
        { label: 'Uptime', value: minutesToDhm(sysInfo['Uptime']) },
        { label: 'Load', value: `${sysInfo['Load']}%` },
        sysInfo['Internal Temperature'] && {
            label: 'Temp',
            value: `${sysInfo['Internal Temperature']}°C`,
            style: `color: ${sysInfo['Internal Temperature'] > 55 ? 'red' : 'inherit'};`
        },
        { label: 'Free Ram', value: sysInfo['Free RAM'] },
        { label: 'Free Stack', value: sysInfo['Free Stack'] },
        { label: 'IP Address', value: myJson.WiFi['IP Address'] },
        { label: 'RSSI', value: `${myJson.WiFi['RSSI']} dBm` },
        { label: 'Build', value: sysInfo['Build'] },
        { label: 'Eco Mode', value: sysInfo['CPU Eco Mode'] === "true" ? 'on' : 'off' }
    ].filter(Boolean);

    let syshtml = sysPairs.map(pair => `
                <div class="syspair">
                    <div>${pair.label}:</div>
                    <div style="${pair.style || ''}">${pair.value}</div>
                </div>
            `).join('');

    let [dateBig, clockBig] = myJson.System['Local Time'].split(" ");
    clockBig = clockBig.split(':').slice(0, -1).join(':');
    let [dateY, dateM, dateD] = dateBig.split('-');

    if (!myJson.Sensors.length && !hasParams) {
        html += '<div class="sensorset clickables" onclick="splitOn(); topF();"><div  class="sensors" style="font-weight:bold;">no tasks configured...</div>';
    }
    else {
        //------------------------------------
        // -----------------------------------------------------------------------    Sensors
        for (const sensor of myJson.Sensors) {
            //myJson.Sensors.forEach(sensor => {

            const { TaskNumber, TaskDeviceNumber, TaskName, TaskDeviceGPIO1, PluginStats } = sensor;

            if (PluginStats) {
                const existing = cD.find(item => item.device === TaskName);
                existing ? (existing.chart = PluginStats) : cD.push({ device: TaskName, chart: PluginStats });
            }

            //console.log("chartData", cD);
            var bigSpan = "";
            sensorName = TaskName;
            deviceName = TaskName;
            taskEnabled = sensor.TaskEnabled.toString();
            const [, bgColor] = getComputedStyle(document.body).backgroundColor.match(/\d+/g);

            tBGS = selectionData?.["S"]?.["SBC"] &&
                selectionData?.["S"]?.["SBC"] !== "#000000"
                ? `background:${selectionData?.["S"]?.["SBC"]}${bgColor === "0" ? "80" : ""}`
                : "";


            //this is a bit to confusing when creating events for now
            var sensorName3 = changeNN(sensorName) //replace "_" and "." in device and "BigValue" names

            const htS1 = `sensorset clickables" onclick="playSound(3000), `;

            const htS2 = `<div id="${sensorName}" class="sensors" style="font-weight:bold;">${sensorName3}</div>`;
            exC = [87, 38, 41, 42].includes(TaskDeviceNumber); //all PluginNR in an array that need to be excluded 
            exC2 = !sensor.Type?.includes("Display")

            let isHidden = (!hiddenOverride && selectionData[TaskNumber]?.["A"]?.["hide"] === 1);

            if (taskEnabled === "true" && !isHidden && !exC && exC2 && !hasParams) {

                const orderA = selectionData[TaskNumber]?.["A"]?.["order"] || "0";
                const chart = selectionData[TaskNumber]?.["A"]?.["chart"] || 0;
                let efcIDA = `efc:${deviceName}=${TaskDeviceNumber},${TaskNumber}`;
                //chart
                if (chart && window.efc) {
                    html2 += `<div order="${orderA}" id="${efcIDA},1A" class="sensorset chart" style="height:150px; padding:0;" ><canvas id="${TaskName}chart"></canvas></div>`;
                }

                if (sensor.TaskValues) {
                    someoneEn = 1;
                    let firstItem = false;
                    let firstItemCheck = false;
                    let firstBigVal = true;

                    //----------------------------------------------------------------------------------------------   TaskValues 
                    for (const item of sensor.TaskValues) {

                        const { ValueNumber, Value, Name, NrDecimals } = item;


                        //adding an ID for every Tile to be able to access the context menu
                        let efcID = `${efcIDA},${ValueNumber}`;


                        // getting efc data

                        let selectedTaskVal = selectionData?.[TaskNumber]?.[ValueNumber];

                        let overrideSelection = selectionData[TaskNumber]?.["A"]?.["val"];

                        tBG = selectionData[TaskNumber]?.["A"]?.["color"] &&
                            selectionData[TaskNumber]["A"]["color"] !== "#000000"
                            ? `background:${selectionData[TaskNumber]["A"]["color"]}${bgColor === "0" ? "80" : ""}`
                            : "";

                        let taskVal = selectedTaskVal?.["val"] || "";
                        let kindN = selectedTaskVal?.["unit"] || "";
                        let kindNP = `<span style="background:none;padding-left: 2px;">${kindN}</span>`
                        let XI = selectedTaskVal?.["noI"] === 1 ? "noI" : "";
                        let order = selectedTaskVal?.["order"] || "0";


                        const sendToValue = selectedTaskVal?.sendTo;
                        const [sendToNr = "", gpio = ""] = (typeof sendToValue === "string" ? sendToValue.split(",") : []) || [];

                        isHidden = (!hiddenOverride && selectedTaskVal?.["hide"] === 1);

                        // Handle range values
                        if (selectedTaskVal?.["range"]) {
                            [slMin, slMax, slStep] = selectedTaskVal["range"].split(",");
                        } else {
                            [slMin, slMax, slStep] = taskVal === "thSlider" ? [5, 35, 1] : [0, 1024, 1];
                        }

                        if (overrideSelection && overrideSelection !== "none" && overrideSelection !== "chart") {
                            sensorName = overrideSelection;
                        } else if (!taskVal || taskVal === "none") {
                            sensorName = TaskName;
                        } else {
                            sensorName = taskVal;
                        }

                        if (!firstItemCheck && (!taskVal || ["", "none", "bigVS"].includes(taskVal) || sensorName === "bigVal")) {
                            firstItemCheck = firstItem = true;
                        }
                        wasUsed = false;

                        if (typeof Value == 'number') {
                            num2Value = Value.toFixed(NrDecimals);
                        }
                        else { num2Value = Value; }

                        if (selectedTaskVal?.["noV"] === 1) {
                            itemName = "";
                        }
                        else {
                            itemName = Name.toString();
                        }
                        itemNameChanged = changeNN(itemName);

                        //empty button State
                        bS = "";
                        //buttons = html; sensor tiles = html1; slider = html2; big values = html3
                        //switch---------------------------------------------------------
                        if (TaskDeviceNumber == 1) {
                            wasUsed = true;
                            if ((itemName === "btnStateC" && Value < 2) || Value === 1) { bS = "on"; }
                            else if (Value === 2) { bS = "alert"; }

                            if (TaskDeviceGPIO1 && (itemName === "State" || itemName === "iState")) {
                                if (itemName === "iState") { Value = Value == 1 ? 0 : 1; }
                                const uttonGP = `${sensorName}|${TaskDeviceGPIO1}`;
                                html += `<div order="${orderA}" id="${efcID}A" class="btnTile ${bS} ${htS1} buttonClick('${uttonGP}', '${Value}')">${htS2}`;

                            } else if (itemName === "pState" && TaskDeviceGPIO1) {
                                const uttonGP = `${sensorName}?${TaskDeviceGPIO1}`;
                                html += `<div order="${orderA}" id="${efcID}A" class="${bS} btnTile push sensorset" 
                                            onpointerdown="if (event.button === 0) { playSound(3000); pushClick('${uttonGP}',1); }" 
                                            onpointerup="pushClick('${uttonGP}',0)">
                                            <div id="${sensorName}" class="sensors" style="font-weight:bold;">${sensorName}</div>
                                        </div>`;

                            } else if (itemName.includes("btnState")) {
                                if (itemName === "ibtnState") { Value = Value == 1 ? 0 : 1; }
                                if (kindN) { sensorName = `${sensorName}|${kindN}`; }
                                html += `<div order="${orderA}" id="${efcID}A" id="${sensorName}" class="btnTile ${XI} ${bS} ${htS1}buttonClick('${sensorName}', '${Value}')">${htS2}`;
                            } else {
                                wasUsed = false;
                            }
                        }
                        //dummy---------------------------------------------------------
                        if (TaskDeviceNumber !== 1 && !isHidden && !(sensorName).includes("bigVal")) {
                            if (TaskDeviceNumber !== 33) XI = " noI ";
                            wasUsed = true;
                            //button coloring
                            if ((kindN === "C" && Value < 2) || Value === 1) { bS = "on"; }
                            else if (Value === 2) { bS = "alert"; }
                            //handle tile hiding of dummy tiles
                            if (["dButtons", "vInput", "pButtons"].some(v => TaskName.includes(v)) && Name.includes("noVal")) {
                                //novalAuto tiles are only shown on larger screens
                                //When isAuto is true, shouldAddTile checks if the window width is at least 450 pixels and if the cookie contains "Two=1".
                                //When isAuto is false, shouldAddTile is always true.
                                const isAuto = Name.includes("noValAuto");
                                const shouldAddTile = isAuto ? (window.innerWidth >= 450 && document.cookie.includes("Two=1")) : true;
                                if (shouldAddTile) {
                                    html += `<div order="${order}" class="sensorset btnTile"></div>`;
                                }
                            }
                            //virtual buttons
                            else if ((sensorName).includes("dButtons")) {
                                if (Value > -1) {

                                    if (gpio) {
                                        getRemoteGPIOState(TaskNumber, sendToNr, gpio, myJson.System['Unit Number'], ValueNumber);
                                    }
                                    if (sendToNr) { itemName = `${itemName}&${sendToNr}G${gpio}`; }
                                    const clickHandler = sendToNr === "A" ? `getNodes('${itemName}')` : `buttonClick('${itemName}')`;
                                    html += `<div order="${order}" id="${efcID}" class="btnTile ${XI}${bS} ${htS1} ${clickHandler}"><div id="${itemName}" class="sensors ${sendToNr === "A" ? `nodes` : ``}" style="font-weight:bold;">${itemNameChanged}</div></div>`;
                                }
                            }
                            //push buttons
                            else if (sensorName.includes("pButtons") && Value > -1) {
                                html += `<div order="${order}" id="${efcID}" class="${bS} btnTile push sensorset" 
                                            onpointerdown="if (event.button === 0) { playSound(3000); pushClick('${itemName}',1); }" 
                                            onpointerup="if (event.button === 0) {pushClick('${itemName}',0)}">
                                            <div id="${itemName}" class="sensors" style="font-weight:bold;">${itemNameChanged}</div>
                                        </div>`;
                            }
                            //number input
                            else if (sensorName.includes("vInput")) {
                                html += `
                                        <div order="${order}" id="${efcID}" class="sensorset clickables">
                                            <div id="${itemName}" class="sensors" style="font-weight:bold;pointer-events:all" onclick="getInput(this.nextElementSibling.firstElementChild)">
                                                ${itemNameChanged}
                                            </div>
                                            <div class="valWrap">
                                                <input type="number" class="vInputs ${TaskNumber},${ValueNumber}" id="${itemName}" name="${sensorName}" placeholder="${num2Value}" onkeydown="getInput(this)" onclick="getInput(this,1)">
                                                <div class="kindInput">${kindNP}</div>
                                            </div>
                                        </div>`;
                            }
                            //normal slider
                            else if ((sensorName).includes("vSlider")) {
                                num2Value = Number(num2Value).toFixed((slStep.toString().split('.')[1] || '').length);
                                itemName = itemName === "noVal" ? "&nbsp;" : itemName;
                                html2 += `<div order="${order}" id="${efcID}" class="${XI} sensorset"><input type="range" min="${slMin}" max="${slMax}" step="${slStep}" value="${num2Value}" id="${itemName}" class="slider sL ${TaskNumber},${ValueNumber}`;
                                //if (sensorName.includes("vSliderSw")) html2 += " swSlider";
                                html2 += sensorName.includes("nvSlider")
                                    ? ` noVal"><div class="sensors" style="align-items: flex-end;"><div style="font-weight:bold;">${itemNameChanged}</div></div></div>`
                                    : `"><div class="sensors" style="align-items: flex-end;"><div style="font-weight:bold;">${itemNameChanged}</div><div class="sliderAmount" style="text-align: right;">${num2Value}${kindNP}</div></div></div>`;
                            }
                            //time slider
                            else if ((sensorName).includes("tSlider")) {
                                if (NrDecimals !== 4) itemName = "For the Time slider the value must have<br>4 decimals!";
                                slT1 = Value.toFixed(4);
                                slT2 = (slT1 + "").split(".")[1];
                                slT1 = Math.floor(slT1);
                                hour1 = Math.floor(slT1 / 60);
                                minute1 = slT1 % 60;
                                const padded1 = minute1.toString().padStart(2, "0");
                                hour2 = Math.floor(slT2 / 60);
                                minute2 = slT2 % 60;
                                const padded2 = minute2.toString().padStart(2, "0");
                                itemName = changeNN(itemName);
                                const htmlSlider1 = `<input class="slTS slTHU" type="range" min="0" max="1440" step="5" value="`;

                                html2 += `
                                  <div order="${order}" id="${efcID}" class="slTimeSetWrap ${sensorName} ${TaskNumber},${ValueNumber}" style="font-weight:bold;">
                                    ${itemName}
                                    <div class="slTimeText">
                                      <span class="hAmount1">${hour1}</span>:<span class="mAmount1">${padded1}</span>-
                                      <span class="hAmount2">${hour2}</span>:<span class="mAmount2">${padded2}</span>
                                    </div>
                                    <div class="slTimeSet">
                                      ${htmlSlider1}${slT1}" id="${itemName}:L">
                                      ${htmlSlider1}${slT2}" id="${itemName}:R">
                                    </div>
                                  </div>
                                `;

                            }
                            // thermostat slider
                            else if ((sensorName).includes("thSlider")) {
                                if (NrDecimals !== 3) itemName = "For the Thermo slider the value must have<br>3 decimals!";
                                itemName = changeNN(itemName);
                                slT1 = Value.toFixed(3);
                                slT2 = (slT1 - Math.floor(slT1)) * 100;
                                slT2 = slT2.toFixed(1)
                                slT1 = (Math.floor(slT1) / 10).toFixed(1);
                                //if (Math.floor(slT1) < 10) { slT1N = "&nbsp;" + slT1.toString() }
                                const htmlSlider1 = `type="range" min="${slMin}" max="${slMax}" step="${slStep}" value="`;
                                const thermoSliderAddon = `<div class="noI" style="z-index: 2; position: absolute">${itemName}</div>`;

                                html2 += `
                                  <div order="${order}" id="${efcID}" class="slTimeSetWrap ${sensorName} ${TaskNumber},${ValueNumber}" style="font-weight:bold;">
                                    ${thermoSliderAddon}
                                    <div class="slTimeText">
                                      <div class="even">&#9728;&#xFE0E;<span class="isT">${slT1}</span>°C</div>
                                      <div class="even">&#9737;&#xFE0E;<span class="setT">${slT2}</span>°C</div>
                                    </div>
                                    <div class="slTimeSet">
                                      <input class="slTHU thermO ${XI}" ${htmlSlider1}${slT2}" id="setpoint">
                                      <input class="slider noI thT" ${htmlSlider1}${slT1}" id="${itemName}">
                                    </div>
                                  </div>
                                `;
                            }
                            //neopixel slider
                            else if (sensorName.includes("nPix")) {
                                // Determine the type of the range based on the value of itemName
                                const rangeType = ['H', 'S', 'V'].includes(kindN.toUpperCase()) ? kindN.toUpperCase() : 'H';

                                // Create the HTML element with a range input, depending on the type
                                html2 += `<div order="${order}" id="${efcID}" class="${XI} sensorset" style="padding:0;"><input type="range" max="${rangeType === 'H' ? 359 : 100}" min="0" value="${num2Value}" id="${sensorName}?${rangeType}" class="sL npSl ${TaskNumber},${ValueNumber} np${rangeType} noVal"></div>`;
                            }
                            else { wasUsed = false; }
                        }
                        //big values---------------------------------------------------------

                        if (sensorName.includes("bigVal")) {
                            wasUsed = true;


                            if (firstBigVal) {
                                firstBigVal = false;
                                html3 += htmlBigFirst;
                            }

                            let htmlBig2 = `<div order="${order}" id="${efcID}" style="${tBG}" class="bigNumWrap `;

                            if (!isHidden) {
                                // if (sensor.TaskValues.length === 3) { //&& !sensor.TaskValues.some(item => isHidden)) {
                                //     bigSpan = "big3";
                                // }

                                html3 += htmlBig2 + bigSpan + `">`;
                                let htS3 = `${htmlBig1}${itemName}</div><div id="`;

                                if (["Clock", "Uhr"].some(v => itemName.includes(v))) {
                                    html3 += `${htS3}clock" class="valueBig">${clockBig}</div></div>`;
                                }
                                else if (["Datum"].some(v => itemName.toLowerCase().includes(v))) {
                                    html3 += `${htS3}date" class="valueBig">${dateD}.${dateM}</div></div>`;
                                }
                                else if (["Date"].some(v => itemName.toLowerCase().includes(v))) {
                                    html3 += `${htS3}date" class="valueBig">${dateM}-${dateD}</div></div>`;
                                }
                                else if (["Year", "Jahr"].some(v => itemName.toLowerCase().includes(v))) {
                                    html3 += `${htS3}year" class="valueBig">${dateY}</div></div>`;
                                }
                                else if (itemName.includes("noVal")) {
                                    html3 += `${htmlBig1}</div><div class="valueBig"></span></div></div>`;
                                }
                                else {
                                    html3 += `${htmlBig1}${itemName}</div><div class="valueBig">${num2Value}${kindNP}</div></div>`;
                                }
                            }
                        }
                        if (taskVal.includes("bigVS") && !sensorName.includes("bigVal")) {
                            const htmlBig2 = `<div order="${order}" id="efc:bigSingle=${TaskDeviceNumber},${TaskNumber},${ValueNumber}" style="${tBGS}" class="bigNumWrap bigSingles `;
                            htmlBigS += htmlBig2 + bigSpan + `">`;
                            if (isHidden) {
                                htmlBigS += `${htmlBig1}</div><div class="valueBig"></div></div>`;
                            } else {
                                htmlBigS += `${htmlBig1}${itemName}</div><div class="valueBig">${num2Value}${kindNP}</div></div>`;
                            }

                        }


                        // if all items with a specific declaration are processed do the rest---------------------------------------------------------
                        if (!wasUsed) {
                            //output clock
                            if (TaskDeviceNumber == 43) {
                                if (firstItem) {
                                    if (Value === 1) { bS = "on"; }
                                    html += `<div order="${orderA}" id="${efcID}A" class="btnTile ${bS} sensorset clickables" onclick="playSound(3000); splitOn(${TaskNumber}); topF();">
                                                <div class="sensors" style="font-weight:bold;">${sensorName}</div>
                                                <div class="odd" style="font-size: 20pt;">&#x23F2;&#xFE0E;</div>
                                            </div></div>`;
                                }
                            }
                            else if (overrideSelection !== "bigVal") {
                                if (firstItem) {
                                    html1 += `<div order="${orderA}" id="${efcID}A" class="${htS1}buttonClick('${sensorName}')" style="${tBG}">${htS2}`;
                                }

                                if (!isHidden || taskVal.includes("bigVS") || taskVal.includes("chart")) {
                                    if (TaskDeviceNumber === 81) {
                                        html1 += `
                                            <div id="${efcID}" class="cron">
                                                <div>${itemNameChanged}</div>
                                                <div style="font-size: 10pt;">${Value}</div>
                                            </div>`;
                                    } else {
                                        html1 += `
                                            <div id="${efcID}" class="row">
                                                <div class="odd">${itemNameChanged}</div>
                                                <div class="even">${num2Value}${kindNP}</div>
                                            </div>`;
                                    }
                                }
                            }
                        }
                        firstItem = false;

                    };
                    html += diV
                    html1 += diV;
                    html3 += diV;


                    //sorting button and value tiles
                    if (!document.cookie.includes("Sort=1")) {
                        html += html1;
                        html1 = '';
                    }
                }
                else {
                    html1 += `
                      <div order="${orderA}" id="${efcIDA},1A" class="sensorset clickables" onclick="buttonClick('${sensorName}')">
                        <div class="sensors" style="font-weight:bold;">${sensorName}</div>
                        <div></div><div></div>
                      </div>
                    `;
                    someoneEn = 1;
                    document.getElementById('sensorList').innerHTML = html1;
                }
            }
        };
        if (!someoneEn && !hasParams) {
            html += '<div class="sensorset clickables" onclick="splitOn(); topF();"> <div class="sensors" style="font-weight:bold;">no tasks enabled or visible...</div>';
        }
    }
    html += html1;
    //wrap bigValues singleMode
    if (htmlBigS) {
        let htmlBigSingles = '';
        htmlBigSingles = htmlBigFirst + htmlBigS + diV;
        html3 += htmlBigSingles;
    }

    document.getElementById('sysInfo').innerHTML = syshtml;
    document.getElementById('sensorList').innerHTML = orderFunction(html);

    const shouldShow = document.getElementById('allList')?.offsetWidth > 400;
    if (htmlold !== html2 || shouldShow !== shouldShowOld) {
        document.getElementById('sliderList').innerHTML = orderFunction(html2);
        chartInstances = {};
    }
    shouldShowOld = shouldShow
    htmlold = html2;
    html2 = "";

    document.getElementById('bigNumber').innerHTML = html3;
    //Things that only need to run once
    if (firstRun) {
        if (!document.cookie.includes("Snd=")) mC("Snd");

        // Set full viewport height for iPhones
        // if (/iPhone/i.test(window.navigator.userAgent)) {
        //     document.body.style.height = "100vh";
        // }

        // Start fetching JSON data every 2 seconds
        fJ = setInterval(fetchJson, 2000);

        unitNr1 = myJson.System["Unit Number"];
        initIP = myJson.WiFi["IP Address"] === "(IP unset)" ? "192.168.4.1" : myJson.WiFi["IP Address"];

        nP2 = `http://${initIP}/devices`;
        nP = `http://${initIP}/tools`;

        getNodes();
        longPressS();
        longPressN();
        addEonce();

        firstRun = false;
    }

    // Set unit symbol if unit number matches
    styleU = unitNr === unitNr1 ? "&#8858;&#xFE0E;" : "";

    // Update unit display if there are no parameters
    if (!hasParams) {
        document.getElementById("unitId").innerHTML = `${styleU}${unit} <span class="numberUnit"> (${myJson.WiFi.RSSI})</span>`;
        document.getElementById("unitT").innerHTML = `${styleU}${unit}`;
    }
    if (gN == "gN") getNodes(undefined, undefined, "ch");
    paramS();
    changeCss();
    resizeText();
   if (window.efc) makeChart();
    if (!window.configMode) { longPressB(); }
}

//##############################################################################################################
//      order the tiles
//##############################################################################################################
function orderFunction(html) {
    let tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;

    let divs = [...tempContainer.children];

    let positiveDivs = divs.filter(div => (parseInt(div.getAttribute('order')) || 0) > 0)
        .sort((a, b) => parseInt(a.getAttribute('order')) - parseInt(b.getAttribute('order')));

    let zeroDivs = divs.filter(div => (parseInt(div.getAttribute('order')) || 0) === 0);

    let negativeDivs = divs.filter(div => (parseInt(div.getAttribute('order')) || 0) < 0)
        .sort((a, b) => parseInt(b.getAttribute('order')) - parseInt(a.getAttribute('order')));

    return [...positiveDivs, ...zeroDivs, ...negativeDivs].map(div => div.outerHTML).join('');
}
//##############################################################################################################
//      get remote GPIO state
//##############################################################################################################

async function getRemoteGPIOState(taskNum, unitToNum, gpioNum, unitFromNum, valueNum) {
    const url = Number(unitToNum) === unitNr1
        ? `${cmD}SendTo,${unitFromNum},'taskvalueset,${taskNum},${valueNum},[Plugin%23GPIO%23Pinstate%23${gpioNum}]'`
        : `${cmD}SendTo,${unitToNum},'SendTo,${unitFromNum},"taskvalueset,${taskNum},${valueNum},\\[Plugin%23GPIO%23Pinstate%23${gpioNum}\\]"'`;
    return await getUrl(url);
}

//##############################################################################################################
//      replace _ and .
//##############################################################################################################

function changeNN(nn) {
    return nn.replace(/_/g, " ").replace(/\./g, "-<br>"); //replace "_" and "." in device and "BigValue" names
}

//##############################################################################################################
//      ADJUST THE STYLING
//##############################################################################################################
function changeCss() {
    let x = " auto";
    let m = "";
    let coloumnSet, y, z;
    var numSl = document.querySelectorAll('.chart, input[type=range]').length;
    if (!numSl) { document.getElementById("allList").classList.add('allExtra'); }
    else { document.getElementById("allList").classList.remove('allExtra'); }
    var list3 = document.querySelectorAll(".bigNum");
    var sList = document.getElementById("sensorList");
    var numSet = sList.getElementsByClassName('sensorset').length;
    //var bigLength = 0;

    // find the largest group size

    let bigLength = Math.max(...Array.from(list3, div => div.children.length));



    z = 0;
    if (!list3.length) z = numSet; //if there are no big values orient on number of "normal" tiles
    if (bigLength == 4 || z > 9) {
        y = x + x + x + x;
        coloumnSet = 4;
    }
    else if (bigLength == 3 || z > 4) {
        y = x + x + x;
        coloumnSet = 3;
    }
    else if (bigLength == 2 || z > 1) {
        y = x + x;
        coloumnSet = 2;
    }
    else if ((bigLength == 1 && numSet < 2) || (z < 2 && !list3.length)) {
        y = x;
        // m = "important" 
        if (list3.length) {
            list3.forEach(item => item.classList.add('bigNumOne'));
        }
        coloumnSet = 1;
    }
    else {
        y = x + x;
        coloumnSet = 2;
    }

    let isttwo = false;
    widthLimit = coloumnSet * 150 + (coloumnSet * (window.innerHeight / 100));
    if (window.innerWidth < widthLimit || document.cookie.includes("Two=1")) {
        isttwo = true;


        if (bigLength > 1 || numSet > 1) {
            coloumnSet = 2; y = x + x
            bigLength = 2;
        }

    }


    // append missing tiles with order starting from 1
    list3.forEach(group => {
        let orderCounter = 4;

        while (group.children.length < bigLength) {
            let newDiv = document.createElement('div');
            newDiv.className = 'bigNumWrap';
            newDiv.setAttribute('order', orderCounter++); // Assign increasing order
            group.appendChild(newDiv);
        }
    });

    // order child elements after all groups are equalized
    list3.forEach(div => {
        div.innerHTML = orderFunction(div.innerHTML); // Apply ordering after adding missing tiles

        let children = Array.from(div.children);
        if (children.length === 3) {
            children.forEach(child => child.classList.add('big3'));
        }
    });

    if (isttwo) {
        const elements = document.querySelectorAll(".big3");
        elements.forEach(el => el.classList.add("bigSpan"));
    }


    console.log(coloumnSet, y);
    sList.style.setProperty('grid-template-columns', y);
    list3.forEach(item => {
        item.style.setProperty('grid-template-columns', y);
    });

    //calculate and add extra tiles
    if (numSet % coloumnSet != 0 && coloumnSet != 1) {
        calcTile = coloumnSet - (numSet - coloumnSet * Math.floor(numSet / coloumnSet));
        for (let i = 1; i <= calcTile; i++) {
            sList.innerHTML += '<div class="sensorset"></div>'
        }
    }

    if (coloumnSet == 2 && bigLength == 1) {
        document.getElementsByClassName('bigNum')[0].appendChild(Object.assign(document.createElement('div'), { className: 'bigNumWrap' }));
    }

    document.getElementById('sensorList').innerHTML = sList.innerHTML;
    bigLength = 0;
}

//##############################################################################################################
//      ADD ADDITIONAL STUFF
//##############################################################################################################
function paramS() {
    var sliders = document.querySelectorAll(".slTHU");
    sliders.forEach(slider => {
        slider.addEventListener("input", updateSlTS);
        slider.addEventListener('change', sliderChTS);
        slider.addEventListener("pointerup", (event) => { iIV = setTimeout(blurInput, 1000) });
    });
    var sliders = document.querySelectorAll(".sL");
    sliders.forEach(slider => {
        slider.addEventListener('input', updateSlider);
        slider.addEventListener('change', sliderChange);
        slider.addEventListener("pointerup", (event) => { iIV = setTimeout(blurInput, 1000) });
    });
    neoS = document.querySelectorAll(".npS");
    neoS.forEach(sID => {
        hVal = document.getElementById(sID.id.split("?")[0] + '?H')?.value;
        vVal = document.getElementById(sID.id.split("?")[0] + '?V')?.value || 20;
        if (vVal < 20) vVal = 20;
        sID.style.backgroundImage = 'linear-gradient(to right, hsl(0,0%,' + vVal + '%),hsl(' + hVal + ',100%,50%))';
    });
    if (window.efc) {
        addContext();
    }
}

//##############################################################################################################
//      EVENTLISTENERS THAT NEED TO BE ADDED ONCE
//##############################################################################################################
function addEonce() {
    document.addEventListener('touchstart', e => {
        msTs = Date.now();
        tsX = e.changedTouches[0].screenX
        tsY = e.changedTouches[0].screenY
    })
    document.addEventListener('touchend', e => {
        msTe = Date.now();
        teX = e.changedTouches[0].screenX
        teY = e.changedTouches[0].screenY
        checkDirection()
    })
    document.addEventListener('mousemove', e => {
        if (!manNav && !navOpen) {
            if (e.clientX < 10 && document.getElementById('mySidenav').offsetLeft === -280) openNav()
            //if (e.clientX >280 && document.getElementById('sysInfo').offsetHeight === 0) closeNav()
        }
    })
    document.getElementById('mySidenav').addEventListener('mouseleave', e => {
        if (!manNav) {
            closeNav()
        }
    })
    if (window.efc) {
        createMenu();
    }
}

//##############################################################################################################
//      TOUCHSLIDE TO OPEN SIDENAV
//##############################################################################################################
function checkDirection() {
    touchtime = msTe - msTs
    touchDistX = teX - tsX
    touchDistY = teY - tsY
    if (teX < tsX && navOpen) {
        if (Math.abs(touchDistX) > 40 && Math.abs(touchDistY) < 30 && touchtime < 250) closeNav()
    }
    if (teX > tsX && !navOpen) {
        if (Math.abs(touchDistX) > 40 && Math.abs(touchDistY) < 30 && touchtime < 250) openNav()
    }
}

//##############################################################################################################
//      TIMESLIDER UPDATE VALUES
//##############################################################################################################
function updateSlTS(event) {
    isittime = 0;
    const slider = event.target;
    const isSetpoint = slider.id === "setpoint";
    const slTimeSetWrap = slider.closest(".slTimeSetWrap");

    if (isSetpoint) {
        const amount = slTimeSetWrap.querySelector(".slTimeText .setT");
        amount.textContent = Number(slider.value).toFixed(1);
        return;
    }

    const nuM = slider.id.slice(-1) === "L" ? 1 : 2;
    const amount = slTimeSetWrap.querySelector(`.hAmount${nuM}`);
    const amount2 = slTimeSetWrap.querySelector(`.mAmount${nuM}`);

    const hours = Math.floor(slider.value / 60);
    const minutes = slider.value % 60;

    amount.textContent = hours;
    amount2.textContent = minutes.toString().padStart(2, "0");
}

//##############################################################################################################
//      NORMAL SLIDER UPDATE VALUES
//##############################################################################################################
function updateSlider(event) {
    //NrofSlides++;
    isittime = 0;

    const slider = event.target;
    const currVal = slider.attributes.value.nodeValue;
    let slKind = slider.id.split("?")[4] || "";

    // Update slider value display if not marked "noVal"
    if (!slider.className.includes("noVal")) {
        const amount = slider.closest("div.sensorset").querySelector(".sliderAmount");
        if (slKind === "H") slKind = "%";

        const stepPrecision = slider.step.includes(".")
            ? slider.step.split(".")[1].length
            : 0;
        const slA = Number(slider.value).toFixed(stepPrecision) + slKind;

        amount.textContent = slA;
    }

    // Handle "npSl" slider type
    if (slider.classList[1] === "npSl") {
        const sliderId = slider.id.split("?")[0];

        const hVal = document.getElementById(`${sliderId}?H`)?.value;
        const sVal = document.getElementById(`${sliderId}?S`)?.value;
        let vVal = document.getElementById(`${sliderId}?V`)?.value || 0;

        gesVal = [hVal, sVal, vVal];

        // Update saturation gradient if H and S values exist
        if (hVal && sVal) {
            vVal = Math.max(vVal, 20);
            const sGrad = document.getElementById(`${sliderId}?S`);
            sGrad.style.backgroundImage = `linear-gradient(to right, hsl(0,0%,${vVal}%), hsl(${hVal},100%,50%))`;
        }
    }
}

//##############################################################################################################
//      TIMESLIDER SEND EVENT ON CHANGE
//##############################################################################################################
function sliderChTS(event) {
    playSound(4000);
    const slider = event.target;
    console.log(slider);
    const slTName = slider.parentNode.parentNode;
    console.log(slTName);
    const slTNameID = slTName.id.match(/:(\w+)=/)[1];
    const sliderId = slider.id.split(":")[0];
    const LorR = slider.id.split(":")[1];
    const slClass2 = slTName.classList[2];
    const slClass1 = slTName.classList[1];
    const sliderValue = event.target.value;
    // thermoslider
    if (sliderId === "setpoint") {
        const isT = parseFloat(slider.closest(".slTimeSetWrap").querySelector(".isT").textContent);
        const setTvalue = (isT * 10) + (sliderValue / 100);
        const commandBase = `taskvalueset,${slClass2},${setTvalue}`;
        const eventBase = `event,${slTNameID}Event=${sliderValue * 10}`;

        if (unitNr === unitNr1) {
            getUrl(`${cmD}${commandBase}`);
            getUrl(`${cmD}${eventBase}`);
        } else {
            getUrl(`${cmD}SendTo,${nNr},"${commandBase}"`);
            getUrl(`${cmD}SendTo,${nNr},"${eventBase}"`);
        }
        // timeslider
    } else {
        const isLeft = LorR === "L";
        const secVal = document.getElementById(isLeft ? `${sliderId}:R` : `${sliderId}:L`).value;
        console.log(secVal);
        const paddedSecVal = secVal.toString().padStart(4, "0");
        const combinedValue = isLeft
            ? `${sliderValue}.${paddedSecVal}`
            : `${secVal}.${sliderValue.toString().padStart(4, "0")}`;
        const commandBase = `taskvalueset,${slClass2},${combinedValue}`;
        const eventBase = `event,${sliderId}Event=${combinedValue}`;

        if (unitNr === unitNr1) {
            getUrl(`${cmD}${commandBase}`);
            getUrl(`${cmD}${eventBase}`);
        } else {
            getUrl(`${cmD}SendTo,${nNr},"${commandBase}"`);
            getUrl(`${cmD}SendTo,${nNr},"${eventBase}"`);
        }
    }
}

//##############################################################################################################
//      NORMAL SLIDER SEND EVENT ON CHANGE
//##############################################################################################################
function sliderChange(event) {
    playSound(4000);

    const slider = event.target;
    //const maxVal = parseFloat(slider.max);
    //const minVal = parseFloat(slider.min);
    let slA = slider.value;
    //let OnOff = "";
    //const isSwSlider = slider.classList[3] === "swSlider";
    const isNpSlider = slider.classList[1] === "npSl";

    // Handle single-slider specific logic
    // if (NrofSlides === 1 && isSwSlider) {
    //     const threshold = (maxVal - minVal) / 10;

    //     if (slA > (maxVal - threshold) && currVal !== maxVal) {
    //         slA = maxVal;
    //         OnOff = ",1";
    //         isittime = 1;
    //         setTimeout(fetchJson, 500);
    //     }

    //     if (slA < (minVal + threshold) && currVal !== minVal) {
    //         slA = minVal;
    //         OnOff = ",0";
    //         isittime = 1;
    //         setTimeout(fetchJson, 500);
    //     }
    // }

    // Simplify slider ID handling
    const sliderId = (slider.id.match(/\?/g) || []).length >= 3 || slider.classList[1] == 'npSl'
        ? slider.id.split("?")[0]
        : slider.id;

    // Filter `gesVal` if defined
    if (gesVal) {
        gesVal = gesVal.filter(Boolean);
    }

    // Build command strings
    const taskValueSetCmd = `taskvalueset,${slider.classList[2]},${slA}`;
    const eventCmd = isNpSlider
        ? `event,${sliderId}Event=${gesVal}`
        : `event,${sliderId}Event=${slA}`; //`event,${sliderId}Event=${slA},${OnOff}`;

    if (unitNr === unitNr1) {
        getUrl(`${cmD}${taskValueSetCmd}`);
        getUrl(`${cmD}${eventCmd}`);
    } else {
        getUrl(`${cmD}SendTo,${nNr},"${taskValueSetCmd}"`);
        getUrl(`${cmD}SendTo,${nNr},"${eventCmd}"`);
    }

    //NrofSlides = 0;
}

//##############################################################################################################
//      NORMAL BUTTON EVENT
//##############################################################################################################
function buttonClick(sensorName, gState) {

    // Handle "dButtons" sending to other nodes
    if (sensorName.includes("&")) {
        const [utton2, nodeInfo] = sensorName.split("&");
        const [nNr2, gpioNr] = nodeInfo.split("G");
        const isGPIOToggle = gpioNr && !gpioNr.endsWith("L");
        if (unitNr == nNr2) {
            if (isGPIOToggle) {
                getUrl(`${cmD}GPIOToggle,${gpioNr}`);
            } else {
                getUrl(`${cmD}"event,${utton2}Event"`);
            }
        } else {
            if (isGPIOToggle) {
                getUrl(`${cmD}SendTo,${nNr2},"GPIOToggle,${gpioNr}"`);
            } else {
                getUrl(`${cmD}SendTo,${nNr2},"event,${utton2}Event"`);
            }
        }
    }
    // Handle button events via "switch plugin"
    else if (sensorName.includes("|")) {
        const [uN, gpioNr] = sensorName.split("|");

        if (unitNr === unitNr1) {
            getUrl(`${cmD}gpio,${gpioNr},${1 - gState}`);
            getUrl(`${cmD}event,${uN}Event`);
        } else {
            getUrl(`${cmD}SendTo,${nNr},"gpio,${gpioNr},${1 - gState}"`);
            getUrl(`${cmD}SendTo,${nNr},"event,${uN}Event"`);
        }
    }
    // Handle normal button events via "dButtons"
    else {
        const eventCmd = `event,${sensorName}Event`;

        if (unitNr === unitNr1) {
            getUrl(`${cmD}"${eventCmd}"`);
        } else {
            getUrl(`${cmD}SendTo,${nNr},"${eventCmd}"`);
        }
    }

    // Refresh data after 400ms
    setTimeout(fetchJson, 400);
}

//##############################################################################################################
//      PUSH BUTTON EVENT
//##############################################################################################################
function pushClick(sensorName, b) {
    isittime = b === 0 ? 1 : 0;
    if (b === 0) playSound(1000);

    if (sensorName.includes("?")) {
        const gpioNr = sensorName.split("?")[1];
        const pcmd = `${cmD}gpio,${gpioNr},${b}`;
        if (unitNr === unitNr1) {
            getUrl(pcmd);
        } else {
            getUrl(`${cmD}SendTo,${nNr},"${pcmd}"`);
        }
    } else if (sensorName.includes("&")) {
        const [utton2, nNr2] = sensorName.split("&");
        getUrl(`${cmD}SendTo,${nNr2},"event,${utton2}Event=${b}"`);
    } else {
        const eventCmd = `${cmD}event,${sensorName}Event=${b}`;
        if (unitNr === unitNr1) {
            getUrl(eventCmd);
        } else {
            getUrl(`${cmD}SendTo,${nNr},"${eventCmd}"`);
        }
    }
}

//##############################################################################################################
//      INPUT TILES EVENT
//##############################################################################################################
function getInput(ele, initialClick) {
    ele.addEventListener('click', (e) => {
        if (e.type === 'click') {
            isittime = 0;
            iIV = setTimeout(blurInput, 8000);
            ele.addEventListener('blur', (event) => {
                clearTimeout(iIV);
                isittime = 1;
                setTimeout(fetchJson, 400);
            });
        }

        // Truncate the value if it exceeds 12 characters
        if (ele.value.length > 12) {
            ele.value = ele.value.slice(0, 12);
        }

        // Handle 'Enter' or 'click' event with 'initialClick' flag
        if ((e.key === 'Enter' || e.type === 'click' && !initialClick)) {
            isittime = 1;

            if (ele.value) {
                playSound(4000);

                // Dynamic task value command
                const taskValueSetCmd = `taskvalueset,${ele.classList[1]},${ele.value}`;

                if (unitNr === unitNr1) {
                    getUrl(cmD + taskValueSetCmd);
                } else {
                    getUrl(`${cmD}SendTo,${nNr},"${taskValueSetCmd}"`);
                }

                buttonClick(ele.id);
            } else {
                setTimeout(fetchJson, 400);
            }
            clearTimeout(iIV);
        }
        // Handle Escape key press to clear the input value
        else if (e.key === 'Escape') {
            document.getElementById(ele.id).value = "";
        }
        // If no condition is met, set a timeout for blur
        else {
            clearTimeout(iIV);
            iIV = setTimeout(blurInput, 5000);
        }
    });
}

//##############################################################################################################
//      BLUR INPUT
//##############################################################################################################
function blurInput() {
    isittime = 1;
}

//##############################################################################################################
//      OPEN THE SIDENAV
//##############################################################################################################
function openNav(whatisit) {
    navOpen = 1;
    if (whatisit) manNav = 1;
    clearInterval(nIV);
    nIV = setInterval(getNodes, 10000);
    const sideNav = document.getElementById('mySidenav');
    if (sideNav.offsetLeft === -280) {
        getNodes();
        sideNav.style.left = "0";
    } else {
        closeNav();
    }
}

//##############################################################################################################
//      CLOSE THE SIDENAV
//##############################################################################################################
function closeNav() {
    manNav = 0;
    navOpen = 0;
    clearInterval(nIV);
    document.getElementById("mySidenav").style.left = "-280px";
}

//##############################################################################################################
//      OPEN SYTEM INFO
//##############################################################################################################
function openSys() {
    if (document.getElementById('sysInfo').offsetHeight === 0) {
        document.getElementById('menueWrap1').style.flexShrink = "0";
        document.getElementById('sysInfo').style.height = "180px";
    } else {
        document.getElementById('sysInfo').style.height = "0";
        document.getElementById('menueWrap1').style.flexShrink = "999";
    }
}

//##############################################################################################################
//      NODES - MAKE A LIST FOR THE SIDENAV
//##############################################################################################################
async function getNodes(sensorName, allNodes, ch) {

    let html4 = '';
    let i = -1;

    if (!ch) {
        response = await getUrl(`/json`);
        myJson2 = await response.json();
    }
    myJson2.nodes.forEach(node => {
        i++
        if (node.nr == myParam && hasParams) {
            nodeChange(i);
            hasParams = 0;
        }

        styleN = node.nr === unitNr1
            ? (node.nr === unitNr ? "&#8857;&#xFE0E;" : "&#8858;&#xFE0E;")
            : (node.nr === unitNr ? "&#183;&#xFE0E;" : "");

        html4 += `
            <div class="menueItem">
                <div class="serverUnit" style="text-align: center;">${styleN}</div>
                <div id="${node.name}" class="nc" onclick="nodeChange(${i});iFr();">${node.name}<span class="numberUnit">${node.nr}</span>
                </div>
            </div>`;

        //sending to all nodes a command
        if (sensorName || allNodes) {
            const eventCmd = allNodes ? 'Long' : 'Event';
            const cmdUrl = node.nr === unitNr1 ? `${cmD}event,${sensorName}${eventCmd}` : `${cmD}SendTo,${node.nr},"event,${sensorName}${eventCmd}"`;
            getUrl(cmdUrl);
        }
    })
    i = 0
    document.getElementById('menueList').innerHTML = html4;
    if (hasParams) {
        let html = '<div class="sensorset clickables"><div  class="sensors" style="font-weight:bold;">can not find node # ' + myParam + '...</div></div>';
        document.getElementById('sensorList').innerHTML = html;
        hasParams = 0;
        setTimeout(fetchJson, 3000);
    }
    else { if (!nIV) { setTimeout(fetchJson, 1000); } }
}

//##############################################################################################################
//      CHANGE THE ADDRESS ACCORDING TO THE SELECTED NODE
//##############################################################################################################
function nodeChange(event) {
    const node = myJson2.nodes[event];
    selectionData = {};
    cD = [];
    if (window.efc) updateSaveButton("hide");
    runonce2 = true;
    if (node) {
        nNr = node.nr;
        nN = node.name;
        baseUrl = `http://${node.ip}`;
        nP = `${baseUrl}/tools`;
        nP2 = `${baseUrl}/devices`;
        //console.log("......nP2:"+nP2);
        jsonPath = `${baseUrl}/json`;
        window.history.replaceState(null, null, `?unit=${nNr}`);
        fetchJson("gN");
    }
    if (window.innerWidth < 450 && document.getElementById('sysInfo').offsetHeight === 0) {
        closeNav();
    }
}

//##############################################################################################################
//      RESIZE THE TEXT FOR "BIG VALUES"
//##############################################################################################################
function resizeText() {
    const isOverflown = ({ clientWidth, clientHeight, scrollWidth, scrollHeight }) => (scrollWidth > clientWidth) || (scrollHeight > clientHeight)
    const resizeText = ({ element, elements, minSize = 10, maxSize = 115, step = 1, unit = 'pt' }) => {
        (elements || [element]).forEach(el => {
            let i = minSize
            let overflow = false
            const parent = el.parentNode
            while (!overflow && i < maxSize) {
                el.style.fontSize = `${i}${unit}`
                overflow = isOverflown(parent)
                if (!overflow) i += step
            }
            el.style.fontSize = `${i - step - 1}${unit}`
            el.style.lineHeight = "0.75"
        })
    }
    resizeText({ elements: document.querySelectorAll('.valueBig'), step: 1 })
}

//##############################################################################################################
//      FULLSCREEN
//##############################################################################################################
function launchFs(element) {
    element.requestFullscreen();
}

//##############################################################################################################
//      OPENS THE IFRAME 
//##############################################################################################################
function splitOn(x) {
    const framie = document.getElementById('framie');
    if (framie.offsetWidth === 0) {
        iO = 1;
        iFr(x);
        framie.style.width = "100%";
    } else {
        iO = 0;
        framie.style.width = 0;
        framie.innerHTML = "";
    }
    setTimeout(fetchJson, 100);
}

// either open the devices page or the page of a specific plugin (e.g. clock)
function iFr(x) {
    //console.log("nP2:"+nP2);
    if (iO) {
        const src = x ? `${nP2}?index=${x}&page=1` : nP2;
        document.getElementById('framie').innerHTML = `<iframe src="${src}"></iframe>`;
        closeNav();
    }
}


//##############################################################################################################
//      SCROLL TO THE TOP
//##############################################################################################################
function topF() { document.body.scrollTop = 0; document.documentElement.scrollTop = 0; }

//##############################################################################################################
//      LONGPRESS AND COOCKIE SECTION
//##############################################################################################################
function longPressN() { document.getElementById('mOpen').addEventListener('long-press', function (e) { window.location.href = nP; }); }

function longPressS() {
    document.body.addEventListener('long-press', function (e) {
        e.preventDefault();
        const actions = {
            closeBtn: "Snd",
            nOpen: "Sort",
            openSys: "Two",
            unitId: "Col"
        };
        if (actions[e.target.id]) {
            mC(actions[e.target.id]);
        }
    });
}

//make cockies
function mC(y) {
    const currentValue = (document.cookie.match(`(^|;)\\s*${y}\\s*=\\s*([^;]+)`)?.pop() || '') == 1;
    playSound(currentValue ? 500 : 900);
    document.cookie = `${y}=${currentValue ? 0 : 1}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/; SameSite=Lax;`;
}

function longPressB() {
    setLongPressDelay(600)
    const longButtons = document.querySelectorAll(".clickables");
    longButtons.forEach(longButton => {
        longButton.addEventListener('long-press', async function (e) {
            e.preventDefault();
            const lBName = longButton.querySelector(".sensors");
            const lBNode = longButton.querySelector(".nodes");
            let url;

            if (lBNode) {
                getNodes(lBNode.textContent, "1");
            } else {
                const [utton2, nNr2] = (lBName.id).split("&");
                const gpioNr = (lBName.id).split(">")[1];

                if (nNr2) {
                    url = gpioNr && gpioNr.endsWith('L')
                        ? `${cmD}SendTo,${nNr2},"GPIOToggle,${gpioNr.split('L')[0]}"`
                        : `${cmD}SendTo,${nNr2},"event,${utton2}Long"`;
                } else {
                    url = unitNr === unitNr1
                        ? `${cmD}event,${lBName.id}Long`
                        : `${cmD}SendTo,${nNr},"event,${lBName.id}Long"`;
                }

                await getUrl(url);
                setTimeout(fetchJson, 400);
            }

            playSound(1000);
            isittime = 0;
            iIV = setTimeout(blurInput, 600);
        });
    });
}

//##############################################################################################################
//      HELPER
//##############################################################################################################
function minutesToDhm(min) {
    const d = Math.floor(min / (60 * 24));
    const h = Math.floor((min % (60 * 24)) / 60);
    const m = min % 60;

    const format = (value, unit) => value > 0 ? `${value} ${unit}${value === 1 ? '' : 's'} ` : '';

    const dDis = format(d, 'day');
    const hDis = format(h, 'hour');
    const mDis = format(m, 'minute');

    return dDis + hDis + mDis;
}

function playSound(freQ) {
    if (freQ === 500) {
        receiveNote("R");
    } else if (freQ >= 900 && freQ <= 1000) {
        receiveNote("Y");
    } else if (freQ > 1000) {
        receiveNote("G");
    } if ((document.cookie.includes("Snd=1") || freQ < 1000) && (isittime || freQ !== 3000)) {
        c = new AudioContext()
        o = c.createOscillator()
        g = c.createGain()
        frequency = freQ
        o.frequency.value = frequency
        o.type = "sawtooth"
        o.connect(g)
        g.connect(c.destination)
        g.gain.setValueAtTime(0.05, 0)
        o.start(0)
        g.gain.exponentialRampToValueAtTime(0.00001, c.currentTime + 0.01)
        o.stop(c.currentTime + 0.01)
    }
}
//timeout fetch requests
async function getUrl(url) {
    if (!window.configMode || url.endsWith("/json?showpluginstats=1")) {
        console.log(url);
        let controller = new AbortController();
        setTimeout(() => controller.abort(), 2000);

        try {
            let response = await fetch(url, {

                signal: controller.signal
            });
            return response; // Ensure response is returned if successful
        } catch (error) {
            receiveNote("R"); // Handle the error
            return null; // Abort further execution by returning null
        }
    }
}

async function getEfcData(unit) {

    if (runonce2 && !hasParams) {
        // If efc.json fetch fails, try to fetch mein_efc.json
        try {
            let response = await getUrl(`/main_efc.json.gz`);

            // If fetching mein_efc.json fails, throw an error
            if (!response || !response.ok) {
                throw new Error("Failed to fetch /main_efc.json");
            }

            // If mein_efc.json is fetched successfully, parse it
            let mainEfcData = await response.json();
            efcArray = mainEfcData;
            console.log("Data from main_efc.json:", unit);

            // Fill selectionData with the entry matching the unitname key
            selectionData = mainEfcData.find(entry => entry.unit === unit);
            console.log("selectionData after matching unitname:", selectionData);

        } catch (error) {
            console.log("Error fetching /main_efc.json:", error.message);
            try {
                // First, attempt to fetch efc.json
                let response = await getUrl(`${baseUrl}/efc.json.gz`);

                // If fetching efc.json fails, throw an error and proceed to the next fetch
                if (!response || !response.ok) {
                    throw new Error("Failed to fetch /efc.json");
                }

                // If efc.json is fetched successfully, parse and assign to selectionData
                selectionData = await response.json();
                console.log("selectionData from efc.json:", selectionData);
                isMain = false;
            } catch (error) {
                console.log("Error fetching /efc.json:", error.message);
            }
        }
        if (!selectionData) { selectionData = {}; }
        // Finally, ensure runonce2 is set to false to prevent repeated execution
        runonce2 = false;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        //console.log("visible");
        clearTimeout(fJ);
        fetchJson();
        fJ = setInterval(fetchJson, 2000);
    } else {
        //console.log("invisible");
        clearTimeout(fJ);
    }
});

function receiveNote(S) {
    const colors = {
        G: "rgb(0, 255, 0)",
        Y: "rgb(255, 251, 0)",
        R: "rgb(255, 0, 0)",
        N: "none",
    };

    const box = "inset 0px 11px 17px -11px ";
    const receiveNoteEl = document.getElementById("unitId");
    receiveNoteEl.style.boxShadow = S === 0 || S === "N" ? colors.N : box + colors[S];
    if (S) setTimeout(() => receiveNote(0), 300);
}


//----------------------------------------------------------------------------------------------------------------

// 1️ Inject Web App Manifest (inline)
const favicon = document.querySelector("link[rel='icon']").getAttribute("href");

const manifest = {
    name: "easyfetch",
    short_name: "easyfetch",
    scope: "./",
    start_url: "./",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [192, 256, 384, 512, 57, 72, 76, 120, 152, 167, 180, 1024].map((x) => ({
        src: favicon,
        sizes: `${x}x${x}`,
        purpose: "any"
    }))
};
console.log(`http://${window.location.hostname}${window.location.pathname}?unit=1`);

const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
const manifestURL = URL.createObjectURL(blob);
const link = document.createElement("link");
link.rel = "manifest";
link.href = manifestURL;
document.head.appendChild(link);

// 2️ Register Inline Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("data:application/javascript," + encodeURIComponent(`
    self.addEventListener("install", (event) => {
      console.log("Service Worker installed");
      self.skipWaiting();
    });

    self.addEventListener("activate", (event) => {
      console.log("Service Worker activated");
    });

    self.addEventListener("fetch", (event) => {
      event.respondWith(
        fetch(event.request).catch(() => {
          console.log("Offline mode: Cannot reach server.");
          return new Response("You are offline!", { status: 503 });
        })
      );
    });
  `)).then(() => console.log("Service Worker registered!"))
        .catch(err => console.error("Service Worker registration failed:", err));
}
// 3️ Handle Install Prompt (PWA Install Button)
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    console.log("PWA Install prompt is available!");

    // Example: Auto-show install prompt after 5 seconds
    setTimeout(() => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt = null; // Reset prompt so it doesn't show again
        }
    }, 1000);
});
// ----------------------------------------------------------------------------------------------------------------


!function (e, n) { "use strict"; let t = null; const o = 10, a = 10; let i = { x: 0, y: 0 }, s = 1e3; const c = "ontouchstart" in e || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0, r = "PointerEvent" in e || e.navigator && "msPointerEnabled" in e.navigator ? { down: "pointerdown", up: "pointerup", move: "pointermove", leave: "pointerleave" } : c ? { down: "touchstart", up: "touchend", move: "touchmove", leave: "touchleave" } : { down: "mousedown", up: "mouseup", move: "mousemove", leave: "mouseleave" }; function u(e) { v(); const t = l(e), o = new CustomEvent("long-press", { bubbles: !0, cancelable: !0, detail: (a = t, { clientX: a.clientX, clientY: a.clientY, offsetX: a.offsetX, offsetY: a.offsetY, pageX: a.pageX, pageY: a.pageY, screenX: a.screenX, screenY: a.screenY }) }); var a; this.dispatchEvent(o) || n.addEventListener("click", m, !0) } function l(e) { return e.changedTouches ? e.changedTouches[0] : e } function d(e, n = s) { v(); const o = e.target; t = setTimeout((() => u.call(o, e)), n) } function v() { t && (clearTimeout(t), t = null) } function m(e) { n.removeEventListener("click", m, !0), e.preventDefault(), e.stopImmediatePropagation() } n.addEventListener(r.down, (function (e) { const n = l(e); i = { x: n.clientX, y: n.clientY }, d(e) }), !0), n.addEventListener(r.move, (function (e) { const n = l(e); (Math.abs(i.x - n.clientX) > o || Math.abs(i.y - n.clientY) > a) && v() }), !0), n.addEventListener(r.up, v, !0), n.addEventListener(r.leave, v, !0), n.addEventListener("wheel", v, !0), n.addEventListener("scroll", v, !0), navigator.userAgent.toLowerCase().includes("android") || n.addEventListener("contextmenu", v, !0), e.setLongPressDelay = function (e) { s = e } }(window, document);