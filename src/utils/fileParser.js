import * as pdfjsLib from 'pdfjs-dist';
// Explicitly import the worker to bundle it, avoiding CDN issues
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Configure PDF.js worker locally
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromFile = async (file) => {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        return await extractTextFromPDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractTextFromDOCX(file);
    } else if (fileType === 'text/plain') {
        return await extractTextFromTXT(file);
    } else {
        throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
    }
};

const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 1. First Pass: Extract raw text per page and identify candidate lines
    const pages = [];
    const allFirstLines = [];
    const allLastLines = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extract line items and group by Y position (simple approximation) or just join
        // For robustness relative to the python script, we'll try to reconstruct lines.
        // PDF.js returns items. We can join them.

        let pageText = "";
        let hasContent = false;

        // Simple join strategy (similar to what we had, but splitting by newlines based on proximity could be better)
        // For now, let's assume PDF.js returns lines reasonably or we treat the whole page string.
        // Better: Let's use the provided strings but try to detect visual lines if possible. 
        // A simple join(' ') is what we had. Let's try to preserve some structure if items have distinct 'transform'.
        // To keep it compatible with "p.py" logic which operates on text lines:

        // We will stick to the previous extraction but assume EOLs might be missing. 
        // Actually, often PDF.js items are fragments. 
        // Let's assume the user's PDFs might be decent. We'll use a slightly better line assembler if we can,
        // but for now, let's stick to the previous extraction (items joined by space/newline) and then split by newline.
        // Wait, previous was `items.map(item => item.str).join(' ')`. This loses newlines.
        // Let's try to add newlines if Y changes significantly? 
        // For simplicity and matching the previous code's dependencies, we'll stick to a basic join but try to inject newlines if items are far apart vertically? 
        // No, let's keep it simple: Join with ' ' is risky for headers. 
        // Let's change to `join('\n')` or check `item.hasEOL` if available (pdf.js specific). 
        // A safer bet without complex geometry math: Join items with ' '. Split by logic later?
        // Actually, many PDFs return lines as separate items. Let's try joining with " " but if we want to detect headers, we REALLY need lines.
        // Let's rely on standard `\n` if the PDF has them, or just use the items as "lines" if they are long enough.

        // REVISION: We'll use a heuristic. 
        // If we join everything with " ", we have no "first line".
        // We MUST attempt to reconstruct lines. 

        // Naive Line Reconstruction:
        // Group items by 'transform[5]' (Y position). 
        // This is safer.

        const linesMap = new Map(); // Y (int) -> [strings]

        for (const item of textContent.items) {
            // Round Y to nearest integer to group slightly misaligned items
            const y = Math.floor(item.transform[5]);
            if (!linesMap.has(y)) linesMap.set(y, []);
            linesMap.get(y).push(item.str);
        }

        // Sort by Y descending (PDF coords start bottom-left usually, or top-left depending on matrix)
        // Usually PDF is bottom(0) to top(height). So higher Y is higher up? 
        // Actually, standard PDF is bottom-up. So higher Y = Header. Lower Y = Footer.
        // We need to sort descending keys.

        const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);

        const pageLines = sortedYs.map(y => linesMap.get(y).join(' ').trim()).filter(l => l.length > 0);

        if (pageLines.length > 0) {
            allFirstLines.push(pageLines[0]); // Header candidate
            allLastLines.push(pageLines[pageLines.length - 1]); // Footer candidate
        }

        pages.push({
            pageNumber: i,
            lines: pageLines
        });
    }

    // 2. Analyze Frequencies (Python logic port)
    const threshold = pdf.numPages * 0.4; // 40% threshold

    const countOccurrences = (arr) => {
        const counts = {};
        arr.forEach(l => counts[l] = (counts[l] || 0) + 1);
        return counts;
    };

    const headerCounts = countOccurrences(allFirstLines);
    const footerCounts = countOccurrences(allLastLines);

    const detectedHeaders = new Set(Object.keys(headerCounts).filter(line => headerCounts[line] > threshold));
    const detectedFooters = new Set(Object.keys(footerCounts).filter(line => footerCounts[line] > threshold));

    if (detectedHeaders.size > 0 || detectedFooters.size > 0) {
        console.log("Cleaned Headers:", detectedHeaders);
        console.log("Cleaned Footers:", detectedFooters);
    }

    // 3. Reconstruct Text with Cleaning
    let finalFullText = "";

    pages.forEach(p => {
        // Filter lines
        const cleanLines = p.lines.filter((line, index) => {
            // Check if it's potentially a header (first line)
            if (index === 0 && detectedHeaders.has(line)) return false;
            // Check if it's potentially a footer (last line)
            if (index === p.lines.length - 1 && detectedFooters.has(line)) return false;
            return true;
        });

        const pageText = cleanLines.join('\n');
        finalFullText += `\n--- Página ${p.pageNumber} ---\n${pageText}\n`;
    });

    return finalFullText;
};

const extractTextFromDOCX = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    // We use convertToHtml to get semantic tags (<ol>, <li>, <h1>)
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    // Use browser's native DOMParser to convert HTML -> Structured Text
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let fullText = "";

    // Recursive function to walk DOM and preserve numbering
    function walkNodes(node, listState = null) {
        if (node.nodeType === Node.TEXT_NODE) {
            const txt = node.textContent;
            if (txt && txt.trim()) fullText += txt;
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.tagName.toLowerCase();

        // Block elements: Add newline before
        if (['p', 'h1', 'h2', 'h3', 'h4', 'div', 'li'].includes(tag)) {
            fullText += "\n";
        }

        // List Handling
        if (tag === 'ol') {
            // Start a new ordered list context
            const newState = { type: 'ol', index: 1, parent: listState };
            Array.from(node.children).forEach(child => walkNodes(child, newState));
            return; // Children handled
        }
        if (tag === 'ul') {
            const newState = { type: 'ul', index: 1, parent: listState };
            Array.from(node.children).forEach(child => walkNodes(child, newState));
            return;
        }
        if (tag === 'li') {
            if (listState && listState.type === 'ol') {
                // If nested list, maybe add indentation? For now just the number.
                // We construct "1. " or "1.1. " if we tracked depth, but simple "1. " is enough for our Regex
                fullText += `${listState.index}. `;
                listState.index++;
            } else {
                fullText += "• ";
            }
        }

        // Headers: Add extra visual separation
        if (['h1', 'h2', 'h3'].includes(tag)) {
            fullText += "\n# ";
        }

        // recurse
        Array.from(node.childNodes).forEach(child => walkNodes(child, listState));

        // Block elements: Add newline after
        if (['p', 'h1', 'h2', 'h3', 'div'].includes(tag)) {
            fullText += "\n";
        }
    }

    walkNodes(doc.body);
    return fullText.trim();
};

const extractTextFromTXT = async (file) => {
    const text = await file.text();
    return text;
};
