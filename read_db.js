const Database = require("better-sqlite3");
const db = new Database("produtos.db", {readonly: true});
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", JSON.stringify(tables));
tables.forEach(t => {
  const cols = db.prepare("PRAGMA table_info(" + t.name + ")").all();
  console.log("Cols of", t.name, ":", JSON.stringify(cols.map(c => c.name)));
  const rows = db.prepare("SELECT * FROM " + t.name + " LIMIT 5").all();
  console.log("Rows:", JSON.stringify(rows));
  const count = db.prepare("SELECT COUNT(*) as n FROM " + t.name).get();
  console.log("Total:", count.n);
});
db.close();
