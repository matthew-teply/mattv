import path from 'path';
import findUp from 'find-up';

export function getProjectRoot() {
    const root = findUp.sync(['lerna.json'], { cwd: __dirname });
    if (!root) throw new Error('Could not find project root');
    return path.dirname(root);
}

export const PROJECT_ROOT = getProjectRoot();

export const DATABASE_DIR = path.join(PROJECT_ROOT, 'database');
export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
