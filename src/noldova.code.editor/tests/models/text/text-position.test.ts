/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TextPosition } from "@noldova/code.editor";

@TestClass
export class TextPositionTests {
  @TestMethod
  public ordersPositionsByLineThenColumn(): void {
    Assert.isTrue(new TextPosition(1, 0).compareTo(new TextPosition(0, 9)) > 0);
    Assert.isTrue(new TextPosition(1, 2).compareTo(new TextPosition(1, 3)) < 0);
    Assert.areEqual(0, new TextPosition(1, 3).compareTo(new TextPosition(1, 3)));
  }

  @TestMethod
  public equalsAPositionWithTheSameLineAndColumnOnly(): void {
    Assert.isTrue(new TextPosition(2, 4).equals(new TextPosition(2, 4)));
    Assert.isTrue(!new TextPosition(2, 4).equals(new TextPosition(2, 5)));
    Assert.isTrue(!new TextPosition(2, 4).equals(new TextPosition(3, 4)));
  }

  @TestMethod
  public refusesANegativeOrFractionalLineOrColumn(): void {
    for (const make of [() => new TextPosition(-1, 0), () => new TextPosition(0, -1), () => new TextPosition(0.5, 0), () => new TextPosition(0, Number.NaN)])
      Assert.throws(make, ArgumentOutOfRangeException);
  }
}
