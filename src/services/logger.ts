import pino from 'pino';
import {config} from '../config';

const pinoConfig: pino.LoggerOptions = {
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
};

if (config.NODE_ENV === 'development') {
    pinoConfig.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    };
}

const logger = pino(pinoConfig);

export default logger;
