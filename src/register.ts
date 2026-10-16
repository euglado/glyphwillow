import { REST, type RESTGetAPIOAuth2CurrentApplicationResult, Routes } from "discord.js";
import { configuration } from "./config.ts";
import { command } from "./discord.ts";
export async function register(
  rest: Pick<REST, "get" | "post">,
  application: string,
  guild: string,
): Promise<void> {
  const current = (await rest.get(
    Routes.oauth2CurrentApplication(),
  )) as RESTGetAPIOAuth2CurrentApplicationResult;
  if (current.id !== application) throw new Error("Application mismatch");
  await rest.post(Routes.applicationGuildCommands(application, guild), { body: command.toJSON() });
}
if (import.meta.main) {
  try {
    const config = configuration(process.env);
    await register(
      new REST({ version: "10" }).setToken(config.token),
      config.application,
      config.guild,
    );
    console.log("Guild command registered. / Sunucu komutu kaydedildi.");
  } catch {
    console.error(
      "Registration failed. Check setup IDs, token and guild installation. / Kayıt başarısız; kurulum bilgilerini kontrol edin. Never share the token.",
    );
    process.exitCode = 1;
  }
}
