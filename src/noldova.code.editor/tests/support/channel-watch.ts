/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ChannelWatch {
  public made: number = 0;
  public closed: number = 0;
  public tasks: number = 0;

  public async whileAsync<T>(work: () => Promise<T>): Promise<T> {
    const original: typeof MessageChannel = globalThis.MessageChannel;
    const made = (): void => {
      this.made++;
    };
    const closed = (): void => {
      this.closed++;
    };
    globalThis.MessageChannel = class CountingChannel extends original {
      public constructor() {
        super();
        made();
        const close = this.port1.close.bind(this.port1);
        this.port1.close = (): void => {
          closed();
          close();
        };
      }
    };
    let watching: boolean = true;
    const task = (): void => {
      if (!watching)
        return;
      this.tasks++;
      setImmediate(task);
    };
    setImmediate(task);
    try {
      return await work();
    }
    finally {
      watching = false;
      globalThis.MessageChannel = original;
    }
  }
}
