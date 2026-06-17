// --- Main Entry Point (app.js) ---
import { closeCustomAlert, showAlert, getLocalDateString } from './config.js';
import { initNavigation } from './navigation.js';
import {
    goldPrices,
    refreshPrices,
    renderPricesEditor,
    saveGoldPricesFromUI,
    loadCrudHistory,
    changeCrudPageSize,
    prevCrudPage,
    nextCrudPage,
    editCrudRecord,
    clearCrudForm,
    saveCrudRecord,
    deleteCrudRecord,
    importCsvDialog,
    exportCsvDialog,
    closeExportCsvModal,
    executeExportCsv,
    clearAllPricesConfirm,
    openFeedbackForm,
    switchSubTab
} from './prices.js';
import {
    selectProduct,
    renderProducts,
    addNewItemRow,
    removeItemRow,
    addNewOldTicketRow,
    addOtherCashRow,
    addOtherRow,
    handleIProtectChange,
    calculateAll,
    sanitizeFinancingInput,
    handleDeficitCashInput,
    showPrintWarning,
    closePrintWarning,
    triggerPrint as arRahnuTriggerPrint,
    setupCalculationListeners,
    initTabs,
    resetCalculator
} from './calculator.js';
import {
    initPurchaseTabs,
    addNewPurchaseItemRow,
    removePurchaseItemRow,
    calculatePurchase,
    resetPurchaseCalculator,
    purchaseCalculationState
} from './purchaseCalculator.js';
import {
    initAlSaleemTabs,
    addNewAlSaleemItemRow,
    removeAlSaleemItemRow,
    calculateAlSaleem,
    resetAlSaleemCalculator,
    alsaleemCalculationState
} from './alsaleemCalculator.js';
import {
    updateGraphData,
    changeHistoryPageSize,
    prevHistoryPage,
    nextHistoryPage
} from './chart.js';

// --- Global Window Bindings for HTML Inline Attributes Compatibility ---
window.addNewItemRow = addNewItemRow;
window.removeItemRow = removeItemRow;
window.addNewOldTicketRow = addNewOldTicketRow;
window.addOtherCashRow = addOtherCashRow;
window.addOtherRow = addOtherRow;
window.handleIProtectChange = handleIProtectChange;
window.calculateAll = calculateAll;
window.sanitizeFinancingInput = sanitizeFinancingInput;
window.handleDeficitCashInput = handleDeficitCashInput;
window.showPrintWarning = () => {
    const isPurchase = document.getElementById('purchase-calculator-view').classList.contains('active');
    const isAlSaleem = document.getElementById('alsaleem-calculator-view').classList.contains('active');

    if (isAlSaleem) {
        const startDateInput = document.getElementById('alsaleemStartDate');
        const endDateInput = document.getElementById('alsaleemEndDate');
        if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
            showAlert('Sila pilih Tarikh Mula Simpan dan Tarikh Tebus terlebih dahulu.');
            return;
        }
        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        if (end < start) {
            showAlert('Tarikh Tebus tidak boleh mendahului Tarikh Mula Simpan.');
            return;
        }
    }

    const title = document.querySelector('#printWarningModal h3');
    if (title) {
        if (isPurchase) {
            title.textContent = 'Draf Cetakan Simulasi Belian Emas';
        } else if (isAlSaleem) {
            title.textContent = 'Draf Cetakan Simulasi Al Saleem';
        } else {
            title.textContent = 'Draf Cetakan Simulasi';
        }
    }
    const modal = document.getElementById('printWarningModal');
    if (modal) modal.classList.add('active');
};
window.closePrintWarning = closePrintWarning;
window.triggerPrint = () => {
    closePrintWarning();
    const isPurchase = document.getElementById('purchase-calculator-view').classList.contains('active');
    const isAlSaleem = document.getElementById('alsaleem-calculator-view').classList.contains('active');
    if (isPurchase) {
        if (purchaseCalculationState) {
            window.api.printSimulation(purchaseCalculationState);
        }
    } else if (isAlSaleem) {
        if (alsaleemCalculationState) {
            window.api.printSimulation(alsaleemCalculationState);
        }
    } else {
        arRahnuTriggerPrint();
    }
};
window.selectProduct = selectProduct;
window.updateGraphData = updateGraphData;
window.changeHistoryPageSize = changeHistoryPageSize;
window.prevHistoryPage = prevHistoryPage;
window.nextHistoryPage = nextHistoryPage;
window.switchSubTab = switchSubTab;
window.saveGoldPricesFromUI = saveGoldPricesFromUI;
window.loadCrudHistory = loadCrudHistory;
window.changeCrudPageSize = changeCrudPageSize;
window.prevCrudPage = prevCrudPage;
window.nextCrudPage = nextCrudPage;
window.editCrudRecord = editCrudRecord;
window.clearCrudForm = clearCrudForm;
window.saveCrudRecord = saveCrudRecord;
window.deleteCrudRecord = deleteCrudRecord;
window.importCsvDialog = importCsvDialog;
window.exportCsvDialog = exportCsvDialog;
window.closeExportCsvModal = closeExportCsvModal;
window.executeExportCsv = executeExportCsv;
window.clearAllPricesConfirm = clearAllPricesConfirm;
window.openFeedbackForm = openFeedbackForm;
window.closeCustomAlert = closeCustomAlert;
window.resetCalculator = resetCalculator;
window.addNewPurchaseItemRow = addNewPurchaseItemRow;
window.removePurchaseItemRow = removePurchaseItemRow;
window.calculatePurchase = calculatePurchase;
window.resetPurchaseCalculator = resetPurchaseCalculator;
window.addNewAlSaleemItemRow = addNewAlSaleemItemRow;
window.removeAlSaleemItemRow = removeAlSaleemItemRow;
window.calculateAlSaleem = calculateAlSaleem;
window.resetAlSaleemCalculator = resetAlSaleemCalculator;

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set Date Display
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    if (currentDateDisplay) {
        const now = new Date();
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        currentDateDisplay.textContent = `Tarikh: ${now.toLocaleDateString('ms-MY', options)}`;
    }

    // 2. Fetch Gold Prices from Database
    await refreshPrices();

    // 3. Render Initial Components
    renderProducts();
    renderPricesEditor();
    initNavigation();

    // 4. Setup Initial Tabs System
    initTabs();
    initPurchaseTabs();
    initAlSaleemTabs();

    // 5. Register Calculator Input Listeners
    setupCalculationListeners();

    // 6. Prepopulate CRUD Grade Select Options
    const crudGradeSelect = document.getElementById('crud-grade');
    if (crudGradeSelect) {
        crudGradeSelect.innerHTML = '';
        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.disabled = true;
        defOpt.selected = true;
        defOpt.textContent = '-- Pilih Mutu --';
        crudGradeSelect.appendChild(defOpt);

        for (const grade of Object.keys(goldPrices)) {
            const opt = document.createElement('option');
            opt.value = grade;
            opt.textContent = grade;
            crudGradeSelect.appendChild(opt);
        }
    }

    // 7. Prepopulate Default Date in CRUD
    const crudDateInput = document.getElementById('crud-date');
    if (crudDateInput) {
        crudDateInput.value = getLocalDateString();
    }

    // 8. Semak Kemas Kini Aplikasi (Semi-Auto Hybrid Approach)
    checkAppUpdates();
});

// --- Semi-Automatic Update Check Logic ---
async function checkAppUpdates() {
    const CURRENT_VERSION = '1.0';
    // Sila kemaskini URL ini dengan akaun GitHub dan repositori sebenar anda nanti
    const UPDATE_URL = 'https://raw.githubusercontent.com/zuwanaufa/Kalkulator-Ar-Rahnu-V2-EXE/refs/heads/main/version.json';

    try {
        const response = await fetch(UPDATE_URL);
        if (!response.ok) return; // Gagal secara senyap jika offline atau file tidak ditemui

        const data = await response.json();

        if (data.version && data.version !== CURRENT_VERSION) {
            const updateDot = document.getElementById('update-dot');
            const updateAlertCard = document.getElementById('update-alert-card');
            const newVersionText = document.getElementById('new-version-text');
            const newVersionNotes = document.getElementById('new-version-notes');
            const downloadGithubBtn = document.getElementById('downloadGithubBtn');
            const downloadDriveBtn = document.getElementById('downloadDriveBtn');

            if (updateDot) updateDot.style.display = 'inline-block';
            if (updateAlertCard) updateAlertCard.style.display = 'block';
            if (newVersionText) newVersionText.textContent = data.version;
            if (newVersionNotes && data.releaseNotes) {
                newVersionNotes.textContent = data.releaseNotes;
            }

            if (downloadGithubBtn && data.githubUrl) {
                downloadGithubBtn.onclick = () => window.api.openExternal(data.githubUrl);
            }
            if (downloadDriveBtn && data.driveUrl) {
                downloadDriveBtn.onclick = () => window.api.openExternal(data.driveUrl);
            }
        }
    } catch (error) {
        // Gagal secara senyap untuk menghormati persekitaran luar talian (offline)
        console.log('Semakan kemas kini dilangkau: PC tiada internet atau pelayan tidak dapat dihubungi.');
    }
}
