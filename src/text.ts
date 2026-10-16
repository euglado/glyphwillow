export type Language = "tr" | "en";
export type View = "report" | "visible" | "preview";
export const MAX_TEXT = 1000;
const selected = new Map<number, string>([
  [0x061c, "ARABIC LETTER MARK"],
  [0x200b, "ZERO WIDTH SPACE"],
  [0x200e, "LEFT-TO-RIGHT MARK"],
  [0x200f, "RIGHT-TO-LEFT MARK"],
  [0x202a, "LEFT-TO-RIGHT EMBEDDING"],
  [0x202b, "RIGHT-TO-LEFT EMBEDDING"],
  [0x202c, "POP DIRECTIONAL FORMATTING"],
  [0x202d, "LEFT-TO-RIGHT OVERRIDE"],
  [0x202e, "RIGHT-TO-LEFT OVERRIDE"],
  [0x2066, "LEFT-TO-RIGHT ISOLATE"],
  [0x2067, "RIGHT-TO-LEFT ISOLATE"],
  [0x2068, "FIRST STRONG ISOLATE"],
  [0x2069, "POP DIRECTIONAL ISOLATE"],
  [0xfeff, "ZERO WIDTH NO-BREAK SPACE / BOM"],
]);
const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
const special = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
export function validate(text: string): void {
  if (!text || text.length > MAX_TEXT || !text.isWellFormed()) throw new Error("invalid-text");
}
export function removable(char: string): boolean {
  const cp = char.codePointAt(0);
  return (
    cp !== undefined &&
    (selected.has(cp) ||
      ((cp < 32 || (cp >= 127 && cp <= 159)) && cp !== 9 && cp !== 10 && cp !== 13))
  );
}
export function code(char: string): string {
  return `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;
}
export function clean(text: string): string {
  validate(text);
  return [...text]
    .filter((c) => !removable(c))
    .join("")
    .normalize("NFC");
}
export function analyze(text: string) {
  validate(text);
  const characters = [...text];
  const findings = characters.flatMap((char, index) =>
    special.test(char)
      ? [
          {
            position: index + 1,
            code: code(char),
            name: selected.get(char.codePointAt(0) ?? 0) ?? "CONTROL / FORMAT / LINE SEPARATOR",
            removed: removable(char),
          },
        ]
      : [],
  );
  return {
    units: text.length,
    points: characters.length,
    graphemes: [...segmenter.segment(text)].length,
    findings,
    removed: characters.filter(removable).length,
    nfcChanged: text.normalize("NFC") !== text,
  };
}
function notation(char: string): string {
  return `\\u{${(char.codePointAt(0) ?? 0).toString(16).toUpperCase()}}`;
}
export function visible(text: string): string {
  return [...text]
    .map((c) => {
      const cp = c.codePointAt(0) ?? 0;
      return cp >= 33 && cp <= 126 && c !== "`" && c !== "\\" ? c : notation(c);
    })
    .join("");
}
export function preview(text: string): string {
  return [...clean(text)]
    .map((c) =>
      c === "`" || c === "\\" || (special.test(c) && c !== "\n" && c !== "\t") ? notation(c) : c,
    )
    .join("");
}
function bounded(text: string, limit: number): string {
  if (text.length <= limit) return text;
  let part = text.slice(0, limit);
  if (/[\uD800-\uDBFF]$/u.test(part)) part = part.slice(0, -1);
  return `${part}\n[…]`;
}
export function render(text: string, view: View, lang: Language): string {
  const a = analyze(text);
  const tr = lang === "tr";
  const title = `GlyphWillow · ${tr ? "Özel metin atölyesi" : "Private text workshop"}`;
  const foot = tr
    ? "5 dakikalık panel. Güvenlik/kimlik doğrulaması değildir. Kapat, RAM kaydını siler; Discord kopyaları kalabilir."
    : "5-minute panel. Not a security/identity check. Close deletes the RAM record; Discord copies may remain.";
  if (view === "visible")
    return `${title}\n${tr ? "ASCII görünümü: boşluk, ters eğik çizgi ve ASCII dışı karakterler Unicode koduyla gösterilir. Kesilmiş olabilir." : "ASCII view: spaces, backslashes and non-ASCII characters appear as Unicode codes. May be truncated."}\n\`\`\`text\n${bounded(visible(text), 1200)}\n\`\`\`\n${foot}`;
  if (view === "preview")
    return `${title}\n${tr ? "NFC önizleme: seçili kontroller kaldırılır. Diğer biçim kontrolleri, ters eğik çizgi ve backtick kodla gösterilir. Yön/emoji anlamı değişebilir; özgün metni değiştirmez. Kesilmiş olabilir." : "NFC preview: selected controls removed. Other format controls, backslashes and backticks shown as codes. Direction/emoji meaning may change; original text is untouched. May be truncated."}\n\`\`\`text\n${bounded(preview(text), 1100) || (tr ? "(boş)" : "(empty)")}\n\`\`\`\n${foot}`;
  const lines = a.findings
    .slice(0, 12)
    .map(
      (f) =>
        `${f.position}. ${f.code} ${f.name} [${f.removed ? (tr ? "kaldırılır" : "removed") : tr ? "korunur" : "kept"}]`,
    )
    .join("\n");
  return `${title}\n${tr ? "UTF-16 birimi / kod noktası / grafem kümesi" : "UTF-16 units / code points / grapheme clusters"}: ${a.units} / ${a.points} / ${a.graphemes}\n${tr ? "Kontrol/biçim/ayraç" : "Control/format/separator"}: ${a.findings.length}; ${tr ? "kaldırılacak" : "to remove"}: ${a.removed}; NFC ${tr ? "değişimi" : "change"}: ${a.nfcChanged ? (tr ? "evet" : "yes") : tr ? "hayır" : "no"}\n${tr ? "Kod noktası konumu; ilk 12 bulgu:" : "Code-point position; first 12 findings:"}\n${lines || (tr ? "Seçili kategorilerde bulgu yok." : "No findings in selected categories.")}\n${tr ? "Her görünmez karakteri veya benzer harfi saptamaz. ZWJ/ZWNJ ve varyasyon seçicileri korunur. Temiz önizlemeyi gözden geçirin." : "Does not detect every invisible character or lookalike. ZWJ/ZWNJ and variation selectors are preserved. Review the clean preview."}\n${foot}`;
}
