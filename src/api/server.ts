import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

import { PUBLIC_DIR } from '@constants';

import { FactoryDatabase } from '@core/factory';
import {ServiceMediaSequence, ServiceLogger, ServiceStream, ServiceNetwork} from '@core/service';
import { SEGMENT_STANDARD_DURATION } from '@core/constants';

import { DEFAULT_PORT } from '@api/constants';

const [,, portArg] = process.argv;

const port = portArg ?? DEFAULT_PORT;

const app = express();

app.use(cors());

const db = (new FactoryDatabase()).create();

const serviceStream = new ServiceStream(db);
const serviceMediaSequence = new ServiceMediaSequence(db);

const serviceLogger = new ServiceLogger();
const serviceNetwork = new ServiceNetwork();

app.use('/', (req, _res, next) => { serviceLogger.client(`[${req.ip}] ${req.url}`); next(); })
app.use('/', express.static(PUBLIC_DIR));

app.get('/', (_req, res) => {
    res.send('Welcome to MatTV!<br><h3>Program</h3>');
});

app.get('/tv', (req, res) => {
    const m3u8Body = fs.readFileSync(path.join(PUBLIC_DIR, 'stream.m3u8')).toString();

    res.setHeader('Content-Disposition', 'inline; filename="MatTV.m3u8"');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');

    res.send(m3u8Body);
});

app.get('/watch', (req, res) => {
    let watchPageHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html')).toString();

    watchPageHtml = watchPageHtml.replace('<TV_URL>', `${serviceNetwork.getLocalIP()}:${port}`);

    res.send(watchPageHtml);
})

app.listen(port, () => {
    serviceLogger.server(`Server started

    ${chalk.bold('Device:')} ${chalk.cyanBright(`127.0.0.1:${port}`)}
    ${chalk.bold('Local Network:')} ${chalk.cyanBright(`${serviceNetwork.getLocalIP()}:${port}`)}
`);

    serviceMediaSequence.resetMediaSequence();
    serviceStream.generateM3U8();

    setInterval(() => {
        serviceStream.generateM3U8();
    }, SEGMENT_STANDARD_DURATION * 1000);
});

// Need to keep the event loop alive so shutdown functions can run
setInterval(() => {}, 1000);
