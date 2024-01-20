importScripts('async-actions.js');
const decoder = new TextDecoder('utf-8');


chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (details.method === "POST") {
        if (details.requestBody.formData) {
            const formData = details.requestBody.formData;
            console.log(formData);
            let username = formData.username ?? formData.user ?? formData.name ?? formData.login ?? '';
            let password = formData.password ?? formData.pass ?? formData.passwd ?? '';
            let email = formData.email ?? '';

            if (username instanceof Array) username = username[0];
            if (password instanceof Array) password = password[0];

            console.log(username, password, email);
        } else {
            console.log(details.requestBody);
            if (!details.requestBody.raw) return;
            const json = decoder.decode(details.requestBody.raw[0].bytes)
            console.log("Payload: ");
            console.log(json);
        }
    }
}, { urls: ["<all_urls>"] }, ["requestBody"]);

chrome.commands.onCommand.addListener((command, tab) => {
    if (command === 'autofill-pw-man') {
        const url = new URL(tab.url);
        const domain = `${url.protocol}//${url.hostname}`;
        loadCredFields(domain, tab.id);
    }
});

function populateCredFields(creds) {
    if (!creds) return;

    const usernameSelectors = [
        "input[name='username' i]", "input[name='login' i]", "#username",
        "input[name='user' i]"
    ]
    let userField = document.querySelector(usernameSelectors.join(", "));
    if (userField !== null) userField.value = creds.username;

    const pwField = document.querySelector("input[type='password' i]");
    if (pwField !== null) pwField.value = creds.password

    const emailSelectors = [
        "input[type=email]", "input[name='email' i]"
    ]
    const emailField = document.querySelector(emailSelectors.join(", "));
    if (emailField !== null) emailField.value = creds.email
}

async function loadCredFields(domain, tabId) {
    const token = await getStoredValue('apiTok');
    const creds = await getCredentials(token, domain);
    chrome.scripting.executeScript({
        target: { tabId },
        function: populateCredFields,
        args: [creds]
    });
}