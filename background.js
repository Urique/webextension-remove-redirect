const MODE = "mode";
const MODE_OFF = "off";
const MODE_BLACKLIST = "blacklist";

const BLACKLIST = "blacklist";
const WHITELIST = "whitelist";


const REMOVE_REDIRECTS_TO_SAME_DOMAIN = "removeRedirectsToSameDomain";

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

browser.storage.local.get([
    MODE,
    BLACKLIST,
    WHITELIST,
    REMOVE_REDIRECTS_TO_SAME_DOMAIN
])
    .then(
        (result) => {
            if (result[BLACKLIST] === undefined) {
                browser.storage.local.set({[BLACKLIST]: GLOBAL_BLACKLIST});
            }
            if (result[WHITELIST] === undefined) {
                browser.storage.local.set({[WHITELIST]: []});
            }
            if (result[REMOVE_REDIRECTS_TO_SAME_DOMAIN] === undefined) {
                browser.storage.local.set({[REMOVE_REDIRECTS_TO_SAME_DOMAIN]: false});
            }
            if (result[MODE] === undefined) {
                browser.storage.local.set({[MODE]: MODE_BLACKLIST});
            } else if (result[MODE] === MODE_OFF) {
                disableRemoving();
            } else {
                enableRemoving(result[MODE]);
            }
        });

browser.storage.onChanged.addListener(
    (changes) => {
        if (changes[MODE]) {
            if (changes[MODE].newValue === MODE_OFF) {
                disableRemoving();
            } else {
                enableRemoving(changes[MODE].newValue);
            }
        }
    }
);

function enableRemoving(mode) {
    currentMode = mode;
    if (mode === MODE_BLACKLIST) {
        browser.browserAction.setIcon({path: ICON_BLACKLIST});
    } else {
        browser.browserAction.setIcon({path: ICON_WHITELIST});
    }
    browser.browserAction.setBadgeBackgroundColor({color: "red"});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("browserActionLabelOn")});
}

function disableRemoving() {
    browser.browserAction.setIcon({path: ICON_OFF});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("browserActionLabelOff")});
}