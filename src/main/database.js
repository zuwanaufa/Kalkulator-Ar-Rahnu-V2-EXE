const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function initDatabase(userDataPath) {
    const dbPath = path.join(userDataPath, 'ar_rahnu_v2.db');
    console.log('Database path:', dbPath);
    
    db = new Database(dbPath);
    
    // Create Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS gold_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            grade TEXT NOT NULL,
            price REAL NOT NULL,
            UNIQUE(date, grade)
        )
    `).run();
    
    // No dummy seeding. Database starts empty as requested.
}

function getLatestPrices() {
    if (!db) throw new Error('Database not initialized');
    // Get the latest price for each grade (using subquery to get max date per grade)
    const stmt = db.prepare(`
        SELECT h.grade, h.price, h.date
        FROM gold_prices h
        INNER JOIN (
            SELECT grade, MAX(date) AS max_date
            FROM gold_prices
            GROUP BY grade
        ) m ON h.grade = m.grade AND h.date = m.max_date
    `);
    return stmt.all();
}

function savePrices(pricesList) {
    if (!db) throw new Error('Database not initialized');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO gold_prices (date, grade, price)
        VALUES (?, ?, ?)
    `);
    
    const transaction = db.transaction((list) => {
        for (const item of list) {
            stmt.run(todayStr, item.grade, parseFloat(item.price));
        }
    });
    
    transaction(pricesList);
    return { success: true };
}

function getPriceHistory() {
    if (!db) throw new Error('Database not initialized');
    // Get historical prices for 999 and 916
    const stmt = db.prepare(`
        SELECT date, grade, price FROM gold_prices
        WHERE grade IN ('999', '916')
        ORDER BY date ASC
    `);
    return stmt.all();
}

function deletePrice(date, grade) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('DELETE FROM gold_prices WHERE date = ? AND grade = ?');
    const info = stmt.run(date, grade);
    return { success: info.changes > 0 };
}

function getAllPrices() {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('SELECT date, grade, price FROM gold_prices ORDER BY date DESC, grade ASC');
    return stmt.all();
}

function saveSinglePrice(date, grade, price) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('INSERT OR REPLACE INTO gold_prices (date, grade, price) VALUES (?, ?, ?)');
    stmt.run(date, grade, price);
    return { success: true };
}

function clearAllPrices() {
    if (!db) throw new Error('Database not initialized');
    db.prepare('DELETE FROM gold_prices').run();
    return { success: true };
}

function getPricesByYearRange(startYear, endYear) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare("SELECT date, grade, price FROM gold_prices WHERE strftime('%Y', date) BETWEEN ? AND ? ORDER BY date ASC");
    return stmt.all(startYear.toString(), endYear.toString());
}

function importPrices(dataArray) {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare('INSERT OR REPLACE INTO gold_prices (date, grade, price) VALUES (?, ?, ?)');
    
    let imported = 0;
    const transaction = db.transaction((list) => {
        for (const item of list) {
            // validate
            if (item.date && item.grade && item.price != null && !isNaN(parseFloat(item.price))) {
                stmt.run(item.date, item.grade, parseFloat(item.price));
                imported++;
            }
        }
    });
    
    transaction(dataArray);
    return { success: true, count: imported };
}

module.exports = {
    initDatabase,
    getLatestPrices,
    savePrices,
    getPriceHistory,
    deletePrice,
    getAllPrices,
    saveSinglePrice,
    clearAllPrices,
    getPricesByYearRange,
    importPrices
};
