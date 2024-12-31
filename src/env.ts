import { Logger } from "pino";

export const ensureEnv = (logger: Logger<never, boolean>) => {
  if (!process.env.DISCORD_TOKEN) {
    logger.error("Error: Specify DISCORD_TOKEN in .env");
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
};
