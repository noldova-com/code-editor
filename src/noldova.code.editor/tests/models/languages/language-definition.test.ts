/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { TestClass, TestMethod } from "@noldova/context.testing";

import { BlockComment, BracketPair, LanguageDefinition, LanguageRegistry } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class LanguageDefinitionTests {
  @TestMethod
  public isFoundByTheRegistryAndLeavesOutTheFieldsNotGiven(): void {
    const comment: BlockComment = new BlockComment("/*", "*/");
    const brackets: List<BracketPair> = new List([new BracketPair("{", "}")]);
    const full: LanguageDefinition = new LanguageDefinition("shellscript", new List(["sh"]), new List([".sh"]), new List([".bashrc"]), new List(["*.bash"]),
      "^#!.*\\bsh\\b", "#", comment, brackets, "-");
    const registry: LanguageRegistry = new LanguageRegistry();
    registry.register(full);

    Expect.same(["shellscript", "shellscript", "shellscript", "#", comment, brackets, "-"], [registry.named("sh")?.id, registry.forFile("a/.bashrc")?.id,
      registry.forFile("run", "#!/bin/sh")?.id, full.lineComment, full.blockComment, full.brackets, full.wordCharacters]);
    const bare: LanguageDefinition = new LanguageDefinition("plain");
    Expect.same([undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined], [bare.aliases, bare.extensions, bare.filenames,
      bare.filenamePatterns, bare.firstLine, bare.lineComment, bare.blockComment, bare.brackets, bare.wordCharacters]);
  }
}
