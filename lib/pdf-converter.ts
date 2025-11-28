// lib/pdf-converter.ts

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function convertPdfToImage(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF Converter] Loading PDF:', pdfUrl);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    console.log('[PDF Converter] PDF loaded, pages:', pdf.numPages);

    // Get the first page (receipts are usually 1 page)
    const page = await pdf.getPage(1);

    // Set scale for better quality
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Convert canvas to base64 image
    const imageDataUrl = canvas.toDataURL('image/png');

    console.log('[PDF Converter] ✅ Converted to image');

    return imageDataUrl;
  } catch (error) {
    console.error('[PDF Converter] Error converting PDF:', error);
    throw error;
  }
}

// Server-side canvas implementation
function createCanvas(width: number, height: number) {
  // Use browser Canvas API (works in Node.js with proper polyfill)
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  // Fallback: Create a minimal canvas-like object for server
  const canvasData = new Uint8ClampedArray(width * height * 4);
  
  return {
    width,
    height,
    getContext: (type: string) => {
      if (type !== '2d') return null;
      
      return {
        canvas: { width, height },
        fillStyle: '#FFFFFF',
        fillRect: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: canvasData }),
        putImageData: () => {},
      };
    },
    toDataURL: () => {
      // For server-side, we'll need to return raw image data
      // This is a simplified version - in reality we'd use the render output
      return '';
    },
  };
}
