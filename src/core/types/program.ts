export interface ProgramRecord {
    id: number;
    from: number;
    segmentId: number;
    mediaId: number;
}

export interface ProgramRecordFromDb {
    id: number;
    from: number;
    segment_id: number;
    media_id: number;
}