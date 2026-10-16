import assert from "node:assert/strict";
import test from "node:test";
import { type Binding, Panels, TTL } from "../src/panels.ts";

const binding: Binding = { user: "user", guild: "guild", channel: "channel", application: "app" };
function prepared() {
  const p = new Panels();
  const card = p.create(binding, "hello", "en", 100);
  p.attach(card.id, "message");
  return { p, card };
}
test("session random IDs, own bound report and clean close", async () => {
  const { p, card } = prepared();
  assert.match(card.id, /^[a-f0-9]{32}$/u);
  await p.click(card.id, "preview", binding, "message", 101, async (value) => {
    assert.match(value?.content ?? "", /NFC preview/u);
  });
  await p.click(card.id, "close", binding, "message", 102, async (value) => {
    assert.equal(value, null);
    assert.equal(p.sessions.size, 0);
  });
});
for (const field of ["user", "guild", "channel", "application"] as const)
  test(`rejects foreign ${field}`, async () => {
    const { p, card } = prepared();
    await assert.rejects(
      p.click(card.id, "report", { ...binding, [field]: "other" }, "message", 101, async () =>
        assert.fail("must not update"),
      ),
      /expired/,
    );
  });
test("rejects foreign message, unattached, expired or restarted panels", async () => {
  const { p, card } = prepared();
  await assert.rejects(p.click(card.id, "report", binding, "other", 101, async () => {}));
  p.discard(card.id);
  const fresh = p.create({ ...binding, user: "second" }, "hi", "en", 101);
  await assert.rejects(p.click(fresh.id, "report", binding, "message", 102, async () => {}));
  await assert.rejects(
    new Panels().click(card.id, "report", binding, "message", 101, async () => {}),
  );
  const q = prepared();
  await assert.rejects(
    q.p.click(q.card.id, "report", binding, "message", 100 + TTL, async () => {}),
  );
  assert.equal(q.p.sessions.size, 0);
});
test("expiry doesn't slide; periodic pruning clears text and cooldowns", async () => {
  const { p, card } = prepared();
  await p.click(card.id, "visible", binding, "message", 1000, async () => {});
  assert.equal(p.sessions.get(card.id)?.expires, 100 + TTL);
  p.prune(100 + TTL);
  assert.equal(p.sessions.size, 0);
  assert.equal(p.cooldowns.size, 0);
});
test("five second command gate and one second panel gate", async () => {
  const { p, card } = prepared();
  assert.throws(() => p.create(binding, "hi", "en", 5099), /cooldown/);
  p.create(binding, "hi", "en", 5100);
  await p.click(card.id, "report", binding, "message", 200, async () => {});
  await assert.rejects(
    p.click(card.id, "preview", binding, "message", 1199, async () => {}),
    /cooldown/,
  );
  await p.click(card.id, "preview", binding, "message", 1200, async () => {});
});
test("session and cooldown capacity refuse growth", () => {
  const p = new Panels();
  for (let n = 0; n < 100; n++) p.create({ ...binding, user: String(n) }, "hi", "en", 0);
  assert.throws(() => p.create(binding, "hi", "en", 0), /capacity/);
  assert.equal(p.sessions.size, 100);
  const q = new Panels();
  for (let n = 0; n < 1000; n++) {
    const c = q.create({ ...binding, user: String(n) }, "hi", "en", 0);
    q.discard(c.id);
  }
  assert.throws(() => q.create(binding, "hi", "en", 0), /capacity/);
  q.create(binding, "hi", "en", 5000);
});
test("concurrent actions blocked until transport completes", async () => {
  const { p, card } = prepared();
  let release: (() => void) | undefined;
  const pending = p.click(
    card.id,
    "report",
    binding,
    "message",
    200,
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  await assert.rejects(
    p.click(card.id, "close", binding, "message", 201, async () => {}),
    /cooldown/,
  );
  assert.ok(release);
  release();
  await pending;
  await p.click(card.id, "close", binding, "message", 202, async () => {});
});
test("transport failure releases busy gate, failed close still deletes", async () => {
  const { p, card } = prepared();
  await assert.rejects(
    p.click(card.id, "report", binding, "message", 200, async () => {
      throw new Error("network");
    }),
  );
  assert.equal(p.sessions.get(card.id)?.busy, false);
  await assert.rejects(
    p.click(card.id, "close", binding, "message", 201, async () => {
      throw new Error("network");
    }),
  );
  assert.equal(p.sessions.size, 0);
});
test("invalid text never creates memory or cooldown records", () => {
  const p = new Panels();
  assert.throws(() => p.create(binding, "", "en", 0));
  assert.equal(p.sessions.size, 0);
  assert.equal(p.cooldowns.size, 0);
});
