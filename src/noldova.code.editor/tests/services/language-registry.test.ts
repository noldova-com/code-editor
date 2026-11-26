/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditorRegistries, type ILanguageDefinition, LanguageDefinition, LanguageRegistry, RegistrationExistsException } from "@noldova/code.editor";

import { Expect } from "../support/expect.js";

@TestClass
export class LanguageRegistryTests {
  private static readonly LANGUAGES: readonly ILanguageDefinition[] = [
    new LanguageDefinition("typescript", new List(["ts", "TypeScript"]), new List([".ts"])),
    new LanguageDefinition("typescript-declarations", undefined, new List([".d.ts"])),
    new LanguageDefinition("dockerfile", undefined, undefined, new List(["Dockerfile"]), new List(["Dockerfile.*"])),
    new LanguageDefinition("shellscript", undefined, new List([".sh"]), new List([".bashrc"]), undefined, "^#!.*\\b(?:bash|sh)\\b"),
    new LanguageDefinition("javascript", undefined, new List([".js"]), undefined, undefined, "^#!.*\\bnode\\b"),
    new LanguageDefinition("gitconfig", undefined, undefined, undefined, new List(["**/.git/config"])),
    new LanguageDefinition("cmake", undefined, new List([".cmake"]), new List(["CMakeLists.txt"]))
  ];

  @TestMethod
  public findsALanguageByItsIdOrAnAliasTrimmedAndInAnyCaseAndNoneForAnUnknownName(): void {
    const registry = LanguageRegistryTests.registry();

    Expect.same(["typescript", "typescript", "typescript", null], [" TS ", "typescript", "TYPESCRIPT", "cobol"].map(t => registry.named(t)?.id ?? null));
    Assert.areEqual("dockerfile", registry.find("dockerfile")?.id);
    Assert.areEqual(null, registry.find("cobol"));
  }

  @TestMethod
  public findsAFilesLanguageByWholeNameThenPatternThenLongestExtensionThenFirstLineOnEitherKindOfSlash(): void {
    const registry = LanguageRegistryTests.registry();
    const paths: readonly string[] = ["src/a.ts", "C:\\work\\types\\b.D.TS", "Dockerfile", "build/Dockerfile.dev", "home/.bashrc", "repo/.git/config", "config",
      "CMakeLists.txt", "x.cmake", "notes.cobol", "README"];

    Expect.same(["typescript", "typescript-declarations", "dockerfile", "dockerfile", "shellscript", "gitconfig", null, "cmake", "cmake", null, null],
      paths.map(t => registry.forFile(t)?.id ?? null));
    Expect.same(["javascript", "shellscript", null, null], ["#!/usr/bin/env node", "#!/bin/bash", "plain text", null].map(t => registry.forFile("bin/run", t)?.id ?? null));
    Assert.areEqual("typescript", registry.forFile("a.ts", "#!/usr/bin/env node")?.id);
  }

  @TestMethod
  public refusesASecondLanguageWithAnIdTheSetHoldsAndTakesItBackOnceTheFirstIsDisposed(): void {
    const registry = new LanguageRegistry();
    const first = registry.register(new LanguageDefinition("toml", undefined, new List([".toml"])));

    Expect.throwsWhere(() => registry.register(new LanguageDefinition("toml")), RegistrationExistsException, t => t.id === "toml");
    first[Symbol.dispose]();
    registry.register(new LanguageDefinition("toml", undefined, new List([".tml"])));

    Assert.areEqual(null, registry.forFile("a.toml"));
    Assert.areEqual("toml", registry.forFile("a.tml")?.id);
    first[Symbol.dispose]();
    Assert.areEqual("toml", registry.find("toml")?.id);
  }

  @TestMethod
  public findsAParentSetsLanguagesFromAChildSetWhichKeepsItsOwnToItself(): void {
    const app = new EditorRegistries();
    app.languages.register(new LanguageDefinition("python", undefined, new List([".py"])));
    const editor = new EditorRegistries(app);
    editor.languages.register(new LanguageDefinition("toml", undefined, new List([".toml"])));

    Assert.areEqual("python", editor.languages.forFile("main.py")?.id);
    Assert.areEqual("toml", editor.languages.forFile("Cargo.toml")?.id);
    Assert.areEqual(null, app.languages.forFile("Cargo.toml"));
  }

  @TestMethod
  public putsAChildSetsLanguagesBeforeItsParentsAndLetsAChildShadowAParentsId(): void {
    const parent = new LanguageRegistry();
    parent.register(new LanguageDefinition("json", undefined, new List([".json"])));
    parent.register(new LanguageDefinition("yaml", undefined, new List([".yaml"])));
    const child = new LanguageRegistry(parent);
    child.register(new LanguageDefinition("json", undefined, new List([".jsonc"])));
    child.register(new LanguageDefinition("jsonc", undefined, undefined, new List(["tsconfig.json"])));

    Expect.same(["jsonc", "json", "yaml"], child.all().select(t => t.id).toArray());
    Assert.areEqual(".jsonc", child.find("json")?.extensions?.tryGet(0));
    Assert.areEqual(".json", parent.find("json")?.extensions?.tryGet(0));
    Assert.areEqual("jsonc", child.forFile("tsconfig.json")?.id);
    Assert.areEqual(null, child.forFile("package.json"));
    Assert.areEqual("json", parent.forFile("package.json")?.id);
    Assert.areEqual("yaml", child.named("YAML")?.id);
  }

  private static registry(): LanguageRegistry {
    const registry = new LanguageRegistry();
    for (const language of LanguageRegistryTests.LANGUAGES)
      registry.register(language);

    return registry;
  }
}
