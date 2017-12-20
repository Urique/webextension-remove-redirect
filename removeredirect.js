/* global psl */
/* global url */
const MODE = "mode";
const BLACKLIST = "blacklist";
const WHITELIST = "whitelist";

const MODE_OFF = "off";
const MODE_BLACKLIST = "blacklist";
const REMOVE_REDIRECTS_TO_SAME_DOMAIN = "removeRedirectsToSameDomain";

const TRACKEDEVENTS = ["focusin", "mouseover", "mousedown", "click"];

let currentMode = undefined;
let removeRedirectsToSameDomain = undefined;
let ExceptionRegex = undefined;
let cachedRedirects = new Map();


browser.storage.local.get([
    MODE,
    BLACKLIST,
    WHITELIST,
    REMOVE_REDIRECTS_TO_SAME_DOMAIN,
])
    .then(
    (result) => {
        currentMode = result[MODE];
        if (currentMode !== MODE_OFF) {
            removeRedirectsToSameDomain = result[REMOVE_REDIRECTS_TO_SAME_DOMAIN];
            if (currentMode === MODE_BLACKLIST) {
                setExceptions(result[BLACKLIST]);
            } else {
                setExceptions(result[WHITELIST]);
            }
            enableRemoving();
        }
    }
    );

function setExceptions(list) {
    ExceptionRegex = new RegExp("(" + list.join("|") + ")", "i");
}

function maybeRedirect(address) {
    let target = getTarget(address);
    cachedRedirects[target] = false;
    return allowed(address) && differentdomains(address, target) && target;


    function allowed(a) {
        let excepted = ExceptionRegex.test(address);
        if (currentMode === MODE_BLACKLIST) {
            return !excepted;
        } else {
            return excepted;
        }
    }
    function getTarget(a) {
        let target = url.extractUrl(a);
        if (target) {
            target = url.maybeDecode(target);
            target = maybeRedirect(target) || target;
            return (target !== a) && target;
        }
        return false;
    }
    function differentdomains(s, t) {
        if (currentMode === MODE_BLACKLIST && !removeRedirectsToSameDomain) {
            let sourcedomain = psl.getDomain(getHostname(s));
            let targetdomain = psl.getDomain(getHostname(t));
            return (sourcedomain !== targetdomain);
        } else {
            return true;
        }

        function getHostname(url) {
            var a = document.createElement("a");
            a.href = url;
            return a.hostname;
        }
    }

}

function getCached(map, key, create) {
    let result = map[key];
    if (result === undefined) {
        result = create(key);
        map[key] = result;
    }
    return result
}

function forEachNode(nodelist, func) {
    for (var i = 0; i < nodelist.length; i++) {
        func(nodelist[i]);
    }
}

function enableRemoving() {
    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type == "childList") {
                forEachNode(mutation.addedNodes, maybefixurl)
            } else {
                maybefixurl(mutation.target);
            }
        })
    });
    let links = document.getElementsByTagName("a");
    forEachNode(links, fixurl);
    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeList: ["href"]
    });
    TRACKEDEVENTS.forEach((e) => document.addEventListener(e, eventoccured));

    function eventoccured(e) {
        maybefixurl(e.target);
    }
    function maybefixurl(element) {
        if (element.tagName === "A") {
            fixurl(element);
        }
    }
    function fixurl(anchor) {
        let result = getCached(cachedRedirects, anchor.href, maybeRedirect);
        if (result) {
            anchor.href = result;
        }
    }
}