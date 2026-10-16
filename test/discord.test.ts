import assert from "node:assert/strict";
import test from "node:test";
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  MessageFlags,
  MessageFlagsBitField,
  PermissionFlagsBits,
  PermissionsBitField,
  type REST,
  Routes,
} from "discord.js";
import { configuration, snowflake } from "../src/config.ts";
import { command, handle, payload, permissionAllowed } from "../src/discord.ts";
import { Panels } from "../src/panels.ts";
import { register } from "../src/register.ts";

const app = "123456789012345678";
const guild = "223456789012345678";
function fake(button = false) {
  const calls: { name: string; data: unknown }[] = [];
  const state = {
    applicationId: app,
    guildId: guild,
    channelId: "channel",
    user: { id: "owner" },
    locale: "en",
    commandName: "glyphwillow",
    customId: "",
    deferred: false,
    replied: false,
    memberPermissions: new PermissionsBitField(PermissionFlagsBits.ViewChannel),
    appPermissions: new PermissionsBitField(PermissionFlagsBits.ViewChannel),
    message: {
      id: "message",
      author: { id: app },
      flags: new MessageFlagsBitField(MessageFlags.Ephemeral),
    },
    options: { getString: () => "hello\u200b" },
    isChatInputCommand: () => !button,
    isButton: () => button,
    deferReply: async (data: unknown) => {
      calls.push({ name: "defer", data });
      state.deferred = true;
    },
    editReply: async (data: unknown) => {
      calls.push({ name: "edit", data });
      return { id: "message" };
    },
    reply: async (data: unknown) => {
      calls.push({ name: "reply", data });
      state.replied = true;
    },
    update: async (data: unknown) => {
      calls.push({ name: "update", data });
      state.replied = true;
    },
  };
  return {
    state,
    calls,
    interaction: state as unknown as ChatInputCommandInteraction & ButtonInteraction,
  };
}
test("command only one bounded required input and no global-only fields", () => {
  const body = command.toJSON();
  assert.equal(body.name, "glyphwillow");
  assert.equal(body.options?.length, 1);
  const option = body.options?.[0];
  assert.ok(option && "max_length" in option);
  assert.equal(option.max_length, 1000);
  assert.equal(body.contexts, undefined);
  assert.equal(body.integration_types, undefined);
});
test("default report private and all button payloads suppress mentions", async () => {
  const f = fake();
  const p = new Panels();
  await handle(f.interaction, p, app, guild);
  assert.deepEqual(f.calls[0], { name: "defer", data: { flags: MessageFlags.Ephemeral } });
  assert.equal(p.sessions.size, 1);
  const data = payload({ content: "@everyone", id: "id", lang: "en" }, "en");
  assert.deepEqual(data.allowedMentions.parse, []);
  assert.equal(data.components[0]?.components.length, 4);
  assert.equal(payload(null, "tr").components.length, 0);
});
test("permission combinations minimum view only, never bot admin", () => {
  const v = PermissionFlagsBits.ViewChannel,
    a = PermissionFlagsBits.Administrator;
  for (const member of [undefined, 0n, v, a, a | v])
    for (const bot of [undefined, 0n, v, a, a | v])
      assert.equal(
        permissionAllowed(member, bot),
        member !== undefined && (member & v) !== 0n && bot === v,
      );
});
for (const field of ["applicationId", "guildId", "channelId"] as const)
  test(`refuses invalid ${field}`, async () => {
    const f = fake();
    f.state[field] = field === "channelId" ? "" : "foreign";
    const p = new Panels();
    await handle(f.interaction, p, app, guild);
    assert.equal(p.sessions.size, 0);
    assert.equal(f.calls[0]?.name, "reply");
  });
test("valid bound button updates; foreign author/nonprivate/malformed refused", async () => {
  const p = new Panels();
  const f = fake();
  await handle(f.interaction, p, app, guild);
  const id = [...p.sessions.keys()][0];
  assert.ok(id);
  const b = fake(true);
  b.state.customId = `gw:${id}:visible`;
  await handle(b.interaction, p, app, guild);
  assert.equal(b.calls[0]?.name, "update");
  for (const mutate of [
    (s: ReturnType<typeof fake>["state"]) => {
      s.message.author.id = "foreign";
    },
    (s: ReturnType<typeof fake>["state"]) => {
      s.message.flags = new MessageFlagsBitField();
    },
    (s: ReturnType<typeof fake>["state"]) => {
      s.customId += "\n";
    },
  ]) {
    const bad = fake(true);
    bad.state.customId = `gw:${id}:close`;
    mutate(bad.state);
    await handle(bad.interaction, p, app, guild);
    assert.equal(bad.calls[0]?.name, "reply");
  }
});
test("failed initial edit/defer creates no retained text; no transport data exposed", async () => {
  for (const phase of ["editReply", "deferReply"] as const) {
    const f = fake();
    f.state[phase] = async () => {
      throw new Error("sensitive");
    };
    const p = new Panels();
    await handle(f.interaction, p, app, guild);
    assert.equal(p.sessions.size, 0);
    assert.doesNotMatch(JSON.stringify(f.calls), /sensitive/);
  }
});
test("access loss refuses existing panel", async () => {
  const p = new Panels();
  const f = fake();
  await handle(f.interaction, p, app, guild);
  const b = fake(true);
  b.state.customId = `gw:${[...p.sessions.keys()][0]}:close`;
  b.state.memberPermissions = new PermissionsBitField();
  await handle(b.interaction, p, app, guild);
  assert.equal(b.calls[0]?.name, "reply");
});
test("unrelated commands and components ignored", async () => {
  for (const button of [true, false]) {
    const f = fake(button);
    f.state.commandName = "other";
    f.state.customId = "other";
    await handle(f.interaction, new Panels(), app, guild);
    assert.equal(f.calls.length, 0);
  }
});
test("registration app identity checked before single guild upsert", async () => {
  const calls: unknown[] = [];
  const rest = {
    get: async (route: string) => {
      assert.equal(route, Routes.oauth2CurrentApplication());
      return { id: app };
    },
    post: async (...args: unknown[]) => {
      calls.push(args);
      return {};
    },
  } as unknown as Pick<REST, "get" | "post">;
  await register(rest, app, guild);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as unknown[])[0], Routes.applicationGuildCommands(app, guild));
  await assert.rejects(register(rest, "other", guild));
  assert.equal(calls.length, 1);
});
test("config canonical IDs reject final newline and whitespace token", () => {
  const env = {
    DISCORD_TOKEN: "x".repeat(40),
    DISCORD_APPLICATION_ID: app,
    DISCORD_GUILD_ID: guild,
  };
  assert.equal(configuration(env).application, app);
  for (const id of [`${app}\n`, ` ${app}`, `0${app}`, "18446744073709551616", "1", ""])
    assert.equal(snowflake(id), false);
  for (const token of ["", "short", `${"x".repeat(40)}\n`, `${"x".repeat(40)}\u200b`])
    assert.throws(() => configuration({ ...env, DISCORD_TOKEN: token }));
});
