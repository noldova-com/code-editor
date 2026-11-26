/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ScriptRunner } from "./fixtures/script-runner.fixture.js";

@TestClass
export class PerfResultsTests {
  private static readonly DIRECTORY_PREFIX: string = "noldova-perf-results-";
  private static readonly DRIVER: string = `
    const [scriptsUrl, folder] = process.argv.slice(1);
    const { default: CommandFailedException } = await import(new URL("command-failed.exception.ts", scriptsUrl).href);
    try {
      const { default: PerfResults } = await import(new URL("perf-results.ts", scriptsUrl).href);
      console.log(JSON.stringify([...await PerfResults.readAsync(folder)]));
    }
    catch (exception) {
      if (!(exception instanceof CommandFailedException))
        throw exception;
      console.log(exception.message);
    }
  `;
  private static readonly REMOVAL_RETRIES: number = 5;
  private static readonly SCRIPT_FILE_NAMES: readonly string[] = ["command-failed.exception.ts", "perf-results.ts"];
  private static readonly SCRIPTS_FOLDER_NAME: string = "scripts";
  private static readonly RESULTS_FOLDER_NAME: string = "perf";
  private static readonly EDITOR: string = JSON.stringify({
    "open, plain": [2, 1], "open, highlighted": [3], "keypress, work before the frame": [1], "keypress to paint": [16], "scroll, work before the frame": [1],
    "scroll frame": [16], "search, first matches": [25], "search, last match": [600]
  });
  private static readonly DIFF: string = JSON.stringify({ "diff, 100,000 lines": [100, 90] });

  @TestMethod
  public async readsEachCasesSamplesFromEveryResultsFileInTheListsOrderAsync(): Promise<void> {
    const output = await PerfResultsTests.readAsync({ "diff-editor.json": PerfResultsTests.DIFF, "code-editor.json": PerfResultsTests.EDITOR, "notes.txt": "skipped" });

    Assert.areEqual(JSON.stringify([["open, plain", [2, 1]], ["open, highlighted", [3]], ["keypress, work before the frame", [1]], ["keypress to paint", [16]],
      ["scroll, work before the frame", [1]], ["scroll frame", [16]], ["search, first matches", [25]], ["search, last match", [600]], ["diff, 100,000 lines", [100, 90]]]), output);
  }

  @TestData("{}", "npm run perf found no samples of \"diff, 100,000 lines\".")
  @TestData("{\"diff, 100,000 lines\": []}", "npm run perf found no samples of \"diff, 100,000 lines\".")
  @TestData("{\"diff, 100,000 lines\": [1], \"open, sideways\": [1]}", "diff-editor.json has samples of \"open, sideways\", which npm run perf doesn't list.")
  @TestData("[1]", "diff-editor.json doesn't hold an object of each case's samples in milliseconds.")
  @TestData("{\"diff, 100,000 lines\": [\"1\"]}", "diff-editor.json doesn't hold an object of each case's samples in milliseconds.")
  @TestData("{\"diff, 100,000 lines\": 1}", "diff-editor.json doesn't hold an object of each case's samples in milliseconds.")
  @TestMethod
  public async refusesACaseWithNoSamplesOrOneItDoesntListOrAFileOfSomethingElseAsync(diff: string, message: string): Promise<void> {
    Assert.areEqual(message, await PerfResultsTests.readAsync({ "code-editor.json": PerfResultsTests.EDITOR, "diff-editor.json": diff }));
  }

  @TestMethod
  public async refusesAnEmptyResultsFolderNamingEveryCaseAsync(): Promise<void> {
    const output = await PerfResultsTests.readAsync({});

    Assert.isTrue(output.startsWith("npm run perf found no samples of \"open, plain\", \"open, highlighted\", ") && output.endsWith(", \"diff, 100,000 lines\"."), output);
  }

  private static async readAsync(files: Readonly<Record<string, string>>): Promise<string> {
    const directory = await mkdtemp(path.join(tmpdir(), PerfResultsTests.DIRECTORY_PREFIX));
    try {
      const scriptsFolder = path.join(directory, PerfResultsTests.SCRIPTS_FOLDER_NAME);
      const resultsFolder = path.join(directory, PerfResultsTests.RESULTS_FOLDER_NAME);
      await mkdir(scriptsFolder);
      await mkdir(resultsFolder);
      for (const name of PerfResultsTests.SCRIPT_FILE_NAMES)
        await copyFile(path.join(ScriptRunner.SCRIPTS_FOLDER, name), path.join(scriptsFolder, name));
      for (const [name, content] of Object.entries(files))
        await writeFile(path.join(resultsFolder, name), content);

      return await ScriptRunner.runAsync(PerfResultsTests.DRIVER, scriptsFolder, [resultsFolder]);
    }
    finally {
      await rm(directory, { recursive: true, force: true, maxRetries: PerfResultsTests.REMOVAL_RETRIES });
    }
  }
}
