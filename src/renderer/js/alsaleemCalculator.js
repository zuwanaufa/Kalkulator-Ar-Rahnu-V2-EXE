// --- Al Saleem Calculator Engine & UI Module ---
import { formatCurrency, showAlert } from './config.js';
import { goldPrices } from './prices.js';

export let alsaleemTabs = [];
export let activeAlSaleemTabId = null;
export let alsaleemCalculationState = null;

const ALSALEEM_MONTHLY_RATE = 0.60; // 0.60% sebulan

export function getDefaultAlSaleemTabState(id, name) {
    return {
        id,
        name,
        items: [{ grade: '', weight: '' }],
        startDate: '',
        endDate: ''
    };
}

export function initAlSaleemTabs() {
    alsaleemTabs = [];
    const firstTab = getDefaultAlSaleemTabState('a-tab-1', 'Simpan 1');
    alsaleemTabs.push(firstTab);
    loadAlSaleemTabState('a-tab-1');

    const tabsBar = document.getElementById('alsaleemCalcTabsBar');
    if (tabsBar) {
        tabsBar.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabsBar.scrollLeft += e.deltaY * 0.8;
            }
        });
    }
}

export function saveActiveAlSaleemTabState() {
    if (!activeAlSaleemTabId) return;
    const tab = alsaleemTabs.find(t => t.id === activeAlSaleemTabId);
    if (!tab) return;

    tab.items = [];
    document.querySelectorAll('#alsaleemItemsContainer > .item-row').forEach(row => {
        const gradeSelect = row.querySelector('.alsaleem-item-grade');
        const weightInput = row.querySelector('.alsaleem-item-weight');
        if (gradeSelect && weightInput) {
            tab.items.push({
                grade: gradeSelect.value,
                weight: weightInput.value
            });
        }
    });

    const startDateInput = document.getElementById('alsaleemStartDate');
    const endDateInput = document.getElementById('alsaleemEndDate');
    if (startDateInput) tab.startDate = startDateInput.value;
    if (endDateInput) tab.endDate = endDateInput.value;
}

export function loadAlSaleemTabState(tabId) {
    const tab = alsaleemTabs.find(t => t.id === tabId);
    if (!tab) return;
    activeAlSaleemTabId = tab.id;

    // Set Dates
    const startDateInput = document.getElementById('alsaleemStartDate');
    const endDateInput = document.getElementById('alsaleemEndDate');
    if (startDateInput) startDateInput.value = tab.startDate;
    if (endDateInput) endDateInput.value = tab.endDate;

    const itemsContainer = document.getElementById('alsaleemItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        if (tab.items.length === 0) {
            tab.items.push({ grade: '', weight: '' });
        }
        tab.items.forEach(it => {
            const rowId = 'a-row-' + Math.random().toString(36).substr(2, 9);
            const div = document.createElement('div');
            div.className = 'item-row';
            div.id = rowId;

            let gradeOpts = `<option value="" ${!it.grade ? 'selected' : ''} disabled>-- Pilih Mutu --</option>`;
            for (const grade of Object.keys(goldPrices)) {
                gradeOpts += `<option value="${grade}" ${it.grade === grade ? 'selected' : ''}>${grade}</option>`;
            }

            div.innerHTML = `
                <div>
                    <label>Mutu Emas</label>
                    <select class="alsaleem-item-grade" onchange="calculateAlSaleem()">${gradeOpts}</select>
                </div>
                <div>
                    <label>Berat (g)</label>
                    <input type="number" class="alsaleem-item-weight" placeholder="0.00" step="0.01" value="${it.weight}" oninput="calculateAlSaleem()">
                </div>
                <div>
                    <label>&nbsp;</label>
                    <button class="btn-icon" onclick="removeAlSaleemItemRow('${rowId}')">🗑️</button>
                </div>
            `;
            itemsContainer.appendChild(div);
        });
    }

    calculateAlSaleem();
    renderAlSaleemTabsBar();
}

export function renderAlSaleemTabsBar() {
    const tabsBar = document.getElementById('alsaleemCalcTabsBar');
    if (!tabsBar) return;

    tabsBar.innerHTML = '';

    alsaleemTabs.forEach(tab => {
        const div = document.createElement('div');
        div.className = 'calc-tab' + (tab.id === activeAlSaleemTabId ? ' active' : '');
        div.onclick = (e) => {
            if (e.target.classList.contains('calc-tab-close')) return;
            switchAlSaleemTab(tab.id);
        };

        const labelSpan = document.createElement('span');
        labelSpan.textContent = tab.name;
        div.appendChild(labelSpan);

        if (alsaleemTabs.length > 1) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'calc-tab-close';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                closeAlSaleemTab(tab.id);
            };
            div.appendChild(closeBtn);
        }

        tabsBar.appendChild(div);
    });

    if (alsaleemTabs.length < 10) {
        const addBtn = document.createElement('div');
        addBtn.className = 'calc-tab-add';
        addBtn.innerHTML = '＋';
        addBtn.title = 'Tambah Tab Al Saleem Baru';
        addBtn.onclick = () => addNewAlSaleemTab();
        tabsBar.appendChild(addBtn);
    }

    setTimeout(() => {
        const activeTabEl = tabsBar.querySelector('.calc-tab.active');
        if (activeTabEl) {
            const tabsBarRect = tabsBar.getBoundingClientRect();
            const activeTabRect = activeTabEl.getBoundingClientRect();

            if (activeTabRect.left < tabsBarRect.left) {
                tabsBar.scrollTo({
                    left: tabsBar.scrollLeft - (tabsBarRect.left - activeTabRect.left + 16),
                    behavior: 'smooth'
                });
            } else if (activeTabRect.right > tabsBarRect.right) {
                tabsBar.scrollTo({
                    left: tabsBar.scrollLeft + (activeTabRect.right - tabsBarRect.right + 16),
                    behavior: 'smooth'
                });
            }
        }
    }, 50);
}

export function addNewAlSaleemTab() {
    if (alsaleemTabs.length >= 10) {
        showAlert('Maksimum 10 tab pengiraan Al Saleem dibenarkan.');
        return;
    }
    saveActiveAlSaleemTabState();

    const newId = 'a-tab-' + Date.now();
    const name = `Simpan ${alsaleemTabs.length + 1}`;
    const newTab = getDefaultAlSaleemTabState(newId, name);

    alsaleemTabs.push(newTab);
    loadAlSaleemTabState(newId);
}

export function closeAlSaleemTab(id) {
    if (alsaleemTabs.length <= 1) return;

    const idx = alsaleemTabs.findIndex(t => t.id === id);
    if (idx === -1) return;

    if (id === activeAlSaleemTabId) {
        const newActiveIdx = idx === 0 ? 1 : idx - 1;
        const newActiveId = alsaleemTabs[newActiveIdx].id;
        alsaleemTabs.splice(idx, 1);
        loadAlSaleemTabState(newActiveId);
    } else {
        alsaleemTabs.splice(idx, 1);
        renderAlSaleemTabsBar();
    }
}

export function switchAlSaleemTab(id) {
    if (id === activeAlSaleemTabId) return;
    saveActiveAlSaleemTabState();
    loadAlSaleemTabState(id);
}

export function resetAlSaleemCalculator() {
    if (!activeAlSaleemTabId) return;
    const idx = alsaleemTabs.findIndex(t => t.id === activeAlSaleemTabId);
    if (idx === -1) return;

    const defaultName = `Simpan ${idx + 1}`;
    const freshTab = getDefaultAlSaleemTabState(activeAlSaleemTabId, defaultName);
    alsaleemTabs[idx] = freshTab;

    loadAlSaleemTabState(activeAlSaleemTabId);
}

export function addNewAlSaleemItemRow() {
    const itemsContainer = document.getElementById('alsaleemItemsContainer');
    if (!itemsContainer) return;

    const rowId = 'a-row-' + Date.now();
    const div = document.createElement('div');
    div.className = 'item-row';
    div.id = rowId;

    let gradeOpts = '<option value="" disabled selected>-- Pilih Mutu --</option>';
    for (const grade of Object.keys(goldPrices)) {
        gradeOpts += `<option value="${grade}">${grade}</option>`;
    }

    div.innerHTML = `
        <div>
            <label>Mutu Emas</label>
            <select class="alsaleem-item-grade" onchange="calculateAlSaleem()">${gradeOpts}</select>
        </div>
        <div>
            <label>Berat (g)</label>
            <input type="number" class="alsaleem-item-weight" placeholder="0.00" step="0.01" oninput="calculateAlSaleem()">
        </div>
        <div>
            <label>&nbsp;</label>
            <button class="btn-icon" onclick="removeAlSaleemItemRow('${rowId}')">🗑️</button>
        </div>
    `;
    itemsContainer.appendChild(div);
}

export function removeAlSaleemItemRow(rowId) {
    const rows = document.querySelectorAll('#alsaleemItemsContainer > .item-row');
    if (rows.length > 1) {
        const target = document.getElementById(rowId);
        if (target) {
            target.remove();
        }
        calculateAlSaleem();
    } else {
        showAlert('Perlu sekurang-kurangnya satu barang simpanan.');
    }
}

export function calculateAlSaleem() {
    const promptEl = document.getElementById('alsaleem-calc-prompt');
    const resultsEl = document.getElementById('alsaleem-calc-results');
    const contentEl = document.getElementById('alsaleemResultContent');
    const detailsEl = document.getElementById('alsaleemSimulationDetails');
    if (!promptEl || !resultsEl || !contentEl || !detailsEl) return;

    const activeEl = document.activeElement;
    const activeId = activeEl ? activeEl.id : null;
    let selectionStart = 0;
    let selectionEnd = 0;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        selectionStart = activeEl.selectionStart;
        selectionEnd = activeEl.selectionEnd;
    }

    let totalWeight = 0;
    let totalMarhun = 0;
    let totalDailyRate = 0;
    const items = [];
    let hasInvalid = false;

    document.querySelectorAll('#alsaleemItemsContainer > .item-row').forEach(row => {
        const gradeSelect = row.querySelector('.alsaleem-item-grade');
        const weightInput = row.querySelector('.alsaleem-item-weight');
        if (!gradeSelect || !weightInput) return;

        const grade = gradeSelect.value;
        const weight = parseFloat(weightInput.value) || 0;

        if (weight > 0 && !grade) {
            hasInvalid = true;
        }

        if (weight > 0 && grade) {
            const price = goldPrices[grade] || 0;
            const marhun = weight * price;
            
            // Upah Simpan Sehari = marhun * (0.60 / 100) * 12 / 365
            const dailyRateFactor = (ALSALEEM_MONTHLY_RATE / 100) * 12 / 365;
            const dailyRate = Math.round(marhun * dailyRateFactor * 100) / 100;

            totalWeight += weight;
            totalMarhun += marhun;
            totalDailyRate += dailyRate;

            items.push({
                grade,
                weight,
                price,
                marhun,
                dailyRate
            });
        }
    });

    totalWeight = Math.round(totalWeight * 100) / 100;
    totalMarhun = Math.round(totalMarhun * 100) / 100;
    totalDailyRate = Math.round(totalDailyRate * 100) / 100;

    // Tab Name update dynamically
    if (alsaleemTabs && alsaleemTabs.length > 0 && activeAlSaleemTabId) {
        const activeTabIdx = alsaleemTabs.findIndex(t => t.id === activeAlSaleemTabId);
        if (activeTabIdx !== -1) {
            if (items.length > 0) {
                alsaleemTabs[activeTabIdx].name = `Simpan ${items[0].grade} (Tab ${activeTabIdx + 1})`;
            } else {
                alsaleemTabs[activeTabIdx].name = `Simpan ${activeTabIdx + 1}`;
            }
            renderAlSaleemTabsBar();
        }
    }

    if (hasInvalid || items.length === 0) {
        promptEl.style.display = 'flex';
        resultsEl.style.display = 'none';
        alsaleemCalculationState = null;
        return;
    }

    promptEl.style.display = 'none';
    resultsEl.style.display = 'block';

    // Dates duration calculation
    const startDateInput = document.getElementById('alsaleemStartDate');
    const endDateInput = document.getElementById('alsaleemEndDate');
    
    let days = 0;
    let totalUpah = 0;
    let pawnDate = new Date();
    let endDate = new Date();

    if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
        pawnDate = new Date(startDateInput.value);
        endDate = new Date(endDateInput.value);
        
        // Reset times for date-only comparison
        pawnDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);

        const diffTime = endDate.getTime() - pawnDate.getTime();
        days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        if (days < 0) days = 0;
        
        totalUpah = Math.round(totalDailyRate * days * 100) / 100;
    }

    // Render items table
    const rowsHtml = items.map((it, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><b>${it.grade}</b></td>
            <td>${it.weight.toFixed(2)} g</td>
            <td>${formatCurrency(it.price)}/g</td>
            <td>${formatCurrency(it.marhun)}</td>
            <td align="right">${formatCurrency(it.dailyRate)}/hari</td>
        </tr>
    `).join('');

    const tableHtml = `
        <div class="table-responsive mb-4" style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
            <table class="table" style="margin-bottom: 0; font-size: 0.8rem;">
                <thead style="background: rgba(0,0,0,0.1)">
                    <tr>
                        <th>BIL</th>
                        <th>Mutu</th>
                        <th>Berat</th>
                        <th>Semasa/g</th>
                        <th>Marhun</th>
                        <th style="text-align: right">Upah Simpan/Hari</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
                <tfoot>
                    <tr style="background: rgba(0,0,0,0.05); font-weight: bold;">
                        <td colspan="2" align="right">Jumlah:</td>
                        <td>${totalWeight.toFixed(2)} g</td>
                        <td></td>
                        <td>${formatCurrency(totalMarhun)}</td>
                        <td align="right" class="text-green">${formatCurrency(totalDailyRate)}/hari</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    contentEl.innerHTML = tableHtml;

    // Render duration simulation details
    if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
        detailsEl.innerHTML = `
            <div style="background: var(--bg-input); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem; text-align: center; color: var(--text-muted);">
                ⚠️ Sila pilih Tarikh Mula Simpan dan Tarikh Tebus untuk simulasi kadar upah terkumpul.
            </div>
        `;
        alsaleemCalculationState = null;
    } else if (days <= 0 || endDate < pawnDate) {
        detailsEl.innerHTML = `
            <div style="background: var(--bg-input); padding: 16px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.85rem; text-align: center; color: var(--danger);">
                ❌ Ralat: Tarikh Tebus tidak boleh mendahului Tarikh Mula Simpan.
            </div>
        `;
        alsaleemCalculationState = null;
    } else {
        detailsEl.innerHTML = `
            <div style="background: var(--bg-input); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>Tempoh Simpanan:</span>
                    <b class="text-green">${days} Hari</b>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>Upah Simpan Harian Keseluruhan:</span>
                    <b>${formatCurrency(totalDailyRate)} / hari</b>
                </div>
                <hr style="border:none; border-top: 1px solid var(--border-color); margin: 12px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size: 1.05rem;">
                    <span style="font-weight: 600;">Jumlah Upah Simpan Terkumpul:</span>
                    <b class="text-green">${formatCurrency(totalUpah)}</b>
                </div>
            </div>
        `;

        alsaleemCalculationState = {
            isAlSaleem: true,
            items,
            totalWeight,
            totalMarhun,
            totalDailyRate,
            pawnDate,
            endDate,
            days,
            totalUpah
        };
    }

    if (activeId) {
        const newActiveEl = document.getElementById(activeId);
        if (newActiveEl) {
            newActiveEl.focus();
            if (newActiveEl.setSelectionRange && (newActiveEl.type === 'text' || newActiveEl.type === 'search' || newActiveEl.type === 'tel' || newActiveEl.type === 'url')) {
                try {
                    newActiveEl.setSelectionRange(selectionStart, selectionEnd);
                } catch (e) {
                    // ignore
                }
            }
        }
    }
}
