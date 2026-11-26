/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ScriptRunner } from "./fixtures/script-runner.fixture.js";

@TestClass
export class CarryDocsTests {
  private static readonly ANGULAR_SCRIPTS_FOLDER: string = path.resolve("src", "noldova.code.editor.angular", "scripts");
  private static readonly COMPILED_ENTRY: string = "out/api/index.d.ts";
  private static readonly COMPILED_ENTRY_TEXT: string = "export { Greeter } from \"../app/greeter.js\";\n";
  private static readonly COMPILED_GREETER: string = "out/app/greeter.d.ts";
  private static readonly COMPILED_GREETER_TEXT: string = "export declare class Greeter {\n    readonly name: string;\n}\n";
  private static readonly DIRECTORY_PREFIX: string = "noldova-carry-docs-";
  private static readonly DOCUMENTED_ENTRY: string = "src/api/index.d.ts";
  private static readonly DOCUMENTED_TEXT: string = "/**\n * A greeting.\n */\nexport declare class Greeter {\n  /**\n   * The name.\n   */\n  readonly name: string;\n}\n";
  private static readonly DRIVER: string = `
    const [scriptsUrl, root, ...arguments_] = process.argv.slice(1);
    const { CarryDocs } = await import(new URL("carry-docs.ts", scriptsUrl).href);
    const exitCode = await new CarryDocs(root, process.stdout).runAsync(arguments_);
    console.log(\`exit \${exitCode}\`);
  `;
  private static readonly ENTRY: string = "src/api/index.ts";
  private static readonly OUTPUT_FOLDER: string = "out";
  private static readonly PROJECT_FILE: string = "tsconfig.json";
  private static readonly PROJECT: string = `${JSON.stringify({
    compilerOptions: { strict: true, target: "ES2022", module: "preserve", moduleResolution: "bundler", types: [] }
  })}\n`;
  private static readonly REMOVAL_RETRIES: number = 5;

  @TestMethod
  public async carriesTheDocumentedJSDocOntoTheCompiledDeclarationsAsync(): Promise<void> {
    await CarryDocsTests.useFolderAsync(CarryDocsTests.listFiles(CarryDocsTests.DOCUMENTED_TEXT, CarryDocsTests.COMPILED_GREETER_TEXT), async root => {
      Assert.areEqual("exit 0", await CarryDocsTests.carryAsync(root));
      Assert.areEqual(
        "/**\n * A greeting.\n */\nexport declare class Greeter {\n    /**\n     * The name.\n     */\n    readonly name: string;\n}\n",
        await readFile(path.join(root, CarryDocsTests.COMPILED_GREETER), "utf8"));
    });
  }

  @TestMethod
  public async refusesACompiledMemberTheDocumentedDeclarationsLackAsync(): Promise<void> {
    const compiled = "export declare class Greeter {\n    readonly name: string;\n    readonly age: number;\n}\n";
    await CarryDocsTests.useFolderAsync(CarryDocsTests.listFiles(CarryDocsTests.DOCUMENTED_TEXT, compiled), async root => {
      const output = await CarryDocsTests.carryAsync(root);

      Assert.isTrue(output.includes("Greeter#age: compiled, but not documented in src/api/index.d.ts"), output);
      Assert.isTrue(output.endsWith("exit 1"), output);
      Assert.areEqual(compiled, await readFile(path.join(root, CarryDocsTests.COMPILED_GREETER), "utf8"));
    });
  }

  @TestMethod
  public async refusesADocumentedMemberTheCompilerDidNotWriteAsync(): Promise<void> {
    const compiled = "export declare class Greeter {\n}\n";
    await CarryDocsTests.useFolderAsync(CarryDocsTests.listFiles(CarryDocsTests.DOCUMENTED_TEXT, compiled), async root => {
      const output = await CarryDocsTests.carryAsync(root);

      Assert.isTrue(output.includes("Greeter#name: documented in src/api/index.d.ts, but not compiled"), output);
      Assert.isTrue(output.endsWith("exit 1"), output);
    });
  }

  @TestMethod
  public async refusesADocumentedMemberWithoutJSDocAsync(): Promise<void> {
    const documented = "/**\n * A greeting.\n */\nexport declare class Greeter {\n  readonly name: string;\n}\n";
    await CarryDocsTests.useFolderAsync(CarryDocsTests.listFiles(documented, CarryDocsTests.COMPILED_GREETER_TEXT), async root => {
      const output = await CarryDocsTests.carryAsync(root);

      Assert.isTrue(output.includes("Greeter#name: has no JSDoc in src/api/index.d.ts"), output);
      Assert.isTrue(output.endsWith("exit 1"), output);
    });
  }

  @TestMethod
  public async leavesAnExportFromOutsideThePackageUncomparedAsync(): Promise<void> {
    const files = new Map(CarryDocsTests.listFiles(CarryDocsTests.DOCUMENTED_TEXT, CarryDocsTests.COMPILED_GREETER_TEXT));
    const outside = "export { Outside } from \"../../vendor/outside.js\";\n";
    files.set(CarryDocsTests.DOCUMENTED_ENTRY, `${CarryDocsTests.DOCUMENTED_TEXT}${outside}`);
    files.set(CarryDocsTests.COMPILED_ENTRY, `${CarryDocsTests.COMPILED_ENTRY_TEXT}${outside}`);
    files.set("vendor/outside.d.ts", "export declare class Outside {\n    readonly size: number;\n}\n");
    await CarryDocsTests.useFolderAsync(files, async root => {
      Assert.areEqual("exit 0", await CarryDocsTests.carryAsync(root));
    });
  }

  @TestMethod
  public async refusesAMissingDocumentedFileAsync(): Promise<void> {
    const files = new Map(CarryDocsTests.listFiles(CarryDocsTests.DOCUMENTED_TEXT, CarryDocsTests.COMPILED_GREETER_TEXT));
    files.delete(CarryDocsTests.DOCUMENTED_ENTRY);
    await CarryDocsTests.useFolderAsync(files, async root => {
      Assert.areEqual("src/api/index.d.ts is missing; each entry's documented declarations sit beside it.\nexit 1", await CarryDocsTests.carryAsync(root));
    });
  }

  @TestMethod
  public async refusesAMissingCompiledFileAsync(): Promise<void> {
    const files = new Map(CarryDocsTests.listFiles(CarryDocsTests.DOCUMENTED_TEXT, CarryDocsTests.COMPILED_GREETER_TEXT));
    files.delete(CarryDocsTests.COMPILED_ENTRY);
    await CarryDocsTests.useFolderAsync(files, async root => {
      Assert.areEqual("The Angular compiler wrote no out/api/index.d.ts for src/api/index.d.ts.\nexit 1", await CarryDocsTests.carryAsync(root));
    });
  }

  @TestMethod
  public async refusesAProjectTypeScriptCannotReadAsync(): Promise<void> {
    const files = new Map(CarryDocsTests.listFiles(CarryDocsTests.DOCUMENTED_TEXT, CarryDocsTests.COMPILED_GREETER_TEXT));
    files.delete(CarryDocsTests.PROJECT_FILE);
    await CarryDocsTests.useFolderAsync(files, async root => {
      const output = await CarryDocsTests.carryAsync(root);

      Assert.isTrue(output.startsWith("Carrying the documented declarations onto out failed: TypeScript could not read "), output);
      Assert.isTrue(output.endsWith("exit 1"), output);
    });
  }

  @TestMethod
  public async printsItsUsageWithoutAnEntryAsync(): Promise<void> {
    const output = await ScriptRunner.runAsync(CarryDocsTests.DRIVER, CarryDocsTests.ANGULAR_SCRIPTS_FOLDER, [tmpdir(), CarryDocsTests.PROJECT_FILE, CarryDocsTests.OUTPUT_FOLDER]);

    Assert.isTrue(output.startsWith("Usage: node src/noldova.code.editor.angular/scripts/carry-docs.ts "), output);
    Assert.isTrue(output.endsWith("exit 2"), output);
  }

  private static listFiles(documented: string, compiledGreeter: string): ReadonlyMap<string, string> {
    return new Map([
      [CarryDocsTests.PROJECT_FILE, CarryDocsTests.PROJECT],
      [CarryDocsTests.DOCUMENTED_ENTRY, documented],
      [CarryDocsTests.COMPILED_ENTRY, CarryDocsTests.COMPILED_ENTRY_TEXT],
      [CarryDocsTests.COMPILED_GREETER, compiledGreeter]
    ]);
  }

  private static async carryAsync(root: string): Promise<string> {
    return await ScriptRunner.runAsync(CarryDocsTests.DRIVER, CarryDocsTests.ANGULAR_SCRIPTS_FOLDER, [
      root,
      path.join(root, CarryDocsTests.PROJECT_FILE),
      path.join(root, CarryDocsTests.OUTPUT_FOLDER),
      path.join(root, CarryDocsTests.ENTRY)
    ]);
  }

  private static async useFolderAsync(files: ReadonlyMap<string, string>, useAsync: (root: string) => Promise<void>): Promise<void> {
    const root = await realpath(await mkdtemp(path.join(tmpdir(), CarryDocsTests.DIRECTORY_PREFIX)));
    try {
      for (const [name, text] of files) {
        const file = path.join(root, name);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, text);
      }
      await useAsync(root);
    }
    finally {
      await rm(root, { recursive: true, force: true, maxRetries: CarryDocsTests.REMOVAL_RETRIES });
    }
  }
}
