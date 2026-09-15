import zlib from 'node:zlib';

/**
 * Minimal PDF text extraction, using only Node's built-in `zlib`.
 *
 * Exists so the PDF journey can assert the receipt's **content** — that it lists the products
 * ordered, their prices and the correct total — rather than settling for "a file downloaded".
 *
 * How the SauceDemo receipt stores its text, confirmed by inspecting a real download:
 *
 *   1. Page content sits in a single `stream ... endstream` block, Flate-compressed.
 *   2. Inflating it yields PDF drawing operators.
 *   3. Visible text appears in `TJ` arrays as hex glyph runs, e.g. `[<537761> 10 <67> 0] TJ`
 *      where `53 77 61` is "Swa" and `67` is "g" — so "Swag Labs" arrives in fragments.
 *
 * This is not a general-purpose PDF parser. It handles Flate-compressed streams with hex or
 * literal string operators, which is what this application produces. If the receipt ever
 * switches to a different encoding, `extractPdfText` returns little or nothing and the journey
 * fails loudly rather than passing vacuously — which is the behaviour we want.
 */
export function extractPdfText(pdfBuffer: Buffer): string {
  const rawPdf = pdfBuffer.toString('latin1');
  const textFragments: string[] = [];
  const streamStartPattern = /stream\r?\n/g;
  let streamStart: RegExpExecArray | null;

  while ((streamStart = streamStartPattern.exec(rawPdf)) !== null) {
    const contentStart = streamStart.index + streamStart[0].length;
    const contentEnd = rawPdf.indexOf('endstream', contentStart);
    if (contentEnd === -1) continue;

    let pageOperators: string;
    try {
      pageOperators = zlib
        .inflateSync(pdfBuffer.subarray(contentStart, contentEnd))
        .toString('latin1');
    } catch {
      // Not a Flate stream (fonts, images). Nothing to read here.
      continue;
    }

    for (const textOperator of pageOperators.matchAll(/\[(.*?)\]\s*TJ|\((.*?)\)\s*Tj/gs)) {
      const hexArrayBody = textOperator[1];
      const literalString = textOperator[2];

      if (literalString !== undefined) {
        textFragments.push(literalString);
        continue;
      }
      if (hexArrayBody === undefined) continue;

      for (const hexRun of hexArrayBody.matchAll(/<([0-9A-Fa-f]+)>/g)) {
        const hexGlyphs = hexRun[1];
        if (!hexGlyphs) continue;
        textFragments.push(Buffer.from(hexGlyphs, 'hex').toString('latin1'));
      }
    }
  }

  return textFragments.join('');
}

/** True when the buffer is a structurally complete PDF file. */
export function isValidPdf(pdfBuffer: Buffer): boolean {
  const startsWithPdfHeader = pdfBuffer.subarray(0, 5).toString('latin1') === '%PDF-';
  const endsWithPdfTrailer = pdfBuffer.subarray(-2048).toString('latin1').includes('%%EOF');
  return startsWithPdfHeader && endsWithPdfTrailer;
}
