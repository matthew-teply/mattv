import { ServiceProgramRecord } from '../../service/ServiceProgramRecord/ServiceProgramRecord';
import { FactoryDatabase } from '../../factory';

export const generateProgram = () => {
    const db = (new FactoryDatabase()).create();
    
    const serviceProgram = new ServiceProgramRecord(db);
    
    const programRecords = serviceProgram.generateProgramRecords([
        "/ads/zeletava/",
        "/shows/spongebob-squarepants/season-1/spongebob-squarepants-s01e01a-help-wanted/",
        "/ads/zeletava/",
        "/shows/spongebob-squarepants/season-1/spongebob-squarepants-s01e01b-reef-blower/",
        "/ads/zeletava/",
        "/shows/spongebob-squarepants/season-1/spongebob-squarepants-s01e01c-tea-at-the-treedome/",
    ], Date.now() + 60000);
    
    console.log('✅ Program records generated');
    
    if(serviceProgram.uploadProgramRecordsToDatabase(programRecords)) {
        console.log('☁️ Program records uploaded to database');
    } else {
        console.log('⛈️ Program records could not be uploaded to database');
    }
}

generateProgram();