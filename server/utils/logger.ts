export interface Logger {
  info(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  debug(message: string, ...args: any[]): void
}

class SimpleLogger implements Logger {
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = this.getTimestamp()
    const formattedArgs = args.length > 0 ? JSON.stringify(args) : ''
    return `[${timestamp}] ${level}: ${message} ${formattedArgs}`.trim()
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', message, ...args))
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('ERROR', message, ...args))
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message, ...args))
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatMessage('DEBUG', message, ...args))
    }
  }
}

export const logger = new SimpleLogger() 