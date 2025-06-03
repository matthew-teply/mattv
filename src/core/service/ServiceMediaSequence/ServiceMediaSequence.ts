import type { Database as IDatabase } from 'better-sqlite3';

export class ServiceMediaSequence {
    private db: IDatabase;
    
    constructor(db: IDatabase) {
        this.db = db;
    }

    setMediaSequence(mediaSequence: number) {
        const mediaSequenceStmnt = this.db.prepare('UPDATE settings SET value = ? WHERE name = ?');

        mediaSequenceStmnt.run(mediaSequence, 'media_sequence');
    }

    getMediaSequence() {
        const mediaSequenceStmnt = this.db.prepare('SELECT value FROM settings WHERE name = ?');

        return Number(mediaSequenceStmnt.get('media_sequence')['value']);
    }

    increaseMediaSequence() {
        const mediaSequence = this.getMediaSequence() + 1;

        this.setMediaSequence(mediaSequence);
    }

    resetMediaSequence() {
        this.setMediaSequence(0);
    }
}