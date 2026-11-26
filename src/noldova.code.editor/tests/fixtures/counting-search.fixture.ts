/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import { type TextDocument, type TextRange, TextSearch } from "@noldova/code.editor";

export class CountingSearch extends TextSearch {
  public readonly searched: number[] = [];

  public override findAll(document: TextDocument, fromLine?: number, toLine?: number): IReadOnlyList<TextRange> {
    this.searched.push(fromLine ?? -1);

    return super.findAll(document, fromLine, toLine);
  }
}
