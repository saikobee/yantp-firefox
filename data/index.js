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
    names: {
        menu: "Menu",
        toolbar: "Toolbar",
        unsorted: "Unsorted"
    }
};

$root.tabs.forEach(function(name) {
    self.port.on("set-bookmarks-" + name, function(marks) {
        $root.bookmarks[name](marks);
    });
});

ko.applyBindings($root);
