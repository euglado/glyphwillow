import assert from "node:assert/strict";
import test from "node:test";
import {
  analyze,
  clean,
  MAX_TEXT,
  preview,
  removable,
  render,
  validate,
  visible,
} from "../src/text.ts";

test("distinguishes UTF16, code points and grapheme clusters", () => {
  const a = analyze("A👩‍👩‍👧‍👦e\u0301");
  assert.equal(a.units, 14);
  assert.equal(a.points, 10);
  assert.equal(a.graphemes, 3);
  assert.equal(a.removed, 0);
  assert.equal(a.findings.length, 3);
  assert.equal(a.nfcChanged, true);
});
test("selected bidi controls, zero width space, BOM and C0/C1 removed", () => {
  const controls =
    "\u061c\u200b\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069\ufeff\u0000\u0001\u001f\u007f\u0085\u009f";
  assert.equal(clean(`a${controls}b`), "ab");
  assert.equal(analyze(controls).removed, [...controls].length);
});
test("preserves language joining, emoji variation and whitespace", () => {
  const text = "ا\u200cب\u200d❤\ufe0f\n\r\t ";
  assert.equal(clean(text), text);
  assert.equal(analyze(text).removed, 0);
});
test("normalization occurs after removing controls", () => {
  assert.equal(clean("e\u200b\u0301"), "é");
  assert.equal(clean("Ａ①ﬀ"), "Ａ①ﬀ");
});
test("cleaning idempotent across all BMP code points except surrogates", () => {
  for (let cp = 0; cp <= 65535; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const value = `a${String.fromCodePoint(cp)}z`;
    assert.equal(clean(clean(value)), clean(value));
  }
});
test("visible output contains only unambiguous ASCII", () => {
  assert.equal(
    visible("A `\\é😀\n\u202e"),
    "A\\u{20}\\u{60}\\u{5C}\\u{E9}\\u{1F600}\\u{A}\\u{202E}",
  );
});
test("preview escapes fences, remaining formats and line separators", () => {
  assert.equal(
    preview("```\u200b\u200d\u200c\r\n\t\u2028"),
    "\\u{60}\\u{60}\\u{60}\\u{200D}\\u{200C}\\u{D}\n\t\\u{2028}",
  );
});
test("invalid text rejected; all-invisible input allowed", () => {
  for (const text of ["", "a".repeat(MAX_TEXT + 1), "\ud800", "a\udfff"])
    assert.throws(() => validate(text));
  validate("a".repeat(MAX_TEXT));
  assert.equal(clean("\u200b"), "");
});
test("report positions use one based code points and cap findings", () => {
  const a = analyze("😀\u200b\n");
  assert.equal(a.findings[0]?.position, 2);
  const content = render("\u202e".repeat(1000), "report", "en");
  assert.match(content, /1000/);
  assert.equal((content.match(/RIGHT-TO-LEFT OVERRIDE/g) ?? []).length, 12);
});
test("all views bounded, well-formed and no raw formatting controls", () => {
  for (const text of [
    "😀".repeat(500),
    "\u202e".repeat(1000),
    "`".repeat(1000),
    "\n".repeat(1000),
    "\u200d".repeat(1000),
    `${"a".repeat(999)}é`,
  ]) {
    for (const lang of ["tr", "en"] as const)
      for (const view of ["report", "visible", "preview"] as const) {
        const result = render(text, view, lang);
        assert.ok(result.length <= 2000);
        assert.ok(result.isWellFormed());
        assert.doesNotMatch(result, /\p{Cf}/u);
      }
  }
});
test("removal policy independent exhaustive ASCII control check", () => {
  for (let cp = 0; cp < 160; cp++)
    assert.equal(
      removable(String.fromCodePoint(cp)),
      (cp < 32 || cp >= 127) && cp !== 9 && cp !== 10 && cp !== 13,
    );
});
