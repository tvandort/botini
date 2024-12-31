import { pino } from "pino";
import pretty from "pino-pretty";

export function getLogger() {
  if ((pretty as any).isColorSupported) {
    return pino({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });
  } else {
    return pino();
  }
}
