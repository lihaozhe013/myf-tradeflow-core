const fs = require("fs-extra");
const path = require("path");
const fs2 = require("fs");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "../..");
const r = (...p) => path.resolve(root, ...p);

fs.copySync(path.resolve(__dirname, '../pm2'), r("dist/pm2"));

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const targetDir = r("dist");

console.log("process.cwd():", process.cwd());
console.log("targetDir:", targetDir);
console.log("exists:", fs2.existsSync(targetDir));
console.log(
  "isDir:",
  fs2.existsSync(targetDir) && fs2.statSync(targetDir).isDirectory()
);

if (!(fs2.existsSync(targetDir) && fs2.statSync(targetDir).isDirectory())) {
  console.error("ERROR: NO", targetDir);
  process.exit(1);
}

``;
