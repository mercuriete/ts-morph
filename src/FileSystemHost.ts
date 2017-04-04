﻿export interface FileSystemHost {
    readFile(filePath: string, encoding?: string): string;
    writeFile(filePath: string, fileText: string, callback?: (err: NodeJS.ErrnoException) => void): void;
    writeFileSync(filePath: string, fileText: string): void;
    fileExists(filePath: string): boolean;
    directoryExists(dirPath: string): boolean;
    getAbsolutePath(filePath: string): string;
    normalize(filePath: string): string;
    getDirectoryName(filePath: string): string;
    pathJoin(...paths: string[]): string;
    getCurrentDirectory(): string;
    glob(patterns: string[]): string[];
}