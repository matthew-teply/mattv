import { ProgramRecord, ProgramRecordFromDb } from '../types';

export class FactoryProgramRecord {
    fromDatabase(programRecordFromDb: ProgramRecordFromDb): ProgramRecord {
        return {
            id: programRecordFromDb.id,
            from: programRecordFromDb.from,
            segmentId: programRecordFromDb.segment_id,
            mediaId: programRecordFromDb.media_id,
        }
    }

    fromDatabaseBulk(programRecordsFromDb: ProgramRecordFromDb[]) {
        return programRecordsFromDb.map(programRecordFromDb => this.fromDatabase(programRecordFromDb));
    }
}