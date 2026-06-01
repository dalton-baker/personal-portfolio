import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.resolve(__dirname, 'index.html');
const outputPath = process.argv[2] || path.resolve(__dirname, 'DaltonBakerResume.pdf');

function findChrome() {
    const paths = [
        process.env.CHROME_PATH,
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ];
    for (const p of paths) {
        if (p) {
            try {
                execSync(`test -x "${p}"`, { stdio: 'ignore' });
                return p;
            } catch {
                // continue
            }
        }
    }
    return undefined;
}

async function buildPdf() {
    const executablePath = findChrome();
    const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (executablePath) {
        launchOptions.executablePath = executablePath;
    }
    const browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    await page.goto(`file://${inputPath}`, { waitUntil: 'networkidle0' });

    await page.pdf({
        path: outputPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    console.log(`PDF built: ${outputPath}`);
}

buildPdf().catch((err) => {
    console.error('Failed to build PDF:', err);
    process.exit(1);
});
