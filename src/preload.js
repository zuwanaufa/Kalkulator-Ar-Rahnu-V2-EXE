const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getLatestPrices: () => ipcRenderer.invoke('gold-prices:get-latest'),
    savePrices: (pricesList) => ipcRenderer.invoke('gold-prices:save', pricesList),
    getHistory: () => ipcRenderer.invoke('gold-prices:get-history'),
    printSimulation: (printData) => ipcRenderer.send('print:simulation', printData),
    getPrintData: () => ipcRenderer.invoke('print:get-data'),
    getAllPrices: () => ipcRenderer.invoke('gold-prices:get-all'),
    deletePrice: (date, grade) => ipcRenderer.invoke('gold-prices:delete', { date, grade }),
    saveSinglePrice: (date, grade, price) => ipcRenderer.invoke('gold-prices:save-single', { date, grade, price }),
    clearAllPrices: () => ipcRenderer.invoke('gold-prices:clear-all'),
    exportPricesCsv: (startYear, endYear) => ipcRenderer.invoke('gold-prices:export-csv', { startYear, endYear }),
    importPricesCsv: () => ipcRenderer.invoke('gold-prices:import-csv'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    printToPrinter: () => ipcRenderer.invoke('printWindow:print'),
    printToPDF: (defaultName) => ipcRenderer.invoke('printWindow:pdf', defaultName),
    closePrintWindow: () => ipcRenderer.invoke('printWindow:close')
});
