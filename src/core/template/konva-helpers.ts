import Konva from "konva";

/**
 * Returns an array of all non-whitespace character "tokens" / "chunks" / words
 * @param {string} text The source text
 * @returns {string[]} Non whitespace tokens in string
 */
export function getTokensInString(text: string): string[] {
  if (typeof text === "string") {
    const result = [];
    const tokens = text.split(" ");
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].length > 0) {
        result.push(tokens[i]);
      }
    }
    return result;
  }
  return [];
}

/**
 * Detect whether Konva.Text rendered any words that were broken across lines
 *
 * @param {string[]} sourceTokens An array of string tokens from original text passed to Konva.Text()
 * @param {Object[]} renderLines The contents of Konva.Text.textArr
 */
export function hasBrokenWords(
  sourceTokens: string[],
  renderLines: Konva.Text["textArr"],
) {
  let combined = "";
  for (let i = 0; i < renderLines.length; i++) {
    combined += (i === 0 ? "" : " ") + renderLines[i].text;
  }

  const a = sourceTokens;
  const b = getTokensInString(combined);

  if (a.length !== b.length) {
    return true;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return true;
    }
  }

  return false;
}

export function autoFitText(textElement: Konva.Text) {
  const sourceTokens = getTokensInString(textElement.text());
  const boxHeight = textElement.parent?.height() || 0;

  for (
    let brokenWords = hasBrokenWords(sourceTokens, textElement.textArr);
    brokenWords && textElement.height() < boxHeight;
    brokenWords = hasBrokenWords(sourceTokens, textElement.textArr)
  ) {
    // TODO: add setting in element that determines if text should be resized
    // or the text element should be resized
    textElement.height(textElement.height() + 1);
  }
}
