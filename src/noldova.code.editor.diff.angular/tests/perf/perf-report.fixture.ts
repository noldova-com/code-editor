/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { inject } from "vitest";
import { commands } from "vitest/browser";

declare module "vitest" {
  export interface ProvidedContext {
    perfResultsFolder: string;
  }
}

export class PerfReport {
  private static readonly DIGITS: number = 1;
  private static readonly EXTENSION: string = ".json";
  private static readonly samples: Map<string, number[]> = new Map<string, number[]>();

  public static record(name: string, milliseconds: number): void {
    const list: number[] = PerfReport.samples.get(name) ?? [];
    list.push(Number(milliseconds.toFixed(PerfReport.DIGITS)));
    PerfReport.samples.set(name, list);
  }

  public static since(name: string, start: number): void {
    PerfReport.record(name, performance.now() - start);
  }

  public static async saveAsync(file: string): Promise<void> {
    await commands.writeFile(`${inject("perfResultsFolder")}/${file}${PerfReport.EXTENSION}`, JSON.stringify(Object.fromEntries(PerfReport.samples)));
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
