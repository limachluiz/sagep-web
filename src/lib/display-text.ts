const NAMED_ENTITIES: Record<string, string> = {
  aacute: "á", acirc: "â", agrave: "à", atilde: "ã",
  amp: "&",
  apos: "'",
  ccedil: "ç",
  eacute: "é", ecirc: "ê",
  gt: ">",
  iacute: "í",
  lt: "<",
  nbsp: " ",
  oacute: "ó", ocirc: "ô", otilde: "õ",
  quot: '"',
  uacute: "ú", uuml: "ü",
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (entity, code: string) => {
    if (!code.startsWith("#")) return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
    const hexadecimal = code[1]?.toLowerCase() === "x";
    const number = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    if (!Number.isFinite(number) || number <= 0 || number > 0x10ffff) return entity;
    try { return String.fromCodePoint(number); } catch { return entity; }
  });
}

function removeControlCharacters(value: string) {
  return Array.from(value, (character) => {
    const code = character.codePointAt(0) ?? 0;
    const removable = (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
    return removable ? "" : character;
  }).join("");
}

export function normalizeDisplayText(value: string | null | undefined) {
  let text = String(value ?? "");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const decoded = decodeHtmlEntities(text);
    if (decoded === text) break;
    text = decoded;
  }
  return removeControlCharacters(text)
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
