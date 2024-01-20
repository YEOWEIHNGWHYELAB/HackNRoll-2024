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


/**
 * Gets credentials for the current page.
 * @param {string} bearerToken 
 * @param {string} domain 
 */
async function getCredentials(bearerToken, domain) {
    return new Promise((res) => setTimeout(() => {
        res({
            username: 'testuser',
            password: 'testpw',
            email: 'kappa@mail.com'
        })
    }, 100));
}


async function getStoredValue(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
}