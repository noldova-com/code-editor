/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextDocument } from "@noldova/code.editor";
import { TextSearch } from "@noldova/code.editor/services/text-search.js";

export class CountingSearch extends TextSearch {
  public readonly searched: number[] = [];

  public override columnsIn(document: TextDocument, line: number): readonly number[] {
    this.searched.push(line);

    return super.columnsIn(document, line);
  }
}
