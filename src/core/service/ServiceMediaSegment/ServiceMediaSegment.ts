import type { Database as IDatabase } from 'better-sqlite3';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { PUBLIC_DIR } from '@constants';

import { ServiceMedia } from '@core/service';
import { Media, MediaSegment, MediaSegmentFromDb } from '@core/types';
import { FactorySegment } from '@core/factory';

interface SegmentM3U8Info {
    duration: number;
    path: string;
}

export class ServiceMediaSegment {
    private db: IDatabase;
    
    private serviceMedia: ServiceMedia;

    private factorySegment = new FactorySegment();

    constructor(db: IDatabase) {
        this.db = db;

        this.serviceMedia = new ServiceMedia(this.db);
    }

    async createMediaSegments(inputDir: string, mediaPath: string) {
        const media = this.serviceMedia.getMediaByMediaPath(mediaPath);

        if (media === undefined) {
            throw new Error('Media is not registered');
        }

        const outputDir = path.join(PUBLIC_DIR, media.path);

        // Prepare segment base URL
        console.log('📺 Segment base URL:', inputDir);

        // Ensure output directory exists
        fs.mkdirSync(outputDir, { recursive: true });

        // FFmpeg arguments
        const ffmpegArgs = [
            '-i', inputDir,
            '-c:a', 'aac',
            '-segment_time', '10',
            '-c:v', 'libx264',
            '-r', '25',
            '-fflags', '+genpts',
            '-reset_timestamps', '1',
            '-avoid_negative_ts', 'make_zero',
            '-muxdelay', '0',
            '-muxpreload', '0',
            '-muxrate', '1000k',
            '-minrate', '1000k',
            '-maxrate', '1000k',
            '-bufsize', '2000k',
            '-pcr_period', '0.04',
            '-x264opts', 'keyint=250:min-keyint=250:no-scenecut',
            '-start_at_zero',
            '-hls_time', '10',
            '-hls_flags', 'independent_segments+round_durations',
            '-hls_list_size', '0',
            '-hls_segment_filename', path.join(outputDir, '%d.ts'),
            '-hls_base_url', media.path,
            '-loglevel', 'error',
            path.join(outputDir, 'stream.m3u8')
        ];

        console.log('▶️ Running ffmpeg...');

        const result = spawnSync('ffmpeg', ffmpegArgs, { encoding: 'utf-8' });

        if (result.error) {
            console.error('❌ FFmpeg error:', result.error.message);
            console.error(result.stderr);
            process.exit(1);
        }

        console.log('✅ HLS files created in', outputDir);
        console.log('💾 Uploading segments to database...');

        this.uploadMediaSegmentsToDatabase(outputDir, media);
    }

    uploadMediaSegmentsToDatabase(outputDit: string, media: Media) {
        const m3u8Contents = this.getM3U8Contents(outputDit);
        const segments = this.getMediaSegmentsFromM3U8(m3u8Contents);

        if (this.deleteMediaSegmentsByMediaId(media.id)) {
            console.log('☁️ Old media segments were deleted from database');
        }

        const insertSegment = this.db.prepare(`
            INSERT INTO segments (segment_path, duration, media_id)
            VALUES (?, ?, ?)
        `);

        const insertMany = this.db.transaction((segments: SegmentM3U8Info[]) => {
            for (let segment of segments) {
                insertSegment.run(
                    segment.path,
                    segment.duration,
                    media.id,
                );
            }
        });

        insertMany(segments);

        console.log(`✅ ${segments.length} segments uploaded to databse`);
    }

    getMediaSegmentById(mediaSegmentId: number): MediaSegment | null {
        const selectMediaSegmentStmnt = this.db.prepare('SELECT * FROM segments WHERE id = ?');

        const dbResult = selectMediaSegmentStmnt.get(mediaSegmentId) as MediaSegmentFromDb;

        if (dbResult === undefined) {
            return null;
        }

        return this.factorySegment.fromDatabase(dbResult);
    }

    getMediaSegmentsByMediaId(mediaId: number): MediaSegment[] | null {
        const segmentsStmnt = this.db.prepare('SELECT * FROM segments WHERE media_id=?');

        const dbResults = segmentsStmnt.all(mediaId);

        if (dbResults === undefined) {
            return null;
        }

        return this.factorySegment.fromDatabaseBulk(dbResults as MediaSegmentFromDb[]);
    }

    getMediaSegmentsDuration(mediaSegments: MediaSegment[]) {
        let totalDuration = 0;

        mediaSegments.forEach(mediaSegment => totalDuration += mediaSegment.duration);
        
        return totalDuration * 1000; // In ms
    }

    getFirstMediaSegmentDuration(mediaSegments: MediaSegment[]) {
        return mediaSegments[0].duration * 1000;
    }

    getMediaSegmentSequenceId(mediaSegment: MediaSegment) {
        const mediaSegmentPathSplit = mediaSegment.path.split('/');

        return Number(mediaSegmentPathSplit.pop().split('.')[0]);
    }

    deleteMediaSegmentsByMediaId(mediaId: number) {
        const mediaSegmentsStmnt = this.db.prepare('DELETE FROM segments WHERE media_id = ?');

        const dbResult = mediaSegmentsStmnt.run(mediaId);

        return dbResult.changes > 0;
    }

    isFirstMediaSegment(mediaSegment: MediaSegment) {
        return mediaSegment.path.split('/').pop() === '0.ts';
    }

    private getMediaSegmentsCountFromM3U8(m3u8Contents: string) {
        const matches = m3u8Contents.match(/stream\d+\.ts/g);

        return matches.length;
    }

    private getM3U8Contents(m3u8Path: string) {
        return fs.readFileSync(path.join(m3u8Path, 'stream.m3u8'), 'utf-8').toString();
    }

    private getMediaSegmentsFromM3U8(m3u8Contents: string): SegmentM3U8Info[] {
        const regex = /#EXTINF:([\d.]+),\s*([^\n\r]+)/g;

        const segments = [];
        let match;

        while ((match = regex.exec(m3u8Contents)) !== null) {
            const duration = parseFloat(match[1]);
            const path = match[2];
            segments.push({ duration, path });
        }

        return segments;
    }
}