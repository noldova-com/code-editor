/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import os from "node:os";

import CommandFailedException from "./command-failed.exception.ts";
import Script from "./script.ts";

export class Perf extends Script {
  private static readonly FOLDERS: readonly string[] = ["src/noldova.code.editor.angular", "src/noldova.code.editor.diff.angular"];
  private static readonly RUN_ARGUMENTS: readonly string[] = ["run", "perf", "--silent"];
  private static readonly PREFIX: string = "noldova-perf\t";
  private static readonly SEPARATOR: string = "\t";
  private static readonly LINE_BREAK: RegExp = /\r?\n/u;
  private static readonly HEADER: string = "| Case | Samples | Median ms | Slowest ms |";
  private static readonly RULE: string = "|---|---:|---:|---:|";

  public override async runAsync(): Promise<void> {
    const samples: Map<string, number[]> = new Map<string, number[]>();
    for (const folder of Perf.FOLDERS) {
      await this.writeLogAsync(Perf.measuring(folder));
      const result = await this.readNPMCommandAsync(Perf.RUN_ARGUMENTS, folder);
      if (!result.isSuccessful)
        throw new CommandFailedException(Perf.failed(folder, result.output + result.errorOutput));

      for (const line of result.output.split(Perf.LINE_BREAK)) {
        const start: number = line.indexOf(Perf.PREFIX);
        if (start < 0)
          continue;

        const [name = "", value = ""] = line.slice(start + Perf.PREFIX.length).split(Perf.SEPARATOR);
        const list: number[] = samples.get(name) ?? [];
        list.push(Number(value));
        samples.set(name, list);
      }
    }

    await this.writeLogAsync(Perf.machine());
    await this.writeLogAsync(Perf.HEADER);
    await this.writeLogAsync(Perf.RULE);
    for (const [name, values] of samples)
      await this.writeLogAsync(Perf.row(name, values));
  }

  private static row(name: string, values: readonly number[]): string {
    const sorted: number[] = [...values].sort((a, b) => a - b);
    const middle: number = Math.floor(sorted.length / 2);
    const median: number = sorted.length % 2 === 1 ? sorted[middle] ?? 0 : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;

    return `| ${name} | ${sorted.length} | ${median.toFixed(1)} | ${(sorted.at(-1) ?? 0).toFixed(1)} |`;
  }

  private static machine(): string {
    return `${os.type()} ${os.arch()}, ${os.cpus()[0]?.model.trim() ?? "unknown CPU"}, ${os.cpus().length} cores, headless Chromium`;
  }

  private static measuring(folder: string): string {
    return `Measuring "${folder}"...`;
  }

  private static failed(folder: string, output: string): string {
    return `The measurements in "${folder}" failed:\n${output}`;
  }
}

const perf = new Perf();
await perf.runAsEntryPointAsync();
