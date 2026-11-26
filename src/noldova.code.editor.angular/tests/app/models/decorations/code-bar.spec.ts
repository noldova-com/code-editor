/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { describe, expect, it } from "vitest";

import { CodeBar } from "../../../../src/app/models/decorations/code-bar.ts";
import type { CodeBarAction } from "../../../../src/app/models/decorations/code-bar-action.ts";

describe("CodeBar", () => {
  it("takes one row before its line, and refuses a negative or fractional line", () => {
    const bar: CodeBar = new CodeBar("one", 4, "Note", null, new List<CodeBarAction>());

    expect([bar.beforeLine, bar.rowCount, bar.background, bar.color]).toEqual([4, 1, null, null]);
    expect(() => new CodeBar("one", -1, "Note", null, new List<CodeBarAction>())).toThrow(expect.objectContaining({ parameterName: "beforeLine" }));
    expect(() => new CodeBar("one", 0.5, "Note", null, new List<CodeBarAction>())).toThrow(ArgumentOutOfRangeException);
  });
});
