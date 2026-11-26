/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import { LineSplit } from "../../models/text/line-split.js";
import type { TextEdit } from "../../models/text/text-edit.js";
import { TextPosition } from "../../models/text/text-position.js";

export class PositionMapper {
  private readonly edits: IReadOnlyList<TextEdit>;

  public constructor(edits: IReadOnlyList<TextEdit>) {
    this.edits = edits.orderBy(t => t.range.start, (a, b) => a.compareTo(b)).toList();
  }

  public map(position: TextPosition): TextPosition {
    let lineDelta: number = 0;
    let lastEndLine: number = -1;
    let columnDelta: number = 0;
    for (const edit of this.edits) {
      if (edit.range.start.compareTo(position) > 0)
        break;
      const shift: number = edit.range.start.line === lastEndLine ? columnDelta : 0;
      const inserted: LineSplit = LineSplit.of(edit.text);
      const last: number = inserted.texts.get(inserted.texts.count() - 1).length;
      const startLine: number = edit.range.start.line + lineDelta;
      const end: TextPosition = inserted.texts.count() === 1
        ? new TextPosition(startLine, edit.range.start.column + shift + last)
        : new TextPosition(startLine + inserted.texts.count() - 1, last);
      if (position.compareTo(edit.range.end) < 0)
        return end;
      lineDelta += inserted.texts.count() - 1 - (edit.range.end.line - edit.range.start.line);
      columnDelta = end.column - edit.range.end.column;
      lastEndLine = edit.range.end.line;
    }

    return new TextPosition(position.line + lineDelta, position.column + (position.line === lastEndLine ? columnDelta : 0));
  }
}
