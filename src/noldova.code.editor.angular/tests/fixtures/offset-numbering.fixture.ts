/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ICodeNumbering } from "../../src/app/interfaces/i-code-numbering.ts";

export class OffsetNumbering implements ICodeNumbering {
  public readonly largest: number;

  public constructor(largest: number) {
    this.largest = largest;
  }

  public numberOf(line: number): number | null {
    return line === 0 ? null : line + 100;
  }
}
