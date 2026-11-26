/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BuiltInTokenTypes, CoreContribution, EditorRegistries, RegistrationExistsException, TokenModifierDefinition, TokenTypeDefinition, TokenTypeRegistry } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class TokenTypeRegistryTests {
  @TestMethod
  public resolvesATypeToItselfOrItsNearestRegisteredOneAlongItsDotsAndAnUnknownRootToNone(): void {
    const registry = new TokenTypeRegistry();
    BuiltInTokenTypes.register(registry);

    Expect.same(["keyword.control", "keyword.control", "keyword", "string.regexp", null, null],
      ["keyword.control", "keyword.control.flow.ts", "keyword.operator", "string.regexp.ts", "operator", ""].map(t => registry.resolve(t)));
  }

  @TestMethod
  public chainsATypeThroughItsGivenParentOrElseTheTypeBeforeItsLastDotStoppingAtARootOrACycle(): void {
    const registry = new TokenTypeRegistry();
    registry.registerType(new TokenTypeDefinition("name"));
    registry.registerType(new TokenTypeDefinition("name.parameter"));
    registry.registerType(new TokenTypeDefinition("parameter", undefined, "name.parameter"));
    registry.registerType(new TokenTypeDefinition("loop.a", undefined, "loop.b"));
    registry.registerType(new TokenTypeDefinition("loop.b", undefined, "loop.a"));

    Expect.same(["parameter", "name.parameter", "name"], registry.chainOf("parameter.readonly").select(t => t.id).toArray());
    Expect.same(["loop.a", "loop.b"], registry.chainOf("loop.a").select(t => t.id).toArray());
    Expect.same([], registry.chainOf("unknown").toArray());
  }

  @TestMethod
  public refusesATypeOrModifierTheSetHoldsAndRemovesEachOnceDisposed(): void {
    const registry = new TokenTypeRegistry();
    const type = registry.registerType(new TokenTypeDefinition("tag"));
    const modifier = registry.registerModifier(new TokenModifierDefinition("async"));

    Expect.throwsWhere(() => registry.registerType(new TokenTypeDefinition("tag")), RegistrationExistsException, t => t.id === "tag");
    Expect.throwsWhere(() => registry.registerModifier(new TokenModifierDefinition("async")), RegistrationExistsException, t => t.id === "async");
    type[Symbol.dispose]();
    modifier[Symbol.dispose]();

    Assert.areEqual(null, registry.findType("tag"));
    Assert.areEqual(null, registry.findModifier("async"));
  }

  @TestMethod
  public listsTheParentsTypesAndModifiersAChildDoesntShadowThenTheChildsOwn(): void {
    const parent = new TokenTypeRegistry();
    BuiltInTokenTypes.register(parent);
    const child = new TokenTypeRegistry(parent);
    child.registerType(new TokenTypeDefinition("keyword", "The child's own."));
    child.registerType(new TokenTypeDefinition("tag", undefined, "meta"));
    child.registerModifier(new TokenModifierDefinition("async"));

    Expect.same(["comment", "keyword.control"], child.types().take(2).select(t => t.id).toArray());
    Expect.same(["keyword", "tag"], child.types().takeLast(2).select(t => t.id).toArray());
    Assert.areEqual(BuiltInTokenTypes.types.count() + 1, child.types().count());
    Expect.same(["deprecated", "readonly", "static", "async"], child.modifiers().select(t => t.id).toArray());
    Assert.areEqual("The child's own.", child.findType("keyword")?.description);
    Expect.same(["tag", "meta"], child.chainOf("tag").select(t => t.id).toArray());
    Assert.areEqual(null, parent.resolve("tag"));
    Assert.areEqual("deprecated", child.findModifier("deprecated")?.id);
  }

  @TestMethod
  public givesASetTheBuiltInTypesThroughTheCoreContributionAndAChildSetItsParentsTypes(): void {
    const app = new EditorRegistries();
    app.add(new CoreContribution());
    const editor = new EditorRegistries(app);
    editor.tokenTypes.registerType(new TokenTypeDefinition("keyword.declaration"));

    Expect.same(BuiltInTokenTypes.types.select(t => t.id).toArray(), app.tokenTypes.types().select(t => t.id).toArray());
    Expect.same(BuiltInTokenTypes.modifiers.select(t => t.id).toArray(), editor.tokenTypes.modifiers().select(t => t.id).toArray());
    Expect.same(["keyword.declaration", "keyword"], editor.tokenTypes.chainOf("keyword.declaration.const").select(t => t.id).toArray());
    Assert.areEqual("keyword", app.tokenTypes.resolve("keyword.declaration"));
    Assert.areEqual(0, new EditorRegistries().tokenTypes.types().count());
  }
}
