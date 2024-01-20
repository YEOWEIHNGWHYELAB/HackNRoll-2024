function getCurrentTabURL() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            // tabs[0] contains information about the active tab
            const currentTab = tabs[0];

            // Get the URL of the active tab
            const currentUrl = currentTab.url;

            // Parse domain name
            const parsedUrl = new URL(currentUrl);

            resolve(parsedUrl.hostname);
        });
    });
}

/**
 * Make a POST request to store new credentials onto backend database
 */
function makePostAPICall(bearerToken, currentDomain, emailUsrValue, pwdValue) {
    // Replace 'your_api_endpoint' with the actual API endpoint
    var apiUrl = 'http://localhost:3600/cred/getcred';

    // Replace 'your_request_body' with the actual request body (JSON format, for example)
    var requestBody = {
        label: currentDomain,
        email: emailUsrValue,
        password: pwdValue
    };

    // Make a POST request using the fetch API
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Adjust the content type based on your API requirements
            'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify(requestBody) // Convert the request body to JSON
    })
        .then(response => {
            // Check if the response is successful (status code 200-299)
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            alert(data.message);

            // Parse the JSON response
            return response.json();
        })
        .catch(error => {
            // Handle errors
            console.error('Error during API call:', error);
        });
}


window.onload = () => {
    chrome.storage.local.get(['apiTok'], (res) => {
        if (res.apiTok) document.querySelector("#apitok").value = res.apiTok;
    });
}

document.querySelector("#btnLoadApiTok").addEventListener("click", function () {
    chrome.storage.local.get(['apiTok'], (res) => {
        if (res.apiTok) document.querySelector("#apitok").value = res.apiTok;
    });
});


document.querySelector("#btnSaveApiTok").addEventListener("click", function () {
    const apiTok = document.querySelector("#apitok").value;
    chrome.storage.local.set({ apiTok }, () => { alert(`Token saved as ${apiTok}`) });
});


document.getElementById("fillForm").addEventListener("click", function () {
    // Get value from input field
    var intValue = document.getElementById("apivalue").value;

    // Run a script in active tab
    chrome.tabs.executeScript(
        {
            // send the value to be used by our script
            code: `var value = "${intValue}"; var functionToCall = "injectorMain";`,
        },

        function () {
            // run the injector script to inject value to the current form
            chrome.tabs.executeScript({
                file: "injector.js",
            });
        }
    );
});

document.getElementById("storeForm").addEventListener("click", async function () {
    try {
        const hostname = await getCurrentTabURL();

        var emailUsrValue = document.getElementById("emailusr").value;
        var pwdValue = document.getElementById("pwd").value;
        var bearerToken = document.getElementById("apitok").value;

        makePostAPICall(bearerToken, hostname, emailUsrValue, pwdValue);
    } catch (error) {
        console.error(error);
    }
});
