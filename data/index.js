const port = self.port;

const bookmarks = {
    menu: [],
    toolbar: [],
    unsorted: []
};

const bookmarkTypes = Object.keys(bookmarks);

function setChildren(elem, children) {
    elem.innerHTML = "";
    children.forEach(function(kid) {
        elem.appendChild(coerceToNode(kid));
    });
}

function fillContainer(name) {
    const frag = document.createDocumentFragment();
    const elems = bookmarks[name].map(bookmarkElement);
    setChildren(frag, elems);
    setChildren(getContainer(name), [frag]);
}

function getContainer(name) {
    return document.getElementById("container-" + name);
}

function getTab(name) {
    return document.getElementById("button-" + name);
}

function showContainer(name) {
    getContainer(name).style.display = "";
    getTab(name).classList.add("active");
}

function hideContainer(name) {
    getContainer(name).style.display = "none";
    getTab(name).classList.remove("active");
}

function hideAllContainers() {
    bookmarkTypes.forEach(hideContainer);
}

function concat(a, b) {
    return a.concat(b);
}

function flatten(ary) {
    return ary.reduce(concat, []);
}

function setUrl(url) {
    port.emit("set-url", { url: url });
}

function coerceToNode(textOrNode) {
    return typeof textOrNode === "string"
        ? document.createTextNode(textOrNode)
        : textOrNode;
}

function assignIfHas(dest, src) {
    return function(key) {
        if (key in src) {
            dest[key] = src[key];
        }
    };
}

function E(opts) {
    const type = opts.type || "span";
    const name = opts.className || "";
    const href = opts.href || "";
    const src = opts.src || "";
    const kids = opts.children || [];
    const elem = document.createElement(type);
    const props = ["className", "href", "src"];
    props.forEach(assignIfHas(elem, opts));
    setChildren(elem, kids);
    return elem;
}

function T(name, text) {
    return E({
        type: "span",
        className: name,
        children: [text]
    });
}

function bookmarkElement(data) {
    return E({
        type: "a",
        className: "bookmark",
        href: data.url,
        children: flatten([
            bookmarkFaviconElement(data),
            bookmarkPrefixElements(data),
            bookmarkTitleElement(data)
        ])
    });
}

function bookmarkFaviconElement(data) {
    return E({
        type: "img",
        className: "favicon",
        src: data.favicon
    })
}

function bookmarkPrefixElements(data) {
    return flatten(data.prefix.map(function(prefix) {
        return [
            T("folder", prefix),
            T("separator", "/")
        ];
    }));
}

function bookmarkTitleElement(data) {
    return T("title", data.title);
}

function whenClicking(id, handler) {
    document
        .getElementById(id)
        .addEventListener("click", handler, false);
}

function listenForTab(type) {
    whenClicking("button-" + type, function(event) {
        hideAllContainers();
        showContainer(type);
    });
}

function installPrivilegedLink(id, url) {
    whenClicking(id, function() {
        port.emit("set-url", { url: url });
    });
}

function installListeners() {
    port.on("set-bookmarks", function(marks) {
        bookmarkTypes.forEach(function(name) {
            bookmarks[name] = marks[name];
        });
        render();
    });
    bookmarkTypes.forEach(listenForTab);
    installPrivilegedLink("other-addons", "about:addons");
    installPrivilegedLink("other-preferences", "about:preferences");
    installPrivilegedLink("other-config", "about:config");
}

function getBookmarks() {
    port.emit("get-bookmarks", {});
}

function render() {
    hideAllContainers();
    fillContainer("menu");
    fillContainer("toolbar");
    fillContainer("unsorted");
    showContainer("menu");
}

function main() {
    installListeners();
    getBookmarks();
}

main();
