import { randomBytes } from "node:crypto";
import { type Language, render, type View, validate } from "./text.ts";
export const TTL = 300_000;
export interface Binding {
  user: string;
  guild: string;
  channel: string;
  application: string;
}
interface Session extends Binding {
  text: string;
  lang: Language;
  expires: number;
  message?: string;
  busy: boolean;
  lastClick: number;
}
export interface Panel {
  content: string;
  id: string;
  lang: Language;
}
export class Panels {
  readonly sessions = new Map<string, Session>();
  readonly cooldowns = new Map<string, number>();
  prune(now: number): void {
    for (const [id, s] of this.sessions) if (s.expires <= now) this.sessions.delete(id);
    for (const [id, until] of this.cooldowns) if (until <= now) this.cooldowns.delete(id);
  }
  create(binding: Binding, text: string, lang: Language, now: number): Panel {
    validate(text);
    this.prune(now);
    const key = `${binding.guild}:${binding.user}`;
    if (this.cooldowns.has(key)) throw new Error("cooldown");
    if (this.sessions.size >= 100 || this.cooldowns.size >= 1000) throw new Error("capacity");
    this.cooldowns.set(key, now + 5000);
    const id = randomBytes(16).toString("hex");
    this.sessions.set(id, {
      ...binding,
      text,
      lang,
      expires: now + TTL,
      busy: false,
      lastClick: -Infinity,
    });
    return { id, lang, content: render(text, "report", lang) };
  }
  attach(id: string, message: string): void {
    const s = this.sessions.get(id);
    if (s) s.message = message;
  }
  discard(id: string): void {
    this.sessions.delete(id);
  }
  async click(
    id: string,
    action: View | "close",
    binding: Binding,
    message: string,
    now: number,
    update: (panel: Panel | null) => Promise<void>,
  ): Promise<void> {
    this.prune(now);
    const s = this.sessions.get(id);
    if (
      !s ||
      s.message !== message ||
      s.user !== binding.user ||
      s.guild !== binding.guild ||
      s.channel !== binding.channel ||
      s.application !== binding.application
    )
      throw new Error("expired");
    if (s.busy || (action !== "close" && now - s.lastClick < 1000)) throw new Error("cooldown");
    s.busy = true;
    s.lastClick = now;
    try {
      if (action === "close") {
        this.sessions.delete(id);
        await update(null);
      } else await update({ id, lang: s.lang, content: render(s.text, action, s.lang) });
    } finally {
      s.busy = false;
    }
  }
}
