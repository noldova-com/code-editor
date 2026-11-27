/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import fs from "node:fs/promises";
import path from "node:path";

import CommandFailedException from "./command-failed.exception.ts";

export default class PerfResults {
  public static readonly FOLDER: string = "_build/perf";
  public static readonly CASES: readonly string[] = ["open, plain", "open, highlighted, first", "open, highlighted", "keypress, work before the frame", "keypress to paint", "scroll, work before the frame",
    "scroll frame", "search, first matches", "search, last match", "diff, 100,000 lines"];
  private static readonly EXTENSION: string = ".json";
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";

  public static async readAsync(folder: string): Promise<ReadonlyMap<string, readonly number[]>> {
    const samples: Map<string, number[]> = new Map<string, number[]>(PerfResults.CASES.map(t => [t, []]));
    const files: readonly string[] = (await fs.readdir(folder)).filter(t => t.endsWith(PerfResults.EXTENSION)).sort();
    for (const file of files) {
      const results: unknown = JSON.parse(await fs.readFile(path.join(folder, file), PerfResults.TEXT_ENCODING));
      if (!Object.isPlainObject(results))
        throw new CommandFailedException(PerfResults.notResults(file));

      for (const [name, found] of Object.entries(results)) {
        const values: unknown = found;
        const list: number[] | undefined = samples.get(name);
        if (Object.isUndefined(list))
          throw new CommandFailedException(PerfResults.unknownCase(file, name));
        const numbers: readonly number[] = Array.isArray(values) ? values.filter((t: unknown): t is number => Object.isNumber(t)) : [];
        if (!Array.isArray(values) || numbers.length !== values.length)
          throw new CommandFailedException(PerfResults.notResults(file));
        list.push(...numbers);
      }
    }

    const missing: readonly string[] = [...samples].filter(([, t]) => t.length === 0).map(([t]) => t);
    if (missing.length > 0)
      throw new CommandFailedException(PerfResults.noSamples(missing));

    return samples;
  }

  private static notResults(file: string): string {
    return `${file} doesn't hold an object of each case's samples in milliseconds.`;
  }

  private static unknownCase(file: string, name: string): string {
    return `${file} has samples of "${name}", which npm run perf doesn't list.`;
  }

  private static noSamples(cases: readonly string[]): string {
    return `npm run perf found no samples of ${cases.map(t => `"${t}"`).join(", ")}.`;
  }
}
