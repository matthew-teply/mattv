import path from 'path';
import fs from 'fs';
import type { Database as IDatabase } from 'better-sqlite3';

import { PUBLIC_DIR } from '@constants';

import { SEGMENT_STANDARD_DURATION } from '@core/constants';
import { Media, MediaSegment } from '@core/types';
import {
    ServiceLogger,
    ServiceMedia,
    ServiceMediaSegment,
    ServiceMediaSequence,
    ServiceProgramRecord
} from '@core/service';

export class ServiceStream {
    private readonly db: IDatabase;

    private serviceMedia: ServiceMedia;
    private serviceMediaSegment: ServiceMediaSegment;
    private serviceProgramRecord: ServiceProgramRecord;
    private serviceMediaSequence: ServiceMediaSequence;

    private serviceLogger: ServiceLogger;

    constructor(db: IDatabase) {
        this.db = db;

        this.serviceMedia = new ServiceMedia(this.db);
        this.serviceMediaSegment = new ServiceMediaSegment(this.db);
        this.serviceProgramRecord = new ServiceProgramRecord(this.db);
        this.serviceMediaSequence = new ServiceMediaSequence(this.db);

        this.serviceLogger = new ServiceLogger();
    }
    generateM3U8() {
        const now = Date.now();

        const programRecords = this.serviceProgramRecord.getCurrentProgramRecords(now);

        if (programRecords === null) {
            console.error('Nothing is playing right now...');
            return;
        }

        const mediaSegments: MediaSegment[] = [];

        for (const programRecord of programRecords) {
            mediaSegments.push(this.serviceMediaSegment.getMediaSegmentById(programRecord.segmentId));
        }

        if (mediaSegments.length === 0) {
            console.error('No segments found for current program records');
            return;
        }

        const mediaSequence = this.serviceMediaSequence.getMediaSequence();

        const lines = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '#EXT-X-PLAYLIST-TYPE: EVENT',
            `#EXT-X-TARGETDURATION:${SEGMENT_STANDARD_DURATION}`,
            `#EXT-X-MEDIA-SEQUENCE:${mediaSequence}`,
        ];

        const manifestMediaSegmentLines = [];

        let currentMediaPlaying: Media | null = null;

        mediaSegments.forEach(mediaSegment => {
            if (this.serviceMediaSegment.isFirstMediaSegment(mediaSegment)) {
                // Even if it is the same media, first segment always has to indicate discontinuity
                manifestMediaSegmentLines.push('#EXT-X-DISCONTINUITY');
            }

            if (currentMediaPlaying === null || currentMediaPlaying.id !== mediaSegment.id) {
                currentMediaPlaying = this.serviceMedia.getMediaById(mediaSegment.mediaId);
            }

            manifestMediaSegmentLines.push(`#EXTINF:${mediaSegment.duration.toFixed(3)},${currentMediaPlaying.displayName}`);
            manifestMediaSegmentLines.push(mediaSegment.path);
        });

        lines.push(...manifestMediaSegmentLines);

        const m3u8Body = lines.join("\n");
        
        this.serviceMediaSequence.increaseMediaSequence();

        this.serviceLogger.server(`Media sequence increased (${mediaSequence} → ${this.serviceMediaSequence.getMediaSequence()})`);

        fs.writeFileSync(path.join(PUBLIC_DIR, 'stream.m3u8'), m3u8Body);

        this.serviceLogger.server(`m3u8 generated`);
        
        const lastMediaPlayedId = programRecords.pop().mediaId;

        this.serviceMedia.setLastMediaPlayed(this.serviceMedia.getMediaById(lastMediaPlayedId).path);
    }

}
