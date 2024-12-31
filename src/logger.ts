import { pino } from "pino";
import pretty from "pino-pretty";

interface HasIsColorSupported {
  isColorSupported: boolean;
}

export function getLogger() {
  if ((pretty as unknown as HasIsColorSupported).isColorSupported) {
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
