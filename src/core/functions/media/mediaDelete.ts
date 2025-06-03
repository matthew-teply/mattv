import { FactoryDatabase } from '@core/factory';
import { ServiceMedia, ServiceMediaSegment } from '@core/service';

const [,, mediaPath] = process.argv;

const db = (new FactoryDatabase()).create();

const serviceMedia = new ServiceMedia(db);
const serviceMediaSegment = new ServiceMediaSegment(db);

const media = serviceMedia.getMediaByMediaPath(mediaPath);

if (media === null) {
    console.error(`❌ Media "${mediaPath}" does not exist`);
} else {
    serviceMedia.deleteMediaById(media.id);
    serviceMediaSegment.deleteMediaSegmentsByMediaId(media.id);

    console.log(`✅ Media "${mediaPath}" deleted`);
}

