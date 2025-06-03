import chalk from 'chalk';

import { LoggerCaller } from '@core/types';
import { callers } from '@core/constants';

export class ServiceLogger {
    log(text: string, caller?: LoggerCaller) {
        if (caller === undefined) {
            console.log(text);
            return;
        }

        console.log(`[${chalk.hex(caller.color).bgBlack(caller.name)}] ${text}`);
    }

    server(text: string) {
        return this.log(text, callers.server);
    }

    client(text: string) {
        return this.log(text, callers.client);
    }

    stream(text: string) {
        return this.log(text, callers.stream);
    }
}
