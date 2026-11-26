/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import { Resources } from "../../resources.js";

export class LanguageFile {
  public readonly path: string;
  public readonly name: string;

  public constructor(path: string) {
    this.path = path.replaceAll(Resources.windowsPathSeparator, Resources.pathSeparator).toLowerCase();
    this.name = this.path.slice(this.path.lastIndexOf(Resources.pathSeparator) + 1);
  }

  public hasName(names: IReadOnlyList<string>): boolean {
    return names.any(t => t.toLowerCase() === this.name);
  }

  public hasExtension(extension: string): boolean {
    return this.name.endsWith(extension.toLowerCase());
  }

  public matchesPattern(patterns: IReadOnlyList<string>): boolean {
    return patterns.any(t => (t.includes(Resources.pathSeparator) ? new RegExp(Resources.formatPathPatternSource(LanguageFile.sourceOf(t)), Resources.unicodeFlag).test(this.path) : new RegExp(Resources.formatNamePatternSource(LanguageFile.sourceOf(t)), Resources.unicodeFlag).test(this.name)));
  }

  private static sourceOf(glob: string): string {
    return glob.toLowerCase().replace(Resources.globPartPattern, part => Resources.globSources.get(part) ?? part.replace(Resources.globSpecialPattern, Resources.regexEscape));
  }
}
