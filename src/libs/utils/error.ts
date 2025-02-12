/**
 * Errors originating in Dkargo SDK
 */
export class DkaSdkError extends Error {
    constructor(message: string, public readonly inner?: Error) {
      super(message);
  
      if (inner) {
        this.stack += '\nCaused By: ' + inner.stack;
      }
    }
  }