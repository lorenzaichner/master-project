import * as winston from 'winston';

const { combine, timestamp, prettyPrint, errors,  } = winston.format;
export class Logger {
  private static instance: winston.Logger | null = null;
  private static logFormat = combine(
    timestamp(),
    errors({ stack: true }),
    prettyPrint()
  );

  public static getInstance(): winston.Logger {
    if(Logger.instance == null) {
      Logger.instance = winston.createLogger({
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), Logger.logFormat),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      });
    }
    return Logger.instance;
  }

  public static log(level: string, message: string): void {
    Logger.instance.log({ level, message });
  }
}
