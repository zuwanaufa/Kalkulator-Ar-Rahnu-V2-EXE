// --- Navigation Module ---
import { renderPriceChart } from './chart.js';

export function initNavigation() {
    setupTabNavigation();
    setupSidebarToggle();
    setupThemeToggle();
}

function setupTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const viewPanels = document.querySelectorAll('.view-panel');
    const viewTitle = document.getElementById('view-title');
    const viewSubtitle = document.getElementById('view-subtitle');

    const viewDetails = {
        'calculator-view': {
            title: 'Kalkulator Ar Rahnu',
            subtitle: 'Simulasi pembiayaan dan bayaran balik Ar Rahnu'
        },
        'purchase-calculator-view': {
            title: 'Kalkulator Belian Emas',
            subtitle: 'Simulasi pengiraan transaksi belian balik emas semasa'
        },
        'alsaleem-calculator-view': {
            title: 'Kalkulator Al Saleem',
            subtitle: 'Simulasi simpanan selamat emas tanpa pembiayaan'
        },
        'chart-view': {
            title: 'Graf & Sejarah Harga',
            subtitle: 'Data pergerakan harga emas 999 dan 916'
        },
        'manage-prices-view': {
            title: 'Urus Harga Emas',
            subtitle: 'Kemaskini harga dasar emas untuk pangkalan data'
        },
        'guide-view': {
            title: 'Panduan Penggunaan',
            subtitle: 'Spesifikasi produk dan manual operasi sistem'
        },
        'about-view': {
            title: 'Tentang Aplikasi',
            subtitle: 'Maklumat perisian dan ruangan maklum balas'
        }
    };

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            // Toggle active menu class
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Toggle active panel
            viewPanels.forEach(vp => vp.classList.remove('active'));
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Update header text
            if (viewDetails[targetId] && viewTitle && viewSubtitle) {
                viewTitle.textContent = viewDetails[targetId].title;
                viewSubtitle.textContent = viewDetails[targetId].subtitle;
            }

            // Custom actions when switching views
            if (targetId === 'chart-view') {
                renderPriceChart();
            }
        });
    });
}

function setupSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (!sidebar || !mainContent || !sidebarToggle) return;

    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('collapsed');
        sidebarToggle.textContent = '▶';
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('collapsed');
        sidebarToggle.textContent = '◀';
    }

    sidebarToggle.addEventListener('click', () => {
        const currentlyCollapsed = sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed');
        sidebarToggle.textContent = currentlyCollapsed ? '▶' : '◀';
        localStorage.setItem('sidebarCollapsed', currentlyCollapsed);
    });

    // Mobile Menu Toggle Drawer
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-active');
        });
    }

    // Close mobile menu on clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('mobile-active') && !sidebar.contains(e.target) && e.target !== mobileMenuToggle) {
            sidebar.classList.remove('mobile-active');
        }
    });

    // Close mobile menu on clicking a menu link
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            sidebar.classList.remove('mobile-active');
        });
    });
}

function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) return;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggleBtn.textContent = '🌙';
    } else {
        document.body.classList.remove('light-theme');
        themeToggleBtn.textContent = '☀️';
    }

    themeToggleBtn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        if (isLight) {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.textContent = '🌙';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.textContent = '☀️';
        }

        const activePanel = document.querySelector('.view-panel.active');
        if (activePanel && activePanel.id === 'chart-view') {
            renderPriceChart();
        }
    });
}
