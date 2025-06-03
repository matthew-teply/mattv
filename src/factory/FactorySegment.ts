import { MediaSegment, MediaSegmentFromDb } from '../types';

export class FactorySegment {
    fromDatabase(segmentFromDb: MediaSegmentFromDb): MediaSegment {
        return {
            id: segmentFromDb.id,
            path: segmentFromDb.segment_path,
            duration: segmentFromDb.duration,
            mediaId: segmentFromDb.media_id,
        }
    }

    fromDatabaseBulk(segmentsFromDb: MediaSegmentFromDb[]): MediaSegment[] {
        return segmentsFromDb.map(segmentFromDb => this.fromDatabase(segmentFromDb));
    }
}