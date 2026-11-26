/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { LineIndex } from "../../src/app/models/rows/line-index.ts";

export class Span {
  public readonly name: string;
  public readonly start: number;
  public readonly end: number;

  public constructor(name: string, start: number, end: number) {
    this.name = name;
    this.start = start;
    this.end = end;
  }

  public static namesIn(index: LineIndex<Span>, start: number, end: number): readonly string[] {
    return index.overlapping(start, end).select(t => t.name).toArray();
  }
}
