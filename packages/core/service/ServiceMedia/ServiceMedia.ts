import type { Database as IDatabase } from 'better-sqlite3';

import { Media, MediaType, MediaFromDb } from '@core/types';
import { FactoryMedia } from '@core/factory';

export class ServiceMedia {
    private readonly db: IDatabase;

    private factoryMedia = new FactoryMedia();

    constructor(db: IDatabase) {
        this.db = db;
    }

    isMediaRegistered(mediaPath: string) {
        const mediaStmnt = this.db.prepare('SELECT COUNT(1) FROM media WHERE media_path=?');

        return (mediaStmnt.get(this.sanitizeMediaPath(mediaPath))['COUNT(1)'] as number) > 0;
    }

    registerMedia(mediaPath: string, mediaType: MediaType, displayName: string) {
        if (this.isMediaRegistered(mediaPath)) {
            throw new Error('Media is already registered');
        }

        const mediaStmnt = this.db.prepare('INSERT INTO media (name, display_name, media_path, media_type) VALUES (?, ?, ?, ?)');

        return mediaStmnt.run(
            this.sanitizeMediaName(displayName), 
            displayName,
            this.createMediaPath(mediaPath),
            mediaType
        ).changes > 0;
    }

    getMediaByMediaPath(mediaPath: string): Media | null {
        const mediaStmnt = this.db.prepare('SELECT * FROM media WHERE media_path=?');

        const dbResult = mediaStmnt.get(this.createMediaPath(mediaPath));

        if (dbResult === undefined) {
            return null;
        }

        return this.factoryMedia.fromDatabase(dbResult as MediaFromDb);
    }

    getMediaById(id: number): Media | null {
        const mediaStmnt = this.db.prepare('SELECT * FROM media WHERE id=?');

        const dbResult = mediaStmnt.get(id);

        if (dbResult === undefined) {
            return null;
        }

        return this.factoryMedia.fromDatabase(dbResult as MediaFromDb);
    }

    setLastMediaPlayed(mediaPath: string) {
        const lastPlayedMediaStmnt = this.db.prepare('UPDATE settings SET value = ? WHERE name = ?');

        lastPlayedMediaStmnt.run(this.createMediaPath(mediaPath), 'last_media_played');
    }

    getLastMediaPlayed() {
        const lastPlayedMediaStmnt = this.db.prepare('SELECT value FROM settings WHERE name = ?');
        
        return String(lastPlayedMediaStmnt.get('last_media_played')['value']);
    }

    deleteMediaById(mediaId: number) {
        const deleteMediaStmnt = this.db.prepare('DELETE FROM media WHERE id = ?');

        return deleteMediaStmnt.run(mediaId).changes > 0;
    }

    createMediaPath(mediaPath: string) {
        if (mediaPath[mediaPath.length - 1] !== '/') {
            mediaPath += '/';
        }

        if (mediaPath[0] !== '/') {
            mediaPath = '/' + mediaPath;
        }

        return this.sanitizeMediaPath(mediaPath);
    }

    private sanitizeMediaPath(mediaPath: string) {
        return mediaPath
            .toLocaleLowerCase()
            .replace(/\s+/g, '-') 
            .replace(/[^a-z0-9\-\/]/g, '');
    }
    
    private sanitizeMediaName(mediaName: string) {
        return mediaName
            .toLowerCase()               // convert to lowercase
            .replace(/\s+/g, '-')        // replace spaces with hyphens
            .replace(/[^a-z0-9\-]/g, '') // remove non-alphanumeric, non-hyphen
            .replace(/\-+/g, '-')        // collapse multiple hyphens
            .replace(/^\-+|\-+$/g, '');  // trim hyphens from start/end
    }
}
