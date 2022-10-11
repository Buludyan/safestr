import {CoreLog} from './log';
import archiver = require('archiver');
import * as fs from 'fs';

export namespace CoreCommonUtils {
  import log = CoreLog.log;
  export interface IGuard<TypeGuard> {
    _guard: TypeGuard;
  }

  export type NotNull<T> = T extends null ? never : T;
  export type NotUndefined<T> = T extends undefined ? never : T;
  export type TypeGuarded<T, TypeGuard> = T extends IGuard<TypeGuard>
    ? T
    : never;
  export type NotNullNotUndefined<T> = NonNullable<T>;

  export const isUndefined = (x: unknown): x is undefined => {
    return x === undefined;
  };

  export const isNotUndefined = (x: unknown): x is undefined => {
    return !isUndefined(x);
  };

  export const isNull = (x: unknown): x is null => {
    return x === null;
  };

  export const isNotNull = (x: unknown): x is null => {
    return !isNull(x);
  };

  export function throwIfNull<T>(x: T, message = ''): asserts x is NotNull<T> {
    if (isNull(x)) {
      log.error(message);
      throw new Error(message);
    }
  }
  export function throwIfUndefined<T>(
    x: T,
    message = ''
  ): asserts x is NotUndefined<T> {
    if (isUndefined(x)) {
      log.error(message);
      throw new Error(message);
    }
  }

  export type TypeGuardOf<T> = T extends IGuard<infer TypeGuard extends string>
    ? TypeGuard
    : never;

  export function makeSureThatXIs<T>(
    x: unknown,
    typeGuard: TypeGuardOf<T>
  ): asserts x is T {
    if ((x as IGuard<TypeGuardOf<T>>)._guard !== typeGuard) {
      const errorMessage = 'TypeGuard check failed';
      log.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  export const getCurrentDateAsString = () => {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}`;
  };

  // TODO: investigate, why this function create 2 source code zips
  export const archiveSourceCodeAndGetPath = async () => {
    const pathToZipFile = 'codebases';
    fs.mkdir(`${pathToZipFile}`, {recursive: true}, err => {
      if (err) {
        return log.error(err.message);
      }
      return log.info(`Directory ${pathToZipFile} created successfully!`);
    });
    const zipName = `codebase-${getCurrentDateAsString()}.zip`;
    log.info(`Creating zip file: ${pathToZipFile}/${zipName}`);
    const output = fs.createWriteStream(`${pathToZipFile}/${zipName}`);
    const archive = archiver('zip', {
      zlib: {level: 9}, // Sets the compression level.
    });

    output.on('close', () => {
      log.info(archive.pointer() + ' total bytes');
      log.info(
        'archiver has been finalized and the output file descriptor has closed.'
      );
    });

    output.on('end', () => {
      log.info('Data has been drained');
    });

    archive.on('warning', err => {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        log.error(err.message);
        throw err;
      }
    });

    archive.on('error', err => {
      log.error(err.message);
      throw err;
    });

    archive.pipe(output);

    log.info(`Adding package.json to the zip file: ${zipName}`);
    archive.file('package.json', {name: 'package.json'});
    log.info(`Adding node_modules to the zip file: ${zipName}`);
    archive.directory('node_modules/', 'node_modules');
    log.info(`Adding dist to the zip file: ${zipName}`);
    archive.directory('dist/', 'dist');
    await archive.finalize();
    await sleep(3000);
    log.info(`Zip file ${zipName} created`);
    return `${pathToZipFile}/${zipName}`;
  };
}
