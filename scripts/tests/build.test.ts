/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ScriptRunner } from "./fixtures/script-runner.fixture.js";

@TestClass
export class BuildTests {
  private static readonly CARRIED_DOCS: ReadonlyMap<string, string> = new Map([
    ["code.editor.angular/app/models/decorations/code-bar.d.ts", " * A bar one row high across the code view between two lines, with an icon,"],
    ["code.editor.merge.angular/app/components/merge-editor/merge-editor.component.d.ts", " * The `noldova-merge-editor` component: the merge view, which shows ours and"]
  ]);
  private static readonly DECLARATION_ENDING: string = ".d.ts";
  private static readonly DECLARATIONS_COPY: string = "\tapi/index.d.ts";
  private static readonly INSERTED_ROWS_FILES: readonly string[] = ["inserted-rows.d.ts", "code-bar.d.ts", "code-spacer.d.ts", "code-embedded-lines.d.ts"];
  private static readonly INSERTED_ROWS_INTERNALS: readonly string[] = ["rowAt", "largestNumber"];
  private static readonly INTERNAL_TAG: string = "@internal";
  private static readonly LIST_COPIES_DRIVER: string = `
    const [scriptsUrl] = process.argv.slice(1);
    await import(new URL("build.ts", scriptsUrl).href);
  `;
  private static readonly LIST_COPIES_OPTION: string = "--list-copies";
  private static readonly PACKAGES: readonly string[] = ["code.editor.angular", "code.editor.merge.angular"];

  @TestMethod
  public async shipsTheAngularPackagesDeclarationsWithoutTheirInternalMembers(): Promise<void> {
    for (const name of BuildTests.PACKAGES) {
      const folder: string = path.resolve("node_modules", "@noldova", name);
      const files: readonly string[] = (await readdir(folder, { recursive: true })).filter(t => t.endsWith(BuildTests.DECLARATION_ENDING));
      Assert.isTrue(files.length > 0, name);
      Assert.isTrue(name !== BuildTests.PACKAGES[0] || files.some(t => path.basename(t) === "inserted-rows.d.ts"), name);
      for (const file of files) {
        const text: string = await readFile(path.join(folder, file), "utf8");
        const internals: readonly string[] = BuildTests.INSERTED_ROWS_FILES.includes(path.basename(file)) ? BuildTests.INSERTED_ROWS_INTERNALS : [];
        Assert.areEqual("", [BuildTests.INTERNAL_TAG, ...internals].filter(t => text.includes(t)).join(), `${name}/${file}`);
      }
    }
  }

  @TestMethod
  public async shipsTheAngularPackagesDeclarationsWithTheirHandwrittenDocsAsync(): Promise<void> {
    for (const [file, line] of BuildTests.CARRIED_DOCS) {
      const text: string = await readFile(path.resolve("node_modules", "@noldova", ...file.split("/")), "utf8");
      Assert.isTrue(text.includes(line), file);
    }
  }

  @TestMethod
  public async listsTheDeclarationsAsCopiedOnlyForThePackagesThatShipThemUnchangedAsync(): Promise<void> {
    const lines: readonly string[] = (await ScriptRunner.runAsync(BuildTests.LIST_COPIES_DRIVER, ScriptRunner.SCRIPTS_FOLDER, [BuildTests.LIST_COPIES_OPTION])).split(/\r?\n/u);
    const copied: readonly string[] = lines.filter(t => t.endsWith(BuildTests.DECLARATIONS_COPY)).map(t => t.split("\t")[1] ?? "");

    Assert.areEqual("@noldova/code.editor,@noldova/code.editor.textmate,@noldova/code.editor.diff,@noldova/code.editor.merge", copied.join());
    Assert.areEqual("end of copies", lines.at(-1));
  }
}
