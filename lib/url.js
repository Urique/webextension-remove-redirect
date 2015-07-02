var EXCEPTIONS = [
    "abp",
    "account",
    "auth",
    "download",
    "login",
    "logout",
    "register",
    "signin",
    "signoff",
    "signon",
    "signout",
    "signup",
    "subscribe",
];

var PROTOCOLS = [
    "ftp",
    "http",
    "https",
    "mms",
    "rtsp",
];

var protocolsGroup = "(?:" + PROTOCOLS.join("|") + ")";
var colonGroup = "(:|%3A|%253A)";

var simpleRegexpProtocol     = new RegExp("https?://.*" + "(?:\\?|/)" + "(" + protocolsGroup + colonGroup + ".*$" + ")");
var simpleRegexpWWW          = new RegExp("https?://.*" + "(?:\\?|/)" + "(" + "www\\."                    + ".*$" + ")");
var queryStringRegexProtocol = new RegExp("https?://.*" +         "=" + "(" + protocolsGroup + colonGroup + "[^?&;#]*" + ")");
var queryStringRegexWWW      = new RegExp("https?://.*" +         "=" + "(" + "www\\."                    + "[^?&;#]*" + ")");

function maybeDecode(urlMatch, colonMatch) {
    switch(colonMatch) {
        case "%253A":
            return decodeURIComponent(decodeURIComponent(urlMatch));
        case "%3A":
            return decodeURIComponent(urlMatch);
        case ":":
            return urlMatch;
        case undefined:
            return "http://" + maybeDecodeWWWMatch(urlMatch);
    }
}

function maybeDecodeWWWMatch(wwwMatch) {
    // %
    if (new RegExp("%25").test(wwwMatch)) {
        wwwMatch = decodeURIComponent(wwwMatch);
    }
    // #$&+,/:;=?@
    if (new RegExp("(%23|%24|%26|%2B|%2C|%2F|%3A|%3B|%3D|%3F|%40)").test(wwwMatch)) {
        wwwMatch = decodeURIComponent(wwwMatch);
    }
    return wwwMatch;
}

function getRedirectTarget(url) {
    if (new RegExp("(" + EXCEPTIONS.join("|") + ")").test(url)) {
        return undefined;
    }

    let matches =
        url.match(simpleRegexpProtocol, "i") ||
        url.match(simpleRegexpWWW, "i") ||
        url.match(queryStringRegexProtocol, "i") ||
        url.match(queryStringRegexWWW, "i") ||
        undefined;
    if (matches) {
        let [urlMatch, colonMatch] = matches.splice(1, 2);
        return maybeDecode(urlMatch, colonMatch);
    }
    return undefined;
}

exports.getRedirectTarget = getRedirectTarget;