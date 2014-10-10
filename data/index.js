const $root = {
    bookmarks: {
        menu: ko.observableArray(),
        toolbar: ko.observableArray(),
        unsorted: ko.observableArray()
    },
    current: ko.observable("menu"),
    tabs: [
        "menu",
        "toolbar",
        "unsorted"
    ],
    otherLinks: [
        {
            url: "about:addons",
            name: "Add-ons",
        },
        {
            url: "about:preferences",
            name: "Preferences",
        },
        {
            url: "about:config",
            name: "Config",
        },
        {
            // action: "open-library",
            url: "chrome://browser/content/places/places.xul",
            name: "Library",
        }
    ],
    handleLink: function(data) {
        if ("url" in data) {
            self.port.emit("set-url", { url: data.url });
        } else if ("action" in data) {
            self.port.emit(data.action);
        }
    },
    names: {
        menu: "Bookmarks Menu",
        toolbar: "Bookmarks Toolbar",
        unsorted: "Unsorted Bookmarks"
    }
};

$root.tabs.forEach(function(name) {
    self.port.on("set-bookmarks-" + name, function(marks) {
        $root.bookmarks[name](marks);
    });
});

ko.applyBindings($root);
