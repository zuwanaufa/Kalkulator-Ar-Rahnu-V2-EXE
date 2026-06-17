// --- Gold Prices & SQLite CRUD Module ---
import { showAlert, showConfirm, getLocalDateString } from './config.js';
import { calculateAll } from './calculator.js';
import { renderPriceChart } from './chart.js';

export const goldPrices = {
    '999': 0,
    '950': 0,
    '916': 0,
    '875': 0,
    '835': 0,
    '750': 0,
    '700 WG': 0,
    '750 WG': 0
};

export async function refreshPrices() {
    try {
        const latest = await window.api.getLatestPrices();
        
        // Reset goldPrices object values to 0
        Object.keys(goldPrices).forEach(grade => {
            goldPrices[grade] = 0;
        });

        // Map database list to goldPrices state object
        latest.forEach(item => {
            goldPrices[item.grade] = item.price;
        });

        // Set Last Update Text
        const lastUpdateText = document.getElementById('lastUpdateText');
        if (latest.length > 0 && lastUpdateText) {
            const dateParts = latest[0].date.split('-'); // YYYY-MM-DD
            if (dateParts.length === 3) {
                lastUpdateText.textContent = `Kemas kini terakhir: Tarikh ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        }
    } catch (e) {
        console.error('Failed to read from SQLite:', e);
        showAlert('Ralat membaca harga emas dari pangkalan data.', 'error');
    }
}

export function renderPricesEditor() {
    const goldPricesEditor = document.getElementById('goldPricesEditor');
    if (!goldPricesEditor) return;

    goldPricesEditor.innerHTML = '';
    for (const [grade, price] of Object.entries(goldPrices)) {
        const div = document.createElement('div');
        div.className = 'editor-item';
        div.innerHTML = `
            <label>${grade}</label>
            <div class="editor-input-group">
                <span>RM</span>
                <input type="number" step="0.01" class="editor-price-input" data-grade="${grade}" value="${price.toFixed(2)}">
            </div>
        `;
        goldPricesEditor.appendChild(div);
    }
}

export async function saveGoldPricesFromUI() {
    const inputs = document.querySelectorAll('.editor-price-input');
    const list = [];
    let hasInvalid = false;

    inputs.forEach(input => {
        const grade = input.getAttribute('data-grade');
        const price = parseFloat(input.value);

        if (isNaN(price) || price <= 0) {
            hasInvalid = true;
        } else {
            list.push({ grade, price });
        }
    });

    if (hasInvalid) {
        showAlert('Sila pastikan semua harga emas diisi dengan nilai positif yang sah.', 'error');
        return;
    }

    try {
        const res = await window.api.savePrices(list);
        if (res.success) {
            showAlert('Harga emas semasa berjaya disimpan ke SQLite!', 'success');
            await refreshPrices();
            renderPricesEditor();
            
            // Re-render grade options for item rows without resetting user selection
            const rows = document.querySelectorAll('.item-row');
            rows.forEach(row => {
                const select = row.querySelector('.item-grade');
                if (select) {
                    const selectedVal = select.value;
                    
                    let gradeOpts = '<option value="" disabled>-- Pilih Mutu --</option>';
                    for (const grade of Object.keys(goldPrices)) {
                        gradeOpts += `<option value="${grade}">${grade}</option>`;
                    }
                    select.innerHTML = gradeOpts;
                    select.value = selectedVal;
                }
            });
            
            calculateAll();
        }
    } catch (e) {
        console.error(e);
        showAlert('Gagal menyimpan harga emas ke pangkalan data.', 'error');
    }
}

// --- CRUD History Logics ---
let isEditingCrud = false;
let crudCurrentPage = 1;
let crudPageSize = 20;
let fullCrudData = [];

export async function loadCrudHistory() {
    const tableBody = document.getElementById('crudTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    try {
        const allPrices = await window.api.getAllPrices();
        fullCrudData = allPrices;
        
        const totalItems = fullCrudData.length;
        const totalPages = Math.ceil(totalItems / crudPageSize) || 1;
        if (crudCurrentPage > totalPages) crudCurrentPage = totalPages;
        if (crudCurrentPage < 1) crudCurrentPage = 1;
        
        const startIndex = (crudCurrentPage - 1) * crudPageSize;
        const endIndex = startIndex + crudPageSize;
        const pageData = fullCrudData.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" align="center" class="text-muted">Tiada rekod sejarah harga emas.</td></tr>';
            
            const pageInfo = document.getElementById('crudPageInfo');
            if (pageInfo) pageInfo.textContent = `Halaman 1 / 1`;
            return;
        }

        pageData.forEach(item => {
            const tr = document.createElement('tr');
            
            const dateParts = item.date.split('-');
            const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : item.date;

            tr.innerHTML = `
                <td><b>${displayDate}</b></td>
                <td><span class="gold-text" style="font-weight: 600;">${item.grade}</span></td>
                <td><b>RM ${item.price.toFixed(2)}</b></td>
                <td align="center">
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button class="btn-action-edit" onclick="editCrudRecord('${item.date}', '${item.grade}', ${item.price})">📝 Edit</button>
                        <button class="btn-action-delete" onclick="deleteCrudRecord('${item.date}', '${item.grade}')">🗑️ Padam</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        
        const pageInfo = document.getElementById('crudPageInfo');
        if (pageInfo) pageInfo.textContent = `Halaman ${crudCurrentPage} / ${totalPages}`;
        
    } catch (e) {
        console.error('Failed to load CRUD history:', e);
        showAlert('Gagal memuatkan log sejarah pangkalan data.', 'error');
    }
}

export function changeCrudPageSize() {
    const sizeSelect = document.getElementById('crudPageSize');
    if (sizeSelect) {
        crudPageSize = parseInt(sizeSelect.value);
        crudCurrentPage = 1;
        loadCrudHistory();
    }
}

export function prevCrudPage() {
    if (crudCurrentPage > 1) {
        crudCurrentPage--;
        loadCrudHistory();
    }
}

export function nextCrudPage() {
    crudCurrentPage++;
    loadCrudHistory();
}

export function editCrudRecord(date, grade, price) {
    const dateInput = document.getElementById('crud-date');
    const gradeSelect = document.getElementById('crud-grade');
    const priceInput = document.getElementById('crud-price');
    const formTitle = document.getElementById('crud-form-title');
    const btnCancel = document.getElementById('btn-cancel-crud');
    if (!dateInput || !gradeSelect || !priceInput || !formTitle || !btnCancel) return;

    dateInput.value = date;
    gradeSelect.value = grade;
    priceInput.value = price.toFixed(2);

    formTitle.innerHTML = '📝 Kemas Kini Rekod Sejarah';
    btnCancel.style.display = 'inline-flex';
    isEditingCrud = true;

    // Scroll the form card into view
    dateInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function clearCrudForm() {
    const dateInput = document.getElementById('crud-date');
    const gradeSelect = document.getElementById('crud-grade');
    const priceInput = document.getElementById('crud-price');
    const formTitle = document.getElementById('crud-form-title');
    const btnCancel = document.getElementById('btn-cancel-crud');
    if (!dateInput || !gradeSelect || !priceInput || !formTitle || !btnCancel) return;

    dateInput.value = getLocalDateString();
    gradeSelect.value = '';
    priceInput.value = '';

    formTitle.innerHTML = '➕ Tambah / Kemas Kini Rekod Sejarah';
    btnCancel.style.display = 'none';
    isEditingCrud = false;
}

export async function saveCrudRecord() {
    const dateInput = document.getElementById('crud-date');
    const gradeSelect = document.getElementById('crud-grade');
    const priceInput = document.getElementById('crud-price');
    if (!dateInput || !gradeSelect || !priceInput) return;

    const date = dateInput.value;
    const grade = gradeSelect.value;
    const price = parseFloat(priceInput.value);

    if (!date) {
        showAlert('Sila pilih tarikh rekod.', 'error');
        return;
    }
    if (!grade) {
        showAlert('Sila pilih mutu emas.', 'error');
        return;
    }
    if (isNaN(price) || price <= 0) {
        showAlert('Sila masukkan harga emas yang sah dan bernilai positif.', 'error');
        return;
    }

    try {
        const res = await window.api.saveSinglePrice(date, grade, price);
        if (res.success) {
            showAlert('Rekod sejarah berjaya disimpan!', 'success');
            
            // Clear the form
            clearCrudForm();

            // Refresh all prices, chart, tables
            await refreshPrices();
            renderPricesEditor();
            await loadCrudHistory();
            
            // Re-render grade options for item rows without resetting user selection
            const rows = document.querySelectorAll('.item-row');
            rows.forEach(row => {
                const select = row.querySelector('.item-grade');
                if (select) {
                    const selectedVal = select.value;
                    
                    let gradeOpts = '<option value="" disabled>-- Pilih Mutu --</option>';
                    for (const grade of Object.keys(goldPrices)) {
                        gradeOpts += `<option value="${grade}">${grade}</option>`;
                    }
                    select.innerHTML = gradeOpts;
                    select.value = selectedVal;
                }
            });

            calculateAll();
            renderPriceChart();
        }
    } catch (e) {
        console.error('Failed to save CRUD record:', e);
        showAlert('Gagal menyimpan rekod ke pangkalan data.', 'error');
    }
}

export async function deleteCrudRecord(date, grade) {
    const dateParts = date.split('-');
    const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : date;
    const confirmMsg = `Adakah anda pasti untuk memadam rekod sejarah emas mutu ${grade} pada tarikh ${displayDate}?`;
    
    const confirmed = await showConfirm(confirmMsg, true);
    if (!confirmed) {
        return;
    }

    try {
        const res = await window.api.deletePrice(date, grade);
        if (res.success) {
            showAlert('Rekod berjaya dipadam!', 'success');
            
            // Refresh
            await refreshPrices();
            renderPricesEditor();
            await loadCrudHistory();

            // Re-render grade options for item rows
            const rows = document.querySelectorAll('.item-row');
            rows.forEach(row => {
                const select = row.querySelector('.item-grade');
                if (select) {
                    const selectedVal = select.value;
                    
                    let gradeOpts = '<option value="" disabled>-- Pilih Mutu --</option>';
                    for (const grade of Object.keys(goldPrices)) {
                        gradeOpts += `<option value="${grade}">${grade}</option>`;
                    }
                    select.innerHTML = gradeOpts;
                    select.value = selectedVal;
                }
            });

            calculateAll();
            renderPriceChart();
        } else {
            showAlert('Gagal memadam rekod. Sila cuba lagi.', 'error');
        }
    } catch (e) {
        console.error('Failed to delete CRUD record:', e);
        showAlert('Gagal memadam rekod dari pangkalan data.', 'error');
    }
}

// --- Data Management (Import / Export / Clear) ---

export async function importCsvDialog() {
    const confirmed = await showConfirm('Adakah anda pasti untuk muat naik data CSV? Data sedia ada yang mempunyai tarikh & mutu yang sama akan ditimpa.', false);
    if (!confirmed) return;
    
    try {
        const res = await window.api.importPricesCsv();
        if (res.success) {
            showAlert(`Berjaya! ${res.count} rekod telah dimuat naik.`, 'success');
            await refreshPrices();
            renderPricesEditor();
            await loadCrudHistory();
            calculateAll();
            renderPriceChart();
        } else if (res.canceled) {
            // User canceled dialog, do nothing
        } else {
            showAlert(res.message || 'Gagal muat naik data CSV. Pastikan format betul.', 'error');
        }
    } catch (e) {
        console.error(e);
        showAlert('Ralat sistem semasa memuat naik CSV.', 'error');
    }
}

export function exportCsvDialog() {
    const modal = document.getElementById('exportCsvModal');
    if (modal) modal.classList.add('active');
}

export function closeExportCsvModal() {
    const modal = document.getElementById('exportCsvModal');
    if (modal) modal.classList.remove('active');
}

export async function executeExportCsv() {
    const startYear = document.getElementById('exportStartYear').value;
    const endYear = document.getElementById('exportEndYear').value;
    
    if (!startYear || !endYear) {
        showAlert('Sila masukkan julat tahun yang sah.', 'error');
        return;
    }
    
    if (parseInt(startYear) > parseInt(endYear)) {
        showAlert('Tahun Mula tidak boleh melebihi Tahun Akhir.', 'error');
        return;
    }

    closeExportCsvModal();

    try {
        const res = await window.api.exportPricesCsv(startYear, endYear);
        if (res.success) {
            showAlert(`Berjaya! ${res.count} rekod telah dieksport ke CSV.`, 'success');
        } else if (res.canceled) {
            // User canceled save dialog
        } else {
            showAlert(res.message || 'Tiada data dijumpai atau gagal eksport.', 'error');
        }
    } catch (e) {
        console.error(e);
        showAlert('Ralat sistem semasa eksport CSV.', 'error');
    }
}

export async function clearAllPricesConfirm() {
    const confirmed1 = await showConfirm('AMARAN Keras! Adakah anda benar-benar pasti mahu memadam KESEMUA rekod sejarah harga emas? Tindakan ini tidak boleh diundur! Sila buat backup (Eksport CSV) terlebih dahulu.', true);
    if (!confirmed1) {
        return;
    }
    
    // Double confirmation
    const confirmed2 = await showConfirm('Sila sahkan sekali lagi. Padam SEMUA data sekarang?', true);
    if (!confirmed2) {
        return;
    }

    try {
        const res = await window.api.clearAllPrices();
        if (res.success) {
            showAlert('Semua rekod sejarah harga emas telah dipadamkan sepenuhnya.', 'success');
            await refreshPrices();
            renderPricesEditor();
            await loadCrudHistory();
            calculateAll();
            renderPriceChart();
        } else {
            showAlert('Gagal memadam data.', 'error');
        }
    } catch (e) {
        console.error(e);
        showAlert('Ralat sistem semasa memadam data.', 'error');
    }
}

export function openFeedbackForm() {
    window.api.openExternal('https://forms.gle/14wn2y7Uou7PGWgd9');
}

// Helper to switch sub-tabs in Urus Harga Emas
export function switchSubTab(tab) {
    const btnPrices = document.getElementById('subtab-prices');
    const btnCrud = document.getElementById('subtab-crud');
    const panelPrices = document.getElementById('subview-prices-panel');
    const panelCrud = document.getElementById('subview-crud-panel');
    if (!btnPrices || !btnCrud || !panelPrices || !panelCrud) return;

    if (tab === 'prices') {
        btnPrices.className = 'btn btn-sm btn-primary';
        btnCrud.className = 'btn btn-sm btn-secondary';
        panelPrices.style.display = 'block';
        panelCrud.style.display = 'none';
    } else if (tab === 'crud') {
        btnPrices.className = 'btn btn-sm btn-secondary';
        btnCrud.className = 'btn btn-sm btn-primary';
        panelPrices.style.display = 'none';
        panelCrud.style.display = 'block';
        loadCrudHistory();
    }
}
