/**
 * Utility to reliably print receipts and thermal slips without blank pages or styling conflicts.
 * Uses an isolated hidden iframe to guarantee zero inheritance of dark mode colors,
 * overflow clipping, or parent layout offsets.
 */
export function printReceiptElement(element, options = {}) {
  if (!element) {
    window.print();
    return;
  }

  const title = options.title || 'Print Receipt';
  const paperWidth = options.paperWidth || '80mm';
  const is58mm = paperWidth === '58mm';

  // Get or create hidden iframe
  let iframe = document.getElementById('hms-print-frame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'hms-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: ${is58mm ? '2mm 3mm' : '4mm 5mm'};
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace, monospace !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Thermal Container Sizing */
          .thermal-container {
            width: 100%;
            max-width: ${is58mm ? '48mm' : '76mm'};
            margin: 0 auto;
            font-size: ${is58mm ? '9.5px' : '11px'};
            line-height: ${is58mm ? '1.25' : '1.35'};
            color: #000000 !important;
          }

          /* Force all normal receipt text & borders to pure black */
          .thermal-container *:not(.bg-black):not(.bg-black *) {
            color: #000000 !important;
          }
          .thermal-container * {
            border-color: #000000 !important;
          }

          /* Layout & Flexbox */
          .flex { display: flex !important; }
          .flex-1 { flex: 1 1 0% !important; }
          .flex-col { flex-direction: column !important; }
          .justify-between { justify-content: space-between !important; }
          .justify-center { justify-content: center !important; }
          .items-center { align-items: center !important; }
          .items-start { align-items: flex-start !important; }
          .shrink-0 { flex-shrink: 0 !important; }

          /* Typography */
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .font-bold { font-weight: 700 !important; }
          .font-semibold { font-weight: 600 !important; }
          .font-black { font-weight: 900 !important; }
          .font-medium { font-weight: 500 !important; }
          .uppercase { text-transform: uppercase !important; }
          .capitalize { text-transform: capitalize !important; }
          .tracking-tight { letter-spacing: -0.025em !important; }
          .tracking-wider { letter-spacing: 0.05em !important; }
          .tracking-widest { letter-spacing: 0.1em !important; }
          .leading-snug { line-height: 1.375 !important; }
          .text-\\[10px\\] { font-size: 10px !important; }
          .text-\\[11px\\] { font-size: 11px !important; }
          .text-\\[9px\\] { font-size: 9px !important; }
          .text-xs { font-size: 11px !important; }
          .text-sm { font-size: 13px !important; }
          .text-2xl { font-size: 22px !important; }

          /* Borders */
          .border { border-width: 1px !important; border-style: solid !important; }
          .border-2 { border-width: 2px !important; border-style: solid !important; }
          .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
          .border-t-2 { border-top-width: 2px !important; border-top-style: solid !important; }
          .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
          .border-b-2 { border-bottom-width: 2px !important; border-bottom-style: solid !important; }
          .border-dashed { border-style: dashed !important; }
          .border-dotted { border-style: dotted !important; }
          .rounded { border-radius: 4px !important; }
          .rounded-lg { border-radius: 8px !important; }

          /* Spacing */
          .space-y-0\\.5 > * + * { margin-top: 2px !important; }
          .space-y-1 > * + * { margin-top: 4px !important; }
          .space-y-1\\.5 > * + * { margin-top: 6px !important; }
          .space-y-2 > * + * { margin-top: 8px !important; }
          .space-y-3 > * + * { margin-top: 12px !important; }
          .space-y-4 > * + * { margin-top: 16px !important; }

          .p-2 { padding: 8px !important; }
          .py-0\\.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
          .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
          .py-1\\.5 { padding-top: 6px !important; padding-bottom: 6px !important; }
          .px-1\\.5 { padding-left: 6px !important; padding-right: 6px !important; }
          .pt-1 { padding-top: 4px !important; }
          .pt-1\\.5 { padding-top: 6px !important; }
          .pt-2 { padding-top: 8px !important; }
          .pt-3 { padding-top: 12px !important; }
          .pt-4 { padding-top: 16px !important; }
          .pb-0\\.5 { padding-bottom: 2px !important; }
          .pb-1 { padding-bottom: 4px !important; }
          .pb-2 { padding-bottom: 8px !important; }
          .pr-1 { padding-right: 4px !important; }
          .gap-1 { gap: 4px !important; }
          .gap-1\\.5 { gap: 6px !important; }
          .gap-2 { gap: 8px !important; }

          /* Inverted / Highlight Badges */
          .bg-black {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
          .bg-black * {
            color: #ffffff !important;
          }
          .bg-neutral-100 {
            background-color: #f0f0f0 !important;
          }

          /* Images & Icons */
          img {
            max-width: 100% !important;
            max-height: 70px !important;
            object-fit: contain !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto !important;
          }
          svg {
            display: inline-block !important;
            vertical-align: middle !important;
          }
          .rotate-90 {
            transform: rotate(90deg) !important;
          }
          .-rotate-90 {
            transform: rotate(-90deg) !important;
          }
          
          /* Hide no-print elements inside iframe */
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="thermal-container">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Ensure images are loaded before printing
  const images = iframeDoc.images;
  const numImages = images.length;
  let loadedImages = 0;

  const triggerPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('Print failed via iframe, falling back to window.print()', err);
      window.print();
    }
  };

  if (numImages === 0) {
    setTimeout(triggerPrint, 150);
  } else {
    let fired = false;
    const checkAllLoaded = () => {
      loadedImages++;
      if (loadedImages >= numImages && !fired) {
        fired = true;
        setTimeout(triggerPrint, 150);
      }
    };
    for (let i = 0; i < numImages; i++) {
      if (images[i].complete) {
        checkAllLoaded();
      } else {
        images[i].onload = checkAllLoaded;
        images[i].onerror = checkAllLoaded;
      }
    }
    // Safety fallback
    setTimeout(() => {
      if (!fired) {
        fired = true;
        triggerPrint();
      }
    }, 600);
  }
}
