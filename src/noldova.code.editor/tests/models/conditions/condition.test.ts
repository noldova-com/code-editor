/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Condition, ConditionKey, ConditionRegistry, ConditionSyntaxException, ConditionValues } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

const FOCUS: ConditionKey<boolean> = new ConditionKey<boolean>("editorFocus", false, "Focus.");
const LANGUAGE: ConditionKey<string> = new ConditionKey<string>("language", "", "Language.");
const COUNT: ConditionKey<number> = new ConditionKey<number>("count", 0, "Count.");

@TestClass
export class ConditionTests {
  @TestMethod
  public readsNamesNotAndOrParenthesesAndComparisonsWithAndBindingTighterThanOr(): void {
    const values = ConditionTests.values();

    Expect.same([true, false, true, false, true, true, false, true, true, true, false, true], [
      "editorFocus", "!editorFocus", "editorFocus && !readOnly", "readOnly || !editorFocus", "readOnly && editorFocus || editorFocus",
      "readOnly && (editorFocus || editorFocus) || !readOnly", "!(editorFocus && !readOnly)", "language == python",
      "language != 'typescript'", "count == 2", "count == 3 && unknownName == false", "'' == '' && !unknownName && !''"
    ].map(t => Condition.parse(t).holds(values)));
  }

  @TestMethod
  public treatsEmptyTextAsAlwaysAndZeroNotANumberEmptyTextAndFalseAsNotHolding(): void {
    const values = ConditionTests.values();

    Expect.same([true, true, false, false, false, false, true, true], [Condition.always.holds(values), Condition.parse("   ").holds(values),
      Condition.parse("zero").holds(values), Condition.parse("notANumber").holds(values), Condition.parse("blank").holds(values), Condition.parse("unknownName").holds(values),
      Condition.parse("count").holds(values), Condition.parse("true && 1.5 && -2").holds(values)]);
    Assert.areEqual("editorFocus", Condition.parse("editorFocus").text);
  }

  @TestMethod
  public buildsConditionsFromTypedKeysThatHoldAsTheirTextDoes(): void {
    const values = ConditionTests.values();
    const built: readonly Condition[] = [Condition.has(FOCUS), Condition.equals(COUNT, 2), Condition.notEquals(LANGUAGE, "python"), Condition.equals(FOCUS, false)];

    Expect.same(["editorFocus", "count == 2", "language != 'python'", "editorFocus == false"], built.map(t => t.text));
    Expect.same([true, true, false, false], built.map(t => t.holds(values)));
    Expect.same(built.map(t => t.holds(values)), built.map(t => Condition.parse(t.text).holds(values)));
  }

  @TestMethod
  public readsADefaultFromTheDeclaredKeyAndAnOverrideFromAParentSet(): void {
    const registry = new ConditionRegistry();
    const visible = new ConditionKey<boolean>("findVisible", true, "The find panel is open.");
    registry.register(visible);
    const parent = new ConditionValues(registry);
    const child = new ConditionValues(registry, parent);

    Assert.areEqual(true, child.get("findVisible"));
    parent.set(visible, false);
    Assert.areEqual(false, child.get("findVisible"));
    child.set(visible, true);
    Assert.areEqual(true, child.get("findVisible"));
    Expect.same(["findVisible"], new ConditionRegistry(registry).names().toArray());
  }

  @TestMethod
  public refusesTextItCantReadAtTheOffsetWhereReadingStopped(): void {
    Expect.same([["a &", 2], ["a | b", 2], ["a = b", 2], ["'open", 0], ["(a", 2], ["a b", 2], ["&&", 0], ["a &&", 4], ["a == !", 5], ["!", 1]],
      ["a &", "a | b", "a = b", "'open", "(a", "a b", "&&", "a &&", "a == !", "!"].map(t => {
        const error: ConditionSyntaxException = Assert.throws(() => Condition.parse(t), ConditionSyntaxException);

        return [error.text, error.offset];
      }));
  }

  private static values(): ConditionValues {
    const registry = new ConditionRegistry();
    const values = new ConditionValues(registry);
    values.set(FOCUS, true);
    values.set(new ConditionKey<boolean>("readOnly", false, "Read-only."), false);
    values.set(LANGUAGE, "python");
    values.set(COUNT, 2);
    values.set(new ConditionKey<number>("zero", 1, "Zero."), 0);
    values.set(new ConditionKey<number>("notANumber", 1, "Not a number."), Number.NaN);
    values.set(new ConditionKey<string>("blank", "x", "Blank."), "");

    return values;
  }
}
