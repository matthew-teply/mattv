import fs from 'fs';
import path from 'path';

import { MediaType } from '../../types';
import { mediaRegister } from '../media/mediaRegister';
import { mediaSegmentGenerate } from '../mediaSegment/mediaSegmentGenerate';
import { FactoryDatabase } from '../../factory';
import { ServiceMedia } from '../../service';

const [,, input, mediaType] = process.argv;

export const uploadMediaWithMediaSegmentsBulk = (input: string, mediaType: MediaType) => {
    const db = (new FactoryDatabase).create();
    
    const serviceMedia = new ServiceMedia(db);

    const inputDirPath = path.join('./input-files', input);

    const mediaFileNames = fs.readdirSync(inputDirPath);

    mediaFileNames.forEach(mediaFileName => {
        const mediaFileSplit = mediaFileName.split('.');

        delete mediaFileSplit[mediaFileSplit.length - 1];

        const diplayName = mediaFileSplit.join('.');
        const mediaPath = serviceMedia.createMediaPath(path.join(input, diplayName));

        // Media record has to be created first
        mediaRegister(mediaPath, mediaType, diplayName);
        mediaSegmentGenerate(path.join(inputDirPath, mediaFileName), mediaPath);
    });
}

uploadMediaWithMediaSegmentsBulk(input, mediaType as MediaType);