import path from 'path';

export const PROJECT_ROOT = path.resolve(__dirname, '..').split('src/admin')[0];

export const DATABASE_DIR = path.join(PROJECT_ROOT, 'database');
export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
