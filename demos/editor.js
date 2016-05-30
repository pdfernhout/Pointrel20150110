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
                m("input", { value: data.a, onchange: m.withAttr(function (value) { data.a = value; })})
            ]),
            m("div", [
                m("label", "b: "),
                m("input")
            ]),
            m("div", [
                m("label", "c: "),
                m("textarea")
            ]),
            m("button", "Add")
        ]),
        m("div", ["A is:", data.a ]),
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