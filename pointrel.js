/*
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/

var command = process.argv[2];

if (!command) {
  console.log("Pointrel usage: command args...");
  process.exit(code=0);
}

// console.log("Pointrel command: " + command);

args = [];

process.argv.forEach(function (val, index, array) {
  if (index > 2) {
   args.push(val);
   // console.log(index - 2 + ': ' + val);
  }
});

console.log("Pointrel command:", command, "args:", args);



