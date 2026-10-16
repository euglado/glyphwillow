export function snowflake(value: string | undefined): value is string {
  return (
    value !== undefined &&
    /^[1-9][0-9]{16,19}$/u.test(value) &&
    BigInt(value) <= 18446744073709551615n
  );
}
export function configuration(env: NodeJS.ProcessEnv) {
  const token = env.DISCORD_TOKEN;
  const application = env.DISCORD_APPLICATION_ID;
  const guild = env.DISCORD_GUILD_ID;
  if (
    !token ||
    token.length < 30 ||
    token.length > 200 ||
    /\s|[\p{Cc}\p{Cf}]/u.test(token) ||
    !snowflake(application) ||
    !snowflake(guild)
  )
    throw new Error(
      "Run setup.cmd or ./setup.sh first. / Önce setup.cmd veya ./setup.sh çalıştırın.",
    );
  return { token, application, guild };
}
