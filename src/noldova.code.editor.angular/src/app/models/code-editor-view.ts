/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FoldShortcut } from "../enums/fold-shortcut.ts";
import type { ICodeEditorView } from "../interfaces/i-code-editor-view.ts";

export class CodeEditorView implements ICodeEditorView {
  private readonly open: (replace: boolean) => void;
  private readonly close: () => void;
  private readonly fold: (shortcut: FoldShortcut) => void;

  public constructor(open: (replace: boolean) => void, close: () => void, fold: (shortcut: FoldShortcut) => void) {
    this.open = open;
    this.close = close;
    this.fold = fold;
  }

  public openSearch(replace: boolean): void {
    this.open(replace);
  }

  public closeSearch(): void {
    this.close();
  }

  public toggleFold(shortcut: FoldShortcut): void {
    this.fold(shortcut);
  }
}
