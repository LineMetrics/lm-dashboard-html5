document.addEventListener("DOMContentLoaded", function () {
    fetchAccessToken()
        .then(fetchLatestCo2Value)
        .then(setActualValue);
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
    const urlParams = parseUrlSearchParams();
    const url = `https://lm3api.linemetrics.com/v2/data/${urlParams.objectId}/${urlParams.measurementPointAlias}?function=last_value`

    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => response.json())
        .then(json => json[0].val)
}

function setActualValue(actualValue) {
    document.getElementById('actual-value').innerText = actualValue;
    document.getElementById('co2meter').value = actualValue;

    if (co2ThresholdReached(actualValue)) {
        setThumbsDown();
        setGuidance('Bitte lüften!');
    } else {
        setThumbsUp();
        clearGuidance();
    }
}

function co2ThresholdReached(co2Value) {
    const threshold = 800;
    return parseFloat(co2Value) > threshold;
}

function clearGuidance() {
    setGuidance('');
}
function setGuidance(innerText) {
    document.getElementById('guidance-text').innerText = innerText;
}

function setThumbsDown() {
    // const emojiThumbsDown = "&#128078;";
    const emojiThumbsDown = "&#129314;";
    setCurrentSmiley(emojiThumbsDown);
}

function setThumbsUp() {
    // const emojiThumbsUp = "&#128077;";
    const emojiThumbsUp = "&#128578;";
    setCurrentSmiley(emojiThumbsUp);
}

function setCurrentSmiley(innerHtml) {
    document.getElementById('current-similey').innerHTML = innerHtml;
}
