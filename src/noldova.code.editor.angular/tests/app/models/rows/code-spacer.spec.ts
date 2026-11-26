/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { describe, expect, it } from "vitest";

import { CodeSpacer } from "../../../../src/app/models/rows/code-spacer.ts";

describe("CodeSpacer", () => {
  it("takes the line it comes before and its rows, and refuses a negative or fractional line or row count", () => {
    const spacer: CodeSpacer = new CodeSpacer(3, 0);

    expect([spacer.beforeLine, spacer.rowCount, spacer.background, spacer.sign, spacer.signColor]).toEqual([3, 0, null, null, null]);
    expect(() => new CodeSpacer(-1, 1)).toThrow(ArgumentOutOfRangeException);
    expect(() => new CodeSpacer(1.5, 1)).toThrow(ArgumentOutOfRangeException);
    expect(() => new CodeSpacer(0, -2)).toThrow(expect.objectContaining({ parameterName: "rowCount" }));
  });
});
