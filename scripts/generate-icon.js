const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 256,
        height: 256,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const svgContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: transparent;
                overflow: hidden;
            }
            svg {
                display: block;
                width: 256px;
                height: 256px;
            }
        </style>
    </head>
    <body>
        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <!-- Background: rounded rectangle -->
            <rect x="12" y="12" width="232" height="232" rx="48" fill="#12161f" stroke="#d4af37" stroke-width="6"/>
            <!-- Scale SVG path centered and scaled up -->
            <g transform="translate(58, 58) scale(5.8)" fill="none" stroke="#d4af37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m16 16 3-8 3 8c-.1.3-.3.5-.6.5h-4.8c-.3 0-.5-.2-.6-.5Z" />
                <path d="m2 16 3-8 3 8c-.1.3-.3.5-.6.5H2.6c-.3 0-.5-.2-.6-.5Z" />
                <path d="M7 21h10" />
                <path d="M12 3v18" />
                <path d="M3 7h18" />
            </g>
        </svg>
    </body>
    </html>
    `;

    const htmlPath = path.join(__dirname, 'temp-icon.html');
    fs.writeFileSync(htmlPath, svgContent, 'utf-8');

    win.loadFile(htmlPath);

    win.webContents.once('did-finish-load', async () => {
        // Wait a tiny bit for rendering
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const image = await win.webContents.capturePage();
            const pngBuffer = image.toPNG();

            // Create directories if they do not exist
            const buildDir = path.join(__dirname, '../build');
            if (!fs.existsSync(buildDir)) {
                fs.mkdirSync(buildDir);
            }

            const assetsDir = path.join(__dirname, '../src/renderer/assets');
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }

            // Create ICO file buffer
            const icoBuffer = Buffer.alloc(22 + pngBuffer.length);

            // ICO Header
            icoBuffer.writeUInt16LE(0, 0);     // Reserved
            icoBuffer.writeUInt16LE(1, 2);     // Type (1 = Icon)
            icoBuffer.writeUInt16LE(1, 4);     // Number of images

            // Directory Entry
            icoBuffer.writeUInt8(0, 6);        // Width (0 = 256)
            icoBuffer.writeUInt8(0, 7);        // Height (0 = 256)
            icoBuffer.writeUInt8(0, 8);        // Color palette (0 = no palette)
            icoBuffer.writeUInt8(0, 9);        // Reserved
            icoBuffer.writeUInt16LE(1, 10);    // Color planes
            icoBuffer.writeUInt16LE(32, 12);   // Bits per pixel (32)
            icoBuffer.writeUInt32LE(pngBuffer.length, 14); // Size of image data
            icoBuffer.writeUInt32LE(22, 18);   // Offset of image data

            // Copy PNG data
            pngBuffer.copy(icoBuffer, 22);

            // Write both ICO and PNG files
            fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
            fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuffer);
            fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngBuffer);

            console.log('Successfully generated icon.ico and icon.png!');
        } catch (err) {
            console.error('Error generating icon:', err);
        } finally {
            // Clean up temp file
            if (fs.existsSync(htmlPath)) {
                fs.unlinkSync(htmlPath);
            }
            app.quit();
        }
    });
});
