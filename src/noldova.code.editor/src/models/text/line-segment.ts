/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

export class LineSegment {
  private static readonly NO_MODIFIERS: IReadOnlyList<string> = new List<string>();

  public readonly start: number;
  public readonly end: number;
  public readonly type: string | null;
  public readonly modifiers: IReadOnlyList<string>;

  public constructor(start: number, end: number, type: string | null, modifiers: IReadOnlyList<string> = LineSegment.NO_MODIFIERS) {
    this.start = start;
    this.end = end;
    this.type = type;
    this.modifiers = modifiers;
  }
}
