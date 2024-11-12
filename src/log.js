const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, colorize, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: "JJC-WS" }),
    colorize(),
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

module.exports = { logger };
