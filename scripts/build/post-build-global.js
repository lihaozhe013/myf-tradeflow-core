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

const args = fs.existsSync(path.join(targetDir, "package-lock.json"))
  ? ["ci", "--omit=dev"]
  : ["install", "--omit=dev"];

console.log(`Installing packages for Prod Env: ${npmCmd} ${args.join(" ")}`);
const child = spawn(npmCmd, args, {
  cwd: targetDir,
  stdio: "inherit",
  // 某些 Windows 终端需要开 shell 才不报 EINVAL；若不需要可关掉
  shell: process.platform === "win32",
});

child.on("error", (err) => {
  console.error("spawn error:", err);
});

child.on("close", (code, signal) => {
  if (signal) {
    console.error(`ERROR: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`ERROR: ${code}`);
    process.exit(code);
  }
});
``;
