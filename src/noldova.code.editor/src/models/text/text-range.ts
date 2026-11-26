/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";
import { TextPosition } from "./text-position.js";

export class TextRange {
  public readonly start: TextPosition;
  public readonly end: TextPosition;

  public constructor(start: TextPosition, end: TextPosition) {
    if (end.compareTo(start) < 0)
      throw new ArgumentException(Resources.rangeReversed, Resources.rangeParameter);

    this.start = start;
    this.end = end;
  }

  public get isEmpty(): boolean {
    return this.start.equals(this.end);
  }

  public equals(other: TextRange): boolean {
    return this.start.equals(other.start) && this.end.equals(other.end);
  }

  public static of(startLine: number, startColumn: number, endLine: number, endColumn: number): TextRange {
    return new TextRange(new TextPosition(startLine, startColumn), new TextPosition(endLine, endColumn));
  }
}
