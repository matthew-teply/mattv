import fs from 'fs';
import path from 'path';
import type { Database as IDatabase } from 'better-sqlite3';

import { PUBLIC_DIR } from '@constants';

import { ServiceMedia, ServiceMediaSegment } from '@core/service';
import { FactoryProgramRecord } from '@core/factory';
import { MediaSegment, ProgramRecord, ProgramRecordFromDb } from '@core/types';
import { MEDIA_STANDBY_PATH, SEGMENT_STANDARD_DURATION, SEGMENTS_BUFFER_SIZE } from '@core/constants';

export class ServiceProgramRecord {
    private db: IDatabase;

    private factoryProgramRecord = new FactoryProgramRecord();

    private serviceMedia: ServiceMedia;
    private serviceMediaSegment: ServiceMediaSegment;

    constructor(db: IDatabase) {
        this.db = db;

        this.serviceMedia = new ServiceMedia(this.db);
        this.serviceMediaSegment = new ServiceMediaSegment(this.db);
    }

    generateProgramRecords(mediaPaths: string[], programStart: number): Omit<ProgramRecord, 'id'>[] {
        // These two ALWAYS have to stay in sync
        let previousProgramRecord: Omit<ProgramRecord, 'id'> | null = null;
        let previousMediaSegment: MediaSegment | null = null; 

        return mediaPaths.map(mediaPath => {
            // This loop creates a program record "block",
            // think of it as one "slab" in the program administration page
            const media = this.serviceMedia.getMediaByMediaPath(mediaPath);

            const mediaSegments = this.serviceMediaSegment.getMediaSegmentsByMediaId(media.id);
            // 1 to 1 (1 program record has one media segment)
            let programRecords: Omit<ProgramRecord, 'id'>[] = []; 

            for (let mediaSegment of mediaSegments) {
                const currentProgramRecord = {
                    // If there were previously set program records and media segments, continue from where they left off
                    from: (previousMediaSegment !== null && previousProgramRecord !== null) ? previousProgramRecord.from + previousMediaSegment.duration * 1000 : programStart,
                    segmentId: mediaSegment.id,
                    mediaId: media.id,
                }

                programRecords.push(currentProgramRecord);

                previousProgramRecord = currentProgramRecord;
                previousMediaSegment = mediaSegment;
            }

            return programRecords;
        }).flat();
    }

    getCurrentProgramRecords(now: number): ProgramRecord[] | null {
        // 1. Select program that is playing RIGHT NOW or has been playing FOR SOME TIME
        // 2. Order by time, latest first
        // 3. Get the desired buffer
        const programRecordStmnt = this.db.prepare(`SELECT * FROM program WHERE "from" >= ? ORDER BY "from" ASC LIMIT ${SEGMENTS_BUFFER_SIZE}`);

        const dbResults = programRecordStmnt.all(now);

        if (dbResults === undefined) {
            return null;
        }

        const programRecords = this.factoryProgramRecord.fromDatabaseBulk(dbResults as ProgramRecordFromDb[]);

        return this.supplementProgramRecords(programRecords, now);
    }

    uploadProgramRecordsToDatabase(programRecords: Omit<ProgramRecord, 'id'>[]) {
        const insertProgramRecordStmnt = this.db.prepare('INSERT INTO program ("from", segment_id, media_id) VALUES (?, ?, ?)');

        let changes = 0;

        const insertMany = this.db.transaction((programRecords: Omit<ProgramRecord, 'id'>[]) => {
            for (const programRecord of programRecords) {
                const run = insertProgramRecordStmnt.run(programRecord.from, programRecord.segmentId, programRecord.mediaId);

                changes += run.changes;
            }
        });

        insertMany(programRecords);

        return changes > 0;
    }

    supplementProgramRecords(programRecords: ProgramRecord[], now: number) {
        const supplementationCount = SEGMENTS_BUFFER_SIZE - programRecords.length;

        const supplementaionData = {
            back: {
                isRequired: false,
                count: 0,
            },
            front: {
                isRequired: supplementationCount > 0,
                count: supplementationCount,
            }
        }

        // Back                              Front
        //   |                                 |
        // [record, record, record, record, record]

        // PROGRAM RECORDS ARE IN THE FUTURE (BACK)
        //
        // The first program record is in the future, a show is going to come on in a few tens of seconds, we need to supplement back 
        if (programRecords.length > 0 && now - programRecords[0].from < SEGMENT_STANDARD_DURATION * 1000) {
            supplementaionData.back.isRequired = true;

            // How far in the future is the first program record? In the increment of 10s
            supplementaionData.back.count = Math.abs(Math.ceil((now - programRecords[0].from) / (SEGMENT_STANDARD_DURATION * 1000)));
        }

        const standByProgramRecord = this.getStandByProgramRecord();

        // Supplementing front
        if (supplementaionData.front.isRequired) {
            for (let i = 0; i < supplementaionData.front.count; i++) {
                programRecords.push(standByProgramRecord);
            }
        }

        // Supplementing back
        if (supplementaionData.back.isRequired) {
            for (let i = 0; i < supplementaionData.back.count; i++) {
                programRecords.unshift(standByProgramRecord);
            }
        }

        programRecords.length = SEGMENTS_BUFFER_SIZE;

        return programRecords;
    }

    purgeProgramRecords() {
        this.db.exec('DELETE FROM program');
    }

    private getStandByProgramRecord() {
        const mediaStandBy = this.serviceMedia.getMediaByMediaPath(MEDIA_STANDBY_PATH);
        const mediaSegmentStandBy = this.serviceMediaSegment.getMediaSegmentsByMediaId(mediaStandBy.id)[0];

        return {
            id: 0,
            from: 0,
            segmentId: mediaSegmentStandBy.id,
            mediaId: mediaStandBy.id,
        };
    }

    private isProgramRecordComingFromStandBy() {
        return this.serviceMedia.getLastMediaPlayed() === MEDIA_STANDBY_PATH;
    }

    private getM3U8Contents(m3u8Path: string) {
        return fs.readFileSync(path.join(PUBLIC_DIR, m3u8Path, 'stream.m3u8'), 'utf-8').toString();
    }

    private generateProgramRecordTime(start: number, duration: number) {
        return {
            from: start,
            to: start + duration,
        }
    }
}
