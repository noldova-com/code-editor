/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { TokenModifierDefinition } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class TokenModifierDefinitionTests {
  @TestMethod
  public keepsItsIdAndDescriptionWhenGiven(): void {
    const described: TokenModifierDefinition = new TokenModifierDefinition("async", "An asynchronous symbol.");
    const bare: TokenModifierDefinition = new TokenModifierDefinition("static");

    Expect.same(["async", "An asynchronous symbol.", "static", undefined], [described.id, described.description, bare.id, bare.description]);
  }
}
