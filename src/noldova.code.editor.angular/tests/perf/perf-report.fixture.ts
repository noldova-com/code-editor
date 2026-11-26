/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PerfReport {
  private static readonly PREFIX: string = "noldova-perf";
  private static readonly SEPARATOR: string = "\t";
  private static readonly DIGITS: number = 1;

  public static record(name: string, milliseconds: number): void {
    console.log([PerfReport.PREFIX, name, milliseconds.toFixed(PerfReport.DIGITS)].join(PerfReport.SEPARATOR));
  }

  public static since(name: string, start: number): void {
    PerfReport.record(name, performance.now() - start);
  }

  public static paintAsync(): Promise<void> {
    return new Promise<void>(resolve => requestAnimationFrame(() => {
      const channel: MessageChannel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        resolve();
      };
      channel.port2.postMessage(null);
    }));
  }
}
