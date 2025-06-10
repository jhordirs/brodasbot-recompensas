const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(process.env.DB_PATH);

let db;

function initialize() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    console.log('Conectado a la base de datos SQLite');
    createTables();
  });
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS rewards (
      guild_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("Error creando tabla rewards:", err);
  });
}

function getRewards(guildId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT data FROM rewards WHERE guild_id = ?", [guildId], (err, row) => {
      if (err) return reject(err);
      resolve(row ? JSON.parse(row.data) : { members: [], headerText: "", footerText: "" });
    });
  });
}

function saveRewards(guildId, members, headerText, footerText) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ members, headerText, footerText });
    db.run(`
      INSERT INTO rewards (guild_id, data) 
      VALUES (?, ?) 
      ON CONFLICT(guild_id) DO UPDATE SET data = ?, last_updated = CURRENT_TIMESTAMP
    `, [guildId, data, data], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  initialize,
  getRewards,
  saveRewards
};