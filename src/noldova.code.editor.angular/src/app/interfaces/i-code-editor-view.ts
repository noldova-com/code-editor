/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FoldShortcut } from "../enums/fold-shortcut.ts";

export interface ICodeEditorView {
  openSearch(replace: boolean): void;
  closeSearch(): void;
  toggleFold(shortcut: FoldShortcut): void;
}
