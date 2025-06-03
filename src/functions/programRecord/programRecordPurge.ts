import { ServiceProgramRecord } from '../../service/ServiceProgramRecord/ServiceProgramRecord';
import { FactoryDatabase } from '../../factory';

export const purgeProgramRecords = () => {
    const db = (new FactoryDatabase()).create();
    
    const serviceProgram = new ServiceProgramRecord(db);
    
    serviceProgram.purgeProgramRecords();
    
    console.log('✅ Program records purged');
}

purgeProgramRecords();