const config = {
    apiCredentials: {
        id: "xxx",
        secret: "xxx"
    },

    grid: {columns: 2, rows: 3,},

    lmIds: ["xxx", "xxx"],
    minutesToBeOutdated: 4,

    inputToDisplay: "temperature",
    valueSuffix: " °C",
    validValueRange: [18, 25]
}

function fetchAccessToken(apiCredentials) {
    const apiId = apiCredentials.id;
    const apiSecret = apiCredentials.secret;

    const url = 'https://lm3api.linemetrics.com/oauth/access_token';

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: apiId,
            client_secret: apiSecret,
            grant_type: "client_credentials"
        })
    })
        .then(response => response.json())
        .then(json => json.access_token);
}

function fetchDeviceBy(accessToken, lmId, inputToDisplay) {
    const url = 'https://lm3api.linemetrics.com/v2/devices?lmId=' + lmId;
    return fetch(url,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        }
    )
        .then(response => response.json())
        .then(json => ({
            lmId: lmId,
            title: titleFrom(json),
            inputToFetch: inputIdFor(json, inputToDisplay)
        }));
}

function fetchLastValueBy(accessToken, device) {
    const url = `https://lm3api.linemetrics.com/v2/device-inputs/${device.inputToFetch}/lastvalue`;
    return fetch(url,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        }
    )
        .then(response => response.json())
        .then(json => ({
            ...device,
            lastValue: json['data'][0]['val'],
            lastSent: json['data'][0]['ts']
        }));
}

function titleFrom(deviceJson) {
    return deviceJson['data'][0]['attributes']['title'];
}

function inputIdFor(deviceJson, inputToDisplay) {
    const input = deviceJson['included'].filter(input => {
        return input['attributes']['alias'] === inputToDisplay
    });
    return input[0]['id']
}

function mpContainer() {
    return document.getElementById("mp-container");
}

function valueFor(accessToken, lmId, inputToDisplay) {
    return fetchDeviceBy(accessToken, lmId, inputToDisplay)
        .then(device => fetchLastValueBy(accessToken, device));
}

function valueInRange(value, validRange) {
    return value > validRange[0] && value < validRange[1]
}

function valueOutOfRange(value, validRange) {
    return !valueInRange(value, validRange);
}

function diffInMinutesToNow(utcTs) {
    const lastSent = new Date(utcTs)
    const diffMs = Date.now() - lastSent
    return Math.round(((diffMs % 86400000) % 3600000) / 60000);
}

function outdated(device, minutesToBeOutdated) {
    return diffInMinutesToNow(device['lastSent']) > minutesToBeOutdated
}

function resetElement(element) {
    element.classList.remove("alarm");
    element.classList.remove("outdated");
    element.classList.add("empty");
}

function lastSentDateString(device) {
    const lastValueDate = new Date(device["lastSent"])
    return lastValueDate.toLocaleTimeString();
}

function setTitleAndLastValue(device, minutesToBeOutdated, valueSuffix, validValueRange) {
    const element = mpContainer().querySelector(`[data-lmid="${device['lmId']}"]`)
    resetElement(element);

    if (outdated(device, minutesToBeOutdated)) {
        element.classList.add("outdated");
    } else if (valueOutOfRange(device["lastValue"], validValueRange)) {
        element.classList.add("alarm");
    }

    element.setAttribute("title", "Letzter Wert: " + lastSentDateString(device));

    element.querySelector(".title").textContent = device["title"];
    element.querySelector(".last-value").textContent = `${device["lastValue"]}${valueSuffix}`;
    element.classList.remove("empty");
}

function createMpElements(numberOfColumns, numberOfRows, lmIds) {
    const elems = [...Array(numberOfRows).keys()]
        .map(x => x + 1)
        .map(row => {
            return [...Array(numberOfColumns).keys()]
                .map(y => y + 1)
                .map(col => {
                    const mpBoxElem = document.createElement("div")
                    mpBoxElem.classList.add("mp-box");
                    mpBoxElem.classList.add("empty");
                    mpBoxElem.style.gridArea = `${row} / ${col} / auto / auto`;

                    const titleElem = document.createElement("div");
                    titleElem.classList.add("title")

                    const lastValueElem = document.createElement("div");
                    lastValueElem.classList.add("last-value")

                    mpBoxElem.appendChild(titleElem)
                    mpBoxElem.appendChild(lastValueElem)

                    return mpBoxElem;
                });
        }).flat();

    lmIds.forEach((val, idx) => {
        elems[idx].setAttribute('data-lmid', val);
        elems[idx].classList.add("lm-id")
    })

    const mpContainer = document.getElementById("mp-container");
    elems.forEach(elem => mpContainer.appendChild(elem))
}

function fetchValuesFor(accessToken, lmIds, inputToDisplay) {
    return lmIds.map(lmId => valueFor(accessToken, lmId, inputToDisplay));
}

function loadAndSetLastValues(apiCredentials, lmIds, minutesToBeOutdated, inputToDisplay, valueSuffix, validValueRange) {
    fetchAccessToken(apiCredentials)
        .then(accessToken => {
            fetchValuesFor(accessToken, lmIds, inputToDisplay)
                .forEach(valuePromise => valuePromise.then(value => setTitleAndLastValue(value, minutesToBeOutdated, valueSuffix, validValueRange)));
        });
}

document.addEventListener("DOMContentLoaded", function () {
    createMpElements(config.grid.columns, config.grid.rows, config.lmIds);
    loadAndSetLastValues(config.apiCredentials, config.lmIds, config.minutesToBeOutdated, config.inputToDisplay, config.valueSuffix, config.validValueRange);
});
