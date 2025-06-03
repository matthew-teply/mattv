import { ServiceProgramRecord } from '@core/service';
import { FactoryDatabase } from '@core/factory';

export const purgeProgramRecords = () => {
    const db = (new FactoryDatabase()).create();
    
    const serviceProgram = new ServiceProgramRecord(db);
    
    serviceProgram.purgeProgramRecords();
    
    console.log('✅ Program records purged');
}

purgeProgramRecords();