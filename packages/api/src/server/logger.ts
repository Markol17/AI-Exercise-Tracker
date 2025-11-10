import { os } from '@orpc/server';

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

type LogContext = Record<string, unknown>;

class Logger {
	private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
		const timestamp = new Date().toISOString();
		const emoji = {
			info: 'ℹ️',
			error: '❌',
			warn: '⚠️',
			debug: '🔍',
		}[level];

		let logMessage = `${emoji} [${timestamp}] ${message}`;

		if (context && Object.keys(context).length > 0) {
			logMessage += `\n${JSON.stringify(context, null, 2)}`;
		}

		return logMessage;
	}

	info(message: string, context?: LogContext) {
		console.log(this.formatMessage('info', message, context));
	}

	error(message: string, error?: Error | unknown, context?: LogContext) {
		const errorContext = {
			...context,
			error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
		};
		console.error(this.formatMessage('error', message, errorContext));
	}

	warn(message: string, context?: LogContext) {
		console.warn(this.formatMessage('warn', message, context));
	}

	debug(message: string, context?: LogContext) {
		console.debug(this.formatMessage('debug', message, context));
	}
}

export const logger = new Logger();

export const loggingMiddleware = os.middleware(async ({ context, next, path }) => {
	const startTime = Date.now();
	const procedurePath = path?.join('.') || 'unknown';

	logger.debug(`→ ${procedurePath}`);

	try {
		const result = await next({ context });
		const duration = Date.now() - startTime;

		logger.info(`✓ ${procedurePath} (${duration}ms)`);

		return result;
	} catch (error) {
		const duration = Date.now() - startTime;

		logger.error(`✗ ${procedurePath} (${duration}ms)`, error, context);

		throw error;
	}
});
