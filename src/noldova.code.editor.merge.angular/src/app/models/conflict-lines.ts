/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextDocument } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../resources.ts";

export class ConflictLines {
  public static of(document: TextDocument, parts: IReadOnlyList<string>, anchors: IReadOnlyList<string>): IReadOnlyList<number | null> {
    const text: string = Resources.lineFeed + document.text();
    const lines: List<number | null> = new List<number | null>();
    let from: number = 0;
    let index: number = 0;
    for (const part of parts) {
      const found: number = text.indexOf(Resources.lineFeed + (part === Resources.empty ? anchors.get(index) : part), from);
      lines.add(found < 0 ? null : document.positionAt(found).line);
      from = found < 0 ? from : found + part.length;
      index++;
    }

    return lines;
  }

  public static countOf(text: string): number {
    return text === Resources.empty ? 0 : text.split(Resources.lineFeed).length - (text.endsWith(Resources.lineFeed) ? 1 : 0);
  }
}
