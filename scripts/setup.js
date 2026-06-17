const fs = require('fs');
const path = require('path');
const https = require('https');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function run() {
    console.log('=== Memulakan Persediaan Sumber Offline ===');

    // Create directories
    const fontDir = path.join(__dirname, '../src/renderer/fonts');
    const libDir = path.join(__dirname, '../src/renderer/lib');

    fs.mkdirSync(fontDir, { recursive: true });
    fs.mkdirSync(libDir, { recursive: true });

    // 1. Download Font Outfit
    console.log('Memuat turun font Outfit...');
    const cssUrl = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const options = {
        headers: {
            'User-Agent': userAgent
        }
    };

    let fontSuccess = false;
    try {
        await new Promise((resolve, reject) => {
            https.get(cssUrl, options, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Google Fonts CSS status: ${res.statusCode}`));
                    return;
                }
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', async () => {
                    const fontFaceRegex = /@font-face\s*{([^}]+)}/g;
                    let match;
                    let localCss = '';
                    let count = 0;

                    const srcRegex = /src:\s*url\((https:[^)]+)\)\s*format\('woff2'\)/;
                    const weightRegex = /font-weight:\s*(\d+)/;
                    const styleRegex = /font-style:\s*([a-z]+)/;

                    const downloads = [];

                    while ((match = fontFaceRegex.exec(data)) !== null) {
                        const block = match[1];
                        const srcMatch = srcRegex.exec(block);
                        const weightMatch = weightRegex.exec(block);
                        const styleMatch = styleRegex.exec(block);

                        if (srcMatch && weightMatch) {
                            const url = srcMatch[1];
                            const weight = weightMatch[1];
                            const style = styleMatch ? styleMatch[1] : 'normal';

                            const filename = `outfit-${weight}-${style}.woff2`;
                            const destPath = path.join(fontDir, filename);

                            downloads.push((async () => {
                                try {
                                    await downloadFile(url, destPath);
                                    localCss += `
@font-face {
  font-family: 'Outfit';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('${filename}') format('woff2');
}
`;
                                    count++;
                                } catch (e) {
                                    console.error(`Gagal memuat turun font weight ${weight}:`, e.message);
                                }
                            })());
                        }
                    }

                    if (downloads.length > 0) {
                        await Promise.all(downloads);
                        fs.writeFileSync(path.join(fontDir, 'outfit.css'), localCss);
                        console.log(`Berjaya memuat turun ${count} fail font dan menjana outfit.css`);
                        fontSuccess = true;
                    } else {
                        reject(new Error('Tiada font ditemui di dalam CSS Google Fonts.'));
                    }
                    resolve();
                });
            }).on('error', reject);
        });
    } catch (e) {
        console.warn('Gagal memuat turun font dari internet:', e.message);
        console.log('Menggunakan konfigurasi font fallback tempatan...');
        const fallbackCss = `
body, html, * {
  font-family: 'Outfit', system-ui, -apple-system, sans-serif !important;
}
`;
        fs.writeFileSync(path.join(fontDir, 'outfit.css'), fallbackCss);
    }

    // 2. Download Chart.js
    console.log('Memuat turun Chart.js tempatan...');
    const chartJsUrl = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js';
    const chartDest = path.join(libDir, 'chart.js');

    try {
        await downloadFile(chartJsUrl, chartDest);
        console.log('Berjaya memuat turun Chart.js tempatan ke src/renderer/lib/chart.js');
    } catch (e) {
        console.error('Gagal memuat turun Chart.js dari CDN:', e.message);
        console.log('Sila pastikan fail Chart.js diletakkan secara manual jika berjalan offline sepenuhnya.');
        // Write empty file if it doesn't exist so build doesn't crash on require/load
        if (!fs.existsSync(chartDest)) {
            fs.writeFileSync(chartDest, '// Chart.js tidak dimuat turun. Sila salin fail chart.umd.js ke sini.');
        }
    }

    console.log('=== Selesai Persediaan Sumber Offline ===');
}

run();
