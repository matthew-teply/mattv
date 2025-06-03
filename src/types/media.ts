import { MEDIA_TYPE_AD, MEDIA_TYPE_MOVIE, MEDIA_TYPE_SHOW, MEDIA_TYPE_STANDBY } from '../constants';

export interface Media {
    id: number;
    name: string;
    displayName: string;
    path: string;
    type: MediaType;
}

export interface MediaFromDb {
    id: number;
    name: string;
    display_name: string;
    media_path: string;
    media_type: string;
}

export type MediaType = 
    typeof MEDIA_TYPE_MOVIE |
    typeof MEDIA_TYPE_SHOW |
    typeof MEDIA_TYPE_AD |
    typeof MEDIA_TYPE_STANDBY;