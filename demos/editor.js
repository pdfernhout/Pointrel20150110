function controller() { }

var data = {
    a: "",
    b: "", 
    c: ""
}

var serverMessage = "";

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
            "Message from server: ",
            m("pre#serverMessage", serverMessage)
        ])
    ]);
}

/* TODO -- call this below
// returns promise that gets response
function pointrel_add(a, b, c) {
    return m.request({
        url: "/add",
        method: "POST",
        data: {
            a: a,
            b: b,
            c: c
        }
    });
}

// returns promise that gets c value or null
function pointrel_findLastC(a, b) {
    return m.request({
        url: "/findLastC",
        method: "POST",
        data: {
            a: a,
            b: b
        },
        unwrapSuccess: function(response) {
            if (!response.content) return null;
            return response.content.c;
        }
    })
}
*/
    
function addClicked() {
    console.log("addClicked")
    m.request({
        url: "/add",
        method: "POST",
        data: data
    }).then(function(response) {
        serverMessage = JSON.stringify(response, null, 2);
    });
}

function findLastCClicked() {
    console.log("findLastCClicked");
    m.request({
        url: "/findLastC",
        method: "POST",
        data: data
    }).then(function(response) {
        data.c = response.content && response.content.c;
    });
}

m.mount(document.body, {controller: controller, view: view});