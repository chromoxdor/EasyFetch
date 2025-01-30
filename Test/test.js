var firstRun = 1;
//var wasUsed;
//var slA; //sliderAmount
var bigLength = 0;
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
var myJson


//##############################################################################################################
//      FETCH AND MAKE TILES
//##############################################################################################################
async function fetchJson() {
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
    if (!isittime) return;
    //-----------------------
    let urlParams = new URLSearchParams(window.location.search);
    myParam = urlParams.get('unit');
    if (urlParams.get('cmd') == "reboot") { window.location.href = window.location.origin + "/tools?cmd=reboot" }
    if (myParam == null) { hasParams = 0; }
    someoneEn = 0;

    if (!isittime) return;

    if (!jsonPath) { jsonPath = `/json`; }
    responseTime = Date.now();
    response = await getUrl(jsonPath);
    myJson = await response.json();
    if (!isittime) return;
    html = '';
    let html1 = '', html2 = '', html3 = '';
    unit = myJson.WiFi.Hostname;
    unitNr = myJson.System['Unit Number'];
    sysInfo = myJson.System

    const sysPairs = [
        { label: 'Sysinfo of', value: unit },
        { label: 'Local Time', value: sysInfo['Local Time'] },
        { label: 'Uptime', value: minutesToDhm(sysInfo['Uptime']) },
        { label: 'Load', value: `${sysInfo['Load']}%` },
        sysInfo['Internal Temperature'] && {
            label: 'Temp',
            value: `${sysInfo['Internal Temperature']}°C`,
            style: `color: ${sysInfo['Internal Temperature'] > 35 ? 'red' : 'inherit'};`
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

    if (!myJson.Sensors.length) {
        html += '<div class="sensorset clickables"><div  class="sensors" style="font-weight:bold;">no tasks configured...</div>';
    }
    else {
        for (const sensor of myJson.Sensors) {
            //myJson.Sensors.forEach(sensor => {
            var bigSpan = "";
            sensorName = sensor.TaskName;
            if (sensorName.includes("?")) { //if a tile has a custom color
                const [, bgColor] = getComputedStyle(document.body).backgroundColor.match(/\d+/g);
                tBG = `background:#${sensorName.split("?")[1]}${bgColor === "0" ? "80" : ""}`;
                sensorName = sensorName.split("?")[0];
            } else {
                tBG = "";
            }
            //this is a bit to confusing when creating events for now
            var sensorName3 = changeNN(sensorName) //replace "_" and "." in device and "BigValue" names

            const htS1 = `sensorset clickables" style="${tBG}" onclick="playSound(3000), `;
            const htS2 = `<div id="${sensorName}" class="sensors" style="font-weight:bold;">${sensorName3}</div>`;
            exC = [87, 38, 41, 42].includes(sensor.TaskDeviceNumber); //all PluginNR in an array that need to be excluded 
            exC2 = !sensor.Type?.includes("Display")
            taskEnabled = sensor.TaskEnabled.toString();

            if (taskEnabled === "true" && !sensorName.includes("XX") && !exC && exC2 && !hasParams) {
                if (sensor.TaskValues) {
                    someoneEn = 1;
                    firstItem = true;
                    for (const item of sensor.TaskValues) {
                        wasUsed = false;
                        if (item.Value == "nan") { item.Value = 0; item.NrDecimals = 0; }
                        if (typeof item.Value == 'number') {
                            num2Value = item.Value.toFixed(item.NrDecimals);
                        }
                        else { num2Value = item.Value; }
                        iN = item.Name.toString();

                        let XI = iN.endsWith("XI") ? " noI " : "";
                        iN = XI ? iN.slice(0, -2) : iN;

                        //split name into name and unit of measurement 
                        itemN = iN.split("?")[0];
                        kindN = iN.split("?")[1];
                        if (!kindN) { kindN = ""; }
                        if (kindN == "H") { kindN = "%"; }
                        if (kindN == "T") {

                            num2Value = num2Value.toString();
                            num2Value = num2Value.replace('.', ':');
                            if (item.NrDecimals == 4) {
                                num2Value = num2Value.replace(/(.*)(.)(.)/, '$1.$2$3');
                            }
                            kindN = "";
                        }
                        //empty button State
                        bS = "";
                        //buttons = html; sensor tiles = html1; slider = html2; big values = html3
                        //switch---------------------------------------------------------
                        if (sensor.TaskDeviceNumber == 1) {
                            wasUsed = true;
                            if ((iN === "btnStateC" && item.Value < 2) || item.Value === 1) { bS = "on"; }
                            else if (item.Value === 2) { bS = "alert"; }

                            if (sensor.TaskDeviceGPIO1 && (iN === "State" || iN === "iState")) {
                                if (iN === "iState") { item.Value = item.Value == 1 ? 0 : 1; }
                                const uttonGP = `${sensorName}|${sensor.TaskDeviceGPIO1}`;
                                html += `<div class="btnTile ${bS} ${htS1} ${XI}buttonClick('${uttonGP}', '${item.Value}')">${htS2}`;

                            } else if (iN === "pState" && sensor.TaskDeviceGPIO1) {
                                const uttonGP = `${sensorName}?${sensor.TaskDeviceGPIO1}`;
                                html += `<div class="${bS} btnTile push sensorset" onpointerdown="playSound(3000), pushClick('${uttonGP}',1)" onpointerup="pushClick('${uttonGP}',0)"><div id="${sensorName}" class="sensors" style="font-weight:bold;">${sensorName}</div></div>`;

                            } else if (itemN.includes("btnState")) {
                                if (itemN === "ibtnState") { item.Value = item.Value == 1 ? 0 : 1; }
                                if (kindN) { sensorName = `${sensorName}|${kindN}`; }
                                html += `<div id="${sensorName}" class="btnTile ${XI} ${bS} ${htS1}buttonClick('${sensorName}', '${item.Value}')">${htS2}`;
                            } else {
                                wasUsed = false;
                            }
                        }
                        //dummy---------------------------------------------------------
                        if (sensor.TaskDeviceNumber == 33 && !(iN).includes("XX") && !(sensorName).includes("bigVal")) {
                            wasUsed = true;
                            //button coloring
                            if ((kindN === "C" && item.Value < 2) || item.Value === 1) { bS = "on"; }
                            else if (item.Value === 2) { bS = "alert"; }
                            //handle tile hiding of dummy tiles
                            if (["dButtons", "vInput", "pButtons"].some(v => sensor.TaskName.includes(v)) && item.Name.includes("noVal")) {
                                //novalAuto tiles are only shown on larger screens
                                //When isAuto is true, shouldAddTile checks if the window width is at least 450 pixels and if the cookie contains "Two=1".
                                //When isAuto is false, shouldAddTile is always true.
                                const isAuto = item.Name.includes("noValAuto");
                                const shouldAddTile = isAuto ? (window.innerWidth >= 450 && document.cookie.includes("Two=1")) : true;
                                if (shouldAddTile) {
                                    html += '<div class="sensorset btnTile"></div>';
                                }
                            }
                            //virtual buttons
                            else if ((sensorName).includes("dButtons")) {
                                if (item.Value > -1) {
                                    itemNB = itemN.split("&")[0];
                                    itemNB2 = changeNN(itemNB);
                                    const [nr, gpio] = itemN.split("&")[1]?.split("G") || [];
                                    if (gpio) {
                                        getRemoteGPIOState(sensor.TaskNumber, nr, gpio, myJson.System['Unit Number'], item.ValueNumber);
                                    }
                                    const clickHandler = nr === "A" ? `getNodes('${itemNB}')` : `buttonClick('${itemN}')`;
                                    html += `<div class="btnTile ${XI} ${bS} ${htS1} ${clickHandler}"><div id="${itemNB}" class="sensors ${nr === "A" ? `nodes` : ``}" style="font-weight:bold;">${itemNB2}</div></div>`;
                                }
                            }
                            //push buttons
                            else if (sensorName.includes("pButtons") && item.Value > -1) {
                                const [itemNB, itemNB2] = [itemN.split("&")[0], changeNN(itemN.split("&")[0])];
                                html += `<div class="${bS} btnTile push sensorset" onpointerdown="playSound(3000), pushClick('${itemN}',1)" onpointerup="pushClick('${itemN}',0)"><div id="${itemN}" class="sensors" style="font-weight:bold;">${itemNB2}</div></div>`;
                            }
                            //number input
                            else if (sensorName.includes("vInput")) {
                                itemN = itemN || "&nbsp;";
                                itemNB2 = changeNN(itemN);
                                html += `
                                        <div class="sensorset clickables">
                                            <div id="${itemN}" class="sensors" style="font-weight:bold;pointer-events:all" onclick="getInput(this.nextElementSibling.firstElementChild)">
                                                ${itemNB2}
                                            </div>
                                            <div class="valWrap">
                                                <input type="number" class="vInputs ${sensor.TaskNumber},${item.ValueNumber}" id="${itemN}" name="${sensorName}" placeholder="${num2Value}" onkeydown="getInput(this)" onclick="getInput(this,1)">
                                                <div class="kindInput">${kindN}</div>
                                            </div>
                                        </div>`;
                            }
                            //normal slider
                            else if ((sensorName).includes("vSlider")) {
                                let { slName, slMin, slMax, slStep, slKind } = parseSliderData(iN, "sl");
                                slName = changeNN(slName);
                                num2Value = Number(num2Value).toFixed((slStep.toString().split('.')[1] || '').length);
                                slName = slName === "noVal" ? "&nbsp;" : slName;
                                slKind = slKind === "H" ? "%" : slKind || "";
                                html2 += `<div class="sensorset ${XI}"><input type="range" min="${slMin}" max="${slMax}" step="${slStep}" value="${num2Value}" id="${iN}" class="slider sL ${sensor.TaskNumber},${item.ValueNumber}`;
                                //if (sensorName.includes("vSliderSw")) html2 += " swSlider";
                                html2 += sensorName.includes("nvSlider")
                                    ? ` noVal"><div class="sensors" style="align-items: flex-end;"><div style="font-weight:bold;">${slName}</div></div></div>`
                                    : `"><div class="sensors" style="align-items: flex-end;"><div style="font-weight:bold;">${slName}</div><div class="sliderAmount" style="text-align: right;">${num2Value}${slKind}</div></div></div>`;
                            }
                            //time slider
                            else if ((sensorName).includes("tSlider")) {
                                if (item.NrDecimals !== 4) iN = "For the Time slider the value must have<br>4 decimals!";
                                slT1 = item.Value.toFixed(4);
                                slT2 = (slT1 + "").split(".")[1];
                                slT1 = Math.floor(slT1);
                                hour1 = Math.floor(slT1 / 60);
                                minute1 = slT1 % 60;
                                const padded1 = minute1.toString().padStart(2, "0");
                                hour2 = Math.floor(slT2 / 60);
                                minute2 = slT2 % 60;
                                const padded2 = minute2.toString().padStart(2, "0");
                                iN = changeNN(iN);
                                htmlSlider1 = '<input class="slTS slTHU" type="range" min="0" max="1440" step="5" value="';
                                html2 += '<div id="' + iN + '" class="slTimeSetWrap ' + sensorName + ' ' + sensor.TaskNumber + ',' + item.ValueNumber + '" style="font-weight:bold;">' + iN + '<div class="slTimeText"> <span class="hAmount1">' + hour1 + '</span><span>:</span><span class="mAmount1">' + padded1 + '</span><span>-</span><span class="hAmount2">' + hour2 + '</span><span>:</span><span class="mAmount2">' + padded2 + '</span></div><div class="slTimeSet">' + htmlSlider1 + slT1 + '" id="' + iN + 'L">' + htmlSlider1 + slT2 + '" id="' + iN + 'R"></div></div>';

                            }
                            // thermostat slider
                            else if ((sensorName).includes("thermoSlider")) {
                                if (item.NrDecimals !== 3) iN = "For the Time slider the value must have<br>3 decimals!";
                                let { slName, slMin, slMax, slStep } = parseSliderData(iN, "th");
                                slName = changeNN(slName);
                                slT1 = item.Value.toFixed(3);
                                slT2 = (slT1 - Math.floor(slT1)) * 100;
                                slT2 = slT2.toFixed(1)
                                slT1 = (Math.floor(slT1) / 10).toFixed(1);
                                if (Math.floor(slT1) < 10) { slT1 = "&nbsp;" + slT1.toString() }
                                htmlSlider1 = 'type="range" min="' + slMin + '" max="' + slMax + '"  step="' + slStep + '" value="';
                                thermoSliderAddon = '<div class="noI" style="z-index: 2; position: absolute">' + slName + '</div>'
                                html2 += '<div id="' + slName + '" class="slTimeSetWrap ' + sensorName + ' ' + sensor.TaskNumber + ',' + item.ValueNumber + '" style="font-weight:bold;">' + thermoSliderAddon + '<div class="slTimeText"> <div class="even">&#9728;&#xFE0E;<span class="isT"> ' + slT1 + '</span>°C</div><div class="even">&#9737;&#xFE0E;<span class="setT"> ' + slT2 + '</span>°C</div></div><div class="slTimeSet"><input class="slTHU thermO ' + XI + '" ' + htmlSlider1 + slT2 + '" id="setpoint"><input class="slider noI thT" ' + htmlSlider1 + slT1 + '" id="' + slName + '"></div></div>';
                            }
                            //neopixel slider
                            else if (sensorName.includes("neoPixel")) {
                                // Determine the type of the range based on the value of iN
                                const rangeType = iN === 'h' ? '?H' : iN === 's' ? '?S' : iN === 'v' ? '?V' : '';

                                // Create the HTML element with a range input, depending on the type
                                html2 += `<input type="range" max="${iN === 'h' ? 359 : 100}" min="0" value="${num2Value}" id="${sensorName}${rangeType}" class="sL npSl ${sensor.TaskNumber},${item.ValueNumber} np${iN.toUpperCase()} noVal">`;
                            }
                            else { wasUsed = false; }
                        }
                        //big values---------------------------------------------------------
                        if ((sensorName).includes("bigVal")) {
                            wasUsed = true;
                            let htmlBig1 = '<div class="valuesBig" style="font-weight:bold;text-align:left;">';
                            if (firstItem == true) {
                                html3 += '<div class="bigNum">';
                                if (bigLength < sensor.TaskValues.length) { bigLength = sensor.TaskValues.length };
                            }
                            htmlBig2 = '<div style="' + tBG + '" class="bigNumWrap '
                            if (!(iN).includes("XX")) {
                                if (sensor.TaskValues.length === 3 && !(sensor.TaskValues).some(item => iN === 'XX')) { if (window.innerWidth < 450 || document.cookie.includes("Two=1")) { bigSpan = "bigSpan" } }
                                if ((sensorName).includes("bigValC")) {
                                    html3 += htmlBig2 + 'bigC ' + bigSpan + '">';
                                }
                                else {
                                    html3 += htmlBig2 + bigSpan + '">';
                                }
                                htS3 = htmlBig1 + iN + '</div><div id="'
                                if (["Clock", "Uhr", "Zeit", "Time"].some(v => (iN).includes(v))) { //(item.Name).toLowerCase().includes(v)
                                    html3 += htS3 + 'clock" class="valueBig">' + clockBig + '</div></div>';
                                }
                                else if ((iN).toLowerCase().includes("datum")) {
                                    html3 += htS3 + 'date" class="valueBig">' + dateD + '.' + dateM.toString() + '</div></div>';
                                }
                                else if ((iN).toLowerCase().includes("date")) {
                                    html3 += htS3 + 'date" class="valueBig">' + dateM + '-' + dateD.toString() + '</div></div>';
                                }
                                else if (["year", "jahr"].some(v => (iN).toLowerCase().includes(v))) {
                                    html3 += htS3 + 'year" class="valueBig">' + dateY + '</div></div>';
                                }
                                else if (iN.includes("noVal")) { html3 += htmlBig1 + '</div><div class="valueBig"></span></div></div>'; }
                                else {
                                    itemN = changeNN(itemN);
                                    html3 += htmlBig1 + itemN + '</div><div class="valueBig">' + num2Value + '<span style="background:none;padding-right: 1%;">' + kindN + '</span></div></div>';
                                }
                            }
                        }
                        // if all items with a specific declaration are processed do the rest---------------------------------------------------------
                        if (!wasUsed) {
                            //itemN = itemN.replace(/_/g, " ").replace(/\./g, "<br>"); //replace "_" and "." in value names of sensor tiles
                            if (sensor.TaskDeviceNumber == 43) {
                                if (firstItem) {
                                    if (item.Value === 1) { bS = "on"; } html += '<div class="btnTile ' + bS + ' sensorset clickables" onclick="playSound(3000); splitOn(' + sensor.TaskNumber + '); topF()""><div class="sensors" style="font-weight:bold;">' + sensorName + '</div><div class=even style="font-size: 20pt;">&#x23F2;&#xFE0E;</div></div></div>'
                                }
                            }
                            else {
                                if (firstItem == true) { html1 += '<div class="' + htS1 + 'buttonClick(\'' + sensorName + '\')">' + htS2; }
                                if (!item.Name.toString().includes("XX")) {
                                    //else if (iN.includes("noVal")) { html += '<div class="values therest"><div>&nbsp;</div><div></div></div>'; }
                                    if (sensor.TaskDeviceNumber == 81) { html1 += '<div class="cron"><div>' + itemN + '</div><div style="font-size: 10pt;">' + item.Value + '</div></div>'; }
                                    else { html1 += '<div class=row><div class=odd>' + itemN + '</div><div class=even>' + num2Value + ' ' + kindN + '</div></div>'; }
                                }
                            }
                        }
                        firstItem = false;

                    };
                    html += '</div>';
                    html1 += '</div>';
                    html3 += '</div>';
                    if (!document.cookie.includes("Sort=1")) {
                        html += html1;
                        html1 = '';
                    }
                }
                else { html1 += '<div  class="sensorset clickables" onclick="buttonClick(\'' + sensorName + '\')"><div class="sensors" style="font-weight:bold;">' + sensorName + '</div><div></div><div></div></div>'; someoneEn = 1; document.getElementById('sensorList').innerHTML = html; }
            }
        };
        if (!someoneEn && !hasParams) {
            html += '<div class="sensorset clickables" onclick="splitOn(); topF()"> <div class="sensors" style="font-weight:bold;">no tasks enabled or visible...</div>';
        }
    }
    html += html1;
    document.getElementById('sysInfo').innerHTML = syshtml;
    document.getElementById('sensorList').innerHTML = html;
    document.getElementById('sliderList').innerHTML = html2;
    document.getElementById('bigNumber').innerHTML = html3;
    //Things that only need to run once
    if (firstRun) {
        if (!document.cookie.includes("Snd=")) { mC("Snd") }
        //if (!document.cookie.includes("Two=")) { mC("Two") }
        if (window.navigator.userAgent.match(/iPhone/i)) {
            document.body.style.height = "101vh";
        }
        fJ = setInterval(fetchJson, 2000);
        unitNr1 = myJson.System['Unit Number'];
        initIP = 0;
        if (myJson.WiFi['IP Address'] == "(IP unset)") { initIP = "192.168.4.1" }
        else { initIP = myJson.WiFi['IP Address'] }
        nP2 = 'http://' + initIP + '/devices';
        nP = 'http://' + initIP + '/tools';
        getNodes();
        longPressS();
        longPressN();
        addEonce();
        firstRun = 0;
    }
    if (unitNr === unitNr1) { styleU = "&#8858;&#xFE0E;"; }
    else { styleU = ""; }
    if (!hasParams) {
        document.getElementById('unitId').innerHTML = styleU + unit + '<span class="numberUnit"> (' + myJson.WiFi.RSSI + ')</span>';
        document.getElementById('unitT').innerHTML = styleU + unit;
    }
    paramS();
    changeCss();
    resizeText();
    longPressB();
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
//      min max step for sliders
//##############################################################################################################

function parseSliderData(iN, SLtype) {
    let slName, slMin, slMax, slStep, slKind;

    // Check if the string contains exactly 3 occurrences of "?"
    if ((iN.match(/\?/g) || []).length >= 3) {

        [slName, slMin, slMax, slStep, slKind] = iN.split("?");

        // Check if the first character of slMin or slMax is "m" and replace it with "-"
        if (slMin.charAt(0) === "m") {
            slMin = "-" + slMin.slice(1);  // Replace "m" with "-" in slMin
        }

        if (slMax.charAt(0) === "m") {
            slMax = "-" + slMax.slice(1);  // Replace "m" with "-" in slMax
        }
    } else {
        slName = iN;
        // If the condition is not met, return default values
        if (SLtype === "th") {
            slMin = 5;
            slMax = 35;
            slStep = 0.5;
        } else {
            slMin = 0;
            slMax = 1024;
            slStep = 1;
        }
    }

    // Return the values as an object
    return { slName, slMin, slMax, slStep, slKind };
}

//##############################################################################################################
//      replace _ and .
//##############################################################################################################

function changeNN(nn) {
    return nn.replace(/_/g, " ").replace(/\./g, "<br>"); //replace "_" and "." in device and "BigValue" names
}

//##############################################################################################################
//      ADJUST THE STYLING
//##############################################################################################################
function changeCss() {
    let x = "auto ";
    let m = null;
    let coloumnSet, y, z;
    var numSl = document.querySelectorAll('input[type=range]').length;
    if (!numSl) { document.getElementById("allList").classList.add('allExtra'); }
    else { document.getElementById("allList").classList.remove('allExtra'); }
    var list3 = document.querySelectorAll(".bigNum");
    var sList = document.getElementById("sensorList");
    var numSet = sList.getElementsByClassName('sensorset').length;
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
    else if (bigLength == 1 || z < 2) {
        y = x;
        m = "important"
        if (list3.length) { for (let i = 0; i < list3.length; ++i) { list3[i].classList.add('bigNumOne'); } }
        coloumnSet = 1;
    }
    else {
        y = x + x;
        coloumnSet = 2;
    }
    widthLimit = coloumnSet * 150 + (coloumnSet * (window.innerHeight / 100));
    if (window.innerWidth < widthLimit || document.cookie.includes("Two=1")) {
        if (list3.length) { for (let i = 0; i < list3.length; ++i) { list3[i].style.cssText = "display: grid; grid-template-columns: auto auto;"; } }
        if (bigLength == 1 || (bigLength == 0 && numSet == 1)) {
            coloumnSet = 1
            y = x;
            m = "important"
        }
        else { coloumnSet = 2; y = x + x }
    };

    sList.style.setProperty('grid-template-columns', y, m);

    //calculate and add extra tiles
    if (numSet % coloumnSet != 0 && coloumnSet != 1) {
        calcTile = coloumnSet - (numSet - coloumnSet * Math.floor(numSet / coloumnSet));
        for (let i = 1; i <= calcTile; i++) {
            html += '<div class="sensorset"></div>'
        }
    }
    document.getElementById('sensorList').innerHTML = html;
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
    const slTName = slider.parentNode.parentNode;
    const sliderId = slider.id;
    const slClass2 = slTName.classList[2];
    const slClass1 = slTName.classList[1];
    const sliderValue = event.target.value;
    // thermoslider
    if (sliderId === "setpoint") {
        const isT = parseFloat(slider.closest(".slTimeSetWrap").querySelector(".isT").textContent);
        const setTvalue = (isT * 10) + (sliderValue / 100);
        const commandBase = `taskvalueset,${slClass2},${setTvalue}`;
        const eventBase = `event,${slTName.id}Event=${sliderValue * 10}`;

        if (unitNr === unitNr1) {
            getUrl(`${cmD}${commandBase}`);
            getUrl(`${cmD}${eventBase}`);
        } else {
            getUrl(`${cmD}SendTo,${nNr},"${commandBase}"`);
            getUrl(`${cmD}SendTo,${nNr},"${eventBase}"`);
        }
        // timeslider
    } else {
        const isLeft = sliderId === `${slTName.id}L`;
        const secVal = document.getElementById(isLeft ? `${slTName.id}R` : `${slTName.id}L`).value;
        const paddedSecVal = secVal.toString().padStart(4, "0");
        const combinedValue = isLeft
            ? `${sliderValue}.${paddedSecVal}`
            : `${secVal}.${sliderValue.toString().padStart(4, "0")}`;
        const commandBase = `taskvalueset,${slClass2},${combinedValue}`;
        const eventBase = `event,${slClass1}Event=${slClass2.split(",")[1]}`;

        if (unitNr === unitNr1) {
            getUrl(`${cmD}"${commandBase}"`);
            getUrl(`${cmD}"${eventBase}"`);
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
function getInput(ele, initalCLick) {
    console.log("getInput", ele, initalCLick);
    if (event.type === 'click') {
        isittime = 0;
        iIV = setTimeout(blurInput, 8000);
        ele.addEventListener('blur', (event) => {
            clearTimeout(iIV)
            isittime = 1;
            setTimeout(fetchJson, 400);
        });
    }
    if (ele.value.length > 12) { ele.value = ele.value.slice(0, 12); }
    if (event.key === 'Enter' || event.type === 'click' && !initalCLick) {
        isittime = 1;
        if (ele.value) {
            playSound(4000);
            const taskValueSetCmd = `taskvalueset,${ele.classList[1]},${ele.value}`;
            if (unitNr === unitNr1) {
                getUrl(taskValueSetCmd);
            } else {
                getUrl(`${cmD}SendTo,${nNr},"${taskValueSetCmd}"`);
            }
            buttonClick(ele.id);
        }
        else { setTimeout(fetchJson, 400); }
        clearTimeout(iIV);
    }
    else if (event.key === 'Escape') { document.getElementById(ele.id).value = ""; }
    else { clearTimeout(iIV); iIV = setTimeout(blurInput, 5000); }
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
    nIV = setInterval(getNodes, 2000);
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
async function getNodes(sensorName, allNodes) {
    let html4 = '';
    let i = -1;
    myJson.nodes.forEach(node => {
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
    const node = myJson.nodes[event];
    if (node) {
        nNr = node.nr;
        nN = node.name;
        const baseUrl = `http://${node.ip}`;
        nP = `${baseUrl}/tools`;
        nP2 = `${baseUrl}/devices`;
        //console.log("......nP2:"+nP2);
        jsonPath = `${baseUrl}/json`;
        window.history.replaceState(null, null, `?unit=${nNr}`);
        fetchJson();
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
        receiveNote("B");
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
    let controller = new AbortController();
    setTimeout(() => controller.abort(), 2000);
    try {
        response = await fetch(url, {
            signal: controller.signal
        });
    } catch {
        receiveNote("R");
    }
    return response;
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
        G: "rgb(82, 255, 195)",
        B: "rgb(236, 255, 89)",
        R: "#e60073",
        N: "none",
    };

    const createBoxShadow = (color) =>
        Array.from({ length: 7 }, (_, i) => `0 0 ${10 * (i + 1)}px ${color}`).join(", ");

    const receiveNoteEl = document.getElementById("unitId");
    receiveNoteEl.style.textShadow = S === 0 || S === "N" ? colors.N : createBoxShadow(colors[S]);
    if (S) setTimeout(() => receiveNote(0), 300);
}
!function (e, t) { "use strict"; let n = null; const o = 10, a = 10; let i = { x: 0, y: 0 }; const s = "ontouchstart" in e || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0, c = "PointerEvent" in e || e.navigator && "msPointerEnabled" in e.navigator ? { down: "pointerdown", up: "pointerup", move: "pointermove", leave: "pointerleave" } : s ? { down: "touchstart", up: "touchend", move: "touchmove", leave: "touchleave" } : { down: "mousedown", up: "mouseup", move: "mousemove", leave: "mouseleave" }; "function" != typeof e.CustomEvent && (e.CustomEvent = function (e, n = { bubbles: !1, cancelable: !1, detail: void 0 }) { const o = t.createEvent("CustomEvent"); return o.initCustomEvent(e, n.bubbles, n.cancelable, n.detail), o }, e.CustomEvent.prototype = e.Event.prototype); const u = e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame || (t => e.setTimeout(t, 1e3 / 60)); function r(e) { v(); const n = l(e), o = new CustomEvent("long-press", { bubbles: !0, cancelable: !0, detail: (a = n, { clientX: a.clientX, clientY: a.clientY, offsetX: a.offsetX, offsetY: a.offsetY, pageX: a.pageX, pageY: a.pageY, screenX: a.screenX, screenY: a.screenY }) }); var a; this.dispatchEvent(o) || t.addEventListener("click", d, !0) } function l(e) { return e.changedTouches ? e.changedTouches[0] : e } function m(o) { v(); const a = o.target, i = parseInt(function (e, n, o) { for (; e && e !== t.documentElement;) { const t = e.getAttribute(n); if (t) return t; e = e.parentNode } return o }(a, "data-long-press-delay", "600"), 10); n = function (t, n) { if (!u) return e.setTimeout(t, n); const o = (new Date).getTime(), a = {}, i = () => { (new Date).getTime() - o >= n ? t() : a.value = u(i) }; return a.value = u(i), a }(r.bind(a, o), i) } function v() { var t; (t = n) && (e.cancelAnimationFrame || e.clearTimeout)(t.value), n = null } function d(e) { t.removeEventListener("click", d, !0), e.preventDefault(), e.stopImmediatePropagation() } t.addEventListener(c.down, (function (e) { const t = l(e); i = { x: t.clientX, y: t.clientY }, m(e) }), !0), t.addEventListener(c.move, (function (e) { const t = l(e); (Math.abs(i.x - t.clientX) > o || Math.abs(i.y - t.clientY) > a) && v() }), !0), t.addEventListener(c.up, v, !0), t.addEventListener(c.leave, v, !0), t.addEventListener("wheel", v, !0), t.addEventListener("scroll", v, !0), t.addEventListener("contextmenu", v, !0) }(window, document);