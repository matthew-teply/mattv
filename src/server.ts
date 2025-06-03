import os from 'os';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bonjour from 'bonjour';
import { execSync } from 'child_process';

import { FactoryDatabase } from './factory';
import { ServiceMedia, ServiceMediaSegment, ServiceMediaSequence, ServiceProgramRecord } from './service';
import { SEGMENT_STANDARD_DURATION } from './constants';
import { Media, MediaSegment } from './types';
import { ServiceLogger } from './service/ServiceLogger';

const PORT = 8000;
const PUBLIC_PATH = path.join(process.cwd(), 'public');

const app = express();

app.use(cors());

const db = (new FactoryDatabase()).create();

const serviceLogger = new ServiceLogger();

const serviceProgramRecord = new ServiceProgramRecord(db);
const serviceMediaSegment = new ServiceMediaSegment(db);
const serviceMediaSequence = new ServiceMediaSequence(db);
const serviceMedia = new ServiceMedia(db);

const generateM3U8 = () => {
    const now = Date.now();

    const programRecords = serviceProgramRecord.getCurrentProgramRecords(now);

    if (programRecords === null) {
        console.error('Nothing is playing right now...');
        return;
    }

    const mediaSegments: MediaSegment[] = [];

    for (const programRecord of programRecords) {
        mediaSegments.push(serviceMediaSegment.getMediaSegmentById(programRecord.segmentId));
    }

    if (mediaSegments.length === 0) {
        console.error('No segments found for current program records');
        return;
    }

    const mediaSequence = serviceMediaSequence.getMediaSequence();

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
        if (serviceMediaSegment.isFirstMediaSegment(mediaSegment)) {
            // Even if it is the same media, first segment always has to indicate discontinuity
            manifestMediaSegmentLines.push('#EXT-X-DISCONTINUITY');
        }

        if (currentMediaPlaying === null || currentMediaPlaying.id !== mediaSegment.id) {
            currentMediaPlaying = serviceMedia.getMediaById(mediaSegment.mediaId);
        }

        manifestMediaSegmentLines.push(`#EXTINF:${mediaSegment.duration.toFixed(3)},${currentMediaPlaying.displayName}`);
        manifestMediaSegmentLines.push(mediaSegment.path);
    });

    lines.push(...manifestMediaSegmentLines);

    const m3u8Body = lines.join("\n");
    
    serviceMediaSequence.increaseMediaSequence();

    serviceLogger.server(`Media sequence increased (${mediaSequence} → ${serviceMediaSequence.getMediaSequence()})`);

    fs.writeFileSync('./public/stream.m3u8', m3u8Body);

    serviceLogger.server(`m3u8 generated`);
    
    const lastMediaPlayedId = programRecords.pop().mediaId;

    serviceMedia.setLastMediaPlayed(serviceMedia.getMediaById(lastMediaPlayedId).path);
}

app.use('/', (req, _res, next) => { serviceLogger.client(`[${req.ip}] ${req.url}`); next(); })
app.use('/', express.static(PUBLIC_PATH));

app.get('/', (_req, res) => {
    res.send('Welcome to MatTV!<br><h3>Program</h3>');
});

app.get('/tv', (req, res) => {
    const m3u8Body = fs.readFileSync('./public/stream.m3u8').toString();

    res.setHeader('Content-Disposition', 'inline; filename="MatTV.m3u8"');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');

    res.send(m3u8Body);
});

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
            }
        }
    }

    return '127.0.0.1'; // fallback if no external interface found
}

app.get('/watch', (req, res) => {
    let watchPageHtml = fs.readFileSync(path.join(PUBLIC_PATH, 'index.html')).toString();

    watchPageHtml = watchPageHtml.replace('<TV_URL>', `${getLocalIP()}:8000`);

    res.send(watchPageHtml);
})

app.listen(PORT, () => {
    const bonjourInstance = bonjour();

    bonjourInstance.publish({
        name: 'mat-tv',
        type: 'http',
        port: 8000,
    });

    const localNetworkName = execSync('scutil --get LocalHostName').toString().trim();

    serviceLogger.server(`Started service at ${localNetworkName}.local:${PORT}`);

    process.on('SIGTERM', () => {
        bonjourInstance.unpublishAll(() => {
            bonjourInstance.destroy();
            process.exit();
        })
    })

    serviceMediaSequence.resetMediaSequence();

    generateM3U8();

    setInterval(() => {
        generateM3U8();
    }, SEGMENT_STANDARD_DURATION * 1000);
});

// Need to keep the event loop alive so shutdown functions can run
setInterval(() => {}, 1000);