import fs from 'fs/promises';
import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'src/data');

export async function readJson<T>(filename: string): Promise<T> {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        throw new Error(`Failed to read database: ${filename}`);
    }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        throw new Error(`Failed to write database: ${filename}`);
    }
}
