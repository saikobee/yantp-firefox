function render(node, mark) {
    var t = mark.prefix.concat([mark.title]).join(" / ");
    var text = document.createTextNode(t);

    var bookmark = document.createElement("div");
    bookmark.className = "bookmark";

    var favicon = document.createElement("img");
    favicon.src = mark.favicon;

    var anchor = document.createElement("a");
    anchor.href = mark.url;
    anchor.appendChild(text);

    bookmark.appendChild(favicon);
    bookmark.appendChild(anchor);

    node.appendChild(bookmark);
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

function main() {
    // self.port.on("render", render);

    var tabs = [
        "menu",
        "toolbar",
        "unsorted"
    ];

    tabs.forEach(function(name) {
        document.body.appendChild(container(name));
        // clear(name);
        self.port.on("add-to-" + name, addTo(name));
    });
}

main();
