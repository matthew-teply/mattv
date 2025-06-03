import { MediaFromDb, Media, MediaType } from '@core/types';

export class FactoryMedia {
    fromDatabase(mediaFromDb: MediaFromDb): Media {
        return {
            id: mediaFromDb.id,
            displayName: mediaFromDb.display_name,
            name: mediaFromDb.name,
            path: mediaFromDb.media_path,
            type: mediaFromDb.media_type as MediaType,
        }
    }

    fromDatabaseBulk(mediasFromDb: MediaFromDb[]): Media[] {
        return mediasFromDb.map(mediaFromDb => this.fromDatabase(mediaFromDb));
    }
}