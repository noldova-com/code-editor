/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BuiltInTokenTypes, TokenModifierDefinition, TokenStyles, TokenTypeDefinition, TokenTypeRegistry } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class TokenStylesTests {
  private static readonly PREFIX: string = "nol-code-editor-token-";

  @TestMethod
  public givesATokenTheClassOfTheTypeItResolvesToAndOneForEachRegisteredModifier(): void {
    const registry = new TokenTypeRegistry();
    BuiltInTokenTypes.register(registry);

    Expect.same(["nol-code-editor-token-keyword-control", "nol-code-editor-token-modifier-deprecated"],
      TokenStyles.classesOf(registry, "keyword.control.flow", new List(["deprecated", "unknown"]), TokenStylesTests.PREFIX).toArray());
    Expect.same([], TokenStyles.classesOf(registry, "operator", new List<string>(), TokenStylesTests.PREFIX).toArray());
    Expect.same(["nol-code-editor-token-modifier-readonly"], TokenStyles.classesOf(registry, null, new List(["readonly"]), TokenStylesTests.PREFIX).toArray());
  }

  @TestMethod
  public writesARuleForEveryTypeWhoseColorFallsBackThroughItsParentsAndOneForEveryModifier(): void {
    const registry = new TokenTypeRegistry();
    BuiltInTokenTypes.register(registry);
    registry.registerType(new TokenTypeDefinition("keyword.control.flow"));
    registry.registerType(new TokenTypeDefinition("Tag Name", undefined, "meta"));
    registry.registerModifier(new TokenModifierDefinition("async"));
    const rules: readonly string[] = TokenStyles.styleSheet(registry, TokenStylesTests.PREFIX).split("\n");

    Assert.areEqual(BuiltInTokenTypes.types.count() + 2 + BuiltInTokenTypes.modifiers.count() + 1, rules.length);
    Assert.isTrue(rules.includes(".nol-code-editor-token-comment { color: var(--nol-code-comment, inherit); }"));
    Assert.isTrue(rules.includes(".nol-code-editor-token-keyword-control { color: var(--nol-code-control, var(--nol-code-keyword, inherit)); }"));
    Assert.isTrue(rules.includes(".nol-code-editor-token-string-regexp { color: var(--nol-code-regex, var(--nol-code-string, inherit)); }"));
    Assert.isTrue(rules.includes(".nol-code-editor-token-keyword-control-flow { color: var(--nol-code-keyword-control-flow, var(--nol-code-control, var(--nol-code-keyword, inherit))); }"));
    Assert.isTrue(rules.includes(".nol-code-editor-token-tag-name { color: var(--nol-code-tag-name, var(--nol-code-meta, inherit)); }"));
    Assert.isTrue(rules.includes(".nol-code-editor-token-modifier-async { font-style: var(--nol-code-modifier-async-font-style, inherit); "
      + "font-weight: var(--nol-code-modifier-async-font-weight, inherit); text-decoration: var(--nol-code-modifier-async-text-decoration, inherit); }"));
  }
}
