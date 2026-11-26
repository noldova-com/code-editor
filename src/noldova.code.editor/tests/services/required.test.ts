/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IndexOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Required, ValueMissingException } from "@noldova/code.editor";

import { Expect } from "../support/expect.js";

@TestClass
export class RequiredTests {
  @TestMethod
  public givesTheItemAtAnIndex(): void {
    Assert.areEqual("b", Required.at(["a", "b"], 1));
  }

  @TestMethod
  public refusesAnIndexPastTheItemsNamingItAndTheCount(): void {
    Expect.throwsWhere(() => Required.at(["a"], 1), IndexOutOfRangeException, error => error.message === "Index 1 is outside the 1 items.");
  }

  @TestMethod
  public givesAValueThatIsThereAndRefusesOneThatIsNullOrMissing(): void {
    Assert.areEqual(0, Required.value(0));
    Assert.throws(() => Required.value<number>(null), ValueMissingException);
    Expect.throwsWhere(() => Required.value<number>(undefined), ValueMissingException, error => error.message === "A value is missing where one is required." && error.name === "ValueMissingException");
  }
}
