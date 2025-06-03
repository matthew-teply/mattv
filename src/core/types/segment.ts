export interface MediaSegment {
    id: number;
    path: string;
    duration: number;
    mediaId: number;
}

export interface MediaSegmentFromDb {
    id: number;
    segment_path: string;
    duration: number;
    media_id: number;
}