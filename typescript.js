// Utility to safely read and expose tsconfig at runtime (ESM)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function readTsConfig(tsconfigPath = path.join(__dirname, 'tsconfig.json')) {
  try {
    const raw = fs.readFileSync(tsconfigPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default { readTsConfig };


