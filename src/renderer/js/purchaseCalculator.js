// --- Gold Purchase Calculator Engine & UI Module ---
import { formatCurrency, showAlert } from './config.js';
import { goldPrices } from './prices.js';

export let purchaseTabs = [];
export let activePurchaseTabId = null;
export let purchaseCalculationState = null;

const purchaseRates = {
    '999': 84,
    '950': 84,
    '916': 83,
    '875': 82,
    '835': 80,
    '750': 82,
    '700 WG': 65,
    '750 WG': 65
};

export function getDefaultPurchaseTabState(id, name) {
    return {
        id,
        name,
        items: [{ grade: '', weight: '' }]
    };
}

export function initPurchaseTabs() {
    purchaseTabs = [];
    const firstTab = getDefaultPurchaseTabState('p-tab-1', 'Belian 1');
    purchaseTabs.push(firstTab);
    loadPurchaseTabState('p-tab-1');

    const tabsBar = document.getElementById('purchaseCalcTabsBar');
    if (tabsBar) {
        tabsBar.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabsBar.scrollLeft += e.deltaY * 0.8;
            }
        });
    }
}

export function saveActivePurchaseTabState() {
    if (!activePurchaseTabId) return;
    const tab = purchaseTabs.find(t => t.id === activePurchaseTabId);
    if (!tab) return;

    tab.items = [];
    document.querySelectorAll('#purchaseItemsContainer > .item-row').forEach(row => {
        const gradeSelect = row.querySelector('.purchase-item-grade');
        const weightInput = row.querySelector('.purchase-item-weight');
        if (gradeSelect && weightInput) {
            tab.items.push({
                grade: gradeSelect.value,
                weight: weightInput.value
            });
        }
    });
}

export function loadPurchaseTabState(tabId) {
    const tab = purchaseTabs.find(t => t.id === tabId);
    if (!tab) return;
    activePurchaseTabId = tab.id;

    const itemsContainer = document.getElementById('purchaseItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        if (tab.items.length === 0) {
            tab.items.push({ grade: '', weight: '' });
        }
        tab.items.forEach(it => {
            const rowId = 'p-row-' + Math.random().toString(36).substr(2, 9);
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
                    <select class="purchase-item-grade" onchange="calculatePurchase()">${gradeOpts}</select>
                </div>
                <div>
                    <label>Berat (g)</label>
                    <input type="number" class="purchase-item-weight" placeholder="0.00" step="0.01" value="${it.weight}" oninput="calculatePurchase()">
                </div>
                <div>
                    <label>&nbsp;</label>
                    <button class="btn-icon" onclick="removePurchaseItemRow('${rowId}')">🗑️</button>
                </div>
            `;
            itemsContainer.appendChild(div);
        });
    }

    calculatePurchase();
    renderPurchaseTabsBar();
}

export function renderPurchaseTabsBar() {
    const tabsBar = document.getElementById('purchaseCalcTabsBar');
    if (!tabsBar) return;

    tabsBar.innerHTML = '';

    purchaseTabs.forEach(tab => {
        const div = document.createElement('div');
        div.className = 'calc-tab' + (tab.id === activePurchaseTabId ? ' active' : '');
        div.onclick = (e) => {
            if (e.target.classList.contains('calc-tab-close')) return;
            switchPurchaseTab(tab.id);
        };

        const labelSpan = document.createElement('span');
        labelSpan.textContent = tab.name;
        div.appendChild(labelSpan);

        if (purchaseTabs.length > 1) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'calc-tab-close';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                closePurchaseTab(tab.id);
            };
            div.appendChild(closeBtn);
        }

        tabsBar.appendChild(div);
    });

    if (purchaseTabs.length < 10) {
        const addBtn = document.createElement('div');
        addBtn.className = 'calc-tab-add';
        addBtn.innerHTML = '＋';
        addBtn.title = 'Tambah Tab Belian Baru';
        addBtn.onclick = () => addNewPurchaseTab();
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

export function addNewPurchaseTab() {
    if (purchaseTabs.length >= 10) {
        showAlert('Maksimum 10 tab pengiraan belian dibenarkan.');
        return;
    }
    saveActivePurchaseTabState();

    const newId = 'p-tab-' + Date.now();
    const name = `Belian ${purchaseTabs.length + 1}`;
    const newTab = getDefaultPurchaseTabState(newId, name);

    purchaseTabs.push(newTab);
    loadPurchaseTabState(newId);
}

export function closePurchaseTab(id) {
    if (purchaseTabs.length <= 1) return;

    const idx = purchaseTabs.findIndex(t => t.id === id);
    if (idx === -1) return;

    if (id === activePurchaseTabId) {
        const newActiveIdx = idx === 0 ? 1 : idx - 1;
        const newActiveId = purchaseTabs[newActiveIdx].id;
        purchaseTabs.splice(idx, 1);
        loadPurchaseTabState(newActiveId);
    } else {
        purchaseTabs.splice(idx, 1);
        renderPurchaseTabsBar();
    }
}

export function switchPurchaseTab(id) {
    if (id === activePurchaseTabId) return;
    saveActivePurchaseTabState();
    loadPurchaseTabState(id);
}

export function resetPurchaseCalculator() {
    if (!activePurchaseTabId) return;
    const idx = purchaseTabs.findIndex(t => t.id === activePurchaseTabId);
    if (idx === -1) return;

    const defaultName = `Belian ${idx + 1}`;
    const freshTab = getDefaultPurchaseTabState(activePurchaseTabId, defaultName);
    purchaseTabs[idx] = freshTab;

    loadPurchaseTabState(activePurchaseTabId);
}

export function addNewPurchaseItemRow() {
    const itemsContainer = document.getElementById('purchaseItemsContainer');
    if (!itemsContainer) return;

    const rowId = 'p-row-' + Date.now();
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
            <select class="purchase-item-grade" onchange="calculatePurchase()">${gradeOpts}</select>
        </div>
        <div>
            <label>Berat (g)</label>
            <input type="number" class="purchase-item-weight" placeholder="0.00" step="0.01" oninput="calculatePurchase()">
        </div>
        <div>
            <label>&nbsp;</label>
            <button class="btn-icon" onclick="removePurchaseItemRow('${rowId}')">🗑️</button>
        </div>
    `;
    itemsContainer.appendChild(div);
}

export function removePurchaseItemRow(rowId) {
    const rows = document.querySelectorAll('#purchaseItemsContainer > .item-row');
    if (rows.length > 1) {
        const target = document.getElementById(rowId);
        if (target) {
            target.remove();
        }
        calculatePurchase();
    } else {
        showAlert('Perlu sekurang-kurangnya satu barang belian.');
    }
}

export function calculatePurchase() {
    const promptEl = document.getElementById('purchase-calc-prompt');
    const resultsEl = document.getElementById('purchase-calc-results');
    const contentEl = document.getElementById('purchaseResultContent');
    if (!promptEl || !resultsEl || !contentEl) return;

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
    let totalPurchase = 0;
    const items = [];
    let hasInvalid = false;

    document.querySelectorAll('#purchaseItemsContainer > .item-row').forEach(row => {
        const gradeSelect = row.querySelector('.purchase-item-grade');
        const weightInput = row.querySelector('.purchase-item-weight');
        if (!gradeSelect || !weightInput) return;

        const grade = gradeSelect.value;
        const weight = parseFloat(weightInput.value) || 0;

        if (weight > 0 && !grade) {
            hasInvalid = true;
        }

        if (weight > 0 && grade) {
            const price = goldPrices[grade] || 0;
            const rate = purchaseRates[grade] || 0;
            const belianPrice = Math.round(price * rate) / 100;
            const marhun = weight * price;
            const purchaseValue = Math.round(weight * belianPrice * 20) / 20;

            totalWeight += weight;
            totalMarhun += marhun;
            totalPurchase += purchaseValue;

            items.push({
                grade,
                weight,
                price,
                rate,
                belianPrice,
                marhun,
                purchaseValue
            });
        }
    });

    totalWeight = Math.round(totalWeight * 100) / 100;
    totalMarhun = Math.round(totalMarhun * 100) / 100;
    totalPurchase = Math.round(totalPurchase * 20) / 20;

    if (purchaseTabs && purchaseTabs.length > 0 && activePurchaseTabId) {
        const activeTabIdx = purchaseTabs.findIndex(t => t.id === activePurchaseTabId);
        if (activeTabIdx !== -1) {
            if (items.length > 0) {
                purchaseTabs[activeTabIdx].name = `Belian ${items[0].grade} (Tab ${activeTabIdx + 1})`;
            } else {
                purchaseTabs[activeTabIdx].name = `Belian ${activeTabIdx + 1}`;
            }
            renderPurchaseTabsBar();
        }
    }

    if (hasInvalid || items.length === 0) {
        promptEl.style.display = 'flex';
        resultsEl.style.display = 'none';
        return;
    }

    promptEl.style.display = 'none';
    resultsEl.style.display = 'block';

    const rowsHtml = items.map((it, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><b>${it.grade}</b></td>
            <td>${it.weight.toFixed(2)} g</td>
            <td>${formatCurrency(it.price)}/g</td>
            <td>${formatCurrency(it.belianPrice)}/g <span class="text-xs text-muted">(${it.rate}%)</span></td>
            <td>${formatCurrency(it.marhun)}</td>
            <td align="right"><b>${formatCurrency(it.purchaseValue)}</b></td>
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
                        <th>Belian/g</th>
                        <th>Marhun</th>
                        <th style="text-align: right">Nilai Belian</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
                <tfoot>
                    <tr style="background: rgba(0,0,0,0.05); font-weight: bold;">
                        <td colspan="2" align="right">Jumlah:</td>
                        <td>${totalWeight.toFixed(2)} g</td>
                        <td colspan="2"></td>
                        <td>${formatCurrency(totalMarhun)}</td>
                        <td align="right" class="text-green">${formatCurrency(totalPurchase)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    contentEl.innerHTML = tableHtml;

    purchaseCalculationState = {
        isPurchase: true,
        items,
        totalWeight,
        totalMarhun,
        totalPurchase,
        pawnDate: new Date()
    };

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

export function showPurchasePrintWarning() {
    const title = document.querySelector('#printWarningModal h3');
    if (title) title.textContent = 'Draf Cetakan Simulasi Belian Emas';
    
    const modal = document.getElementById('printWarningModal');
    if (modal) modal.classList.add('active');
}
