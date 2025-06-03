import { MediaType } from '../../types';
import { mediaRegister } from '../media/mediaRegister';
import { mediaSegmentGenerate } from '../mediaSegment/mediaSegmentGenerate';

const [,, input, mediaPath, mediaType, displayName] = process.argv;

export const uploadMediaWithMediaSegments = (input: string, mediaPath: string, mediaType: MediaType, displayName?: string) => {
    // Media record has to be created first
    mediaRegister(mediaPath, mediaType, displayName);

    mediaSegmentGenerate(input, mediaPath);
}

uploadMediaWithMediaSegments(input, mediaPath, mediaType as MediaType, displayName);