/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TextRange } from "@noldova/code.editor";

@TestClass
export class TextRangeTests {
  @TestMethod
  public isEmptyWhenItStartsWhereItEnds(): void {
    Assert.isTrue(TextRange.of(1, 2, 1, 2).isEmpty);
    Assert.isTrue(!TextRange.of(1, 2, 1, 3).isEmpty);
  }

  @TestMethod
  public equalsARangeWithTheSameStartAndEndOnly(): void {
    Assert.isTrue(TextRange.of(0, 1, 2, 3).equals(TextRange.of(0, 1, 2, 3)));
    Assert.isTrue(!TextRange.of(0, 1, 2, 3).equals(TextRange.of(0, 1, 2, 4)));
    Assert.isTrue(!TextRange.of(0, 1, 2, 3).equals(TextRange.of(0, 0, 2, 3)));
  }

  @TestMethod
  public refusesARangeThatEndsBeforeItStarts(): void {
    Assert.throws(() => TextRange.of(1, 0, 0, 5), ArgumentException);
  }
}
