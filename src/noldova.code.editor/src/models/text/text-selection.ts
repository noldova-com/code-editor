/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { TextPosition } from "./text-position.js";

export class TextSelection {
  public readonly anchor: TextPosition;
  public readonly head: TextPosition;

  public constructor(anchor: TextPosition, head: TextPosition = anchor) {
    this.anchor = anchor;
    this.head = head;
  }

  public equals(other: TextSelection): boolean {
    return this.anchor.equals(other.anchor) && this.head.equals(other.head);
  }

  public static allEqual(first: IReadOnlyList<TextSelection>, second: IReadOnlyList<TextSelection>): boolean {
    return first.count() === second.count() && first.zip(second, (a, b) => a.equals(b)).all(t => t);
  }
}
