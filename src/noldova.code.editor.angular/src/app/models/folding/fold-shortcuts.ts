/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IReadOnlyList } from "@noldova/context.collections";

import { FoldShortcut } from "../../enums/fold-shortcut.ts";
import type { CodeFold } from "./code-fold.ts";

export class FoldShortcuts {
  public static foldAt(folds: IReadOnlyList<CodeFold>, line: number, shortcut: FoldShortcut): CodeFold | null {
    const found: CodeFold | undefined = shortcut === FoldShortcut.Fold
      ? folds.where(t => !t.collapsed && t.lineCount > 0 && t.startLine <= line && line < t.startLine + t.lineCount).orderByDescending(t => t.startLine).firstOrDefault()
      : folds.firstOrDefault(t => t.collapsed && t.lineCount > 0 && (t.startLine === line || t.startLine === line + 1 || t.startLine + t.lineCount === line));

    return found ?? null;
  }
}
