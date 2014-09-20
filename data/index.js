const SEPARATOR_TEXT = "/";

function render(node, mark) {
    var folderFragment = document.createDocumentFragment();
    mark.prefix.forEach(function(folder) {
        var folderElement = document.createElement("span");
        var separatorElement = document.createElement("span");

        folderElement.className = "folder";
        folderElement.appendChild(document.createTextNode(folder));

        separatorElement.className = "separator";
        separatorElement.appendChild(document.createTextNode(SEPARATOR_TEXT));

        folderFragment.appendChild(folderElement);
        folderFragment.appendChild(separatorElement);
    });

    var text = document.createTextNode(mark.title);

    var bookmark = document.createElement("a");
    bookmark.href = mark.url;
    bookmark.className = "bookmark";

    var favicon = document.createElement("img");
    favicon.className = "favicon";
    favicon.src = mark.favicon;

    var title = document.createElement("span");
    title.className = "title";
    title.appendChild(text);

    bookmark.appendChild(favicon);
    bookmark.appendChild(folderFragment);
    bookmark.appendChild(title);

    node.appendChild(bookmark);
}

function renderAll(node, marks) {
    marks.forEach(function(mark) {
        render(node, mark);
    });
}

function container(name) {
    var element = document.createElement("div");
    element.className = "container";
    element.id = "container-" + name;
    var header = document.createElement("h1");
    var text = document.createTextNode("container-" + name);
    header.appendChild(text);
    element.appendChild(header);
    return element;
}

function ID(id) {
    return document.getElementById(id);
}

function clear(target) {
    ID("container-" + target).innerHTML = "";
}

function addTo(name) {
    var target = document.getElementById("container-" + name);
    return function(mark) {
        render(target, mark);
    };
}

function addAllTo(name) {
    var target = document.getElementById("container-" + name);
    return function(mark) {
        renderAll(target, mark);
    };
}

function main() {
    var tabs = [
        "menu",
        "toolbar",
        "unsorted"
    ];

    tabs.forEach(function(name) {
        document.body.appendChild(container(name));
        self.port.on("add-all-to-" + name, addAllTo(name));
    });
}

main();
