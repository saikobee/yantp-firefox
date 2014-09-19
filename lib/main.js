const prefs = require("sdk/preferences/service");
const bmarks = require("sdk/places/bookmarks");
const { PageMod } = require("sdk/page-mod");
const { data } = require("sdk/self");
const { getFavicon } = require("sdk/places/favicon");

const PREF_NTP_URL = "browser.newtab.url";
const YANTP_URL = data.url("index.html");
const INDEX_JS_URL = data.url("index.js");
const FALLBACK_FAVICON_URL = data.url("fallback-favicon.png");

function j(data) {
    console.log(JSON.stringify(data, null, 4));
}

function displayNameForGroup(group) {
    const map = {};
    map[bmarks.MENU.id] = "Bookmarks Menu";
    map[bmarks.TOOLBAR.id] = "Bookmarks Toolbar";
    map[bmarks.UNSORTED.id] = "Unsorted Bookmarks";
    return map[group.id] || group.title;
}

function makePrefix(group) {
    return "group" in group
        ?  makePrefix(group.group).concat([group.title])
        : [];
}

function searchBookmarks(query, callback) {
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

    return searchPromise(query).then(function(data) {
        var promises = data
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
            worker.port.emit("add-all-to-" + category, data);
        };
    }

    var tabs = [
        "menu",
        "toolbar",
        "unsorted"
    ];

    tabs.forEach(function(tab) {
        const TAB = tab.toUpperCase();
        searchBookmarks({ group: bmarks[TAB] })
            .then(sendAllTo(tab));
    });
}

function main(options, callbacks) {
    PageMod({
        include: YANTP_URL,
        contentScriptWhen: "ready",
        contentScriptFile: INDEX_JS_URL,
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
