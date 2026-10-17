// --- Ar Rahnu Calculator Engine & UI Module ---
import { products, formatCurrency, formatDate, addMonths, showAlert, getDefaultTabState } from './config.js';
import { goldPrices } from './prices.js';

export let selectedProduct = null;
export let calculationState = null;
export let tabs = [];
export let activeTabId = null;

export function initTabs() {
    tabs = [];
    const firstTab = getDefaultTabState('tab-1', 'Kiraan 1');
    tabs.push(firstTab);
    loadTabState('tab-1');

    const tabsBar = document.getElementById('calcTabsBar');
    if (tabsBar) {
        tabsBar.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabsBar.scrollLeft += e.deltaY * 0.8; // Smooth factor multiplier
            }
        });
    }
}

export function saveActiveTabState() {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;

    // 1. Product
    tab.selectedProductId = selectedProduct ? selectedProduct.id : null;

    // 2. Items
    tab.items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const gradeSelect = row.querySelector('.item-grade');
        const weightInput = row.querySelector('.item-weight');
        if (gradeSelect && weightInput) {
            tab.items.push({
                grade: gradeSelect.value,
                weight: weightInput.value
            });
        }
    });

    // 3. Old tickets
    tab.oldTickets = [];
    document.querySelectorAll('.ticket-row').forEach(row => {
        const refInput = row.querySelector('.ticket-ref');
        const amtInput = row.querySelector('.ticket-amount');
        if (refInput && amtInput) {
            tab.oldTickets.push({
                ref: refInput.value,
                amt: amtInput.value
            });
        }
    });

    // 4. Input values
    tab.belianEmasVal = document.getElementById('belianEmasVal')?.value || '';
    tab.cuciEmasVal = document.getElementById('cuciEmasVal')?.value || '';
    tab.ujiEmasVal = document.getElementById('ujiEmasVal')?.value || '';

    // 5. Checkboxes
    tab.iprotect1 = document.getElementById('iprotect1_cb')?.checked || false;
    tab.iprotect2 = document.getElementById('iprotect2_cb')?.checked || false;
    tab.flexipa = document.getElementById('flexipa_cb')?.checked || false;
    tab.newmember = document.getElementById('newmember_cb')?.checked || false;
    tab.sag = document.getElementById('sag_cb')?.checked || false;
    tab.suratWakilTebus = document.getElementById('suratWakilTebus_cb')?.checked || false;

    // 6. Dynamic other cash
    tab.otherCash = [];
    document.querySelectorAll('#otherCashContainer > .dynamic-row').forEach(row => {
        const nameInput = row.querySelector('.other-cash-name');
        const valInput = row.querySelector('.other-cash-val');
        if (nameInput && valInput) {
            tab.otherCash.push({
                name: nameInput.value,
                val: valInput.value
            });
        }
    });

    // 7. Dynamic other charges
    tab.others = [];
    document.querySelectorAll('#othersContainer > .dynamic-row').forEach(row => {
        const nameInput = row.querySelector('.other-name');
        const valInput = row.querySelector('.other-val');
        if (nameInput && valInput) {
            tab.others.push({
                name: nameInput.value,
                val: valInput.value
            });
        }
    });

    // 8. Custom financing value
    tab.customFinancingVal = document.getElementById('customFinancingVal')?.value || '';

    // 9. Cash paid value
    tab.cashPaidVal = document.getElementById('cashPaidVal')?.value || '';

    // 10. Tukar Surat (Gadai Semula)
    tab.tukarSurat = document.getElementById('tukarSurat_cb')?.checked || false;
    tab.tukarSuratRef = document.getElementById('tukarSuratRef')?.value || '';
    tab.tukarSuratTebus = document.getElementById('tukarSuratTebus')?.value || '';
    tab.tukarSuratPembiayaan = document.getElementById('tukarSuratPembiayaan')?.value || '';
}

export function handleTukarSuratToggle() {
    const cb = document.getElementById('tukarSurat_cb');
    const fields = document.getElementById('tukarSuratFields');
    if (cb && fields) {
        fields.style.display = cb.checked ? 'block' : 'none';
    }
    calculateAll();
}

export function loadTabState(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    activeTabId = tab.id;

    // 1. Product selection
    if (tab.selectedProductId) {
        selectedProduct = products.find(p => p.id === tab.selectedProductId);
        document.querySelectorAll('.product-card').forEach(el => el.classList.remove('selected'));
        const selectedEl = document.getElementById(`prod-${tab.selectedProductId}`);
        if (selectedEl) {
            selectedEl.classList.add('selected');
        }
    } else {
        selectedProduct = null;
        document.querySelectorAll('.product-card').forEach(el => el.classList.remove('selected'));
    }

    // 2. Items
    const itemsContainer = document.getElementById('itemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        if (tab.items.length === 0) {
            tab.items.push({ grade: '', weight: '' });
        }
        tab.items.forEach(it => {
            const rowId = 'row-' + Math.random().toString(36).substr(2, 9);
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
                    <select class="item-grade" onchange="calculateAll()">${gradeOpts}</select>
                </div>
                <div>
                    <label>Berat (g)</label>
                    <input type="number" class="item-weight" placeholder="0.00" step="0.01" value="${it.weight}" oninput="calculateAll()">
                </div>
                <div>
                    <label>&nbsp;</label>
                    <button class="btn-icon" onclick="removeItemRow('${rowId}')">🗑️</button>
                </div>
            `;
            itemsContainer.appendChild(div);
        });
    }

    // 3. Old tickets
    const oldTicketsContainer = document.getElementById('oldTicketsContainer');
    if (oldTicketsContainer) {
        oldTicketsContainer.innerHTML = '';
        tab.oldTickets.forEach(tk => {
            const rowId = 'ticket-' + Math.random().toString(36).substr(2, 9);
            const div = document.createElement('div');
            div.className = 'ticket-row';
            div.id = rowId;

            div.innerHTML = `
                <div>
                    <label>No. Rujukan Surat</label>
                    <input type="text" class="ticket-ref" placeholder="Cth: A1234-5678" value="${tk.ref || ''}">
                </div>
                <div>
                    <label>Jumlah Tebus (RM)</label>
                    <input type="number" class="ticket-amount" placeholder="0.00" step="0.01" value="${tk.amt || ''}" oninput="calculateAll()">
                </div>
                <div>
                    <label>&nbsp;</label>
                    <button class="btn-icon" onclick="document.getElementById('${rowId}').remove(); calculateAll();">🗑️</button>
                </div>
            `;
            oldTicketsContainer.appendChild(div);
        });
    }

    // 4. Simple inputs
    const belianEmasEl = document.getElementById('belianEmasVal');
    if (belianEmasEl) belianEmasEl.value = tab.belianEmasVal;

    const cuciEmasEl = document.getElementById('cuciEmasVal');
    if (cuciEmasEl) cuciEmasEl.value = tab.cuciEmasVal;

    const ujiEmasEl = document.getElementById('ujiEmasVal');
    if (ujiEmasEl) ujiEmasEl.value = tab.ujiEmasVal;

    // 5. Checkboxes
    const ip1El = document.getElementById('iprotect1_cb');
    if (ip1El) ip1El.checked = tab.iprotect1;

    const ip2El = document.getElementById('iprotect2_cb');
    if (ip2El) ip2El.checked = tab.iprotect2;

    const flexiPaEl = document.getElementById('flexipa_cb');
    if (flexiPaEl) flexiPaEl.checked = tab.flexipa;

    const newMemberEl = document.getElementById('newmember_cb');
    if (newMemberEl) newMemberEl.checked = tab.newmember;

    const sagEl = document.getElementById('sag_cb');
    if (sagEl) sagEl.checked = tab.sag;

    const suratWakilTebusEl = document.getElementById('suratWakilTebus_cb');
    if (suratWakilTebusEl) suratWakilTebusEl.checked = tab.suratWakilTebus;

    // 6. Dynamic other cash
    const otherCashContainer = document.getElementById('otherCashContainer');
    if (otherCashContainer) {
        otherCashContainer.innerHTML = '';
        tab.otherCash.forEach(oc => {
            const rowId = 'other-cash-' + Math.random().toString(36).substr(2, 9);
            const div = document.createElement('div');
            div.className = 'dynamic-row';
            div.id = rowId;

            div.innerHTML = `
                <input type="text" class="other-cash-name" placeholder="Sumber (cth: Lebihan Lelong)" value="${oc.name || ''}">
                <input type="number" class="other-cash-val" placeholder="0.00" step="0.01" value="${oc.val || ''}" oninput="calculateAll()">
                <button class="btn-icon" onclick="document.getElementById('${rowId}').remove(); calculateAll();" style="width:36px; height:36px;">✕</button>
            `;
            otherCashContainer.appendChild(div);
        });
    }

    // 7. Dynamic other charges
    const othersContainer = document.getElementById('othersContainer');
    if (othersContainer) {
        othersContainer.innerHTML = '';
        tab.others.forEach(oth => {
            const rowId = 'other-charge-' + Math.random().toString(36).substr(2, 9);
            const div = document.createElement('div');
            div.className = 'dynamic-row';
            div.id = rowId;

            div.innerHTML = `
                <input type="text" class="other-name" placeholder="Caj (cth: Jualan Goldbar)" value="${oth.name || ''}">
                <input type="number" class="other-val" placeholder="0.00" step="0.01" value="${oth.val || ''}" oninput="calculateAll()">
                <button class="btn-icon" onclick="document.getElementById('${rowId}').remove(); calculateAll();" style="width:36px; height:36px;">✕</button>
            `;
            othersContainer.appendChild(div);
        });
    }

    // 8. Tukar Surat (Gadai Semula)
    const tukarSuratCb = document.getElementById('tukarSurat_cb');
    const tukarSuratFields = document.getElementById('tukarSuratFields');
    const tukarSuratRef = document.getElementById('tukarSuratRef');
    const tukarSuratTebus = document.getElementById('tukarSuratTebus');
    const tukarSuratPembiayaan = document.getElementById('tukarSuratPembiayaan');

    if (tukarSuratCb) {
        tukarSuratCb.checked = tab.tukarSurat || false;
    }
    if (tukarSuratFields) {
        tukarSuratFields.style.display = tab.tukarSurat ? 'block' : 'none';
    }
    if (tukarSuratRef) tukarSuratRef.value = tab.tukarSuratRef || '';
    if (tukarSuratTebus) tukarSuratTebus.value = tab.tukarSuratTebus || '';
    if (tukarSuratPembiayaan) tukarSuratPembiayaan.value = tab.tukarSuratPembiayaan || '';

    // Trigger calculation
    calculateAll(false);

    // Apply custom values post-calculation
    const customFinancingEl = document.getElementById('customFinancingVal');
    if (customFinancingEl && tab.customFinancingVal !== '') {
        customFinancingEl.value = tab.customFinancingVal;
        calculateAll(false);
    }

    const cashPaidEl = document.getElementById('cashPaidVal');
    if (cashPaidEl && tab.cashPaidVal !== '') {
        cashPaidEl.value = tab.cashPaidVal;
        const deficit = calculationState ? calculationState.deficit : 0;
        handleDeficitCashInput(cashPaidEl, deficit);
    }

    renderTabsBar();
}

export function renderTabsBar() {
    const tabsBar = document.getElementById('calcTabsBar');
    if (!tabsBar) return;

    tabsBar.innerHTML = '';

    tabs.forEach(tab => {
        const div = document.createElement('div');
        div.className = 'calc-tab' + (tab.id === activeTabId ? ' active' : '');
        div.onclick = (e) => {
            if (e.target.classList.contains('calc-tab-close')) return;
            switchTab(tab.id);
        };

        const labelSpan = document.createElement('span');
        labelSpan.textContent = tab.name;
        div.appendChild(labelSpan);

        if (tabs.length > 1) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'calc-tab-close';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                closeTab(tab.id);
            };
            div.appendChild(closeBtn);
        }

        tabsBar.appendChild(div);
    });

    if (tabs.length < 10) {
        const addBtn = document.createElement('div');
        addBtn.className = 'calc-tab-add';
        addBtn.innerHTML = '＋';
        addBtn.title = 'Tambah Kiraan Baru (Tab)';
        addBtn.onclick = () => addNewTab();
        tabsBar.appendChild(addBtn);
    }

    // Smooth scroll the active tab into view horizontally inside tabsBar (without page jumping)
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

export function addNewTab() {
    if (tabs.length >= 10) {
        showAlert('Maksimum 10 tab pengiraan dibenarkan.');
        return;
    }
    saveActiveTabState();

    const newId = 'tab-' + Date.now();
    const name = `Kiraan ${tabs.length + 1}`;
    const newTab = getDefaultTabState(newId, name);

    tabs.push(newTab);
    loadTabState(newId);
}

export function closeTab(id) {
    if (tabs.length <= 1) return;

    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;

    if (id === activeTabId) {
        const newActiveIdx = idx === 0 ? 1 : idx - 1;
        const newActiveId = tabs[newActiveIdx].id;
        tabs.splice(idx, 1);
        loadTabState(newActiveId);
    } else {
        tabs.splice(idx, 1);
        renderTabsBar();
    }
}

export function switchTab(id) {
    if (id === activeTabId) return;
    saveActiveTabState();
    loadTabState(id);
}

export function resetCalculator() {
    if (!activeTabId) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    if (idx === -1) return;

    const defaultName = `Kiraan ${idx + 1}`;
    const freshTab = getDefaultTabState(activeTabId, defaultName);
    tabs[idx] = freshTab;

    loadTabState(activeTabId);
}

export function selectProduct(id) {
    selectedProduct = products.find(p => p.id === id);
    document.querySelectorAll('.product-card').forEach(el => el.classList.remove('selected'));
    
    const selectedEl = document.getElementById(`prod-${id}`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }
    
    calculateAll();
}

export function renderProducts() {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    productsContainer.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.id = `prod-${p.id}`;
        div.onclick = () => window.selectProduct(p.id);

        const rateText = p.isDaily ? `RM ${p.rate.toFixed(2)} / RM100 sehari` : `RM ${p.rate.toFixed(2)} / RM100 sebulan`;
        const tenureText = p.canExtend ? `${p.tenure} + 6 Bulan (12 Bulan)` : `${p.tenure} Bulan`;

        div.innerHTML = `
            <div class="product-title">${p.name}</div>
            <div class="product-details">
                <p>Pembiayaan <span>${p.margin}%</span></p>
                <p>Tempoh <span>${tenureText}</span></p>
                <p>Kadar Upah Simpan <span>${rateText}</span></p>
            </div>
        `;
        productsContainer.appendChild(div);
    });
}

// --- Row Manipulations ---
export function addNewItemRow() {
    const itemsContainer = document.getElementById('itemsContainer');
    if (!itemsContainer) return;

    const rowId = 'row-' + Date.now();
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
            <select class="item-grade" onchange="calculateAll()">${gradeOpts}</select>
        </div>
        <div>
            <label>Berat (g)</label>
            <input type="number" class="item-weight" placeholder="0.00" step="0.01" oninput="calculateAll()">
        </div>
        <div>
            <label>&nbsp;</label>
            <button class="btn-icon" onclick="removeItemRow('${rowId}')">🗑️</button>
        </div>
    `;
    itemsContainer.appendChild(div);
}

export function removeItemRow(rowId) {
    const rows = document.querySelectorAll('.item-row');
    if (rows.length > 1) {
        const target = document.getElementById(rowId);
        if (target) {
            target.remove();
        }
        calculateAll();
    } else {
        showAlert('Perlu sekurang-kurangnya satu barang gadaian.');
    }
}

export function addNewOldTicketRow() {
    const oldTicketsContainer = document.getElementById('oldTicketsContainer');
    if (!oldTicketsContainer) return;

    const rowId = 'ticket-' + Date.now();
    const div = document.createElement('div');
    div.className = 'ticket-row';
    div.id = rowId;

    div.innerHTML = `
        <div>
            <label>No. Rujukan Surat</label>
            <input type="text" class="ticket-ref" placeholder="Cth: A1234-5678">
        </div>
        <div>
            <label>Jumlah Tebus (RM)</label>
            <input type="number" class="ticket-amount" placeholder="0.00" step="0.01" oninput="calculateAll()">
        </div>
        <div>
            <label>&nbsp;</label>
            <button class="btn-icon" onclick="document.getElementById('${rowId}').remove(); calculateAll();">🗑️</button>
        </div>
    `;
    oldTicketsContainer.appendChild(div);
}

export function addOtherCashRow() {
    const otherCashContainer = document.getElementById('otherCashContainer');
    if (!otherCashContainer) return;

    const rowId = 'other-cash-' + Date.now();
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.id = rowId;

    div.innerHTML = `
        <input type="text" class="other-cash-name" placeholder="Sumber (cth: Lebihan Lelong)">
        <input type="number" class="other-cash-val" placeholder="0.00" step="0.01" oninput="calculateAll()">
        <button class="btn-icon" onclick="document.getElementById('${rowId}').remove(); calculateAll();" style="width:36px; height:36px;">✕</button>
    `;
    otherCashContainer.appendChild(div);
}

export function addOtherRow() {
    const othersContainer = document.getElementById('othersContainer');
    if (!othersContainer) return;

    const rowId = 'other-charge-' + Date.now();
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.id = rowId;

    div.innerHTML = `
        <input type="text" class="other-name" placeholder="Caj (cth: Jualan Goldbar)">
        <input type="number" class="other-val" placeholder="0.00" step="0.01" oninput="calculateAll()">
        <button class="btn-icon" onclick="document.getElementById('${rowId}').remove(); calculateAll();" style="width:36px; height:36px;">✕</button>
    `;
    othersContainer.appendChild(div);
}

export function handleIProtectChange(version) {
    const ip1 = document.getElementById('iprotect1_cb');
    const ip2 = document.getElementById('iprotect2_cb');
    if (!ip1 || !ip2) return;

    if (version === '1.0' && ip1.checked) {
        ip2.checked = false;
    } else if (version === '2.0' && ip2.checked) {
        ip1.checked = false;
    }
    calculateAll();
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
}

export function calculateAll(freshCustomFinancing = true) {
    const calcPrompt = document.getElementById('calc-prompt');
    const calcResults = document.getElementById('calc-results');
    const standardResultContent = document.getElementById('standardResultContent');
    if (!calcPrompt || !calcResults || !standardResultContent) return;

    if (tabs && tabs.length > 0 && activeTabId) {
        const activeTabIdx = tabs.findIndex(t => t.id === activeTabId);
        if (activeTabIdx !== -1) {
            const isTS = document.getElementById('tukarSurat_cb')?.checked || false;
            const suffix = isTS ? ' [TS]' : '';
            if (selectedProduct) {
                tabs[activeTabIdx].name = `${selectedProduct.name}${suffix} (Tab ${activeTabIdx + 1})`;
            } else {
                tabs[activeTabIdx].name = `Kiraan ${activeTabIdx + 1}`;
            }
            renderTabsBar();
        }
    }

    // Record current active element and selection range to prevent focus loss
    const activeEl = document.activeElement;
    const activeId = activeEl ? activeEl.id : null;
    let selectionStart = 0;
    let selectionEnd = 0;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        selectionStart = activeEl.selectionStart;
        selectionEnd = activeEl.selectionEnd;
    }

    if (!selectedProduct) {
        calcPrompt.style.display = 'flex';
        calcPrompt.innerHTML = `
            <div class="prompt-icon">ℹ️</div>
            <div>Sila pilih produk dan masukkan berat barang gadaian untuk menjana rumusan pengiraan.</div>
        `;
        calcResults.style.display = 'none';
        return;
    }

    // 1. Parse Gadaian Items
    let totalMarhun = 0;
    let totalWeight = 0;
    const items = [];
    let hasInvalid = false;

    document.querySelectorAll('.item-row').forEach(row => {
        const gradeSelect = row.querySelector('.item-grade');
        const weightInput = row.querySelector('.item-weight');
        if (!gradeSelect || !weightInput) return;

        const grade = gradeSelect.value;
        const weight = parseFloat(weightInput.value) || 0;

        if (weight > 0 && !grade) {
            hasInvalid = true;
        }

        if (weight > 0 && grade) {
            const price = goldPrices[grade] || 0;
            const marhun = weight * price;
            totalMarhun += marhun;
            totalWeight += weight;
            items.push({ grade, weight, marhun, price });
        }
    });

    if (hasInvalid || totalMarhun === 0) {
        calcPrompt.style.display = 'flex';
        calcPrompt.innerHTML = `
            <div class="prompt-icon">ℹ️</div>
            <div>Sila pilih produk dan masukkan berat barang gadaian untuk menjana rumusan pengiraan.</div>
        `;
        calcResults.style.display = 'none';
        return;
    }

    // Tukar Surat (Gadai Semula) Check & Validation
    const isTukarSurat = document.getElementById('tukarSurat_cb')?.checked || false;
    const tukarSuratRef = document.getElementById('tukarSuratRef')?.value.trim() || '';
    const tukarSuratTebusVal = parseFloat(document.getElementById('tukarSuratTebus')?.value) || 0;
    const tukarSuratPembiayaanVal = parseFloat(document.getElementById('tukarSuratPembiayaan')?.value) || 0;

    if (isTukarSurat && (tukarSuratTebusVal <= 0 || tukarSuratPembiayaanVal <= 0)) {
        calcPrompt.style.display = 'flex';
        calcPrompt.innerHTML = `
            <div class="prompt-icon">⚠️</div>
            <div>
                <strong>Mod Tukar Surat Aktif:</strong> Sila lengkapkan <strong>Jumlah Tebus Surat Lama</strong> dan <strong>Pembiayaan Surat Lama</strong> (kedua-dua medan ini wajib diisi).
            </div>
        `;
        calcResults.style.display = 'none';
        return;
    }

    calcPrompt.style.display = 'none';
    calcResults.style.display = 'block';

    // 2. Jumlah Pembiayaan Maksimum (Pindaan 1 Oktober 2026 - Versi 2.0)
    // Formula asas: Jumlah Marhun * Margin%.
    // Mengikut piawaian, nilai sen dibuang (Math.floor).
    // Pindaan 1 Oktober 2026: Jika nilai sen adalah RM 0.99 (>= 99 sen selepas dibundar 2 tempat perpuluhan),
    // nilai pembiayaan digenapkan ke atas (Math.ceil) kepada Ringgit seterusnya (Cth: RM556.99 -> RM557.00).
    const financingRaw = totalMarhun * (selectedProduct.margin / 100);
    const roundedFinancingRaw = Math.round(financingRaw * 100) / 100;
    const floorFinancing = Math.floor(roundedFinancingRaw);
    const cents = Math.round((roundedFinancingRaw - floorFinancing) * 100);
    const financingMax = (cents >= 99) ? Math.ceil(roundedFinancingRaw) : floorFinancing;

    // Financing Amount Logic
    let financingAmount = financingMax;
    let cajTukarSurat = 0;

    if (isTukarSurat) {
        // Jika tukar surat aktif, sistem secara automatik menggunakan pembiayaan lama (tidak boleh menggunakan pembiayaan baru) dan dikenakan caj tukar surat RM10
        financingAmount = tukarSuratPembiayaanVal;
        cajTukarSurat = 10.00;
    } else {
        // Custom financing request
        const customFinancingInput = document.getElementById('customFinancingVal');
        if (customFinancingInput && !freshCustomFinancing) {
            const rawVal = customFinancingInput.value.replace(/[^0-9]/g, '');
            const customVal = parseFloat(rawVal);
            if (!isNaN(customVal)) {
                if (customVal > financingMax) {
                    financingAmount = financingMax;
                } else if (customVal < 0) {
                    financingAmount = 0;
                } else {
                    financingAmount = Math.floor(customVal);
                }
            }
        }
    }

    // 3. Storage Fee Calculations
    const dailyRateFactor = selectedProduct.isDaily ? (selectedProduct.rate / 100) : (selectedProduct.rate / 100) * (12 / 365);
    let dailyRate = totalMarhun * dailyRateFactor;
    dailyRate = Math.round(dailyRate * 100) / 100; // Round to 2 decimals

    const upah60Days = dailyRate * 60;

    // 4. Deductions / Additions
    let iProtect = 0;
    let iProtectTransFee = 0;
    let iProtectLabel = 'I-Protect';

    const ip1El = document.getElementById('iprotect1_cb');
    const ip2El = document.getElementById('iprotect2_cb');
    const ip1 = ip1El ? ip1El.checked : false;
    const ip2 = ip2El ? ip2El.checked : false;

    if (ip1) {
        iProtect = totalMarhun <= 1000 ? 1.25 : Math.ceil(totalMarhun / 1000) * 1.25;
        iProtectLabel = 'I-Protect 1.0';
    } else if (ip2) {
        iProtect = totalMarhun <= 1000 ? 2.50 : Math.ceil(totalMarhun / 1000) * 2.50;
        iProtectTransFee = 1.50;
        iProtectLabel = 'I-Protect 2.0';
    }

    const flexiPaEl = document.getElementById('flexipa_cb');
    const newMemberEl = document.getElementById('newmember_cb');
    const sagEl = document.getElementById('sag_cb');
    const suratWakilTebusEl = document.getElementById('suratWakilTebus_cb');

    const flexiPa = flexiPaEl && flexiPaEl.checked ? 64.80 : 0;
    const newMember = newMemberEl && newMemberEl.checked ? 10.00 : 0;
    const sag = sagEl && sagEl.checked ? 10.00 : 0;
    const suratWakilTebus = suratWakilTebusEl && suratWakilTebusEl.checked ? 10.00 : 0;
    
    const cuci = getVal('cuciEmasVal');
    const uji = getVal('ujiEmasVal');
    const belianEmas = getVal('belianEmasVal');

    // Dynamic others deductions
    let othersTotal = 0;
    const othersItems = [];
    document.querySelectorAll('#othersContainer > .dynamic-row').forEach(row => {
        const nameInput = row.querySelector('.other-name');
        const valInput = row.querySelector('.other-val');
        if (!nameInput || !valInput) return;

        const name = nameInput.value.trim();
        const val = parseFloat(valInput.value) || 0;
        if (val > 0) {
            othersTotal += val;
            othersItems.push({ name, val });
        }
    });

    // Dynamic other cash in
    let otherCashTotal = 0;
    const otherCashItems = [];
    document.querySelectorAll('#otherCashContainer > .dynamic-row').forEach(row => {
        const nameInput = row.querySelector('.other-cash-name');
        const valInput = row.querySelector('.other-cash-val');
        if (!nameInput || !valInput) return;

        const name = nameInput.value.trim();
        const val = parseFloat(valInput.value) || 0;
        if (val > 0) {
            otherCashTotal += val;
            otherCashItems.push({ name, val });
        }
    });

    // Redemption old tickets
    let totalRedeemOld = 0;
    const oldTickets = [];
    document.querySelectorAll('#oldTicketsContainer > .ticket-row').forEach(row => {
        const refInput = row.querySelector('.ticket-ref');
        const amtInput = row.querySelector('.ticket-amount');
        if (!refInput || !amtInput) return;

        const ref = refInput.value.trim();
        const amt = parseFloat(amtInput.value) || 0;
        if (amt > 0) {
            totalRedeemOld += amt;
            oldTickets.push({ ref, amt });
        }
    });

    const totalDeductionsCommon = upah60Days + cajTukarSurat + iProtect + iProtectTransFee + flexiPa + newMember + sag + suratWakilTebus + cuci + uji + othersTotal;
    
    // Net result
    const netReceivedStandard = financingAmount + belianEmas + otherCashTotal - totalDeductionsCommon - (isTukarSurat ? tukarSuratTebusVal : 0) - totalRedeemOld;

    // --- Prepare Schedule Markup ---
    const pawnDate = new Date();
    const basicMonths = selectedProduct.tenure;
    const basicDays = basicMonths * 30;
    const dateBasicExpiry = addMonths(pawnDate, basicMonths);

    const upahBasicTotal = dailyRate * basicDays;
    const upahBasicBal = dailyRate * (basicDays - 60);
    const totalRedeemBasic = financingAmount + upahBasicBal;

    let scheduleHtml = '';
    let upahExtended = 0;
    let totalRedeemExtended = 0;
    let dateExtendedExpiry = null;

    if (selectedProduct.canExtend) {
        const extendedMonths = selectedProduct.extendTenure || 6;
        const totalMonths = basicMonths + extendedMonths; // 12 Bulan
        dateExtendedExpiry = addMonths(pawnDate, totalMonths);
        upahExtended = dailyRate * (extendedMonths * 30); // 180 Hari
        totalRedeemExtended = financingAmount + upahExtended;

        scheduleHtml = `
            <div class="schedule-container">
                <div class="schedule-header">📅 Jadual Bayaran Balik (Lanjutan - 12 Bulan)</div>
                <table class="sched-table">
                    <tbody>
                        <tr class="group-header"><td colspan="2">Fasa 1: Tempoh Asas (6 Bulan / 180 Hari)</td></tr>
                        <tr><td>Tarikh Gadai:</td><td align="right"><b>${formatDate(pawnDate)}</b></td></tr>
                        <tr><td>Tarikh Tamat Tempoh Asas:</td><td align="right" class="text-red"><b>${formatDate(dateBasicExpiry)}</b></td></tr>
                        <tr><td>Upah Asas (180 Hari):</td><td align="right">${formatCurrency(upahBasicTotal)}</td></tr>
                        <tr class="text-red"><td>(-) Upah Dibayar Awal (60 Hari):</td><td align="right">-${formatCurrency(upah60Days)}</td></tr>
                        <tr class="font-semibold"><td>Baki Upah Wajib Bayar:</td><td align="right" class="text-red">${formatCurrency(upahBasicBal)}</td></tr>
                        <tr><td>Pokok Pembiayaan:</td><td align="right">${formatCurrency(financingAmount)}</td></tr>
                        <tr class="total-row"><td>Anggaran Tebus Bulan ke-6:</td><td align="right">${formatCurrency(totalRedeemBasic)}</td></tr>
                        <tr class="text-muted">
                            <td colspan="2" style="font-size: 0.8rem; line-height: 1.4;">
                                <b>Ansuran Bulanan: ${formatCurrency(totalRedeemBasic / basicMonths)} / bulan</b><br>
                                <span style="font-size: 0.75rem; display: block; margin-top: 4px; color: var(--text-muted);">
                                    *Nota Pengiraan Ansuran: (Pokok RM ${financingAmount.toFixed(2)} + Baki Upah Asas RM ${upahBasicBal.toFixed(2)}) / ${basicMonths} bulan.
                                </span>
                            </td>
                        </tr>
                        
                        <tr class="group-header"><td colspan="2">Fasa 2: Tempoh Lanjutan (6 Bulan / 180 Hari Tambahan)</td></tr>
                        <tr class="text-muted"><td colspan="2"><i>* Syarat Fasa 2 (Lanjutan): Pelanggan wajib bayar baki upah simpan asas (${formatCurrency(upahBasicBal)}) sebelum/pada ${formatDate(dateBasicExpiry)} bagi melayakkan tempoh lanjutan 6 bulan lagi.</i></td></tr>
                        <tr><td>Tamat Tempoh Lanjutan:</td><td align="right" class="text-red"><b>${formatDate(dateExtendedExpiry)}</b></td></tr>
                        <tr><td>Upah Lanjutan (180 Hari):</td><td align="right">${formatCurrency(upahExtended)}</td></tr>
                        <tr><td>Pokok Pembiayaan:</td><td align="right">${formatCurrency(financingAmount)}</td></tr>
                        <tr class="total-row" style="color:var(--danger)"><td>Jumlah Tebus Bulan ke-${totalMonths}:</td><td align="right">${formatCurrency(totalRedeemExtended)}</td></tr>
                        <tr class="text-muted">
                            <td colspan="2" style="font-size: 0.8rem; line-height: 1.4;">
                                <b>Simulasi Ansuran (${totalMonths} Bulan): ${formatCurrency((financingAmount + upahBasicBal + upahExtended) / totalMonths)} / bulan</b><br>
                                <span style="font-size: 0.75rem; display: block; margin-top: 4px; color: var(--text-muted); text-align: justify;">
                                    *Nota Aliran & Pengiraan Ansuran: (Pokok RM ${financingAmount.toFixed(2)} + Baki Upah Asas RM ${upahBasicBal.toFixed(2)} + Upah Lanjutan RM ${upahExtended.toFixed(2)}) / ${totalMonths} bulan. Bayaran ansuran bulanan hendaklah didahulukan untuk melunaskan Baki Upah Simpan Asas (RM ${upahBasicBal.toFixed(2)}) sebelum/pada ${formatDate(dateBasicExpiry)} bagi melayakkan lanjutan tempoh 6 bulan (Fasa 2) sebelum baki bayaran digunakan untuk Pokok Pembiayaan.
                                </span>
                            </td>
                        </tr>
                        <tr><td colspan="2" class="text-red text-xs font-semibold">⚠️ Peringatan: Wajib tebus atau tukar surat (gadai semula) sepenuhnya selepas ${totalMonths} bulan.</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    } else {
        scheduleHtml = `
            <div class="schedule-container">
                <div class="schedule-header">📅 Jadual Bayaran Balik</div>
                <table class="sched-table">
                    <tbody>
                        <tr class="group-header"><td colspan="2">Tempoh Asas (${basicMonths} Bulan / ${basicDays} Hari)</td></tr>
                        <tr><td>Tarikh Gadai:</td><td align="right"><b>${formatDate(pawnDate)}</b></td></tr>
                        <tr><td>Tamat Tempoh:</td><td align="right" class="text-red"><b>${formatDate(dateBasicExpiry)}</b></td></tr>
                        <tr><td>Upah Simpan (${basicDays} Hari):</td><td align="right">${formatCurrency(upahBasicTotal)}</td></tr>
                        <tr class="text-red"><td>(-) Upah Dibayar Awal (60 Hari):</td><td align="right">-${formatCurrency(upah60Days)}</td></tr>
                        <tr class="font-semibold"><td>Baki Upah Wajib Bayar:</td><td align="right" class="text-red">${formatCurrency(upahBasicBal)}</td></tr>
                        <tr><td>Pokok Pembiayaan:</td><td align="right">${formatCurrency(financingAmount)}</td></tr>
                        <tr class="total-row"><td>Anggaran Tebus Bulan ke-${basicMonths}:</td><td align="right">${formatCurrency(totalRedeemBasic)}</td></tr>
                        <tr class="text-muted">
                            <td colspan="2" style="font-size: 0.8rem; line-height: 1.4;">
                                <b>Ansuran Bulanan: ${formatCurrency(totalRedeemBasic / basicMonths)} / bulan</b><br>
                                <span style="font-size: 0.75rem; display: block; margin-top: 4px; color: var(--text-muted);">
                                    *Nota Pengiraan Ansuran: (Pokok RM ${financingAmount.toFixed(2)} + Baki Upah Asas RM ${upahBasicBal.toFixed(2)}) / ${basicMonths} bulan.
                                </span>
                            </td>
                        </tr>
                        <tr><td colspan="2" class="text-red text-xs font-semibold">⚠️ Peringatan: Wajib tebus atau tukar surat (gadai semula) jika cukup tempoh ${basicMonths} bulan. Produk ${selectedProduct.name} tiada tempoh lanjutan.</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- Prepare Results HTML ---
    const itemsRowsHtml = items.map((it, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><b>${it.grade}</b></td>
            <td>${formatCurrency(it.price)}/g</td>
            <td>${it.weight.toFixed(2)} g</td>
            <td align="right">${formatCurrency(it.marhun)}</td>
        </tr>
    `).join('');

    const itemsTableHtml = `
        <div class="table-responsive mb-4" style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
            <table class="table" style="margin-bottom: 0; font-size: 0.8rem;">
                <thead style="background: rgba(0,0,0,0.1)">
                    <tr>
                        <th>BIL</th>
                        <th>Mutu</th>
                        <th>Harga/g</th>
                        <th>Berat</th>
                        <th style="text-align: right">Marhun</th>
                    </tr>
                </thead>
                <tbody>${itemsRowsHtml}</tbody>
                <tfoot>
                    <tr style="background: rgba(0,0,0,0.05)">
                        <td colspan="3" align="right">Jumlah:</td>
                        <td>${totalWeight.toFixed(2)} g</td>
                        <td align="right">${formatCurrency(totalMarhun)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    // Cash Paid Input state preservation
    const oldCashPaidInput = document.getElementById('cashPaidVal');
    const cashPaidStr = oldCashPaidInput ? oldCashPaidInput.value : '';
    const cashPaid = parseFloat(cashPaidStr) || 0;
    const deficit = Math.abs(netReceivedStandard);
    const hasEnoughPaid = cashPaid >= deficit;
    const changeColorClass = hasEnoughPaid ? 'text-green' : 'text-red';
    const changeValStr = hasEnoughPaid ? formatCurrency(cashPaid - deficit) : 'Tunai tidak mencukupi';

    let resultsHtml = `
        <div class="result-row highlight">
            <span>Produk Terpilih:</span>
            <span>${selectedProduct.name} ${isTukarSurat ? '<span style="font-size:0.7rem; padding: 2px 8px; border-radius: 4px; background: var(--primary-color); color: #12161f; font-weight: 700; margin-left: 6px;">TUKAR SURAT</span>' : ''}</span>
        </div>
        <div class="result-row">
            <span>Nilai Marhun Keseluruhan:</span>
            <span>${formatCurrency(totalMarhun)}</span>
        </div>
        <div class="result-row">
            <span>Pembiayaan Maks Baru (${selectedProduct.margin}%):</span>
            <span><b>${formatCurrency(financingMax)}</b></span>
        </div>
        ${isTukarSurat ? `
            <div class="result-row" style="align-items: center; background: rgba(212, 175, 55, 0.08); padding: 8px 10px; border-radius: 6px; margin: 4px 0;">
                <div style="display: flex; flex-direction: column;">
                    <span class="font-semibold" style="color: var(--primary-color)">Pembiayaan Surat Lama (Digunakan):</span>
                    <span class="text-muted" style="font-size: 0.7rem;">*Tukar Surat: Menggunakan pembiayaan lama</span>
                </div>
                <div class="input-currency" style="width: 160px; height: 32px; opacity: 0.95;">
                    <span class="currency-symbol" style="padding: 4px 0 4px 10px;">RM</span>
                    <input type="text" id="customFinancingVal" value="${financingAmount}" disabled readonly style="padding: 4px 10px 4px 2px; font-weight: bold; text-align: right; color: var(--primary-color); cursor: not-allowed; background: transparent;">
                </div>
            </div>
        ` : `
            <div class="result-row" style="align-items: center;">
                <span class="font-semibold" style="color: var(--primary-color)">Pembiayaan Dipohon:</span>
                <div class="input-currency" style="width: 160px; height: 32px;">
                    <span class="currency-symbol" style="padding: 4px 0 4px 10px;">RM</span>
                    <input type="text" id="customFinancingVal" value="${financingAmount}" style="padding: 4px 10px 4px 2px; font-weight: bold; text-align: right; color: var(--primary-color);" oninput="sanitizeFinancingInput(this)">
                </div>
            </div>
        `}
        ${isTukarSurat ? `
            <div class="result-row text-red">
                <span>Caj Tukar Surat:</span>
                <span>-${formatCurrency(cajTukarSurat)}</span>
            </div>
            <div class="result-row text-red">
                <span>Tebus Surat Lama (Tukar Surat${tukarSuratRef ? ' - ' + tukarSuratRef : ''}):</span>
                <span>-${formatCurrency(tukarSuratTebusVal)}</span>
            </div>
        ` : ''}
        <div class="result-row">
            <span>Upah Simpan (Harian):</span>
            <span>${formatCurrency(dailyRate)}</span>
        </div>
        <div class="result-row text-red">
            <span>Upah Simpan (Awal 60 Hari):</span>
            <span>-${formatCurrency(upah60Days)}</span>
        </div>
        
        ${belianEmas > 0 ? `<div class="result-row text-green"><span>Belian Emas (Tunai):</span> <span>+${formatCurrency(belianEmas)}</span></div>` : ''}
        ${otherCashItems.map(o => `<div class="result-row text-green"><span>${o.name}:</span> <span>+${formatCurrency(o.val)}</span></div>`).join('')}
        ${iProtect > 0 ? `<div class="result-row text-red"><span>${iProtectLabel}:</span> <span>-${formatCurrency(iProtect)}</span></div>` : ''}
        ${iProtectTransFee > 0 ? `<div class="result-row text-red"><span>Caj Transaksi I-Protect:</span> <span>-${formatCurrency(iProtectTransFee)}</span></div>` : ''}
        ${flexiPa > 0 ? `<div class="result-row text-red"><span>Flexi PA:</span> <span>-${formatCurrency(flexiPa)}</span></div>` : ''}
        ${newMember > 0 ? `<div class="result-row text-red"><span>Ahli Baru:</span> <span>-${formatCurrency(newMember)}</span></div>` : ''}
        ${sag > 0 ? `<div class="result-row text-red"><span>Caj Kehilangan SAG:</span> <span>-${formatCurrency(sag)}</span></div>` : ''}
        ${suratWakilTebus > 0 ? `<div class="result-row text-red"><span>Caj Surat Wakil Tebus:</span> <span>-${formatCurrency(suratWakilTebus)}</span></div>` : ''}
        ${cuci > 0 ? `<div class="result-row text-red"><span>Cuci Emas:</span> <span>-${formatCurrency(cuci)}</span></div>` : ''}
        ${uji > 0 ? `<div class="result-row text-red"><span>Uji Emas:</span> <span>-${formatCurrency(uji)}</span></div>` : ''}
        ${othersItems.map(o => `<div class="result-row text-red"><span>${o.name}:</span> <span>-${formatCurrency(o.val)}</span></div>`).join('')}
        ${oldTickets.map(t => `<div class="result-row text-red"><span>Tebus Surat Lama (${t.ref || 'Tiada Rujukan'}):</span> <span>-${formatCurrency(t.amt)}</span></div>`).join('')}
        
        <div class="result-row-total">
            ${netReceivedStandard < 0 
                ? `<span class="text-red">Pelanggan Perlu Tambah Tunai (Defisit):</span><span class="text-red">-${formatCurrency(deficit)}</span>`
                : `<span class="text-green">Jumlah Bersih Diterima Pelanggan:</span><span class="text-green">${formatCurrency(netReceivedStandard)}</span>`
            }
        </div>

        ${netReceivedStandard < 0 ? `
            <div class="deficit-card">
                <div class="result-row text-red" style="font-weight: bold; border-bottom: none; margin-bottom: 8px;">
                    <span>Pelanggan Perlu Bayar (Defisit):</span>
                    <span>${formatCurrency(deficit)}</span>
                </div>
                <div class="result-row" style="align-items: center; border-bottom: none; margin-bottom: 8px;">
                    <label for="cashPaidVal">Tunai Diterima (RM):</label>
                    <div class="input-currency" style="width: 160px; height: 32px;">
                        <span class="currency-symbol" style="padding: 4px 0 4px 10px;">RM</span>
                        <input type="text" id="cashPaidVal" value="${cashPaidStr}" placeholder="0.00" style="padding: 4px 10px 4px 2px; text-align: right;" oninput="handleDeficitCashInput(this, ${deficit})">
                    </div>
                </div>
                <div class="result-row" style="font-weight: bold; border-bottom: none;">
                    <span>Baki:</span>
                    <span id="changeDisplay" class="${changeColorClass}">${changeValStr}</span>
                </div>
            </div>
        ` : ''}

        ${scheduleHtml}
    `;

    // Save calculation state for printing
    calculationState = {
        productName: selectedProduct.name,
        selectedProduct,
        items,
        totalWeight,
        totalMarhun,
        financingAmount,
        financingMax,
        isTukarSurat,
        cajTukarSurat,
        tukarSuratRef,
        tukarSuratTebus: tukarSuratTebusVal,
        tukarSuratPembiayaan: tukarSuratPembiayaanVal,
        dailyRate,
        upah60Days,
        belianEmas,
        otherCashItems,
        iProtect,
        iProtectLabel,
        iProtectTransFee,
        flexiPa,
        newMember,
        sag,
        suratWakilTebus,
        cuci,
        uji,
        othersItems,
        oldTickets,
        netReceivedStandard,
        deficit,
        cashPaid,
        hasEnoughPaid,
        changeValStr,
        pawnDate,
        dateBasicExpiry,
        upahBasicTotal,
        upahBasicBal,
        totalRedeemBasic,
        upahExtended,
        totalRedeemExtended,
        dateExtendedExpiry
    };

    standardResultContent.innerHTML = itemsTableHtml + resultsHtml;

    // Restore focus and cursor position
    if (activeId) {
        const newActiveEl = document.getElementById(activeId);
        if (newActiveEl) {
            newActiveEl.focus();
            if (newActiveEl.setSelectionRange && (newActiveEl.type === 'text' || newActiveEl.type === 'search' || newActiveEl.type === 'tel' || newActiveEl.type === 'url')) {
                try {
                    newActiveEl.setSelectionRange(selectionStart, selectionEnd);
                } catch (e) {
                    // ignore if not supported by type
                }
            }
        }
    }
}

// --- Dynamic Input Handlers for Calculation State ---
export function sanitizeFinancingInput(input) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const oldVal = input.value;
    const newVal = oldVal.replace(/[^0-9]/g, '');
    
    if (oldVal !== newVal) {
        input.value = newVal;
        const diff = oldVal.length - newVal.length;
        const newStart = Math.max(0, start - diff);
        const newEnd = Math.max(0, end - diff);
        input.setSelectionRange(newStart, newEnd);
    }
    
    calculateAll(false);
}

export function handleDeficitCashInput(input, deficit) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const oldVal = input.value;
    const newVal = oldVal.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    
    if (oldVal !== newVal) {
        input.value = newVal;
        const diff = oldVal.length - newVal.length;
        const newStart = Math.max(0, start - diff);
        const newEnd = Math.max(0, end - diff);
        input.setSelectionRange(newStart, newEnd);
    }
    
    const cashPaid = parseFloat(newVal) || 0;
    const changeDisplay = document.getElementById('changeDisplay');
    
    if (changeDisplay) {
        if (cashPaid >= deficit) {
            const change = cashPaid - deficit;
            changeDisplay.textContent = formatCurrency(change);
            changeDisplay.className = 'text-green';
        } else {
            changeDisplay.textContent = 'Tunai tidak mencukupi';
            changeDisplay.className = 'text-red';
        }
    }
    
    if (calculationState) {
        calculationState.cashPaid = cashPaid;
        calculationState.hasEnoughPaid = cashPaid >= deficit;
        calculationState.changeValStr = cashPaid >= deficit ? formatCurrency(cashPaid - deficit) : 'Tunai tidak mencukupi';
    }
}

export function showPrintWarning() {
    const modal = document.getElementById('printWarningModal');
    if (modal) modal.classList.add('active');
}

export function closePrintWarning() {
    const modal = document.getElementById('printWarningModal');
    if (modal) modal.classList.remove('active');
}

export function triggerPrint() {
    closePrintWarning();
    if (calculationState) {
        window.api.printSimulation(calculationState);
    }
}

export function setupCalculationListeners() {
    const inputs = [
        'belianEmasVal',
        'cuciEmasVal',
        'ujiEmasVal',
        'tukarSuratRef',
        'tukarSuratTebus',
        'tukarSuratPembiayaan'
    ];
    
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => calculateAll());
        }
    });

    const checkboxes = [
        'flexipa_cb',
        'newmember_cb',
        'sag_cb',
        'suratWakilTebus_cb'
    ];
    
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => calculateAll());
        }
    });

    const tukarSuratCb = document.getElementById('tukarSurat_cb');
    if (tukarSuratCb) {
        tukarSuratCb.addEventListener('change', () => handleTukarSuratToggle());
    }
}
