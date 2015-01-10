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

if (command === "add") {
  if (args.length !== 3) {
    console.log("add command needs three args");
    process.exit(-1);
  }
  var contents = {command: "add", a: args[0], b: args[1], c: args[2]};
  var currentTimeInMillseconds = new Date().getTime()
  var fileName = "resources/pointrel_" + currentTimeInMillseconds + ".json";
  var output = JSON.stringify(contents, null, 2) + "\n";
  fs.writeFileSync(fileName, output);
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

if (command === "find" || command === "findall") {
  if (args.length !== 3) {
    console.log("find command needs three args");
    process.exit(-1);
  }
  readData();
  var results = [];
  for (var key in resources) {
    var data = resources[key];
    if (args[0] === "_" || data.a === args[0]) {
      if (args[1] === "_" || data.b === args[1]) {
         if (args[2] === "_" || data.c === args[2]) {
           // Match
           var result = [key]
           if (args[0] === "_") result.push(data.a);
           if (args[1] === "_") result.push(data.b);
           if (args[2] === "_") result.push(data.c);
           results.push(result);
         }
       }
    }
  }
  if (command === "findall") {
    console.log(results);
  } else {
    if (results.length) {
      var lastResult = results[results.length - 1]
      console.log(lastResult[lastResult.length - 1]);
    }
  }
  process.exit(0);
}

if (command === "list") {
  if (args.length > 2) {
    console.log("list command needs zero, one, or two args");
    process.exit(-1);
  }
  readData();
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
  for (var resultKey in results) {
    console.log(resultKey);
  }
  process.exit(0);
}

console.log("Unknown command:", command);

