const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const database = require('./database');

let mainWindow = null;
let printWindow = null;
let currentPrintData = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 850,
        minWidth: 1000,
        minHeight: 700,
        title: "Kalkulator Ar Rahnu V2",
        icon: path.join(__dirname, '../renderer/assets/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true
        },
        autoHideMenuBar: true
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (printWindow) {
            printWindow.close();
        }
    });
}

app.whenReady().then(() => {
    // Initialize Database in user data directory
    const userDataPath = app.getPath('userData');
    database.initDatabase(userDataPath);

    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC Listeners ---
ipcMain.handle('gold-prices:get-latest', async () => {
    return database.getLatestPrices();
});

ipcMain.handle('gold-prices:save', async (event, pricesList) => {
    return database.savePrices(pricesList);
});

ipcMain.handle('gold-prices:get-history', async () => {
    return database.getPriceHistory();
});

ipcMain.handle('gold-prices:get-all', async () => {
    return database.getAllPrices();
});

ipcMain.handle('gold-prices:delete', async (event, { date, grade }) => {
    return database.deletePrice(date, grade);
});

ipcMain.handle('gold-prices:save-single', async (event, { date, grade, price }) => {
    return database.saveSinglePrice(date, grade, price);
});

ipcMain.handle('gold-prices:clear-all', async () => {
    return database.clearAllPrices();
});

ipcMain.handle('gold-prices:export-csv', async (event, { startYear, endYear }) => {
    try {
        const prices = database.getPricesByYearRange(startYear, endYear);
        if (prices.length === 0) {
            return { success: false, message: 'Tiada data dijumpai untuk julat tahun ini.' };
        }

        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Eksport Data Sejarah Harga Emas',
            defaultPath: `Harga_Emas_${startYear}_hingga_${endYear}.csv`,
            filters: [{ name: 'CSV Files', extensions: ['csv'] }]
        });

        if (!filePath) return { success: false, canceled: true, message: 'Eksport dibatalkan' };

        let csvContent = 'Tarikh,Mutu Emas,Harga RM/g\n';
        for (const row of prices) {
            csvContent += `${row.date},${row.grade},${row.price}\n`;
        }

        fs.writeFileSync(filePath, csvContent, 'utf-8');
        return { success: true, count: prices.length, message: `Berjaya mengeksport ${prices.length} rekod ke ${filePath}` };
    } catch (error) {
        console.error('Export Error:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('gold-prices:import-csv', async () => {
    try {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Import Data Sejarah Harga Emas',
            filters: [{ name: 'CSV Files', extensions: ['csv'] }],
            properties: ['openFile']
        });

        if (!filePaths || filePaths.length === 0) {
            return { success: false, canceled: true, message: 'Import dibatalkan' };
        }

        const filePath = filePaths[0];
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        
        const dataArray = [];
        for (let i = 1; i < lines.length; i++) { // Skip header
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(',');
            if (cols.length >= 3) {
                const date = cols[0].trim();
                const grade = cols[1].trim();
                const price = parseFloat(cols[2].trim());
                
                // Simple validation
                if (date.match(/^\d{4}-\d{2}-\d{2}$/) && grade && !isNaN(price)) {
                    dataArray.push({ date, grade, price });
                }
            }
        }

        if (dataArray.length === 0) {
            return { success: false, message: 'Tiada data sah dijumpai dalam fail CSV.' };
        }

        const result = database.importPrices(dataArray);
        return { success: true, count: result.count, message: `Berjaya mengimport ${result.count} rekod harga emas.` };

    } catch (error) {
        console.error('Import Error:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.on('print:simulation', (event, printData) => {
    currentPrintData = printData;

    // Open print window
    if (printWindow) {
        printWindow.close();
    }

    printWindow = new BrowserWindow({
        width: 950,
        height: 800,
        parent: mainWindow,
        modal: true,
        title: "Cetak Simulasi Ar Rahnu",
        icon: path.join(__dirname, '../renderer/assets/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
        autoHideMenuBar: true
    });

    printWindow.loadFile(path.join(__dirname, '../renderer/print.html'));
    
    printWindow.on('closed', () => {
        printWindow = null;
    });
});

ipcMain.handle('print:get-data', async () => {
    return currentPrintData;
});

ipcMain.handle('open-external', async (event, url) => {
    const { shell } = require('electron');
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
        return shell.openExternal(url);
    }
    console.warn(`Blocked openExternal call for non-http/https URL: ${url}`);
    return false;
});

ipcMain.handle('printWindow:print', async (event) => {
    const webContents = event.sender;
    try {
        await webContents.print({ silent: false, printBackground: true });
        return { success: true };
    } catch (err) {
        console.error('Print error:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('printWindow:pdf', async (event, defaultName) => {
    const webContents = event.sender;
    try {
        const win = BrowserWindow.fromWebContents(webContents);
        const { filePath } = await dialog.showSaveDialog(win, {
            title: 'Simpan Slip Sebagai PDF',
            defaultPath: defaultName || 'Slip_Simulasi_Ar_Rahnu.pdf',
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (!filePath) {
            return { success: false, message: 'Simpan PDF dibatalkan' };
        }

        const data = await webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4',
            preferCSSPageSize: true
        });

        fs.writeFileSync(filePath, data);
        return { success: true, filePath };
    } catch (err) {
        console.error('PDF error:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('printWindow:close', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.close();
    }
});
