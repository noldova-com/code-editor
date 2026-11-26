/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { describe, expect, it } from "vitest";

import { CodeGutterMarker } from "../../../../src/app/models/decorations/code-gutter-marker.ts";

describe("CodeGutterMarker", () => {
  it("takes its line, and refuses a negative or fractional one", () => {
    const marker: CodeGutterMarker = new CodeGutterMarker(0, "!", "red");

    expect([marker.line, marker.text, marker.color]).toEqual([0, "!", "red"]);
    expect(() => new CodeGutterMarker(-1, "!", "red")).toThrow(expect.objectContaining({ parameterName: "line" }));
    expect(() => new CodeGutterMarker(1.5, "!", "red")).toThrow(ArgumentOutOfRangeException);
  });
});
