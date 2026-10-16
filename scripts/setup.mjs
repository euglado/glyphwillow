import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

export function hiddenToken(input = process.stdin, output = process.stdout) {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== "function")
    return Promise.reject(new Error("A real terminal is required. / Gerçek terminal gerekir."));
  return new Promise((resolve, reject) => {
    let token = "";
    const wasRaw = input.isRaw;
    function done(error) {
      input.off("data", data);
      input.off("error", failure);
      input.off("end", ended);
      input.setRawMode(Boolean(wasRaw));
      input.pause();
      output.write("\n");
      if (error) reject(error);
      else resolve(token);
      token = "";
    }
    function failure() {
      done(new Error("Terminal input failed."));
    }
    function ended() {
      done(new Error("Terminal closed."));
    }
    function data(chunk) {
      const text = chunk.toString("utf8");
      if (/[\r\n]/u.test(text) && !/^[^\r\n]*(?:\r\n|\r|\n)$/u.test(text)) {
        done(new Error("Paste only one token line."));
        return;
      }
      for (const c of text) {
        if (c === "\r" || c === "\n") {
          done(
            token.length >= 30 && token.length <= 200 && !/\s|[\p{Cc}\p{Cf}]/u.test(token)
              ? undefined
              : new Error("Invalid token format."),
          );
          return;
        }
        if (c === "\u0003") {
          done(new Error("Cancelled."));
          return;
        }
        if (c === "\b" || c === "\u007f") token = token.slice(0, -1);
        else if (/[\p{Cc}\p{Cf}\s]/u.test(c) || token.length >= 200) {
          done(new Error("Invalid token input."));
          return;
        } else token += c;
      }
    }
    output.write("Bot token (hidden / gizli): ");
    input.setRawMode(true);
    input.on("data", data);
    input.once("error", failure);
    input.once("end", ended);
    input.resume();
  });
}
export function validId(value) {
  return /^[1-9][0-9]{16,19}$/u.test(value) && BigInt(value) <= 18446744073709551615n;
}
export async function saveSettings(application, guild, token, destination = ".env") {
  if (
    !validId(application) ||
    !validId(guild) ||
    typeof token !== "string" ||
    token.length < 30 ||
    token.length > 200 ||
    /\s|[\p{Cc}\p{Cf}]/u.test(token)
  )
    throw new Error("Invalid settings");
  await writeFile(
    destination,
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
}
export async function setup() {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("Open a real terminal. / Gerçek terminal açın.");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let application;
  let guild;
  try {
    application = await rl.question("Application ID / Uygulama kimliği: ");
    guild = await rl.question("Server ID / Sunucu kimliği: ");
  } finally {
    rl.close();
  }
  if (!validId(application) || !validId(guild))
    throw new Error("Invalid IDs. / Kimlikler geçersiz.");
  const token = await hiddenToken();
  await saveSettings(application, guild, token);
  console.log(
    `Saved .env without overwriting. / .env üzerine yazmadan kaydedildi.\nGuild install / Sunucu kurulumu:\nhttps://discord.com/oauth2/authorize?client_id=${application}&scope=bot%20applications.commands&permissions=1024&guild_id=${guild}&disable_guild_select=true\nNext / Sonra: register.cmd or ./register.sh; start.cmd or ./start.sh`,
  );
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  setup().catch(() => {
    console.error(
      "Setup failed or .env already exists. Use a real terminal, valid IDs and one token line. / Kurulum başarısız veya .env mevcut; terminal ve bilgileri kontrol edin. Never share the token.",
    );
    process.exitCode = 1;
  });
}
