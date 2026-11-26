/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditsOverlapException, TextRange } from "@noldova/code.editor";

@TestClass
export class EditsOverlapExceptionTests {
  @TestMethod
  public carriesBothRangesAndNamesWhereEachStarts(): void {
    const first = TextRange.of(0, 1, 0, 5);
    const second = TextRange.of(0, 3, 1, 0);
    const error = new EditsOverlapException(first, second);

    Assert.areEqual("EditsOverlapException", error.name);
    Assert.areEqual("edits", error.parameterName);
    Assert.isTrue(error.message.startsWith("The edit starting at 0:3 overlaps the edit starting at 0:1."));
    Assert.areEqual(first, error.first);
    Assert.areEqual(second, error.second);
    Assert.isTrue(error instanceof ArgumentException);
  }
}
