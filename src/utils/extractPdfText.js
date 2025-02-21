// src/utils/extractPdfText.js
"use strict";

import PDFParser from "pdf2json";

/**
 * Extract text from a PDF Buffer using pdf2json.
 * Returns a Promise that resolves to a single string of all text.
 */
export function extractPdfText(pdfBuffer) {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();

      // Handle errors
      pdfParser.on("pdfParser_dataError", (errData) => {
        reject(errData.parserError || new Error("Failed to parse PDF"));
      });

      // On successful parse, combine text from all pages
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        let extractedText = "";
        // pdfData.Pages is an array of pages
        pdfData.Pages.forEach((page) => {
          // Each page has an array of text "Texts"
          page.Texts.forEach((textObj) => {
            // textObj.R is an array of text runs, each with T (URI-encoded string)
            if (textObj.R && textObj.R.length > 0) {
              const encodedStr = textObj.R[0].T;
              // decodeURIComponent decodes the URI-encoded text
              extractedText += decodeURIComponent(encodedStr) + " ";
            }
          });
          extractedText += "\n";
        });

        resolve(extractedText.trim());
      });

      // Start parsing the PDF buffer
      pdfParser.parseBuffer(pdfBuffer);
    } catch (error) {
      reject(error);
    }
  });
}
