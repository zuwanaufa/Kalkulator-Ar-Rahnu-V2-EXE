// --- Chart & History Table Module ---

let myChart = null;
let fullHistoryData = [];
let historyCurrentPage = 1;
let historyPageSize = 20;

export async function renderPriceChart() {
    try {
        const rawHistory = await window.api.getHistory();
        fullHistoryData = rawHistory;
        
        // Render chart and table with the current filter and page state
        updateGraphData();
        renderHistoryTable();

    } catch (e) {
        console.error('Failed to load chart data:', e);
    }
}

// Update graph based on filter dropdown
export function updateGraphData() {
    const canvas = document.getElementById('goldPriceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const filterSelect = document.getElementById('graphFilter');
    const filterDays = filterSelect ? filterSelect.value : 'all';
    
    // Group data by date
    const historyMap = {};
    
    fullHistoryData.forEach(item => {
        if (!historyMap[item.date]) {
            historyMap[item.date] = {};
        }
        historyMap[item.date][item.grade] = item.price;
    });
    
    let sortedDatesAsc = Object.keys(historyMap).sort((a, b) => a.localeCompare(b));
    
    if (filterDays !== 'all') {
        const daysToKeep = parseInt(filterDays);
        if (sortedDatesAsc.length > 0) {
            let latestDateStr = sortedDatesAsc[sortedDatesAsc.length - 1];
            let latestDateObj = new Date(latestDateStr);
            let cutoffDateObj = new Date(latestDateObj);
            cutoffDateObj.setDate(cutoffDateObj.getDate() - daysToKeep);
            const cutoffDateStr = cutoffDateObj.toISOString().split('T')[0];
            
            sortedDatesAsc = sortedDatesAsc.filter(d => d >= cutoffDateStr);
        }
    }
    
    const labels = sortedDatesAsc.map(d => {
        const dateParts = d.split('-');
        return dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : d; // show dd/mm
    });
    
    const data999 = [];
    const data916 = [];
    
    let last999 = null;
    let last916 = null;
    
    sortedDatesAsc.forEach(dateStr => {
        const prices = historyMap[dateStr];
        if (prices['999'] !== undefined) last999 = prices['999'];
        if (prices['916'] !== undefined) last916 = prices['916'];
        
        data999.push(last999);
        data916.push(last916);
    });
    
    if (myChart) {
        myChart.destroy();
    }

    const ChartLib = window.Chart;
    if (!ChartLib) {
        console.error('Chart.js library is not loaded.');
        return;
    }

    const isLight = document.body.classList.contains('light-theme');
    const color999 = '#d4af37';
    const color916 = isLight ? '#334155' : '#e2e8f0'; 
    const bg999 = 'rgba(212, 175, 55, 0.1)';
    const bg916 = isLight ? 'rgba(51, 65, 85, 0.08)' : 'rgba(226, 232, 240, 0.05)';
    const fontColor = isLight ? '#0f172a' : '#f3f4f6';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
    const tickColor = isLight ? '#475569' : '#9ca3af';
    const tooltipBg = isLight ? '#ffffff' : '#1b202c';
    const tooltipBorder = isLight ? '#cbd5e1' : '#2e374b';
    const pointBorder = isLight ? '#ffffff' : '#12161f';

    myChart = new ChartLib(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Mutu 999 (RM/g)',
                    data: data999,
                    borderColor: color999,
                    backgroundColor: bg999,
                    borderWidth: 3,
                    pointBackgroundColor: color999,
                    pointBorderColor: pointBorder,
                    pointHoverBackgroundColor: pointBorder,
                    pointHoverBorderColor: color999,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    spanGaps: true
                },
                {
                    label: 'Mutu 916 (RM/g)',
                    data: data916,
                    borderColor: color916,
                    backgroundColor: bg916,
                    borderWidth: 3,
                    pointBackgroundColor: color916,
                    pointBorderColor: pointBorder,
                    pointHoverBackgroundColor: pointBorder,
                    pointHoverBorderColor: color916,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: fontColor, font: { family: 'Outfit', size: 12, weight: '500' } }
                },
                tooltip: {
                    backgroundColor: tooltipBg, titleColor: color999, bodyColor: fontColor,
                    borderColor: tooltipBorder, borderWidth: 1, padding: 10,
                    titleFont: { family: 'Outfit', weight: 'bold' },
                    bodyFont: { family: 'Outfit' },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label = label.split(' ')[0] + ': ';
                            if (context.parsed.y !== null) label += 'RM ' + context.parsed.y.toFixed(2) + '/g';
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Outfit' } } },
                y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Outfit' }, callback: value => 'RM ' + value } }
            }
        }
    });
}

export function renderHistoryTable() {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;
    
    // Group and sort
    const historyMap = {};
    fullHistoryData.forEach(item => {
        if (!historyMap[item.date]) historyMap[item.date] = {};
        historyMap[item.date][item.grade] = item.price;
    });
    
    const sortedDatesDesc = Object.keys(historyMap).sort((a, b) => b.localeCompare(a));
    
    // Create flattened array of table rows data
    const rowsData = [];
    sortedDatesDesc.forEach(dateStr => {
        const prices = historyMap[dateStr];
        if (prices['999'] !== undefined) rowsData.push({ date: dateStr, grade: '999', price: prices['999'] });
        if (prices['916'] !== undefined) rowsData.push({ date: dateStr, grade: '916', price: prices['916'] });
    });
    
    // Pagination
    const totalItems = rowsData.length;
    const totalPages = Math.ceil(totalItems / historyPageSize) || 1;
    if (historyCurrentPage > totalPages) historyCurrentPage = totalPages;
    if (historyCurrentPage < 1) historyCurrentPage = 1;
    
    const startIndex = (historyCurrentPage - 1) * historyPageSize;
    const endIndex = startIndex + historyPageSize;
    const pageData = rowsData.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    if (pageData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" align="center" class="text-muted">Tiada rekod.</td></tr>';
    } else {
        pageData.forEach(item => {
            const dateParts = item.date.split('-');
            const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : item.date;
            
            const tr = document.createElement('tr');
            if (item.grade === '999') {
                tr.innerHTML = `
                    <td>${displayDate}</td>
                    <td><span style="color: #d4af37; font-weight: bold;">999 (24K)</span></td>
                    <td><b>RM ${item.price.toFixed(2)}</b></td>
                `;
            } else {
                tr.innerHTML = `
                    <td>${displayDate}</td>
                    <td><span class="grade-916-text" style="font-weight: bold;">916 (22K)</span></td>
                    <td><b>RM ${item.price.toFixed(2)}</b></td>
                `;
            }
            tableBody.appendChild(tr);
        });
    }
    
    const pageInfo = document.getElementById('historyPageInfo');
    if (pageInfo) pageInfo.textContent = `Halaman ${historyCurrentPage} / ${totalPages}`;
}

export function changeHistoryPageSize() {
    const sizeSelect = document.getElementById('historyPageSize');
    if (sizeSelect) {
        historyPageSize = parseInt(sizeSelect.value);
        historyCurrentPage = 1;
        renderHistoryTable();
    }
}

export function prevHistoryPage() {
    if (historyCurrentPage > 1) {
        historyCurrentPage--;
        renderHistoryTable();
    }
}

export function nextHistoryPage() {
    historyCurrentPage++;
    renderHistoryTable();
}
