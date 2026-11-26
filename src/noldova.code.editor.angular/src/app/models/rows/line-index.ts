/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Required } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

export class LineIndex<TItem extends {} | null> {
  private readonly items: IReadOnlyList<TItem>;
  private readonly order: readonly number[];
  private readonly starts: readonly number[];
  private readonly reach: readonly number[];
  private readonly endOf: (item: TItem) => number;

  public constructor(items: IReadOnlyList<TItem>, startOf: (item: TItem) => number, endOf: (item: TItem) => number) {
    this.items = items;
    this.endOf = endOf;
    this.order = Array.from({ length: items.count() }, (_, index) => index).sort((a, b) => startOf(items.get(a)) - startOf(items.get(b)) || a - b);
    this.starts = this.order.map(t => startOf(items.get(t)));
    const reach: number[] = [];
    let furthest: number = Number.NEGATIVE_INFINITY;
    for (const index of this.order) {
      furthest = Math.max(furthest, endOf(items.get(index)));
      reach.push(furthest);
    }
    this.reach = reach;
  }

  public overlapping(start: number, end: number): IReadOnlyList<TItem> {
    let low: number = 0;
    let high: number = this.starts.length;
    while (low < high) {
      const middle: number = Math.floor((low + high) / 2);
      if (Required.at(this.starts, middle) < end)
        low = middle + 1;
      else
        high = middle;
    }
    const found: number[] = [];
    for (let at: number = low - 1; at >= 0 && Required.at(this.reach, at) > start; at--) {
      const index: number = Required.at(this.order, at);
      if (this.endOf(this.items.get(index)) > start)
        found.push(index);
    }
    const overlapping: List<TItem> = new List<TItem>();
    for (const index of found.sort((a, b) => a - b))
      overlapping.add(this.items.get(index));

    return overlapping;
  }
}
