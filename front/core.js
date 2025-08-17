function fetchAndGenerateOptions(address, parent) {
    fetch("/api/" + address)
        .then(function (response) {
            if (response.ok)
                return response.json(); // or response.text() for plain text
            throw new Error('Network response was not ok:' + response.status + response.statusText);
        })
        .then(function (data) {
            let options = '';
            for (network of data) {
                options += `<option style="width:50px;" value="${network.ssid}" >${network.ssid}</option>`;
            }
            parent.innerHTML += options;
        })
        .catch(function (error) { console.error('There was a problem with the fetch operation:', error); });
}

function reloadStatus(tableId) {
    const table = document.getElementById(tableId);
    if (table) {
        let wifi_status = table.getElementById("wifi_status");
        if(wifi_status) {

        }
        let ssid_dropdn = table.getElementById("ssid_dropdn");
        if(ssid_dropdn) {
            fetchAndGenerateOptions(document.getElementById(selectId));
        }
    }
}

function reloadInlineFrame(frameId) {
    const iframe = document.getElementById(frameId);
    if (iframe) {
        iframe.src = iframe.src; // Reloads the iframe by setting its source again
    }
}
