import { FactoryDatabase } from '../../factory';
import { ServiceMediaSegment } from '../../service';

const [,, input, outputDir] = process.argv;

export const mediaSegmentGenerate = (input: string, outputDir: string) => {
    const db = (new FactoryDatabase()).create();

    const serviceSegment = new ServiceMediaSegment(db);

    try {
        serviceSegment.createMediaSegments(input, outputDir);
    } catch (e) {
        console.log(`❌ ${e}`);
    }
}

// mediaSegmentGenerate(input, outputDir);
