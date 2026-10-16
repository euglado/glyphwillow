import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { hiddenToken, saveSettings, validId } from "../scripts/setup.mjs";

class Terminal extends EventEmitter {
  isTTY = true;
  isRaw = false;
  paused = false;
  setRawMode(value) {
    this.isRaw = value;
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
}
function terminal() {
  const input = new Terminal();
  const out = [];
  const output = { isTTY: true, write: (value) => out.push(value) };
  return { input, output, out };
}
test("hidden token isn't echoed and raw state restored", async () => {
  const t = terminal();
  const promise = hiddenToken(t.input, t.output);
  t.input.emit("data", Buffer.from(`${"x".repeat(39)}y\bx\r`));
  assert.equal(await promise, "x".repeat(40));
  assert.equal(t.input.isRaw, false);
  assert.equal(t.input.paused, true);
  assert.equal(t.input.listenerCount("data"), 0);
  assert.doesNotMatch(t.out.join(""), /xxxxxxxx/);
});
for (const [name, value] of [
  ["cancel", "\u0003"],
  ["short", "short\r"],
  ["multiline", `${"x".repeat(40)}\nx\n`],
  ["control", "\u001b[1m"],
  ["overlong", "x".repeat(201)],
  ["spaces", "x "],
])
  test(`hidden token rejects ${name}`, async () => {
    const t = terminal();
    const promise = hiddenToken(t.input, t.output);
    t.input.emit("data", Buffer.from(value));
    await assert.rejects(promise);
    assert.equal(t.input.isRaw, false);
    assert.equal(t.input.listenerCount("data"), 0);
  });
test("terminal errors/end restore original raw state", async () => {
  for (const event of ["error", "end"]) {
    const t = terminal();
    t.input.isRaw = true;
    const p = hiddenToken(t.input, t.output);
    t.input.emit(event, new Error("private"));
    await assert.rejects(p);
    assert.equal(t.input.isRaw, true);
    assert.equal(t.input.listenerCount("data"), 0);
  }
});
test("nonterminal rejects before asking for token", async () => {
  const t = terminal();
  t.input.isTTY = false;
  await assert.rejects(hiddenToken(t.input, t.output));
  assert.equal(t.out.length, 0);
});
test("ID validation rejects newline/overflow", () => {
  assert.equal(validId("123456789012345678"), true);
  for (const v of ["123456789012345678\n", "18446744073709551616", "1"])
    assert.equal(validId(v), false);
});
test("settings creation is exclusive; invalid settings never write", async () => {
  const prefix = path.join(tmpdir(), "glyphwillow-settings-");
  const directory = await mkdtemp(prefix);
  assert.ok(path.resolve(directory).startsWith(path.resolve(prefix)));
  const target = path.join(directory, ".env");
  const id = "123456789012345678";
  const token = "x".repeat(40);
  try {
    await assert.rejects(saveSettings(id, id, "short", target));
    assert.deepEqual(await readdir(directory), []);
    await saveSettings(id, id, token, target);
    const initial = await readFile(target, "utf8");
    assert.ok(initial.includes(token));
    await assert.rejects(saveSettings(id, id, "y".repeat(40), target), { code: "EEXIST" });
    assert.equal(await readFile(target, "utf8"), initial);
    if (process.platform !== "win32") assert.equal((await stat(target)).mode & 0o777, 0o600);
  } finally {
    if (path.resolve(directory).startsWith(path.resolve(prefix)))
      await rm(directory, { recursive: true, force: true });
  }
});
test("actual unconfigured entrypoints fail safely without files or credentials", async () => {
  const prefix = path.join(tmpdir(), "glyphwillow-test-");
  const directory = await mkdtemp(prefix);
  assert.ok(path.resolve(directory).startsWith(path.resolve(prefix)));
  try {
    const env = { ...process.env };
    delete env.DISCORD_TOKEN;
    delete env.DISCORD_APPLICATION_ID;
    delete env.DISCORD_GUILD_ID;
    for (const entry of ["../src/main.ts", "../src/register.ts", "../scripts/setup.mjs"]) {
      const result = spawnSync(process.execPath, [fileURLToPath(new URL(entry, import.meta.url))], {
        cwd: directory,
        env,
        encoding: "utf8",
        timeout: 10_000,
      });
      assert.equal(result.status, 1, `${entry}: ${result.stderr}`);
      assert.equal(result.error, undefined);
      assert.match(result.stderr, /failed|başarısız|Başlatılamadı/u);
      assert.deepEqual(await readdir(directory), []);
    }
  } finally {
    if (path.resolve(directory).startsWith(path.resolve(prefix)))
      await rm(directory, { recursive: true, force: true });
  }
});
