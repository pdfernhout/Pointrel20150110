// Command line version of Pointrel system for Node.js
// Just quick-and-dirty playful experiment for now
// 2015-01-10 Paul D. Fernhout
// MIT License

"use strict";

var resourcesDirectory = __dirname + "/resources";

var command = process.argv[2];

if (!command) {
  console.log("Pointrel usage: command args...");
  process.exit(0);
}

var args = [];

process.argv.forEach(function (val, index, array) {
  if (index > 2) args.push(val);
});

// console.log("Pointrel command:", command, "args:", args);

var fs = require('fs');

function displayHelp() {
  console.log("Pointrel system for the command line");
  console.log("  add a b c -- adds triple");
  console.log("  find a b c -- finds last matching triple, use _ for wildcard");
  console.log("  findall a b c -- finds all matching triples, use _ for wildcard");
  console.log("  list [a [b]] -- lists matching strings with duplicates removes");
  console.log("  delete timestamp -- deletes a triple by renaming file with leading #");
  console.log("  uuid -- generate random uuid");
  console.log("  now -- the time right now in milliseconds");
  console.log("  current -- the result of 'pointrel find current value _'");
  console.log("  server -- web server displaying pages using 'pointrel find webpages $name _'");
  console.log("  help -- show this text");
}

if (command === "help") {
  displayHelp();
  process.exit(0);
}

if (command === "add") {
  if (args.length !== 3) {
    console.log("add command needs three args of a b c");
    process.exit(-1);
  }
  var currentTimeInMillseconds = new Date().getTime();
  var contents = {command: "add", timestamp: currentTimeInMillseconds, a: args[0], b: args[1], c: args[2]};
  var fileName = "resources/pointrel_" + currentTimeInMillseconds + ".json";
  var output = JSON.stringify(contents, null, 2) + "\n";
  fs.writeFileSync(fileName, output);
  process.exit(0);
}

if (command === "delete") {
  if (args.length !== 1) {
    console.log("delete command needs one arg of a timestamp");
    process.exit(-1);
  }
  var timestamp = args[0];
  // todo: better sanitizing of timestamp
  if (isNaN(timestamp)) {
    console.log("argument to delete is not a timestamp");
    process.exit(-1);
  }
  var fileName = "resources/pointrel_" + timestamp + ".json";
  if (!fs.existsSync(fileName)) {
    console.log("resource file does not exist:", fileName);
    process.exit(-1);
  } else {
    var ignoredFileName = "resources/#pointrel_" + timestamp + ".json";
    fs.renameSync(fileName, ignoredFileName);
  }
  process.exit(0);
}

function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

function strEndsWith(str, suffix) {
    return str.match(suffix + "$") == suffix;
}

var resources = {};

function readData()  {
  var files = fs.readdirSync(resourcesDirectory);
  for (var i in files) {
    if (!files.hasOwnProperty(i)) continue;
    var shortFileName = files[i];
    var isResourceFile = strStartsWith(shortFileName, "pointrel_") && strEndsWith(shortFileName, ".json");
    if (!isResourceFile) continue;  
    var fullFileName = resourcesDirectory + '/' + shortFileName;
    var data = JSON.parse(fs.readFileSync(fullFileName, 'utf8'));
    // console.log("read:", fullFileName, data);
    resources[shortFileName.substring(9).substring(0, shortFileName.length - 14)] = data;
  }
}

// Issue with believing timestamps vs. modifying/reactingTo thing as-it-is (especially clock is wrong sometime).

function find(a, b, c) {
  var results = [];
  for (var key in resources) {
    var data = resources[key];
    if (a === "_" || data.a === a) {
      if (b === "_" || data.b === b) {
         if (c === "_" || data.c === c) {
           // Match
           var result = [key]
           if (a === "_") result.push(data.a);
           if (b === "_") result.push(data.b);
           if (c === "_") result.push(data.c);
           results.push(result);
         }
       }
    }
  }
  return results;
}

if (command === "find" || command === "findall") {
  if (args.length !== 2 && args.length !== 3) {
    console.log(command + " command needs two or three args");
    process.exit(-1);
  }
  readData();
  if (args.length < 3) args.push("_");
  var results = find(args[0], args[1], args[2]);
  if (command === "findall") {
    console.log(results);
  } else {
    if (results.length) {
      var lastResult = results[results.length - 1];
      console.log(lastResult[lastResult.length - 1]);
    }
  }
  process.exit(0);
}

function list(args) {
  var results = {};
  if (args.length === 0) {
    for (var key in resources) {
      var data = resources[key];
      results[data.a] = true;
    }
  } else if (args.length === 1) {
    for (var key in resources) {
      var data = resources[key];
      if (data.a === args[0]) results[data.b] = true;
    }
  } else {
    for (var key in resources) {
      var data = resources[key];
      if ((data.a === args[0]) && (data.b === args[1])) results[data.c] = true;
    }
  }
  return results;
}

if (command === "list") {
  if (args.length > 2) {
    console.log("list command needs zero, one, or two args");
    process.exit(-1);
  }
  readData();
  var results = list(args);
  for (var resultKey in results) {
    console.log(resultKey);
  }
  process.exit(0);
}

// generateUUID from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

if (command === "uuid") {
  var uuid = generateUUID();
  console.log(uuid);
  process.exit(0);
}

if (command === "now") {
  var currentTimeInMillseconds = new Date().getTime();
  console.log(currentTimeInMillseconds);
  process.exit(0);
}

if (command === "current") {
  readData();
  var results = find("current", "value", "_");
  if (results.length === 0) {
    console.log("undefined");
    process.exit(-1);
  }
  var lastResult = results[results.length - 1];
  console.log(lastResult[lastResult.length - 1]);
  process.exit(0);
}

function last(a, b) {
    var results = find(a, b, "_");
    if (results.length) {
      var lastResult = results[results.length - 1];
      return lastResult[lastResult.length - 1];
    } else {
      return null;
    }
}

var refreshDelay_ms = 1000;
var lastReadTime_ms = new Date().getTime() - refreshDelay_ms;

function serverHandler(request, response) {
  if (request.method === "GET") {
    var contentType = "text/plain";
    var url = request.url;
    console.log("Requesting:", url);
    // TODO: improve; should not be reading all the data with every page request, even with ten second delay
    var now = new Date().getTime();
    if (lastReadTime_ms < now - refreshDelay_ms) {
      console.log("Reading data");
      readData();
      lastReadTime_ms = now;
    }
    if (url === "/") url = "/index.html";
    var pageID = "page:" + url.substring(1);
    var content = last(pageID, "content");
    if (content === null) {
      content = "URL not found: " + url;
    } else {
       var specificContentType = last(pageID, "contentType");
       if (specificContentType) contentType = specificContentType;
    }
    response.writeHead(200, {"Content-Type": contentType});
    response.end(content);
  } else if (request.method === "POST") {
    if (request.url === "/add") {
      var requestBody = '';
      request.on('data', function(data) {
        requestBody += data;
        if (requestBody.length > 1e7) {
          response.writeHead(413, 'Request Entity Too Large', {'Content-Type': 'text/html'});
          response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
        }
      });
      request.on('end', function() {
        // TODO: Sanitize inputs?
        // TODO: Eventually move require to top of file
        var qs = require('querystring');
        var formData = qs.parse(requestBody);
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('<!doctype html><html><head><title>response</title></head><body>');
        response.write('Thanks for the data!<br />a ' + formData.a);
        response.write('<br />b: ' + formData.b);
        response.write('<br />c: ' + formData.c);
        response.end('</body></html>');
      });
    } else {
      response.writeHead(404, 'Resource Not Found', {'Content-Type': 'text/html'});
      response.end('<!doctype html><html><head><title>404</title></head><body>404: Resource Not Found</body></html>');
    }
  } else {
  response.writeHead(405, 'Method Not Supported', {'Content-Type': 'text/html'});
  return response.end('<!doctype html><html><head><title>405</title></head><body>405: Method Not Supported</body></html>');
  }
}

function server() {
  // TODO: Eventually move require to top of file
  var http = require('http');
  var server = http.createServer(serverHandler);
  server.listen(8000);
  console.log("server on http://localhost:8000");
}

if (command === "server") {
  readData();
  server();
} else {
  console.log("Unknown command:", command);
  displayHelp();
}
