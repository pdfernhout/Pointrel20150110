function controller() { }

var data = {
    a: "",
    b: "", 
    c: ""
}

function view() { 
    return m("div.editor", [
        m("form[id='formNode']", [
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
            m("button", "Add")
        ]),
        m("div", ["data is ", JSON.stringify(data) ]),
        m("button", "Find last C"),
        m("#resultDiv", [
            m("div", [
                m("label", "Server Message:"),
                m("span#serverMessage")
            ])
        ])
    ]);
}

m.mount(document.body, {controller: controller, view: view});