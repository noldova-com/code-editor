/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type DiffSpan, Required } from "@noldova/code.editor";
import { Enumerable, type IReadOnlyList } from "@noldova/context.collections";

import { LineChange } from "../models/line-change.js";
import { Resources } from "../resources.js";

export class LineChangeCodec {
  public static readonly width: number = Resources.lineChangeWidth;

  public static encode(changes: IReadOnlyList<DiffSpan>): Int32Array {
    const count: number = changes.count();
    const values: Int32Array = new Int32Array(count * LineChangeCodec.width);
    LineChangeCodec.encodeInto(values, changes, 0, count);

    return values;
  }

  public static encodeInto(values: Int32Array, changes: IReadOnlyList<DiffSpan>, start: number, end: number): void {
    for (const i of Enumerable.range(start, end - start)) {
      const change: DiffSpan = changes.get(i);
      values.set([change.originalStart, change.originalEnd, change.modifiedStart, change.modifiedEnd], i * LineChangeCodec.width);
    }
  }

  public static decode(values: Int32Array): IReadOnlyList<LineChange> {
    return Enumerable.from(values)
      .chunk(LineChangeCodec.width)
      .select((t, i) => new LineChange(i, Required.at(t, Resources.originalStartOffset), Required.at(t, Resources.originalEndOffset),
        Required.at(t, Resources.modifiedStartOffset), Required.at(t, Resources.modifiedEndOffset)))
      .toList();
  }
}
