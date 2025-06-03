import { FactoryDatabase } from '@core/factory';
import { ServiceMedia } from '@core/service';
import { MediaType } from '@core/types';

const [,, mediaPath, displayName] = process.argv;

export const mediaRegister = (mediaPath: string, mediaCategory: MediaType, displayName?: string) => {
    const db = (new FactoryDatabase).create();
    
    const serviceMedia = new ServiceMedia(db);
    
    if (displayName === undefined) {
        const mediaPathSplit = mediaPath.split('/');

        // No display name specified, display name will be the file's directory
        displayName = mediaPathSplit[mediaPathSplit.length - 2];
    }

    try {
        if (serviceMedia.registerMedia(mediaPath, mediaCategory, displayName)) {
            console.log(`✅ Media registered as "${displayName}"`);
        } else {
            console.log('❌ Media could not be registered');
        }
    } catch (e) {
        console.log(`❌ ${e}`);
    }
} 


// mediaRegister(mediaPath, displayName);