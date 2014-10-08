const prefs = require("sdk/preferences/service");
const bmarks = require("sdk/places/bookmarks");
const tabs = require("sdk/tabs");
const { PageMod } = require("sdk/page-mod");
const { data } = require("sdk/self");
const { getFavicon } = require("sdk/places/favicon");
const {Cc, Ci} = require("chrome");
const windowUtils = require("sdk/window/utils");

const PREF_NTP_URL = "browser.newtab.url";
const YANTP_URL = data.url("index.html");
const INDEX_JS_URL = data.url("index.js");
const KO_JS_URL = data.url("knockout-min.js");
const FALLBACK_FAVICON_URL = data.url("fallback-favicon.png");

const windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"]
    .getService(Ci.nsIWindowMediator);

function openLibrary() {
    tabs.open("chrome://browser/content/places/places.xul");

    // const organizer = windowMediator.getMostRecentWindow("Places:Organizer");
    // if (organizer) {
    //     organizer.PlacesOrganizer.selectLeftPaneContainerByHierarchy("AllBookmarks");
    //     organizer.focus();
    // } else {
    //     windowUtils.openDialog(
    //         "chrome://browser/content/places/places.xul",
    //         "",
    //         "chrome,toolbar=yes,dialog=no,resizable",
    //         "AllBookmarks"
    //     );
    // }
}

function makePrefix(group) {
    return "group" in group
        ?  makePrefix(group.group).concat([group.title])
        : [];
}

function searchPromise(query) {
    return new Promise(function(ok, bad) {
        bmarks.search(query)
            .on("end", ok)
            .on("error", bad);
    });
}

function bookmarkWithFaviconPromise(data) {
    function setFavicon(favicon) {
        bookmarkData.favicon = favicon;
        return bookmarkData;
    }

    function setFallbackFavicon() {
        bookmarkData.favicon = FALLBACK_FAVICON_URL;
        return bookmarkData;
    }

    const prefix = makePrefix(data.group);
    const bookmarkData = {
        url: data.url,
        title: data.title,
        prefix: prefix
    };

    return getFavicon(data.url)
        .then(setFavicon, setFallbackFavicon)
}

function searchBookmarks(query, callback) {
    return searchPromise(query).then(function(data) {
        const promises = data
            .filter(isBookmark)
            .map(bookmarkWithFaviconPromise);
        return Promise.all(promises);
    });
}

function isBookmark(bmark) {
    return "title" in bmark && "url" in bmark;
}

function onAttach(worker) {
    function sendAllTo(category) {
        return function(data) {
            worker.port.emit("set-bookmarks-" + category, data);
        };
    }

    const tabNames = [
        "menu",
        "toolbar",
        "unsorted"
    ];

    tabNames.forEach(function(tab) {
        const TAB = tab.toUpperCase();
        searchBookmarks({ group: bmarks[TAB] })
            .then(sendAllTo(tab));
    });

    worker.port.on("set-url", function(data) {
        worker.tab.url = data.url;
    });

    worker.port.on("open-library", openLibrary);
}

function main(options, callbacks) {
    PageMod({
        include: YANTP_URL,
        contentScriptWhen: "ready",
        contentScriptFile: [
            KO_JS_URL,
            INDEX_JS_URL
        ],
        onAttach: onAttach
    });

    prefs.set(PREF_NTP_URL, YANTP_URL);
}

function onUnload(reason) {
    if (reason === "disable") {
        disablePlugin();
    }
}

function disablePlugin() {
    prefs.reset(PREF_NTP_URL);
}

exports.main = main;
exports.onUnload = onUnload;
