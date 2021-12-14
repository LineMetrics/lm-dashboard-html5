document.addEventListener("DOMContentLoaded", function () {
    fetchAccessToken()
        .then(accessToken => {
            fetchLatestCo2Value(accessToken).then(setCo2);
            fetchLatestTemperature(accessToken).then(setTemperature);
            fetchLatestHumidity(accessToken).then(setHumidity);
            fetchLatestLight(accessToken).then(setLight);
        });
});

function parseUrlSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);

    let apiId = null;
    let apiSecret = null;
    let objectId = null;
    let measurementPointAlias = null;

    for (let p of urlParams) {
        const parameterName = p[0];
        const parameterValue = p[1];
        switch (parameterName) {
            case 'ai':
                apiId = parameterValue;
                break;
            case 'as':
                apiSecret = parameterValue;
                break;
            case 'oi':
                objectId = parameterValue;
                break;
            case 'mpa':
                measurementPointAlias = parameterValue;
        }
    }

    return {
        apiId,
        apiSecret,
        objectId,
        measurementPointAlias
    };
}

function fetchAccessToken() {
    const urlParams = parseUrlSearchParams();

    const apiId = urlParams.apiId;
    const apiSecret = urlParams.apiSecret;
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

function fetchLatestCo2Value(accessToken) {
    return fetchLatestValue(accessToken, 'co_2');
}

function fetchLatestTemperature(accessToken) {
    return fetchLatestValue(accessToken, 'temperatur');
}

function fetchLatestHumidity(accessToken) {
    return fetchLatestValue(accessToken, 'humidity');
}

function fetchLatestLight(accessToken) {
    return fetchLatestValue(accessToken, 'light');
}

function fetchLatestValue(accessToken, alias) {
    const urlParams = parseUrlSearchParams();
    const url = `https://lm3api.linemetrics.com/v2/data/${urlParams.objectId}/${alias}?function=last_value`

    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => response.json())
        .then(json => json[0].val)
}

function setCo2(value) {
    document.getElementById('co2').innerText = "CO2: " + value + " ppm";
}

function setTemperature(value) {
    document.getElementById('temperature').innerText = "Temperature: " + value + " °C";
}

function setHumidity(value) {
    document.getElementById('humidity').innerText = "Humidity: " + value +  " %";
}

function setLight(value) {
    document.getElementById('light').innerText = "Light: " + value + " lux";
}
