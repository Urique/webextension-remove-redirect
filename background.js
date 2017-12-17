/* global psl */
/* global url */
const MODE = "mode";
const MODE_OFF = "off";
const MODE_BLACKLIST = "blacklist";

const BLACKLIST = "blacklist";
const WHITELIST = "whitelist";

const SKIP_REDIRECTS_TO_SAME_DOMAIN = "skipRedirectsToSameDomain";

const ICON           = "icon.svg";
const ICON_OFF       = "icon-off.svg";
const ICON_BLACKLIST = "icon-blacklist.svg";
const ICON_WHITELIST = "icon-whitelist.svg";

const GLOBAL_BLACKLIST = [
    "/abp",
    "/account",
    "/adfs",
    "/auth",
    "/cookie",
    "/download",
    "/login",
    "/logoff",
    "/logon",
    "/logout",
    "/oauth",
    "/preferences",
    "/profile",
    "/register",
    "/saml",
    "/signin",
    "/signoff",
    "/signon",
    "/signout",
    "/signup",
    "/sso",
    "/subscribe",
    "/verification",
];

let currentMode = undefined;
let blacklist = [];
let whitelist = [];

let skipRedirectsToSameDomain = false;

browser.storage.local.get([
    MODE,
    BLACKLIST,
    WHITELIST,
    SKIP_REDIRECTS_TO_SAME_DOMAIN,
])
    .then(
        (result) => {
            if (result[BLACKLIST] === undefined) {
                browser.storage.local.set({[BLACKLIST]: GLOBAL_BLACKLIST});
            } else {
                updateBlacklist(result[BLACKLIST]);
            }

            if (result[WHITELIST] === undefined) {
                browser.storage.local.set({[WHITELIST]: []});
            } else {
                updateWhitelist(result[WHITELIST]);
            }

            if (result[MODE] === undefined) {
                browser.storage.local.set({[MODE]: MODE_BLACKLIST});
            } else if (result[MODE] === MODE_OFF) {
                disableSkipping();
            } else {
                enableSkipping(result[MODE]);
            }

            if (result[SKIP_REDIRECTS_TO_SAME_DOMAIN] === undefined) {
                browser.storage.local.set({[SKIP_REDIRECTS_TO_SAME_DOMAIN]: false});
            } else {
                skipRedirectsToSameDomain = result[SKIP_REDIRECTS_TO_SAME_DOMAIN];
            }

        }
    );

browser.storage.onChanged.addListener(
    (changes) => {
        if (changes[BLACKLIST]) {
            updateBlacklist(changes[BLACKLIST].newValue);
        }

        if (changes[WHITELIST]) {
            updateWhitelist(changes[WHITELIST].newValue);
        }

        if (changes[MODE]) {
            if (changes[MODE].newValue === MODE_OFF) {
                disableSkipping();
            } else {
                enableSkipping(changes[MODE].newValue);
            }
        }

        if (changes[SKIP_REDIRECTS_TO_SAME_DOMAIN]) {
            skipRedirectsToSameDomain = changes[SKIP_REDIRECTS_TO_SAME_DOMAIN].newValue;
        }

    }
);

function updateBlacklist(newBlacklist) {
    blacklist = newBlacklist.filter(Boolean);
}

function updateWhitelist(newWhitelist) {
    whitelist = newWhitelist.filter(Boolean);
}

function enableSkipping(mode) {
    browser.webRequest.onBeforeRequest.removeListener(maybeRedirect);

    currentMode = mode;
    if (mode === MODE_BLACKLIST) {
        browser.webRequest.onBeforeRequest.addListener(
            maybeRedirect,
            {urls: ["<all_urls>"], types: ["main_frame"]},
            ["blocking"]
        );
        browser.browserAction.setIcon({path: ICON_BLACKLIST});
    } else {
        if (whitelist.length > 0) {
            browser.webRequest.onBeforeRequest.addListener(
                maybeRedirect,
                {urls: whitelist, types: ["main_frame"]},
                ["blocking"]
            );
        }

        browser.browserAction.setIcon({path: ICON_WHITELIST});
    }

    browser.browserAction.setBadgeBackgroundColor({color: "red"});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("browserActionLabelOn")});
}

function disableSkipping() {
    browser.webRequest.onBeforeRequest.removeListener(maybeRedirect);

    browser.browserAction.setIcon({path: ICON_OFF});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("browserActionLabelOff")});
}

function maybeRedirect(requestDetails) {
    if (requestDetails.tabId === -1 || requestDetails.method === "POST") {
        return;
    }

    let exceptions = [];
    if (currentMode === MODE_BLACKLIST) {
        exceptions = blacklist;
    }

    const redirectTarget = url.getRedirectTarget(requestDetails.url, exceptions);
    if (redirectTarget === requestDetails.url) {
        return;
    }

    if (currentMode === MODE_BLACKLIST && !skipRedirectsToSameDomain) {
        let sourceHostname = getHostname(requestDetails.url);
        let targetHostname = getHostname(redirectTarget);
        let sourceDomain = psl.getDomain(sourceHostname);
        let targetDomain = psl.getDomain(targetHostname);
        if (sourceDomain === targetDomain) {
            return;
        }
    }

    return {
        redirectUrl: redirectTarget,
    };
}


function getHostname(url) {
    var a = document.createElement("a");
    a.href = url;
    return a.hostname;
}

function chainPromises(functions) {
    let promise = Promise.resolve();
    for (let function_ of functions) {
        promise = promise.then(function_);
    }

    return promise.catch((error) => { console.warn(error.message); });
}
