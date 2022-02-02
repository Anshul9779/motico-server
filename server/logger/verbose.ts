import winston from "winston";

export const LOG_DIR = process.env.LOG_DIR || "__logs__";

const logger = winston.createLogger({
  level: "verbose",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "verbose.log",
      dirname: LOG_DIR,
      level: "verbose",
    }),
    new winston.transports.File({
      filename: "error.log",
      dirname: LOG_DIR,
      level: "error",
    }),
    new winston.transports.File({
      filename: "info.log",
      dirname: LOG_DIR,
      level: "info",
    }),
  ],
});

export default logger;
