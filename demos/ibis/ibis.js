"use strict";
console.log("Starting IBIS editor for Twirlip");

require([
    "dijit/form/Button",
    "dojo/_base/connect",
    "dijit/layout/ContentPane",
    "dojox/xml/DomParser",
    "dojox/uuid/generateRandomUuid",
    "dojox/gfx",
    "dojo/hash",
    "dojo/_base/lang",
    "dojox/gfx/move",
    "dojox/gfx/Moveable",
    "dojox/xml/parser",
    "dojo/query",
    "dojo/request",
    "dojox/layout/ResizeHandle",
    "dijit/form/SimpleTextarea",
    "dijit/form/TextBox",
    "dojox/widget/Toaster",
    "dijit/Toolbar",
    "dijit/ToolbarSeparator",
    "./widgetSupport.js",
    "dojo/domReady!"
], function(
    Button,
    connect,
    ContentPane,
    DomParser,
    generateRandomUuid,
    gfx,
    hash,
    lang,
    move,
    Moveable,
    parser,
    query,
    request,
    ResizeHandle,
    SimpleTextarea,
    TextBox,
    Toaster,
    Toolbar,
    ToolbarSeparator,
    widgetSupport
) {
        
    var defaultTextStyle = {family: "Arial", size: "12pt", weight: "normal"};
    var defaultSurfaceWidthInPixels = 800;
    var defaultSurfaceHeightInPixels = 600;
    
    // Caution: "this" may be undefined for functions called by this unless "bind" or "hitch" is used
    function forEach(array, theFunction) {
        if (array === undefined || array === null) {
            console.log("array is undefined or null", array);
        }
        for (var index = 0, length = array.length; index < length; ++index) {
            theFunction(index, array[index], array);
        }
    }
    
    function addBreak(contentPane) {
        contentPane.domNode.appendChild(document.createElement('br'));
    }
    
    function addText(contentPane, text) {
        contentPane.domNode.appendChild(document.createTextNode(text));
    }
    
    function addHTML(contentPane, htmlText) {
        var childContentPane = new ContentPane({
            content: htmlText
        });
        
       childContentPane.placeAt(contentPane);
       return childContentPane;
    }
    
    // returns promise that gets response
    function pointrel_add(a, b, c) {
        return request("/add", {
            method: "POST",
            handleAs: "json",
            data: JSON.stringify({
                a: a,
                b: b,
                c: c
            })
        });
    }

    // returns promise that gets c value or null
    function pointrel_findLastC(a, b) {
        return request("/findLastC", {
            method: "POST",
            handleAs: "json",
            data: JSON.stringify({
                a: a,
                b: b
            })
        }).then(function(response) {
            if (!response.content) return null;
            return response.content.c;
        })
    }
    
    function IBISDiagram(contentPane) {
        this.mainContentPane = contentPane;
        this.itemToDisplayObjectMap = {};
        this.changesCount = 0;
        this.autosave = false;
        this.lastSelectedItem = null;
        this.linkingFrom = null;
        
        this.diagram = {
            surfaceWidthInPixels: defaultSurfaceWidthInPixels,
            surfaceHeightInPixels: defaultSurfaceHeightInPixels,
            nodes: [],
            links: []
        }
        
        this.setupMainSurface();
    }
    
    IBISDiagram.prototype.setupMainSurface = function() {
        var divForResizing = document.createElement("div");
        this.divForResizing = divForResizing;
        var divUUID = "ResizeableCanvasHolder_001"; //  + generateRandomUuid(); 
        divForResizing.setAttribute("id", divUUID);
        var style = "width: " + this.diagram.surfaceWidthInPixels + "px; height: " + this.diagram.surfaceHeightInPixels + "px;";
        style = style + "border: solid 1px; position: relative";
        divForResizing.setAttribute("style", style);
       
        this.mainContentPane.domNode.appendChild(divForResizing);
        
        this._mainSurface = gfx.createSurface(divForResizing, this.diagram.surfaceWidthInPixels, this.diagram.surfaceHeightInPixels);

        this._mainSurface.whenLoaded(lang.hitch(this, function() {
            // TODO: Maybe need to disable diagram widget until this callback is called?
            this.mainSurface = this._mainSurface.createGroup();
            var isMouseDown = null;
            this._mainSurface.connect("onmousedown", lang.hitch(this, function (e) {
                // console.log("triggered down", e);
                this.selectItem(null);
                // console.log("onmousedown item", item);
                isMouseDown = e;
            }));
            this._mainSurface.connect("onmouseup", lang.hitch(this, function (e) {
                isMouseDown = null;
            }));
            this._mainSurface.connect("onmousemove", lang.hitch(this, function (e) {
                if (isMouseDown) {
                    // console.log("mouse move", e)
                    this.mainSurface.applyTransform(gfx.matrix.translate(e.clientX - isMouseDown.clientX, e.clientY - isMouseDown.clientY));
                    isMouseDown = e;
                }
            }));
            this.recreateDisplayObjectsForAllItems();
        }));
        
        var handle = new ResizeHandle({
            targetId: divUUID,
            // Need either activeResize true or animateSizing false so that onResize will only be called when totally done resizing
            // and not with animation still running and node not quite the final size
            // Updating seems to look worse with activeResize true as canvas still draws old size while rectangle shrinks or grows 
            // activeResize: true,
            animateSizing: false,
            // style: "bottom: 4px; right: 4px;",
            onResize: lang.hitch(this, this.updateSizeOfCanvas)
        }).placeAt(divForResizing);
        // TODO: Unsure if need this: handle.startup();
        
        function handleDragOver(event) {
            console.log("handleDragOver", event);
        }
        // this._mainSurface.addEventListener('dragover', handleDragOver, false);
    };

    IBISDiagram.prototype.updateSizeOfCanvas = function() {
        var newWidth = this.divForResizing.clientWidth;
        var newHeight = this.divForResizing.clientHeight;
        console.log("resize!", newWidth, newHeight);
        this._mainSurface.setDimensions(newWidth, newHeight);
        
        this.diagram.surfaceWidthInPixels = newWidth;
        this.diagram.surfaceHeightInPixels = newHeight;
        this.incrementChangesCount();
    };
    
    IBISDiagram.prototype.clearDisplayObjects = function() {
        this.itemToDisplayObjectMap = {};
        this.lastSelectedItem = null;
        this.linkingFrom = null;
        
        this.mainSurface.clear();
    }
    
    IBISDiagram.prototype.recreateDisplayObjectsForAllItems = function() {
        console.log("recreateDisplayObjectsForAllItems", this.diagram);
        this.clearDisplayObjects();

        // console.log("before forEach this:", this);
        var thisObject = this;
        forEach(this.diagram.nodes, function (index, item) {
            // console.log("looping over: ", item, "this:", this);
            var displayObject = thisObject.addDisplayObjectForItem(item);
        });
        forEach(this.diagram.links, function (index, link) {
            // console.log("looping over: ", link, "this:", this);
            var displayObject = thisObject.addDisplayObjectForLink(link);
        });
        // console.log("done recreateDisplayObjectsForAllItems");
    };
    
    IBISDiagram.prototype.incrementChangesCount = function() {
        this.changesCount++;
        if (this.autosave) {
            this.saveChanges();
        }
    };
    
    IBISDiagram.prototype.addItem = function(buttonType, title) {
        var x = 100;
        var y = 100;
        if (this.lastSelectedItem) {
            x = x + this.lastSelectedItem.x;
            y = y + this.lastSelectedItem.y;
        }
        var item = {uuid: generateRandomUuid(), type: buttonType, x: x, y: y, text: title};
        this.diagram.nodes.push(item);
        this.addDisplayObjectForItem(item);
    }
    
    IBISDiagram.prototype.addDisplayObjectForItem = function(item) {
        var group = this.mainSurface.createGroup();
        group.item = item;
        this.itemToDisplayObjectMap[item.uuid] = {group: group, item: item};
        
        group.image = group.createImage({x: 0, y: 0, width: 32, height: 32, src: fileNameForItemType(item.type)});
        group.text = group.createText({text: item.text, x: 36, y: 16, align: "left"}).setFont(defaultTextStyle).setFill("black");
        
        group.applyTransform(gfx.matrix.translate(item.x, item.y));
        
        group.connect("onmousedown", lang.hitch(this, function (e) {
            // console.log("triggered down", e);
            this.selectItem(item);
            // console.log("onmousedown item", item);
        }));
        
        group.on("dblclick", function(e) {
            console.log("dblclick", e);
            if (item.type === "map" && item.text) {
                toast("Opening diagram:<br>" + item.text)
                hash(item.text);
            } else if (item.type === "reference" && item.text) {
                toast("Following link:<br>" + item.text)
                window.open(item.text);
            } else {
                console.log("no action to do", item);
            }
        });
        
        var moveable = new Moveable(group);
        moveable.item = item;

        moveable.onMoveStart = lang.hitch(this, function (mover, shift) {
            // Kludge for Android as not setting on mouse down
            // this.updateItemDisplay(item);
            console.log("onMoveStart", this.linkingFrom, item);
            if (this.linkingFrom) {
                // console.log("checking link", this.linkingFrom, item);
                // Remove link if it exists, or create it if missing
                var removed = this.removeLink(this.linkingFrom, item);
                if (!removed) {
                    this.createLink(this.linkingFrom, item);
                }
                this.linkingFrom = null;
            }
        });
        
        moveable.onMoved = lang.hitch(this, function (mover, shift) {
            item.x += shift.dx;
            item.y += shift.dy;
            this.updateLinkPositions(item);
        });

        moveable.onMoveStop = lang.hitch(this, function (mover, shift) {
            this.incrementChangesCount();
        });
        
        this.lastSelectedItem = item;
    };
    
    function calculateArrowHeadPosition(from, to) {
        var distance = 20;
        var dx = to.x - from.x;
        var dy = to.y - from.y;
        var angleInRadians = Math.atan2(dy, dx);
        var x = distance * Math.cos(angleInRadians);
        var y = distance * Math.sin(angleInRadians);
        var cx = to.x + 16 - x;
        var cy = to.y + 16 - y;
        return {cx: cx, cy: cy, r: 2};
    }
    
    IBISDiagram.prototype.createLink = function(from, to) {
        console.log("add link", from, from.uuid, to, to.uuid);
        var newLink = {uuid: generateRandomUuid(), from: from.uuid, to: to.uuid};
        // console.log("newLink", newLink);
        this.diagram.links.push(newLink);
        this.addDisplayObjectForLink(newLink);
    }
        
    IBISDiagram.prototype.addDisplayObjectForLink = function(newLink) {
        var from = this.itemToDisplayObjectMap[newLink.from].item;
        var to = this.itemToDisplayObjectMap[newLink.to].item;
        console.log("addDisplayObjectForLink", newLink, from, to);
        
        var color = "blue";
        if (from.type === "pro") color = "green";
        if (from.type === "con") color = "red";
        
        var line = this.mainSurface.createLine({x1: from.x + 16, y1: from.y + 16, x2: to.x + 16, y2: to.y + 16}).setStroke(color);
        line.moveToBack();
        
        var arrowHeadPosition = calculateArrowHeadPosition(from, to);
        var arrowhead = this.mainSurface.createCircle(arrowHeadPosition).setStroke(color);
        
        this.itemToDisplayObjectMap[newLink.uuid] = {link: newLink, line: line, arrowhead: arrowhead};
    };
    
    IBISDiagram.prototype.removeLink = function(from, to) {
        var match = -1;
        var oldLink;
        forEach(this.diagram.links, function (index, linkItem) {
            // console.log("Comparing against ", linkItem);
            // console.log("from test", linkItem.from === linkingFrom.uuid);
            // console.log("to test", linkItem.to === item.uuid, linkItem.to, item.uuid);
            if (linkItem.from === from.uuid && linkItem.to === to.uuid) {
                // console.log("found existing link", index);
                match = index;
                oldLink = linkItem;
            }
        });
        if (match !== -1) {
            console.log("remove link", from, to);
            this.diagram.links.splice(match, 1);
            this.itemToDisplayObjectMap[oldLink.uuid].line.removeShape();
            this.itemToDisplayObjectMap[oldLink.uuid].arrowhead.removeShape();
            return true;
        }
        return false;
    };
    
    IBISDiagram.prototype.updateLinkPositions = function(item) {
        var itemToDisplayObjectMap = this.itemToDisplayObjectMap;
        forEach(this.diagram.links, function (index, oldLink) {
            if (oldLink.from === item.uuid) {
                // console.log("found from link that uses item", index);
                itemToDisplayObjectMap[oldLink.uuid].line.setShape({x1: item.x + 16, y1: item.y + 16});
                var to = itemToDisplayObjectMap[oldLink.to].item;
                var arrowHeadPosition = calculateArrowHeadPosition(item, to);
                itemToDisplayObjectMap[oldLink.uuid].arrowhead.setShape(arrowHeadPosition);
            }
            if (oldLink.to === item.uuid) {
                // console.log("found to link that uses item", index);
                itemToDisplayObjectMap[oldLink.uuid].line.setShape({x2: item.x + 16, y2: item.y + 16});
                var from = itemToDisplayObjectMap[oldLink.from].item;
                var arrowHeadPosition = calculateArrowHeadPosition(from, item);
                itemToDisplayObjectMap[oldLink.uuid].arrowhead.setShape(arrowHeadPosition);
            }
        });
    }
    
    IBISDiagram.prototype.deleteItem = function(item) {
        var itemToDisplayObjectMap = this.itemToDisplayObjectMap;
        // iterate backwards so can safely remove items while iterating
        for (var i = this.diagram.links.length - 1; i >= 0; i--) {
            var oldLink = this.diagram.links[i];
            if (oldLink.from === item.uuid || oldLink.to === item.uuid) {
                // console.log("found to link that uses item", i);
                itemToDisplayObjectMap[oldLink.uuid].line.removeShape();
                itemToDisplayObjectMap[oldLink.uuid].arrowhead.removeShape();
                this.diagram.links.splice(i, 1);
            }
        }
                
        var i = ibisDiagram.diagram.nodes.indexOf(item);
        if (i !== -1) {
            ibisDiagram.itemToDisplayObjectMap[item.uuid].group.removeShape();
            ibisDiagram.diagram.nodes.splice(i, 1);
        }
        if (ibisDiagram.lastSelectedItem === item) ibisDiagram.lastSelectedItem = null;
    }
    
    IBISDiagram.prototype.selectItem = function(item) {
        console.log("selectItem", item);
        if (this.lastSelectedItem) {
            console.log("lastSelected", this.lastSelectedItem);
            //var lastSelectedDisplayObject = this.itemToDisplayObjectMap[this.lastSelectedItem.uuid].group;
            //lastSelectedDisplayObject.circle.setStroke(
            // {color: lastSelectedDisplayObject.borderColor, width: lastSelectedDisplayObject.borderWidth, cap: "butt", join: 4});
        }
        if (item) {
            //var displayObject = this.itemToDisplayObjectMap[item.uuid].group;
            //displayObject.circle.setStroke({color: displayObject.borderColor, width: displayObject.borderWidth * 2, cap: "butt", join: 4});
        }
        this.lastSelectedItem = item;
        //this.updateItemDisplay(item);
    };
    
    IBISDiagram.prototype.loadDiagram = function(diagram) {
        console.log("loadDiagram", diagram);
        this.changesCount = 0;
        this.diagram.nodes = diagram.nodes;
        this.diagram.links = diagram.links;
        this.recreateDisplayObjectsForAllItems();
    };
    
    IBISDiagram.prototype.clearDiagram = function() {
        console.log("clearDiagram", this);
        this.changesCount = 0;
        this.diagram.nodes = [];
        this.diagram.links = [];
        this.clearDisplayObjects();
    };
    
    function fileNameForItemType(type) {
        var fileName = type;
        if (type === "pro") fileName = "plus";
        if (type === "con") fileName = "minus";
        return "/ibis/CompendiumIcons/" + fileName + ".png";
    }
    
    // Creating interface
    var mainContentPane = new ContentPane({
    });
    
    document.body.appendChild(mainContentPane.domNode);
    mainContentPane.startup();
    
    // For a "toaster" that can give status or progress updates
    var toasterPane = addHTML(mainContentPane, '');
    var toasterWidget = new Toaster({id: "toasterWidget"}, toasterPane.domNode);
    
    addHTML(mainContentPane, '<b>IBIS diagram editor inspired by Compendium</b>');
    addBreak(mainContentPane);
    
    var fileToolbar = new Toolbar({});
        
    addText(fileToolbar, "Name: ");
    var idTextBox = new TextBox({
        name: "idTextBox",
        style: "width: 300px;"
    });
    idTextBox.placeAt(fileToolbar);

    // File Commands
    forEach([
        ["Load", loadClicked],
        ["Save", saveClicked],
        ["Import", importClicked]
    ], function(index, item) {
        var commandName = item[0];
        var commandFunction = item[1];
        if (commandName === "separator") {
            fileToolbar.addChild(new ToolbarSeparator());
        } else {
            var commandButton = new Button({
                label: '<img src="/ibis/CrystalClearIcons/' + commandName + '.png" alt="' + commandName + '"/>',
                showLabel: true,
                iconClass: "toolbarIcon toolbarIcon-" + commandName,
                title: commandName,
                onClick: lang.partial(commandFunction)
            });
            fileToolbar.addChild(commandButton);
        }
    });
    
    fileToolbar.placeAt(mainContentPane);
    
    var entityToolbar = new Toolbar({});

    var objectNames = ["map", "issue", "position", "decision", "pro", "con", "argument", "note", "list", "reference"];

    // Entity Objects
    forEach(objectNames, function(index, item) {
        var button = new Button({
            label: '<img src="' + fileNameForItemType(item) + '" alt="' + item + '"/>',
            showLabel: true,
            iconClass: "toolbarIcon toolbarIcon-" + item,
            title: item,
            onClick: lang.partial(entityToolbarButtonClicked, item)
        });
        entityToolbar.addChild(button);
    });
    
    entityToolbar.addChild(new ToolbarSeparator());
    
    // Entity Commands
    forEach([
        ["LeftArrow", leftArrowClicked],
        ["Edit", editClicked],
        ["Delete", deleteClicked],
    ], function(index, item) {
        var commandName = item[0];
        var commandFunction = item[1];
        if (commandName === "separator") {
            entityToolbar.addChild(new ToolbarSeparator());
        } else {
            var commandButton = new Button({
                label: '<img src="/ibis/CrystalClearIcons/' + commandName + '.png" alt="' + commandName + '"/>',
                showLabel: true,
                iconClass: "toolbarIcon toolbarIcon-" + commandName,
                title: commandName,
                onClick: lang.partial(commandFunction)
            });
            entityToolbar.addChild(commandButton);
        }
    });
    
    entityToolbar.placeAt(mainContentPane);
    
    var ibisDiagram = new IBISDiagram(mainContentPane);
    
    document.getElementById("startup").style.display = "none";
    
    var currentDocumentID = null;

    // Load the referenced file, if any
    var fragment = hash();
    console.log("startup fragment", fragment);
    if (fragment) {
        urlHashFragmentChanged(fragment);
    }
    
    // Update if the URL hash fragment changes
    connect.subscribe("/dojo/hashchange", urlHashFragmentChanged);
    
    function urlHashFragmentChanged(encodedNewHash) {
        var newHash = decodeURI(encodedNewHash);
        console.log("urlHashFragmentChanged", encodedNewHash, newHash, currentDocumentID);
        if (currentDocumentID !== newHash && newHash) {
            idTextBox.set("value", newHash);
            loadClicked();
        } else {
            console.log('Problem in urlHashFragmentChanged for hash: "' + newHash + '"');
        }
    }
    
    function entityToolbarButtonClicked(buttonType) {
        console.log("entityToolbarButtonClicked", buttonType);
        
        var title = prompt("Title for new " + buttonType + "?");
        if (!title) return;
        
        ibisDiagram.addItem(buttonType, title);
    }
    
    function leftArrowClicked() {
        console.log("left arrow clicked");
        ibisDiagram.linkingFrom = ibisDiagram.lastSelectedItem;
    }
    
    function editClicked() {
        console.log("edit clicked");
        var item = ibisDiagram.lastSelectedItem
        if (!item) return alert("Please select an item first");
        var newTitle = prompt("New title?", item.text);
        if (newTitle) {
            item.text = newTitle;
            var text = ibisDiagram.itemToDisplayObjectMap[item.uuid].group.text;
            text.setShape({text: newTitle});
        }
    }
    
    function deleteClicked() {
        console.log("delete clicked");
        var item = ibisDiagram.lastSelectedItem
        if (!item) return alert("Please select an item first");
        // Remove all the links first
        ibisDiagram.deleteItem(item);
    }
    
    function loadClicked() {
        console.log("load clicked");
        var documentID = idTextBox.get("value");
        if (!documentID) return alert("no document ID");
        /*
        pointrel20141201Client.loadLatestEnvelopeForID(documentID, function(error, envelope) {
            if (error) {
                console.log("No stored versions could be loaded -- have any versions been saved?");
                toast("Load failed for:<br>" + documentID);
                ibisDiagram.clearDiagram();
                currentDocumentID = documentID;
                hash(currentDocumentID);
                return;
            }
            console.log("envelope.contents", envelope.content);
            if (envelope.contentType !== "text/IBISDiagram") {
                console.log("Unexpected content type", envelope.contentType);
            } else {
                ibisDiagram.loadDiagram(envelope.content);
            }
            toast("Loaded: " + documentID);
            currentDocumentID = documentID;
            hash(currentDocumentID);
        });
        */
        pointrel_findLastC(documentID, "content").then(function (c) {
            if (c === null) {
                console.log("No stored versions could be loaded -- have any versions been saved?");
                toast("Load failed for:<br>" + documentID);
                ibisDiagram.clearDiagram();
                currentDocumentID = documentID;
                hash(currentDocumentID);
                return;
            }
            var envelope;
            try {
                envelope = JSON.parse(c);
            } catch (e) {
                console.log("Problem parsing JSON content", c);
                return;
            }
            console.log("envelope.content", envelope.content);
            if (envelope.contentType !== "text/IBISDiagram") {
                console.log("Unexpected content type", envelope.contentType);
            } else {
                ibisDiagram.loadDiagram(envelope.content);
            }
            toast("Loaded: " + documentID);
            currentDocumentID = documentID;
            hash(currentDocumentID);         
        });
    }
    
    function saveClicked() {
        console.log("save clicked");
        var documentID = idTextBox.get("value");
        if (!documentID) return alert("no document ID");
        var contentType = "text/IBISDiagram";
        var metadata = {id: documentID, contentType: contentType, committer: "tester", timestamp: true};
        /* 
        var text = ibisDiagram.diagram; // JSON.stringify(ibisDiagram.diagram, null, 2);       
        pointrel20141201Client.storeInNewEnvelope(text, metadata, function(error, serverResponse) {
            if (error) {
                console.log("could not write new version:\n" + error);
                toast("Save failed for:<br>" + documentID);
                return;
            }
            var sha256HashAndLength = serverResponse.sha256AndLength;
            console.log("wrote sha256HashAndLength:", sha256HashAndLength);
            toast("Saved: " + documentID);
            currentDocumentID = documentID;
            hash(currentDocumentID);
        });
        */
        metadata.content = ibisDiagram.diagram;
        var content = JSON.stringify(metadata, null, 2);
        pointrel_add(documentID, "content", content).then(function (response) {
            if (!response.success) {
                console.log("could not write new version:\n" + response);
                toast("Save failed for:<br>" + documentID + "<br>" + response.reason);
                return;
            }
            toast("Saved: " + documentID);
            currentDocumentID = documentID;
            hash(currentDocumentID);        
        });
    }
    
    // Using values from Compendium
    var numberToObjectTypeMap = {
        "0": "general",
        "1": "list",
        "2": "map",
        "3": "issue",
        "4": "position",
        "5": "argument",
        "6": "pro",
        "7": "con",
        "8": "decision",
        "9": "reference",
        "10": "note",
        
        "11": "list_shortcut",
        "12": "map_shortcut",
        "13": "issue_shortcut",
        "14": "position_shortcut",
        "15": "argument_shortcut",
        "16": "pro_shortcut",
        "17": "con_shortcut",
        "18": "decision_shortcut",
        "19": "reference_shortcut",
        "20": "note_shortcut",
        
        "39": "responds_to_link",
        "40": "supports_link",
        "41": "objects_to_link",
        "42": "challenges_link",
        "43": "specialized_link",
        "44": "expands_on_link",
        "45": "related_to_link",
        "46": "about_link",
        "47": "resolves_link",
        
        "51": "trashbin",
        "52": "inbox"
    };
    
    function importClicked() {
        console.log("import clicked");
        var oldText = "";
        widgetSupport.openTextEditorDialog(oldText, "importDialog", "Import", "OK", function(newText, hideDialogFunction) {
            console.log("newText", newText)
            hideDialogFunction();
            
            // var parsed = DomParser.parse(newText);
            var parsed = parser.parse(newText);
            console.log("parsed", parsed);
            // console.log("views", parsed.byNameNS("view"));
            var views = query("view", parsed);
            var nodes = query("node", parsed);
            var links = query("link", parsed)
            console.log("views", views);
            console.log("nodes", nodes);
            console.log("links", links);
            // console.log("view 0 x", views[0].getAttribute("XPosition"));
            
            var nodeMap = {};
            
            var diagram = {
                nodes: [],
                links: []
            }
            
            for (var viewIndex = 0; viewIndex < views.length; viewIndex++) {
                var view = views[viewIndex];
                console.log("view", viewIndex, view);
                var noderef = view.getAttribute("noderef");
                var x = view.getAttribute("XPosition");
                var y = view.getAttribute("YPosition");
                // nodeMap[noderef] = {uuid: noderef, x: x, y: y};
                nodeMap[noderef] = {uuid: noderef, x: parseInt(x), y: parseInt(y)};
            }
            
            for (var nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
                var node = nodes[nodeIndex];
                var id = node.getAttribute("id");
                var label = node.getAttribute("label");
                // var stateNumber = node.getAttribute("state");
                var typeNumber = node.getAttribute("type");
                var type = numberToObjectTypeMap[typeNumber];
                if (!type) {
                    console.log("problem converting number to object type", typeNumber, type);
                }
                var item = nodeMap[id];
                if (!item) {
                    console.log("missing view for node with id -- probably overall map object", id);
                    item = {uuid: id, x: 32, y: 32};
                }
                item.text = label;
                item.type = type;
                diagram.nodes.push(item);
            }
            
            for (var linkIndex = 0; linkIndex < links.length; linkIndex++) {
                var link = links[linkIndex];
                var id = link.getAttribute("id");
                var from = link.getAttribute("from");
                var to = link.getAttribute("to");
                var label = link.getAttribute("label");
                var typeNumber = link.getAttribute("type");
                var type = numberToObjectTypeMap[typeNumber];
                // var item = diagram.nodes[id];
                var linkItem = {uuid: id, from: from, to: to, type: type, label: label};
                diagram.links.push(linkItem);
            }
            
            ibisDiagram.loadDiagram(diagram);
        });
    }
    
    function toast(message, messageType, duration_ms) {
        if (!messageType) messageType = "message";
        if (!duration_ms) duration_ms = 2000;
        toasterWidget.positionDirection = "tl-down";
        toasterWidget.setContent(message, messageType, duration_ms);
        toasterWidget.show();
    }
});