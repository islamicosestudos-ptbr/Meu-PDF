import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentData, PDFPageData } from "../types";

// Configure pdfjs worker to reliable CDN matching installed version or fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Worker setup error:", e);
}

/**
 * Splits extracted page text into clean paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  // Normalize whitespace and split on multi-newlines or meaningful block boundaries
  const rawParagraphs = text.split(/(?:\r?\n){2,}/);
  const cleanParagraphs = rawParagraphs
    .map(p => p.replace(/\s+/g, " ").trim())
    .filter(p => p.length > 0);

  if (cleanParagraphs.length === 0 && text.trim().length > 0) {
    // If no double newlines, split by sentence clumps (approx 200-300 chars)
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    const grouped: string[] = [];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > 350) {
        if (current.trim()) grouped.push(current.trim());
        current = s;
      } else {
        current += " " + s;
      }
    }
    if (current.trim()) grouped.push(current.trim());
    return grouped.length > 0 ? grouped : [text.trim()];
  }

  return cleanParagraphs;
}

/**
 * Parse an uploaded PDF File or ArrayBuffer into structured PDFDocumentData
 */
export async function parsePDFFile(file: File): Promise<PDFDocumentData> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const pages: PDFPageData[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    
    // Assemble text items preserving some structure
    let lastY: number | null = null;
    let pageText = "";

    for (const item of textContent.items as any[]) {
      if (!item.str) continue;
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
        pageText += "\n";
      } else if (pageText.length > 0 && !pageText.endsWith(" ") && !pageText.endsWith("\n")) {
        pageText += " ";
      }
      pageText += item.str;
      lastY = item.transform[5];
    }

    const paragraphs = splitIntoParagraphs(pageText);

    pages.push({
      pageNumber: i,
      text: pageText.trim() || `(Página ${i} sem texto legível ou imagem escaneada)`,
      paragraphs: paragraphs.length > 0 ? paragraphs : [`Página ${i}`]
    });
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return {
    id: "doc_" + Date.now(),
    title: file.name.replace(/\.[^/.]+$/, ""),
    author: "Arquivo do Usuário",
    totalPages,
    pages,
    fileSize: formatSize(file.size),
    uploadedAt: new Date().toLocaleDateString("pt-BR"),
  };
}

/**
 * Renders a specific PDF page onto a canvas element
 */
export async function renderPDFPageToCanvas(
  file: File,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.3
): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(pageNumber);

    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) return;

    const renderContext = {
      canvasContext,
      viewport,
    };

    await page.render(renderContext).promise;
  } catch (err) {
    console.error("Erro ao renderizar página no canvas:", err);
  }
}
