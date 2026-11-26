/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { Condition, KeyBindingRule } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class KeyBindingRuleTests {
  @TestMethod
  public keepsItsFieldsAndLeavesOutTheOnesNotGiven(): void {
    const when: Condition = Condition.parse("editorTabIndents");
    const full: KeyBindingRule = new KeyBindingRule("editor.indent", "tab", when, 2);
    const bare: KeyBindingRule = new KeyBindingRule("-editor.redo");

    Expect.same(["editor.indent", "tab", when, 2], [full.command, full.key, full.when, full.args]);
    Expect.same(["-editor.redo", undefined, undefined, undefined], [bare.command, bare.key, bare.when, bare.args]);
  }
}
