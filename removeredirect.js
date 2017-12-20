/* global psl */
/* global url */
const MODE = "mode";
const BLACKLIST = "blacklist";
const WHITELIST = "whitelist";
const REMOVE_REDIRECTS_TO_SAME_DOMAIN = "removeRedirectsToSameDomain";

const MODE_OFF = "off";
const MODE_BLACKLIST = "blacklist";

const TRACKEDEVENTS = ["focusin", "mouseover", "mousedown", "click"];

const debuggingDelay = false; //false or milliseconds

if (debuggingDelay) {
    setTimeout(initialize, debuggingDelay);
} else {
    initialize();
}

function initialize(){
    browser.storage.local.get([
        MODE,
        BLACKLIST,
        WHITELIST,
        REMOVE_REDIRECTS_TO_SAME_DOMAIN,
    ]).then(
        (result) => {
            if (result[MODE] !== MODE_OFF) {
                let exceptions = undefined;
                if (result[MODE] === MODE_BLACKLIST) {
                    exceptions = result[BLACKLIST];
                } else {
                    exceptions = result[WHITELIST];
                }
                manipulateDocument(document, TRACKEDEVENTS, cachedRedirectWithRuleset(result[MODE], exceptions, result[REMOVE_REDIRECTS_TO_SAME_DOMAIN]))
            }
        }
    );
}


function redirect(address, mode, exceptionRegex, samedomain) {
    let target = getTarget(address, mode, exceptionRegex, samedomain);
    return allowed(address, mode, exceptionRegex) && differentdomains(address, target, mode, samedomain) && target;

    function allowed(url, mode, exceptionRegex) {
        let excepted = exceptionRegex.test(address);
        if (mode === MODE_BLACKLIST) {
            return !excepted;
        } else {
            return excepted;
        }
    }
    function getTarget(address, mode, exceptionRegex, samedomain) {
        let target = url.extractUrl(address);
        if (target) {
            target = url.maybeDecode(target);
            target = redirect(target, mode, exceptionRegex, samedomain) || target;
            return (target !== address) && target;
        }
        return false;
    }
    function differentdomains(source, target, mode, samedomain) {
        if (mode === MODE_BLACKLIST && !samedomain) {
            let sourcedomain = psl.getDomain(getHostname(source));
            let targetdomain = psl.getDomain(getHostname(target));
            return (sourcedomain !== targetdomain);
        } else {
            return true;
        }

        function getHostname(url) {
            var a = document.createElement("A");
            a.href = url;
            return a.hostname;
        }
    }
}

function getConvergingCached(key, create, map) {
    let result = getCached(key, create, map);
    if (result) {
        map[result] = false;
    }
    return result;
}

function getCached(key, create, map) {
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

function cachedRedirectWithRuleset(mode, exceptionlist, samedomain) {
    let redirectCache = new Map();
    let concreteRedirect = redirectWithRuleset(mode, exceptionlist, samedomain, redirectCache);
    return cachedRedirect(concreteRedirect, redirectCache);

    function redirectWithRuleset(mode, exceptionlist, samedomain) {
        let exceptionRegex = new RegExp("(" + exceptionlist.join("|") + ")", "i");
        return (url) => redirect(url, mode, exceptionRegex, samedomain);
    }
    function cachedRedirect(redirect, cache) {
        return (url) => getConvergingCached(url, redirect, cache);
    }
}

function manipulateDocument(doc, trackedevents, linkManipulator) {
    let anchorManipulator = anchorManipulatorFromLinkManipulator(linkManipulator);
    let elementManipulator = ifAnchorWithManipulator(anchorManipulator);
    manipulateAllAnchors(doc, anchorManipulator);
    startObserver(doc, mutationObserverWithHandler(elementManipulator));
    trackedevents.forEach((e) => doc.addEventListener(e, eventListenerFromElementManipulator(elementManipulator)));

    function anchorManipulatorFromLinkManipulator(linkManipulator) {
        return function(anchor) {
            let target = linkManipulator(anchor.href);
            if (target) {
                anchor.href = target;
            }
        };
    }
    function mutationObserverWithHandler(handler) {
        return new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type == "childList") {
                    forEachNode(mutation.addedNodes, handler)
                } else {
                    handler(mutation.target);
                }
            })
        });
    }
    function ifAnchorWithManipulator(func) {
        return (element) => ifAnchor(element, func);
    }
    function ifAnchor(element, func) {
        if (element.tagName === "A") {
            func(element);
        }
    }
    function eventListenerFromElementManipulator(func) {
        return (event) => func(event.target);
    }
    function startObserver(doc, observer) {
        observer.observe(doc, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeList: ["href"]
        });
    }
    function manipulateAllAnchors(doc, anchorManipulator) {
        let anchors = doc.getElementsByTagName("A");
        forEachNode(anchors, anchorManipulator);
    }
}