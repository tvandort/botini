import { Logger } from "pino";

export const ensureEnv = ({ logger }: { logger: Logger<never, boolean> }) => {
  if (!process.env.DISCORD_TOKEN) {
    logger.error("Error: Specify DISCORD_TOKEN in .env");
    process.exit(1);
  }
};
