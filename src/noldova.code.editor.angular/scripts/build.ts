/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readdir } from "node:fs/promises";
import path from "node:path";

import CommandFailedException from "../../../scripts/command-failed.exception.ts";
import Config from "../../../scripts/config.ts";
import type PackageInfo from "../../../scripts/package-info.ts";
import Script from "../../../scripts/script.ts";

export class Build extends Script {
  private static readonly ANGULAR_COMPILER_PATH: string = "node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js";
  private static readonly ANGULAR_PROJECT_FILE_NAME: string = "tsconfig.json";
  private static readonly API_ENTRY_PATH: readonly string[] = ["api", "index.ts"];
  private static readonly CARRY_DOCS_PATH: string = "src/noldova.code.editor.angular/scripts/carry-docs.ts";
  private static readonly COMPILER_PROJECT_OPTION: string = "-p";
  private static readonly DECLARATION_ENDING: string = ".d.ts";
  private static readonly DISPOSABLE_REFERENCE: string = "/// <reference lib=\"esnext.disposable\" />\n";
  private static readonly DISPOSABLE_USE: RegExp = /\bDisposable\b|\bSymbol\.dispose\b/u;
  private static readonly INTERNAL_TAG: string = "@internal";
  private static readonly GENERATED_IMPORT: RegExp = /(\bimport \* as i\d+ from )(["'])(\.{1,2}\/[^"']*)\2/gu;
  private static readonly MANIFEST_INDENTATION: number = 2;
  private static readonly PROJECT_FILE_NAME: string = "tsconfig.build.json";
  private static readonly RELATIVE_SPECIFIER: RegExp = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\bnew URL\(\s*)(["'])(\.{1,2}\/[^"']*)\2/gu;
  private static readonly SCRIPT_ENDING: string = ".js";
  private static readonly SCRIPTS_TSCONFIG_PATH: string = "src/noldova.code.editor.angular/scripts/tsconfig.json";
  private static readonly SOURCE_ENDING: string = ".ts";
  private static readonly WORKER_ENDING: string = ".worker.ts";
  private static readonly WORK_FOLDER: string = "_build/angular";

  public override async runAsync(packageInfo: PackageInfo): Promise<void> {
    await this.executeTypeScriptCompilerAsync([Build.TYPESCRIPT_PROJECT_OPTION, Build.SCRIPTS_TSCONFIG_PATH]);
    const source = path.resolve(Build.SOURCE_DIRECTORY_NAME, packageInfo.path);
    const sources = path.join(source, Build.SOURCE_DIRECTORY_NAME);
    const output = path.resolve(Config.BUILD_FOLDER, packageInfo.name);
    const workers = (await readdir(sources, { recursive: true }))
      .filter(t => t.endsWith(Build.WORKER_ENDING))
      .sort()
      .map(t => path.join(sources, t));
    const entry = path.join(sources, ...Build.API_ENTRY_PATH);
    const angularProjectFile = path.join(source, Build.ANGULAR_PROJECT_FILE_NAME);
    const project = {
      extends: angularProjectFile,
      compilerOptions: { rootDir: sources, outDir: output, declaration: true, stripInternal: true },
      angularCompilerOptions: { compilationMode: "partial" },
      include: [],
      files: [entry, ...workers]
    };
    const projectFile = path.resolve(Build.WORK_FOLDER, Build.PROJECT_FILE_NAME);
    await this.createDirectoryAsync(Build.WORK_FOLDER);
    await this.writeFileAsync(projectFile, `${JSON.stringify(project, null, Build.MANIFEST_INDENTATION)}\n`);
    await this.executeProcessAsync(process.execPath, [Build.ANGULAR_COMPILER_PATH, Build.COMPILER_PROJECT_OPTION, projectFile], process.cwd(), true);
    await this.copyReadmeFileAsync(packageInfo);
    await this.nameImportsAsync(output);
    await this.checkImportsAsync(output);
    await this.executeProcessAsync(process.execPath, [Build.CARRY_DOCS_PATH, angularProjectFile, output, entry], process.cwd(), true);
    await this.checkInternalsAsync(output);
  }

  private async checkInternalsAsync(output: string): Promise<void> {
    const problems: string[] = [];
    for (const file of await Build.listBuiltFilesAsync(output))
      if (file.endsWith(Build.DECLARATION_ENDING) && (await this.readFileAsync(file)).includes(Build.INTERNAL_TAG))
        problems.push(`  ${path.relative(process.cwd(), file)}`);
    if (problems.length > 0)
      throw new CommandFailedException(Build.internalsShipped(problems));
  }

  private async nameImportsAsync(output: string): Promise<void> {
    for (const file of await Build.listBuiltFilesAsync(output)) {
      const text = await this.readFileAsync(file);
      const named = text
        .replace(Build.GENERATED_IMPORT, (whole: string, start: string, quote: string, specifier: string) =>
          specifier.endsWith(Build.SCRIPT_ENDING) ? whole : `${start}${quote}${specifier}${Build.SCRIPT_ENDING}${quote}`)
        .replace(Build.RELATIVE_SPECIFIER, (whole: string, start: string, quote: string, specifier: string) =>
          specifier.endsWith(Build.SOURCE_ENDING) && !specifier.endsWith(Build.DECLARATION_ENDING)
            ? `${start}${quote}${specifier.slice(0, -Build.SOURCE_ENDING.length)}${Build.SCRIPT_ENDING}${quote}`
            : whole);
      const referenced = file.endsWith(Build.DECLARATION_ENDING) && Build.DISPOSABLE_USE.test(named) ? `${Build.DISPOSABLE_REFERENCE}${named}` : named;
      if (referenced !== text)
        await this.writeFileAsync(file, referenced);
    }
  }

  private async checkImportsAsync(output: string): Promise<void> {
    const problems: string[] = [];
    for (const file of await Build.listBuiltFilesAsync(output)) {
      const declares = file.endsWith(Build.DECLARATION_ENDING);
      for (const match of (await this.readFileAsync(file)).matchAll(Build.RELATIVE_SPECIFIER)) {
        const specifier = match[3] ?? String();
        const imported = path.resolve(path.dirname(file), specifier);
        const named = declares ? `${imported.slice(0, -Build.SCRIPT_ENDING.length)}${Build.DECLARATION_ENDING}` : imported;
        if (!specifier.endsWith(Build.SCRIPT_ENDING) || !await this.pathExistsAsync(named))
          problems.push(Build.badImport(path.relative(process.cwd(), file), specifier));
      }
    }
    if (problems.length > 0)
      throw new CommandFailedException(Build.badImports(problems));
  }

  private static async listBuiltFilesAsync(output: string): Promise<readonly string[]> {
    return (await readdir(output, { recursive: true }))
      .filter(t => t.endsWith(Build.SCRIPT_ENDING) || t.endsWith(Build.DECLARATION_ENDING))
      .sort()
      .map(t => path.join(output, t));
  }

  private static badImport(file: string, specifier: string): string {
    return `  ${file}: "${specifier}"`;
  }

  private static internalsShipped(problems: readonly string[]): string {
    return `The built declarations still carry internal members:\n${problems.join("\n")}`;
  }

  private static badImports(problems: readonly string[]): string {
    return `The built files name their own package's files in ways Node.js can't load:\n${problems.join("\n")}`;
  }
}
