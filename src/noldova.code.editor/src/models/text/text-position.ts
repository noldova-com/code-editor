/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";

export class TextPosition {
  public readonly line: number;
  public readonly column: number;

  public constructor(line: number, column: number) {
    TextPosition.requireCount(line, Resources.lineParameter);
    TextPosition.requireCount(column, Resources.columnParameter);

    this.line = line;
    this.column = column;
  }

  public compareTo(other: TextPosition): number {
    return this.line === other.line ? this.column - other.column : this.line - other.line;
  }

  public equals(other: TextPosition): boolean {
    return this.line === other.line && this.column === other.column;
  }

  public static requireCount(value: number, parameterName: string): void {
    if (!Number.isInteger(value) || value < 0)
      throw new ArgumentOutOfRangeException(parameterName, value, Resources.countExpected);
  }
}
