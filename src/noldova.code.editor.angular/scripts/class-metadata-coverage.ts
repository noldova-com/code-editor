/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IVitestPluginContext } from "./interfaces/i-vitest-plugin-context.ts";
import type { IVitestPlugin } from "./interfaces/i-vitest-plugin.ts";
import { MarkedModule } from "./marked-module.ts";

export class ClassMetadataCoverage implements IVitestPlugin {
  private static readonly CALL: RegExp = /^[\t ]+\(typeof ngDevMode === "undefined" \|\| ngDevMode\) && i\d+\.(?:ɵ|\\u0275)setClassMetadata\(([A-Za-z_$][\w$]*), /u;
  private static readonly CLOSING: string = "})();";
  private static readonly HINT: string = " /* v8 ignore next */";
  private static readonly LINE_END: string = "\n";
  private static readonly OPENING: string = "(() => {";
  private static readonly PLUGIN_NAME: string = "noldova-class-metadata-coverage";

  private readonly ignored: Map<string, readonly string[]> = new Map();

  public readonly name: string = ClassMetadataCoverage.PLUGIN_NAME;
  public readonly enforce: "post" = "post";
  public readonly transform: (code: string, id: string) => MarkedModule | null = (code, id) => this.mark(code, id);
  public readonly configureVitest: (context: IVitestPluginContext) => void = context => context.vitest.onClose(() => context.vitest.logger.log(this.summary));

  public get summary(): string {
    const calls: readonly string[] = [...this.ignored.values()].flat();
    return ClassMetadataCoverage.summaryOf(calls.length, new Set(calls).size);
  }

  private mark(code: string, id: string): MarkedModule | null {
    const lines: string[] = code.split(ClassMetadataCoverage.LINE_END);
    const classes: string[] = [];
    for (let index: number = 1; index < lines.length; index++) {
      const name: string | null = this.classAt(lines, index);
      if (Object.isNull(name))
        continue;
      lines[index - 1] += ClassMetadataCoverage.HINT;
      classes.push(name);
    }
    if (classes.length === 0) {
      this.ignored.delete(id);
      return null;
    }
    this.ignored.set(id, classes);
    return new MarkedModule(lines.join(ClassMetadataCoverage.LINE_END));
  }

  private classAt(lines: readonly string[], index: number): string | null {
    if (lines[index] !== ClassMetadataCoverage.OPENING)
      return null;
    const name: string | undefined = ClassMetadataCoverage.CALL.exec(lines[index + 1] ?? "")?.[1];
    if (Object.isUndefined(name) || !lines.slice(index + 2).includes(ClassMetadataCoverage.CLOSING))
      return null;
    return name;
  }

  private static summaryOf(calls: number, classes: number): string {
    return `Coverage ignores ${calls} compiler-generated class-metadata calls for ${classes} classes, which run only in development mode.`;
  }
}
