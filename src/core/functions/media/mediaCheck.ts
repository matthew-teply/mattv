import { FactoryDatabase } from '@core/factory';
import { ServiceMedia } from '@core/service';

export const checkMedia = () => {
    const db = (new FactoryDatabase()).create();
    
    const serviceMedia = new ServiceMedia(db);
    
    const [,, mediaPath] = process.argv;
    
    if (serviceMedia.isMediaRegistered(mediaPath)) {
        console.log('✅ Media is registered');
    } else {
        console.log('❌ Media is not registered');
    }
}
