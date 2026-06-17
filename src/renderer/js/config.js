// --- Configuration & Utility Module ---

export const products = [
    { id: 'prestij', name: 'Prestij', margin: 70, tenure: 6, rate: 0.90, canExtend: true },
    { id: 'didik', name: 'Didik', margin: 75, tenure: 6, rate: 0.85, canExtend: true },
    { id: 'bisnes', name: 'Bisnes', margin: 80, tenure: 6, rate: 1.00, canExtend: true },
    { id: 'biznita', name: 'Biznita', margin: 80, tenure: 6, rate: 0.95, canExtend: true },
    { id: 'emas', name: 'Emas', margin: 80, tenure: 6, rate: 0.90, canExtend: true },
    { id: 'care', name: 'Care', margin: 80, tenure: 6, rate: 0.75, canExtend: false },
    { id: 'ekasih', name: 'eKASIH (Kadar Khas)', margin: 70, tenure: 10, rate: 0.10, isDaily: false, canExtend: false }
];

export function formatCurrency(num) {
    return 'RM ' + num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

export function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- Custom Modal Dialog Helpers ---
export function showAlert(message, type = 'warning') {
    const modal = document.getElementById('customAlertModal');
    const icon = document.getElementById('customAlertIcon');
    const msg = document.getElementById('customAlertMessage');
    if (!modal || !icon || !msg) return;

    msg.textContent = message;

    if (type === 'error') {
        icon.textContent = '❌';
        icon.className = 'modal-icon text-red';
    } else if (type === 'success') {
        icon.textContent = '✅';
        icon.className = 'modal-icon text-green';
    } else {
        icon.textContent = '⚠️';
        icon.className = 'modal-icon';
    }

    modal.classList.add('active');
}

export function closeCustomAlert() {
    const modal = document.getElementById('customAlertModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

export function showConfirm(message, isDestructive = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const icon = document.getElementById('customConfirmIcon');
        const msg = document.getElementById('customConfirmMessage');
        const yesBtn = document.getElementById('customConfirmYesBtn');
        const noBtn = document.getElementById('customConfirmNoBtn');
        if (!modal || !icon || !msg || !yesBtn || !noBtn) {
            resolve(false);
            return;
        }

        msg.textContent = message;

        if (isDestructive) {
            icon.textContent = '🗑️';
            icon.className = 'modal-icon text-red';
            yesBtn.className = 'btn btn-danger';
            yesBtn.textContent = 'Ya, Padam';
        } else {
            icon.textContent = '❓';
            icon.className = 'modal-icon gold-text';
            yesBtn.className = 'btn btn-primary';
            yesBtn.textContent = 'Ya, Teruskan';
        }

        modal.classList.add('active');

        function cleanup(result) {
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
            modal.classList.remove('active');
            resolve(result);
        }

        function onYes() {
            cleanup(true);
        }

        function onNo() {
            cleanup(false);
        }

        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
    });
}

export function getDefaultTabState(id, name) {
    return {
        id,
        name,
        selectedProductId: null,
        items: [{ grade: '', weight: '' }],
        oldTickets: [],
        belianEmasVal: '',
        otherCash: [],
        iprotect1: false,
        iprotect2: false,
        flexipa: false,
        newmember: false,
        sag: false,
        suratWakilTebus: false,
        cuciEmasVal: '',
        ujiEmasVal: '',
        others: [],
        customFinancingVal: '',
        cashPaidVal: ''
    };
}
