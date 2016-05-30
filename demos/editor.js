function controller() { }

var data = {
    a: "",
    b: "", 
    c: ""
}

function view() { 
    return m("div.editor", [
        m("div", [
            m("label", "a: "),
            m("input", { value: data.a, onchange: m.withAttr("value", function (value) { data.a = value; })})
        ]),
        m("div", [
            m("label", "b: "),
            m("input", { value: data.b, onchange: m.withAttr("value", function (value) { data.b = value; })})
        ]),
        m("div", [
            m("label", "c: "),
            m("textarea", { value: data.c, onchange: m.withAttr("value", function (value) { data.c = value; })})
        ]),
        m("button", { onclick: addClicked }, "Add"),
        m("div", ["data is ", JSON.stringify(data) ]),
        m("button", { onclick: findLastCClicked }, "Find last C"),
        m("#resultDiv", [
            m("div", [
                m("label", "Message from server:"),
                m("span#serverMessage")
            ])
        ])
    ]);
}

function addClicked() {
    console.log("addClicked");
}

function findLastCClicked() {
    console.log("findLastCClicked");
}

m.mount(document.body, {controller: controller, view: view});