import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Binding, Panel, Panels } from "./panels.ts";
import type { Language } from "./text.ts";
export const command = new SlashCommandBuilder()
  .setName("glyphwillow")
  .setDescription("Privately inspect pasted text for Unicode controls")
  .setDescriptionLocalizations({ tr: "Yapıştırılan metindeki Unicode kontrollerini özel incele" })
  .addStringOption((o) =>
    o
      .setName("text")
      .setDescription("Your text; never paste tokens or personal secrets")
      .setDescriptionLocalizations({ tr: "Metniniz; token veya kişisel sır yapıştırmayın" })
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(1000),
  );
export function payload(panel: Panel | null, lang: Language) {
  const tr = lang === "tr";
  return {
    content:
      panel?.content ??
      (tr ? "Panel kapandı; geçici metin silindi." : "Panel closed; temporary text deleted."),
    allowedMentions: { parse: [] as [] },
    components: panel
      ? [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...(
              [
                ["report", tr ? "Rapor" : "Report"],
                ["visible", tr ? "Kodlarla göster" : "Show codes"],
                ["preview", tr ? "Temiz önizleme" : "Clean preview"],
                ["close", tr ? "Kapat" : "Close"],
              ] as const
            ).map(([action, label]) =>
              new ButtonBuilder()
                .setCustomId(`gw:${panel.id}:${action}`)
                .setLabel(label)
                .setStyle(action === "close" ? ButtonStyle.Secondary : ButtonStyle.Primary),
            ),
          ),
        ]
      : [],
  };
}
export function permissionAllowed(member: bigint | undefined, app: bigint | undefined): boolean {
  return (
    member !== undefined &&
    app !== undefined &&
    (member & PermissionFlagsBits.ViewChannel) !== 0n &&
    (app & PermissionFlagsBits.ViewChannel) !== 0n &&
    (app & PermissionFlagsBits.Administrator) === 0n
  );
}
type Interaction = ChatInputCommandInteraction | ButtonInteraction;
function language(i: Interaction): Language {
  return i.locale === "tr" ? "tr" : "en";
}
function binding(i: Interaction): Binding {
  return {
    user: i.user.id,
    guild: i.guildId ?? "",
    channel: i.channelId ?? "",
    application: i.applicationId,
  };
}
export function errorText(lang: Language): string {
  return lang === "tr"
    ? "Panel süresi dolmuş, erişim uygun değil veya işlem çok hızlı. 5 saniye bekleyip /glyphwillow komutunu tekrar kullanın. Botta Yönetici iznini kapatın; metni/tokenı paylaşmayın."
    : "Panel expired, access is unavailable, or requests are too fast. Wait 5 seconds and use /glyphwillow again. Remove bot Administrator permission; do not share text/tokens.";
}
export async function handle(
  i: Interaction,
  panels: Panels,
  application: string,
  guild: string,
): Promise<void> {
  if (i.isChatInputCommand() && i.commandName !== "glyphwillow") return;
  if (i.isButton() && !i.customId.startsWith("gw:")) return;
  const lang = language(i);
  let created: string | undefined;
  try {
    if (
      i.applicationId !== application ||
      i.guildId !== guild ||
      !i.channelId ||
      !permissionAllowed(i.memberPermissions?.bitfield, i.appPermissions?.bitfield)
    )
      throw new Error("access");
    if (i.isChatInputCommand()) {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const panel = panels.create(binding(i), i.options.getString("text", true), lang, Date.now());
      created = panel.id;
      const message = await i.editReply(payload(panel, lang));
      panels.attach(panel.id, message.id);
      created = undefined;
    } else {
      const match = /^gw:([a-f0-9]{32}):(report|visible|preview|close)$/u.exec(i.customId);
      if (
        !match ||
        !i.message.flags.has(MessageFlags.Ephemeral) ||
        i.message.author.id !== application
      )
        throw new Error("expired");
      const id = match[1];
      const action = match[2];
      if (
        !id ||
        (action !== "report" && action !== "visible" && action !== "preview" && action !== "close")
      )
        throw new Error("expired");
      await panels.click(id, action, binding(i), i.message.id, Date.now(), async (panel) => {
        await i.update(payload(panel, lang));
      });
    }
  } catch {
    if (created) panels.discard(created);
    try {
      const response = {
        content: errorText(lang),
        allowedMentions: { parse: [] as [] },
        components: [],
      };
      if (i.deferred || i.replied) await i.editReply(response);
      else await i.reply({ ...response, flags: MessageFlags.Ephemeral });
    } catch {
      /* No interaction text, IDs, tokens or transport objects are logged. */
    }
  }
}
