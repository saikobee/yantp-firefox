const prefs = require("sdk/preferences/service");
const bmarks = require("sdk/places/bookmarks");
const tabs = require("sdk/tabs");
const { PageMod } = require("sdk/page-mod");
const { data } = require("sdk/self");
const { getFavicon } = require("sdk/places/favicon");
const { Cc, Ci } = require("chrome");

const PREF_NTP_URL = "browser.newtab.url";
const YANTP_URL = data.url("index.html");
const INDEX_JS_URL = data.url("index.js");
const FALLBACK_FAVICON_URL = data.url("fallback-favicon.png");

const BAD_FAVICON_REGEX = /www.mozilla.org.*made-up-favicon/;

const Bookmarks = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
    .getService(Ci.nsINavBookmarksService);

function openLibrary() {
    tabs.open("chrome://browser/content/places/places.xul");
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
    function assertFaviconIsntFake(favicon) {
        if (BAD_FAVICON_REGEX.test(favicon)) {
            throw new Error("The Firefox bookmarks API is really weird");
        }
        return favicon;
    }

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
        .then(assertFaviconIsntFake)
        .then(setFavicon)
        .catch(setFallbackFavicon);
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

const tabNames = [
    "menu",
    "toolbar",
    "unsorted"
];

function onAttach(worker) {
    worker.port.on("get-bookmarks", function() {
        worker.port.emit("set-bookmarks", bookmarkData);
    });
    worker.port.on("set-url", function(data) {
        worker.tab.url = data.url;
    });
    worker.port.on("open-library", openLibrary);
}

const bookmarkObserver = {
    onBeginUpdateBatch: debouncedUpdateData,
    onEndUpdateBatch: debouncedUpdateData,
    onItemAdded: debouncedUpdateData,
    onItemRemoved: debouncedUpdateData,
    onItemVisited: debouncedUpdateData,
    onItemMoved: debouncedUpdateData
}

const bookmarkData = {
    menu: [],
    toolbar: [],
    unsorted: []
};

function updateData() {
    tabNames.forEach(function(tab) {
        const TAB = tab.toUpperCase();
        searchBookmarks({ group: bmarks[TAB] })
            .then(function(data) {
                bookmarkData[tab] = data;
            });
    });
}

function debounce(t, f) {
    let lastTime = null;
    let lastId = null;
    return function() {
        if (lastId !== null) {
            clearTimeout(lastId);
        }
        lastTime = Date.now();
        lastId = setTimeout(function() {
            const diff = Date.now() - lastTime;
            if (diff >= t) {
                f.apply(this, arguments);
            }
        }, t);
    };
}

// const debouncedUpdateData = debounce(300, updateData);
const debouncedUpdateData = updateData;

function main(options, callbacks) {
    PageMod({
        include: YANTP_URL,
        contentScriptWhen: "ready",
        contentScriptFile: [INDEX_JS_URL],
        onAttach: onAttach
    });

    updateData();
    Bookmarks.addObserver(bookmarkObserver, false);

    prefs.set(PREF_NTP_URL, YANTP_URL);
}

function onUnload(reason) {
    if (reason === "disable") {
        disablePlugin();
    }
}

function disablePlugin() {
    Bookmarks.removeObserver(bookmarkObserver);
    prefs.reset(PREF_NTP_URL);
}

exports.main = main;
exports.onUnload = onUnload;
