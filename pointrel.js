// Command line version of Pointrel system for Node.js
// Just quick-and-dirty playful experiment for now
// 2015-01-10 Paul D. Fernhout

var command = process.argv[2];

if (!command) {
  console.log("Pointrel usage: command args...");
  process.exit(code=0);
}

args = [];

process.argv.forEach(function (val, index, array) {
  if (index > 2) args.push(val);
});

console.log("Pointrel command:", command, "args:", args);

