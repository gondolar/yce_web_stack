function updateComboBox(key, key_text) {
    let comboBox    = document.getElementById(key);
    let inputField  = document.getElementById(key_text);

    if (comboBox.selectedIndex) {
        inputField.style.display = 'none';
        comboBox.style.display = 'block';
    }
    else {
        inputField.style.display = 'block';
        comboBox.style.display = 'none';
        inputField.focus();
    }
}

function updateCustomSSID(key_text, custom_key) {
    let optionSelected = document.getElementById(custom_key);
    let inputField  = document.getElementById(key_text);
    optionSelected.value = inputField.value;
    optionSelected.textContent = inputField.value;
}

function ipFromValue(value)  {
    let ip  = [0,0,0,0];

    if (Array.isArray(value) && value.length == 4)
        ip = value;
    else if (typeof value == 'string') {
        ip = value.split('.');
        for (let i = 0; i < Math.min(ip.length, 4); ++i)
            ip[i] = parseInt(value[i]);
    }
    return ip;
}

function getInputFromBool   (key, value, editable) { return `<input ${editable ? "" : "disabled "}type="checkbox" name="${key}" ${value ? " checked" : ""} />`; }
function getInputFromNumber (key, value, editable) { return `<input ${editable ? "" : "disabled "}style="width:100%;" type="number" ${key.includes("uart") ? 'max="254" min="-1" ' : ''}name="${key}" value="${value}" />`; }
function getInputFromString (key, value, editable) { return `<input ${editable ? "" : "disabled "}style="width:100%;" type="${key.includes("password") ? "password" : "input"}" name="${key}" value="${value}" />`; }
function getInputFromIP     (key, value, editable) {
    let ip      = ipFromValue(value)
    let fields  = "";
    for (let i = 0; i < 4; i++) {
        fields += `<input ${editable ? "" : "disabled "}style="width:50px;" type="number" name="${key}_${i}" value="${ip[i]}" min="0" max="255" maxlength="3" />`;
    }
    return fields;
}
function getInputForSSID(key, value, editable) {
    let fields = ``;
    fields += `<select ${editable ? "" : "disabled "}name="${key}" id="${key}" onchange="updateComboBox('${key}', '${key}_text')" onblur="updateCustomSSID('${key}_text', 'custom_${key}');let comboBox=document.getElementById('${key}');if(comboBox.selectedIndex){let inputField=document.getElementById('${key}_text');inputField.style.display='none';comboBox.style.display='block';}" onchange="updateCustomSSID('${key}_text', 'custom_${key}'); ">`;
    fields += `<option id="custom_${key}" value="${value}" >Custom SSID...</option>`;
    fields += `<option selected value="${value}" >${value}</option>`;
    fields += `</select>`;
    fields += `<input type="text" id="${key}_text" value="${value}" style="display: none;" placeholder="Enter a custom SSID">`;


    fetchAndGenerateOptions("ssid_seen");
    return fields;
}

function isIPAddress(key, ip_key_names) {
    for (const ipKey of ip_key_names) {
        if (key === ipKey)
            return true;
    }
    return false;
}

function getInputFromField(key, value, editable, ip_key_names) {
    return  isIPAddress(key, ip_key_names)  ? getInputFromIP    (key, value, editable)
        //:   ("sta_ssid" == key)             ? getInputForSSID   (key, value, editable)
        :   (typeof value === 'boolean')    ? getInputFromBool  (key, value, editable)
        :   (typeof value === 'number')     ? getInputFromNumber(key, value, editable)
        :   getInputFromString(key, value, editable)
        ;
}

function filterWord(fieldName, token, labelText) {
    if(fieldName == token)
        return fieldName.replace(token, labelText);

    let result        = fieldName.replace('_' + token + '_', '_' + labelText + '_');
    let checktoken    = token + '_';
    let checklabel    = labelText + '_';
    while(result.startsWith(checktoken))
        result = result.replace(checktoken, checklabel);

    checktoken    = '_' + token;
    checklabel    = '_' + labelText;
    while(result.endsWith(checktoken))
        result = result.replace(checktoken, checklabel);

    return result;
}

function applyFilter(fieldName, wordsToFilter) {
    for(let token in wordsToFilter) {
       if (wordsToFilter.hasOwnProperty(token)) {
            fieldName = filterWord(fieldName, token, wordsToFilter[token])
       }
    }
    while(fieldName.includes('_'))
        fieldName = fieldName.replace('_', ' ');

    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
}

const words_to_filter =
    { i2c_address   : 'I2C address of'
    , power_en      : 'Power Enable'
    , sd_card       : 'SD Card Reader'
    , comms         : 'Comms Shield'
    , mainboard     : 'Mainboard'
	, sensors       : 'Sensors'
	, switches      : 'Switches'    
	, display       : 'Display'
    , external      : "- external"
    , battery       : 'Battery'
    , gateway       : 'Gateway'
    , iridium       : 'Iridium'
    , lorawan       : 'LoRaWAN'
    , netmask       : 'Netmask'
    , section       : 'Enable section -'
    , xca           : 'XCA --'
    , swarm         : 'Swarm'
    , ccsds         : 'CCSDS'
    , dhcp          : 'DHCP'
    , http          : 'HTTP'
    , lora          : 'LoRa'
    , ssid          : 'SSID'
    , uart          : 'UART'
    , vbat          : 'vBat'
    , wifi          : 'WiFi'
    , adc           : 'ADC'
    , ads           : 'ADS'
    , ble           : 'BLE'
    , cpu           : 'CPU'
    , dns           : 'DNS'
    , gps           : 'GPS'
    , i2c           : 'I2C'
    , imu           : 'IMU'
    , iot           : 'IoT'
    , isr           : 'ISR'
    , ntp           : 'NTP'
    , sta           : 'STA'
    , udp           : 'UDP'
    , ap            : 'AP'
    , id            : 'ID'
    , ip            : 'IP'
    , rx            : 'RX'
    , tx            : 'TX'
    };

function settingsForm(doc, editable, ip_key_names) {
    let right = false;

    console.log(doc);
    finalString = "";
    const documentRoot = doc;
    for (const key in documentRoot) {
        if (false == documentRoot.hasOwnProperty(key)) 
            continue;
        const value = documentRoot[key];
        fieldName = applyFilter(key, words_to_filter);

        if (!right) {
            finalString += `<tr style="height:24px;">`;
        }

        finalString += `<td style="white-space: nowrap;">${fieldName}</td>`;
        finalString += `<td style="width: 50%">`;
        finalString += getInputFromField(key, value, editable, ip_key_names);
        finalString += "</td>";

        if (right) {
            finalString += "</tr>";
        } else {
            finalString += '<td style="width:10px;"></td>';
        }

        right = !right;
    }

    if (right) {
        finalString += "<td></td></tr>";
    }
    finalString += `<!-- tr style="height:24px;">`;
    finalString += `<td><textarea id="raw_json" name="multilineInput" rows="4" cols="50">${JSON.stringify(doc)}</textarea></td><td></td><td></td>`;
    finalString += `</tr -->`;
    if (editable) {
        finalString += `<tr style="height:24px;"><td colspan=\"3\"><input type=submit value=\"Save settings\"></input></td></tr>`;
    }
    finalString += "<tr><td colspan=\"3\"></td></tr>";
    return finalString;
}

function fetchAndGenerate(address, editable, ip_key_names) {
    fetch("/json/" + address)
        .then(function (response) {
            if (response.ok) {
                return response.json(); // 
                //let responseText = response.text(); // or response.json() for problems
                //console.log(responseText);
                //return JSON.parse(responseText); // 
            }
            throw new Error('Network response was not ok:' + response.status + response.statusText);
        })
        .then(function (data) { document.getElementById("settings_table").innerHTML = settingsForm(data, editable, ip_key_names); })
        .catch(function (error) { console.error('There was a problem with the fetch operation:', error); });
}

function initPage(address, editable, ip_key_names) {
    fetchAndGenerate(address, editable, ip_key_names);
}
