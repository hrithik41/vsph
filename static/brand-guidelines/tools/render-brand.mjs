#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log(`Usage: node tools/render-brand.mjs HTML_PATH [--output PDF_PATH] [--pages all|1,2,3] [--validate-only] [--chrome CHROME_PATH]\n\nRenders using installed Chrome (no package dependencies). Exports a background-enabled,\nCSS-sized landscape A4 PDF, all page PNGs and 16-page JPEG contact sheets by default.\nWrites layout-report.json next to the screenshots. Use data-overflow-ignore on decorative\nelements intentionally extending beyond page bounds. --validate-only skips all exports.`);
  process.exit(0);
}
const htmlPath = path.resolve(args[0]);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const outputPath = path.resolve(option('--output', htmlPath.replace(/\.html?$/i, '.pdf')));
const chromePath = option('--chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const selectedPages = option('--pages', 'all');
const validateOnly = args.includes('--validate-only');
const assetDir = path.join(path.dirname(outputPath), 'rendered-pages');
await fs.access(htmlPath);
await fs.mkdir(assetDir, { recursive: true });
const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vsph-chrome-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--remote-debugging-pipe', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-extensions', '--disable-sync',
  '--hide-scrollbars', '--allow-file-access-from-files', `--user-data-dir=${profileDir}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });

let messageBuffer = '';
let commandId = 0;
let stderr = '';
let chromeExited = false;
let finishChromeExit;
const chromeExit = new Promise(resolve => { finishChromeExit = resolve; });
const pending = new Map();
chrome.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-8000); });
chrome.stdio[4].on('data', chunk => {
  messageBuffer += chunk.toString();
  let boundary;
  while ((boundary = messageBuffer.indexOf('\0')) >= 0) {
    const serialized = messageBuffer.slice(0, boundary);
    messageBuffer = messageBuffer.slice(boundary + 1);
    if (!serialized) continue;
    const message = JSON.parse(serialized);
    const request = pending.get(message.id);
    if (!request) continue;
    pending.delete(message.id);
    clearTimeout(request.timer);
    message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
  }
});
chrome.on('error', error => {
  for (const request of pending.values()) { clearTimeout(request.timer); request.reject(error); }
  pending.clear();
});
chrome.on('exit', code => {
  chromeExited = true;
  finishChromeExit();
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error(`Chrome exited (${code}). ${stderr}`));
  }
  pending.clear();
});
const cdp = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  if (chromeExited) { reject(new Error('Chrome has already exited.')); return; }
  const id = ++commandId;
  const timer = setTimeout(() => {
    pending.delete(id);
    reject(new Error(`Timed out: ${method}. ${stderr}`));
  }, 60000);
  pending.set(id, { resolve, reject, timer });
  chrome.stdio[3].write(`${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`);
});
let sessionId;
const evaluate = async expression => {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};

try {
  const version = await cdp('Browser.getVersion');
  console.log(`Browser: ${version.product}`);
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  ({ sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true }));
  await cdp('Page.enable', {}, sessionId);
  await cdp('Runtime.enable', {}, sessionId);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1122, height: 794, deviceScaleFactor: 1, mobile: false }, sessionId);
  await cdp('Page.navigate', { url: pathToFileURL(htmlPath).href }, sessionId);
  await evaluate(`new Promise(resolve => {
    const ready = async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(r => { image.onload = r; image.onerror = r; })));
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    };
    document.readyState === 'complete' ? ready() : window.addEventListener('load', ready, {once:true});
  })`);
  const report = await evaluate(`(() => {
    const list = [...document.querySelectorAll('.page')];
    const round = n => Math.round(n * 10) / 10;
    const description = element => ({ tag: element.tagName.toLowerCase(), class: element.className?.baseVal ?? element.className, text: element.textContent.trim().replace(/\\s+/g,' ').slice(0,130) });
    return {
      title: document.title,
      pageCount: list.length,
      fonts: [...document.fonts].map(f => ({ family:f.family, status:f.status })),
      brokenImages: [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
      pages: list.map((page,index) => {
        const box = page.getBoundingClientRect();
        const footer = page.querySelector('.footer, .page-footer, footer');
        const footerBox = footer?.getBoundingClientRect();
        const overflow = [];
        const footerOverlap = [];
        const clippedText = [];
        for (const element of page.querySelectorAll('*')) {
          if (element.closest('[data-overflow-ignore], script, style, defs, clipPath')) continue;
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          if (rect.left < box.left-1 || rect.top < box.top-1 || rect.right > box.right+1 || rect.bottom > box.bottom+1) {
            overflow.push({ ...description(element), bounds: {x:round(rect.left-box.left), y:round(rect.top-box.top), width:round(rect.width), height:round(rect.height)} });
          }
          const isText = [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          if (!isText) continue;
          if (footer && !footer.contains(element) && !element.contains(footer) && rect.top < footerBox.bottom && rect.bottom > footerBox.top+1 && rect.left < footerBox.right && rect.right > footerBox.left) footerOverlap.push(description(element));
          if ((style.overflow === 'hidden' || style.overflowY === 'hidden' || style.overflowX === 'hidden') && (element.scrollHeight > element.clientHeight+1 || element.scrollWidth > element.clientWidth+1)) clippedText.push({...description(element), scrollHeight:element.scrollHeight, clientHeight:element.clientHeight, scrollWidth:element.scrollWidth, clientWidth:element.clientWidth });
        }
        return {page:index+1, title:page.getAttribute('data-title') || page.querySelector('h1,h2')?.textContent.trim() || '', box:{x:round(box.left+scrollX),y:round(box.top+scrollY),width:round(box.width),height:round(box.height)}, overflow, footerOverlap, clippedText };
      })
    };
  })()`);
  if (!report.pageCount) throw new Error('No .page elements found in the supplied HTML.');
  await fs.writeFile(path.join(assetDir, 'layout-report.json'), JSON.stringify(report, null, 2));
  console.log(`Pages: ${report.pageCount}; broken images: ${report.brokenImages.length}`);
  const issues = report.pages.filter(p => p.overflow.length || p.footerOverlap.length || p.clippedText.length);
  for (const page of issues) console.log(`LAYOUT page ${page.page} (${page.title}): ${page.overflow.length} elements outside page, ${page.footerOverlap.length} footer overlaps, ${page.clippedText.length} clipped text elements.`);
  console.log(issues.length ? `Review ${path.join(assetDir, 'layout-report.json')}` : 'Layout check: no elements outside page, footer overlaps, or clipped text detected.');
  if (!validateOnly) {
    const pdf = await cdp('Page.printToPDF', {
      landscape: true, printBackground: true, preferCSSPageSize: true,
      paperWidth: 11.6929134, paperHeight: 8.2677165,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      displayHeaderFooter: false, generateTaggedPDF: true,
    }, sessionId);
    const pdfBytes = Buffer.from(pdf.data, 'base64');
    await fs.writeFile(outputPath, pdfBytes);
    console.log(`PDF: ${outputPath}`);
    const printedPages = (pdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    console.log(`PDF page count: ${printedPages}; expected: ${report.pageCount}`);
    if (printedPages !== report.pageCount) console.warn('PDF PAGE COUNT MISMATCH: review print page dimensions and page-break rules.');
    const requested = selectedPages === 'all' ? report.pages.map(p => p.page) : selectedPages.split(',').map(Number);
    const shots = [];
    for (const number of requested) {
      const page = report.pages[number-1];
      if (!page) throw new Error(`Screenshot page ${number} does not exist.`);
      const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: {...page.box, scale: 1} }, sessionId);
      const screenshotPath = path.join(assetDir, `page-${String(number).padStart(2,'0')}.png`);
      await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
      shots.push({ number, title: page.title, data: screenshot.data });
    }
    for (let start = 0; start < shots.length; start += 16) {
      const subset = shots.slice(start, start+16);
      const tileWidth = 336, gutter = 20, labelHeight = 26, topMargin = 24;
      const tileHeight = Math.round(tileWidth * report.pages[0].box.height / report.pages[0].box.width);
      const columns = Math.min(4, subset.length), rows = Math.ceil(subset.length / columns);
      const width = columns * tileWidth + (columns+1) * gutter;
      const height = rows * (tileHeight+labelHeight+gutter) + topMargin;
      const data = await evaluate(`(async () => {
        const canvas = document.createElement('canvas'); canvas.width=${width}; canvas.height=${height};
        const ctx=canvas.getContext('2d'); ctx.fillStyle='#e6e9ef'; ctx.fillRect(0,0,canvas.width,canvas.height);
        const shots=${JSON.stringify(subset)};
        for(let i=0;i<shots.length;i++) {
          const image=new Image(); image.src='data:image/png;base64,'+shots[i].data; await image.decode();
          const x=${gutter}+(i%${columns})*${tileWidth+gutter}, y=${topMargin}+Math.floor(i/${columns})*${tileHeight+labelHeight+gutter};
          ctx.drawImage(image,x,y,${tileWidth},${tileHeight});
          ctx.fillStyle='#16253c';ctx.font='12px Arial';ctx.fillText(String(shots[i].number).padStart(2,'0')+'  '+shots[i].title.slice(0,44),x,y+${tileHeight+18});
        }
        return canvas.toDataURL('image/jpeg',0.9).split(',')[1];
      })()`);
      const sheetPath=path.join(assetDir,`contact-sheet-${String(start/16+1).padStart(2,'0')}.jpg`);
      await fs.writeFile(sheetPath,Buffer.from(data,'base64'));
      console.log(`Contact sheet: ${sheetPath}`);
    }
    console.log(`Page screenshots: ${shots.length} in ${assetDir}`);
  }
} catch(error) {
  console.error(error.stack || error.message);
  process.exitCode=1;
} finally {
  try { await cdp('Browser.close'); } catch {}
  if (!chromeExited) chrome.kill();
  await Promise.race([chromeExit, new Promise(resolve => setTimeout(resolve, 2000))]);
  await fs.rm(profileDir,{recursive:true,force:true});
}
