const fs = require("fs-extra");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const r = (...p) => path.resolve(root, ...p);

fs.copySync(r("backend/routes/export"), r("backend/dist/routes/export"));
fs.copySync(r("backend/routes/analysis"), r("backend/dist/routes/analysis"));
fs.copySync(r("backend/utils/db_commonjs.cjs"), r("backend/dist/utils/db_commonjs.cjs"))
fs.copySync(r("backend/utils/dbSchema_commonjs.cjs"), r("backend/dist/utils/dbSchema_commonjs.cjs"))
fs.copySync(r("backend/utils/decimalCalculator_commonjs.cjs"), r("backend/dist/utils/decimalCalculator_commonjs.cjs"))

fs.moveSync(r("backend/dist"), r("dist/backend"));
fs.copySync(r("backend/package.json"), r("dist/package.json"));
fs.copySync(r("backend/package-lock.json"), r("dist/package-lock.json"));
