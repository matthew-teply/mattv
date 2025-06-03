import { DATABASE_DIR } from '@constants';

import Database from 'better-sqlite3';
import type { Database as IDatabase } from 'better-sqlite3';
import path from 'path';

export class FactoryDatabase {
    create(): IDatabase {
        return new Database(path.join(DATABASE_DIR, 'mattv.sqlite'));
    }
}