const prefs = require("sdk/preferences/service");
const bmarks = require("sdk/places/bookmarks");
const { PageMod } = require("sdk/page-mod");
const { data } = require("sdk/self");
const { getFavicon } = require("sdk/places/favicon");

const PREF_NTP_URL = "browser.newtab.url";
const YANTP_URL = data.url("index.html");
const INDEX_JS_URL = data.url("index.js");

function printBookmarks(data) {
    // console.log(JSON.stringify(data, null, 4));
}

function displayNameForGroup(group) {
    var map = {};
    map[bmarks.MENU.id] = "Bookmarks Menu";
    map[bmarks.TOOLBAR.id] = "Bookmarks Toolbar";
    map[bmarks.UNSORTED.id] = "Unsorted Bookmarks";
    return map[group.id] || group.title;
}

function hasParentGroup(group) {
    return "group" in group;
}

function makePrefix(group) {
    console.warn("MAKE PREFIX = ", group);

    if (!hasParentGroup(group)) {
        // return [displayNameForGroup(group)];
        return [];
    }
    return makePrefix(group.group).concat([group.title]);
}

function searchBookmarks(query, callback) {
    bmarks.search(query).on("data", function(data) {
        if (isBookmark(data)) {
            var prefix = makePrefix(data.group);
            getFavicon(data.url).then(function(favicon) {
                callback({
                    url: data.url,
                    title: data.title,
                    prefix: prefix,
                    favicon: favicon
                });
            });
        }
    });
}

function isBookmark(bmark) {
    return "title" in bmark && "url" in bmark;
}

function onAttach(worker) {
    // function sendRender(data) {
    //     console.log(JSON.stringify(data, null, 2));
    //     worker.port.emit("render", data);
    // }

    function sendTo(category) {
        return function(data) {
            worker.port.emit("add-to-" + category, data);
        };
    }

    console.log({ group: bmarks.MENU });
    console.log({ group: bmarks.TOOLBAR });
    console.log({ group: bmarks.UNSORTED });

    searchBookmarks({ group: bmarks.MENU }, sendTo("menu"));
    searchBookmarks({ group: bmarks.TOOLBAR }, sendTo("toolbar"));
    searchBookmarks({ group: bmarks.UNSORTED }, sendTo("unsorted"));

    // searchBookmarks({ group: bmarks.MENU }, sendRender);
    // searchBookmarks({ group: bmarks.TOOLBAR }, sendRender);
    // searchBookmarks({ group: bmarks.UNSORTED }, sendRender);
}

// TODO: Use getFavicon's promise API to get favicon URLs for bookmarks and
// send that to the content script.

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
