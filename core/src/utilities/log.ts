import {Logger} from 'tslog';
require('fix-esm').register();
import * as StackTrace from 'stack-trace';
import * as SourceMapSupport from 'source-map-support';

export namespace CoreLog {
  const _log: Logger = new Logger({name: 'myLogger'});

  type CallStackEntry = {
    functionName: string | null;
    sourceLocation: {
      sourceFilePath: string | null;
      row: number | null;
      col: number | null;
    };
  };

  type Exception = {
    message: string;
    typeName: string;
    stack: CallStackEntry[];
  };

  const retrieveCallStack = (exception: Error | null): CallStackEntry[] => {
    const unmappedCallstack =
      exception === null ? StackTrace.get() : StackTrace.parse(exception);
    if (!unmappedCallstack || !unmappedCallstack.length) {
      return [];
    }
    const thisStackTrace = unmappedCallstack.map(
      (stackEntry): CallStackEntry => {
        const callSite = SourceMapSupport.wrapCallSite(
          stackEntry as SourceMapSupport.CallSite
        );
        const functionName = callSite.getFunctionName()
          ? callSite.getFunctionName()
          : callSite.getMethodName()
          ? callSite.getMethodName()
          : null;
        const fileName = callSite.getFileName();
        return {
          functionName: functionName,
          sourceLocation: {
            sourceFilePath: fileName,
            row: callSite.getLineNumber(),
            col: callSite.getColumnNumber(),
          },
        };
      }
    );
    return thisStackTrace;
  };

  /** @internal */
  const processException = (exception: unknown): Exception | null => {
    const isError = (exception: unknown): exception is Error => {
      return (
        (exception as Error).stack !== undefined &&
        (exception as Error).message !== undefined
      );
    };

    if (exception === undefined || exception === null || !isError(exception)) {
      return null;
    }

    const exceptionCallStack = StackTrace.parse(exception);
    if (!exceptionCallStack || !exceptionCallStack.length) {
      return null;
    }

    return {
      message: exception.message,
      typeName: exception.name,
      stack: retrieveCallStack(exception),
    };
  };

  const stackEntryToString = (entry: CallStackEntry) => {
    return `[${entry.sourceLocation.sourceFilePath}:${entry.sourceLocation.row}:${entry.sourceLocation.col}] [${entry.functionName}]`;
  };

  export interface ILog {
    readonly error: (message: string) => void;
    readonly info: (message: string) => void;
    readonly trace: (message: string) => void;
    readonly throw: (message: string) => never;
    readonly rethrow: (message: string, err: unknown) => never;
    readonly fatal: (message: string) => void;
  }

  export class Log implements ILog {
    readonly error = (message: string) => {
      _log.error(`Message: ${message}`);
      _log.error(
        `CallStack:\n${retrieveCallStack(null)
          .map(elem => stackEntryToString(elem))
          .join('\n')}`
      );
      // TODO: take stack trace
      // process stacktrace (SourceMapping)
      // send to cloud watch
    };
    readonly info = (message: string) => {
      _log.info(message);
    };
    readonly trace = (message: string) => {
      _log.trace(message);
    };
    readonly throw = (message: string): never => {
      this.error(message);
      throw new Error(message);
    };
    readonly rethrow = (message: string, err: unknown): never => {
      const ex = processException(err);
      if (ex === null) {
        _log.error(`Message: ${message}`);
        throw err;
      }
      _log.error(`Message: ${message}`);
      _log.error(`Exception message: ${JSON.stringify(ex.message)}`);
      _log.error(`Exception typename: ${JSON.stringify(ex.typeName)}`);
      _log.error(
        `CallStack:\n${ex.stack
          .map(elem => stackEntryToString(elem))
          .join('\n')}`
      );
      throw err;
    };
    readonly fatal = (message: string) => {
      _log.fatal(message);
    };
  }

  export const log = new Log();
}
