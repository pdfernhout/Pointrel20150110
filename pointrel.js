// Command line version of Pointrel system for Node.js
// Just quick-and-dirty playful experiment for now
// 2015-01-10 Paul D. Fernhout
// MIT License

"use strict";

var command = process.argv[2];

if (!command) {
  console.log("Pointrel usage: command args...");
  process.exit(code=0);
}

var args = [];

process.argv.forEach(function (val, index, array) {
  if (index > 2) args.push(val);
});

console.log("Pointrel command:", command, "args:", args);

var fs = require('fs');

if (command === "add") {
  if (args.length !== 3) {
    console.log("add command needs three args");
    process.exit(-1);
  }
  var contents = {command: "add", a: args[0], b: args[1], c: args[2]};
  var currentTimeInMillseconds = new Date().getTime()
  var fileName = "pointrel_" + currentTimeInMillseconds + ".json";
  var output = JSON.stringify(contents, null, 2) + "\n";
  fs.writeFileSync(fileName, output);
  process.exit(0);
}

