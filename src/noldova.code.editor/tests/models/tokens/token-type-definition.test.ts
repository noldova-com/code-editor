/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { TokenTypeDefinition, TokenTypeRegistry } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class TokenTypeDefinitionTests {
  @TestMethod
  public fallsBackToItsParentAndLeavesOutTheFieldsNotGiven(): void {
    const registry: TokenTypeRegistry = new TokenTypeRegistry();
    registry.registerType(new TokenTypeDefinition("string"));
    registry.registerType(new TokenTypeDefinition("regex", "A regular expression.", "string"));

    Expect.same(["regex", "string"], registry.chainOf("regex").select(t => t.id).toArray());
    Expect.same(["A regular expression.", undefined, undefined], [registry.findType("regex")?.description, registry.findType("string")?.description,
      registry.findType("string")?.parent]);
  }
}
