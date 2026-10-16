import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { configuration } from "./config.ts";
import { handle } from "./discord.ts";
import { Panels } from "./panels.ts";

try {
  const config = configuration(process.env);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: { parse: [] },
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
      PresenceManager: 0,
      ReactionManager: 0,
    }),
  });
  const panels = new Panels();
  const timer = setInterval(() => panels.prune(Date.now()), 30_000);
  timer.unref();
  client.once(Events.ClientReady, (ready) => {
    if (ready.user.id !== config.application) {
      console.error("Application ID mismatch. / Uygulama kimliği uyuşmuyor.");
      client.destroy();
      process.exitCode = 1;
      return;
    }
    console.log("GlyphWillow online. / GlyphWillow çevrimiçi.");
  });
  client.on(Events.InteractionCreate, (i) => {
    if (i.isChatInputCommand() || i.isButton())
      void handle(i, panels, config.application, config.guild);
  });
  client.on(Events.Error, () =>
    console.error("Discord connection error. / Discord bağlantı hatası."),
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => {
      clearInterval(timer);
      panels.sessions.clear();
      panels.cooldowns.clear();
      client.destroy();
    });
  await client.login(config.token);
} catch {
  console.error(
    "Startup failed. Run setup; check Node24, internet and token. / Başlatılamadı; kurulum, Node24, bağlantı ve tokenı kontrol edin. Never share the token.",
  );
  process.exitCode = 1;
}
