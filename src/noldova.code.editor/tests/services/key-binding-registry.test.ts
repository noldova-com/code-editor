/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { Condition, ConditionValues, CoreCommands, CoreConditions, type EditorRegistries, type IKeyBindingRule, KeyBindingRegistry, KeyBindingRule, type KeyChord, KeyPress, KeySyntaxException, Required } from "@noldova/code.editor";

import { AnswerCommand } from "../fixtures/answer-command.fixture.js";
import { Contexts } from "../support/contexts.js";
import { Expect } from "../support/expect.js";

const NONE: string = "none";

const KEYS: readonly string[] = [
  "ArrowLeft", "Shift+ArrowLeft", "Control+ArrowLeft", "Alt+ArrowLeft", "Meta+ArrowLeft",
  "ArrowRight", "Control+ArrowRight", "Alt+ArrowRight", "Meta+ArrowRight",
  "ArrowUp", "Control+ArrowUp", "Meta+ArrowUp", "ArrowDown", "Control+ArrowDown", "Meta+ArrowDown",
  "PageUp", "Shift+PageDown", "Home", "Control+Home", "End", "Control+Shift+End",
  "Backspace", "Shift+Backspace", "Control+Backspace", "Alt+Backspace", "Delete", "Control+Delete", "Alt+Delete",
  "Enter", "Shift+Enter", "Tab", "Shift+Tab", "Escape",
  "Control+a", "Meta+a", "Control+z", "Control+Shift+Z", "Meta+z", "Meta+Shift+Z", "Control+y", "Control+q", "x"
];

@TestClass
export class KeyBindingRegistryTests {
  @TestMethod
  public bindsWindowsAndLinuxKeysWithControlForWordsTheDocumentAndShortcuts(): void {
    const expected: readonly string[] = [
      CoreCommands.cursorLeft.id, CoreCommands.cursorLeft.select.id, CoreCommands.cursorWordLeft.id, NONE, NONE,
      CoreCommands.cursorRight.id, CoreCommands.cursorWordRight.id, NONE, NONE,
      CoreCommands.cursorUp.id, CoreCommands.cursorTop.id, NONE, CoreCommands.cursorDown.id, CoreCommands.cursorBottom.id, NONE,
      CoreCommands.cursorPageUp.id, CoreCommands.cursorPageDown.select.id, CoreCommands.cursorHome.id, CoreCommands.cursorTop.id, CoreCommands.cursorEnd.id, CoreCommands.cursorBottom.select.id,
      CoreCommands.deleteLeft.id, CoreCommands.deleteLeft.id, CoreCommands.deleteWordLeft.id, NONE, CoreCommands.deleteRight.id, CoreCommands.deleteWordRight.id, NONE,
      CoreCommands.newLine.id, CoreCommands.newLine.id, CoreCommands.indent.id, CoreCommands.outdent.id, CoreCommands.cancelSelection.id,
      CoreCommands.selectAll.id, NONE, CoreCommands.undo.id, CoreCommands.redo.id, NONE, NONE, CoreCommands.redo.id, NONE, NONE
    ];
    Expect.same(expected, KeyBindingRegistryTests.commands("windows"));
    Expect.same(expected, KeyBindingRegistryTests.commands("linux"));
  }

  @TestMethod
  public bindsMacKeysWithOptionForWordsAndCommandForLinesAndTheDocumentAndLeavesControlHomeAndEndAlone(): void {
    Expect.same([
      CoreCommands.cursorLeft.id, CoreCommands.cursorLeft.select.id, NONE, CoreCommands.cursorWordLeft.id, CoreCommands.cursorHome.id,
      CoreCommands.cursorRight.id, NONE, CoreCommands.cursorWordRight.id, CoreCommands.cursorEnd.id,
      CoreCommands.cursorUp.id, NONE, CoreCommands.cursorTop.id, CoreCommands.cursorDown.id, NONE, CoreCommands.cursorBottom.id,
      CoreCommands.cursorPageUp.id, CoreCommands.cursorPageDown.select.id, CoreCommands.cursorHome.id, NONE, CoreCommands.cursorEnd.id, NONE,
      CoreCommands.deleteLeft.id, CoreCommands.deleteLeft.id, NONE, CoreCommands.deleteWordLeft.id, CoreCommands.deleteRight.id, NONE, CoreCommands.deleteWordRight.id,
      CoreCommands.newLine.id, CoreCommands.newLine.id, CoreCommands.indent.id, CoreCommands.outdent.id, CoreCommands.cancelSelection.id,
      CoreCommands.cursorLineStart.id, CoreCommands.selectAll.id, NONE, NONE, CoreCommands.undo.id, CoreCommands.redo.id, NONE, NONE, NONE
    ], KeyBindingRegistryTests.commands("mac"));
  }

  @TestMethod
  public bindsTheMacTextSystemsCommandAndControlKeysOnAMacOnly(): void {
    const keys: readonly string[] = ["Meta+Backspace", "Meta+Delete", "Control+a", "Control+e", "Control+k", "Control+f", "Control+b", "Control+n", "Control+p", "Control+d", "Control+h"];

    Expect.same([
      CoreCommands.deleteAllLeft.id, CoreCommands.deleteAllRight.id, CoreCommands.cursorLineStart.id, CoreCommands.cursorEnd.id, CoreCommands.deleteAllRight.id, CoreCommands.cursorRight.id, CoreCommands.cursorLeft.id, CoreCommands.cursorDown.id, CoreCommands.cursorUp.id, CoreCommands.deleteRight.id, CoreCommands.deleteLeft.id
    ], KeyBindingRegistryTests.commands("mac", keys));
    Expect.same([NONE, NONE, CoreCommands.selectAll.id, NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE], KeyBindingRegistryTests.commands("windows", keys));
    Expect.same([NONE, NONE, CoreCommands.selectAll.id, NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE], KeyBindingRegistryTests.commands("linux", keys));
  }

  @TestMethod
  public leavesTabToTheBrowserUnlessTheEditorTabIndents(): void {
    const registries = Contexts.core();
    const conditions = KeyBindingRegistryTests.on(registries, "linux");

    Expect.same([], registries.keyBindings.matches(KeyBindingRegistryTests.press("Tab"), conditions).toArray());
    conditions.set(CoreConditions.tabIndents, true);
    Expect.same([CoreCommands.indent.id], registries.keyBindings.matches(KeyBindingRegistryTests.press("Tab"), conditions).select(t => t.command).toArray());
  }

  @TestMethod
  public putsTheUsersBindingAheadOfTheDefaultForTheSameKey(): void {
    const registries = Contexts.core();
    const mine = new AnswerCommand("test.mine", true);
    registries.commands.register(mine);
    registries.keyBindings.setUserRules(new List([new KeyBindingRule("test.mine", "ctrl+a", undefined, 3)]));

    Expect.same(["test.mine", CoreCommands.selectAll.id], KeyBindingRegistryTests.ids(registries, "Control+a", "windows"));
    Assert.areEqual(true, registries.keyBindings.dispatch(KeyBindingRegistryTests.press("Control+a"), Contexts.of(registries)));
    Assert.areEqual(1, mine.runs);
    Assert.areEqual("ctrl+a", registries.keyBindings.keyOf("test.mine", KeyBindingRegistryTests.on(registries, "windows")));
    registries.keyBindings.setUserRules(new List<IKeyBindingRule>());
    Expect.same([CoreCommands.selectAll.id], KeyBindingRegistryTests.ids(registries, "Control+a", "windows"));
  }

  @TestMethod
  public removesADefaultForAUserMinusRuleOnEveryKeyOrOnlyOnTheKeyItNames(): void {
    const registries = Contexts.core();

    registries.keyBindings.setUserRules(new List([new KeyBindingRule(`-${CoreCommands.redo.id}`)]));
    Expect.same([], KeyBindingRegistryTests.ids(registries, "Control+y", "windows"));
    Expect.same([], KeyBindingRegistryTests.ids(registries, "Control+Shift+Z", "windows"));
    Assert.areEqual(null, registries.keyBindings.keyOf(CoreCommands.redo.id, KeyBindingRegistryTests.on(registries, "windows")));

    registries.keyBindings.setUserRules(new List([new KeyBindingRule(`-${CoreCommands.redo.id}`, "ctrl+y")]));
    Expect.same([], KeyBindingRegistryTests.ids(registries, "Control+y", "windows"));
    Expect.same([CoreCommands.redo.id], KeyBindingRegistryTests.ids(registries, "Control+Shift+Z", "windows"));

    registries.keyBindings.setUserRules(new List([new KeyBindingRule(`-${CoreCommands.undo.id}`, "cmd+z")]));
    Expect.same([], KeyBindingRegistryTests.ids(registries, "Meta+z", "mac"));
    Expect.same([CoreCommands.undo.id], KeyBindingRegistryTests.ids(registries, "Control+z", "windows"));

    registries.keyBindings.setUserRules(new List([new KeyBindingRule(`-${CoreCommands.undo.id}`, "ctrl+y")]));
    Expect.same([CoreCommands.redo.id], KeyBindingRegistryTests.ids(registries, "Control+y", "windows"));

    registries.keyBindings.addDefaults("test", new List([new KeyBindingRule("test.keyless"), new KeyBindingRule("test.keyed", "f4")]));
    registries.keyBindings.setUserRules(new List([new KeyBindingRule("-test.keyless", "f4")]));
    Expect.same(["test.keyed"], KeyBindingRegistryTests.ids(registries, "F4", "linux"));
    Assert.areEqual(null, registries.keyBindings.keyOf("test.keyless", KeyBindingRegistryTests.on(registries, "linux")));
  }

  @TestMethod
  public triesTheNextBindingWhenACommandDeclinesOrIsUnknownAndReportsWhetherOneRan(): void {
    const registries = Contexts.core();
    const declining = new AnswerCommand("test.declining", false);
    const taking = new AnswerCommand("test.taking", true);
    registries.commands.register(declining);
    registries.commands.register(taking);
    registries.keyBindings.addDefaults("test", new List([new KeyBindingRule("test.taking", "f2"), new KeyBindingRule("test.unknown", "f2"), new KeyBindingRule("test.declining", "f2")]));

    Assert.areEqual(true, registries.keyBindings.dispatch(KeyBindingRegistryTests.press("F2"), Contexts.of(registries)));
    Expect.same([1, 1], [declining.runs, taking.runs]);
    Assert.areEqual(false, registries.keyBindings.dispatch(KeyBindingRegistryTests.press("F3"), Contexts.of(registries)));
  }

  @TestMethod
  public ranksAChildsDefaultsAheadOfItsParentsAndDropsASourceOnceDisposed(): void {
    const registries = Contexts.core();
    const parent = registries.keyBindings;
    const child = new KeyBindingRegistry(parent);
    const added = child.addDefaults("test", new List([new KeyBindingRule("test.close", "escape")]));
    const conditions = KeyBindingRegistryTests.on(registries, "mac");

    Expect.same(["test.close", CoreCommands.cancelSelection.id], child.matches(KeyBindingRegistryTests.press("Escape"), conditions).select(t => t.command).toArray());
    added[Symbol.dispose]();
    Expect.same([CoreCommands.cancelSelection.id], child.matches(KeyBindingRegistryTests.press("Escape"), conditions).select(t => t.command).toArray());
  }

  @TestMethod
  public namesTheKeyBoundToACommandOnEachPlatformWhereItsConditionHolds(): void {
    const registries = Contexts.core();
    const mac = KeyBindingRegistryTests.on(registries, "mac");
    const linux = KeyBindingRegistryTests.on(registries, "linux");

    Assert.areEqual("mod+z", registries.keyBindings.keyOf(CoreCommands.undo.id, mac));
    Assert.areEqual("ctrl+left", registries.keyBindings.keyOf(CoreCommands.cursorWordLeft.id, linux));
    Assert.areEqual("alt+left", registries.keyBindings.keyOf(CoreCommands.cursorWordLeft.id, mac));
    Assert.areEqual(null, registries.keyBindings.keyOf(CoreCommands.indent.id, linux));
    linux.set(CoreConditions.tabIndents, true);
    Assert.areEqual("tab", registries.keyBindings.keyOf(CoreCommands.indent.id, linux));
    Assert.areEqual("cmd+up", registries.keyBindings.keyOf(CoreCommands.cursorTop.id, mac));
    Assert.areEqual(null, registries.keyBindings.keyOf("test.nothing", mac));
  }

  @TestMethod
  public takesThePlatformAHostSetsOverTheOneTheRuntimeGives(): void {
    const registries = Contexts.core();
    const conditions = KeyBindingRegistryTests.on(registries, "linux");
    const child = new ConditionValues(registries.conditions, conditions);

    Expect.same([CoreCommands.selectAll.id], registries.keyBindings.matches(KeyBindingRegistryTests.press("Control+a"), child).select(t => t.command).toArray());
    child.set(CoreConditions.platform, "mac");
    Expect.same([CoreCommands.cursorLineStart.id], registries.keyBindings.matches(KeyBindingRegistryTests.press("Control+a"), child).select(t => t.command).toArray());
    Expect.same([CoreCommands.selectAll.id], registries.keyBindings.matches(KeyBindingRegistryTests.press("Meta+a"), child).select(t => t.command).toArray());
  }

  @TestMethod
  public matchesLettersAndDigitsByTheirKeyAndByTheirPlaceOnlyWhenTheLayoutGivesNoPlainCharacter(): void {
    const registries = Contexts.core();
    registries.keyBindings.addDefaults("test", new List([new KeyBindingRule("test.letter", "alt+a"), new KeyBindingRule("test.digit", "alt+1"),
      new KeyBindingRule("test.bracket", "ctrl+shift+BracketLeft"), new KeyBindingRule("test.escape", "esc"), new KeyBindingRule("test.space", "ctrl+space")]));
    const conditions = KeyBindingRegistryTests.on(registries, "mac");
    const first = (press: KeyPress): string => registries.keyBindings.matches(press, conditions).firstOrDefault()?.command ?? NONE;

    Assert.areEqual("test.letter", first(new KeyPress("å", "KeyA", false, false, true, false)));
    Assert.areEqual("test.digit", first(new KeyPress("¡", "Digit1", false, false, true, false)));
    Assert.areEqual(NONE, first(new KeyPress("q", "KeyA", false, false, true, false)));
    Assert.areEqual("test.bracket", first(new KeyPress("{", "BracketLeft", true, true, false, false)));
    Assert.areEqual("test.escape", first(new KeyPress("Escape", "Escape", false, false, false, false)));
    Assert.areEqual("test.space", first(new KeyPress(" ", "Space", false, true, false, false)));
  }

  @TestMethod
  public goesOnWithASequenceWhoseConditionHoldsCompletesItAndNamesItWholeUnlessAUserRuleRemovesTheWholeSequence(): void {
    const registries = Contexts.core();
    registries.keyBindings.addDefaults("test", new List([new KeyBindingRule("test.comment", "ctrl+k ctrl+c"),
      new KeyBindingRule("test.uncomment", "ctrl+k ctrl+u", Condition.has(CoreConditions.tabIndents))]));
    const conditions = KeyBindingRegistryTests.on(registries, "linux");
    const none = new List<KeyChord>();

    const first: KeyChord = Required.value(registries.keyBindings.continuing(none, KeyBindingRegistryTests.press("Control+k"), conditions));
    const pressed = new List<KeyChord>([first]);
    Expect.same(["ctrl+k", "ctrl+k ctrl+c"], [first.text, registries.keyBindings.keyOf("test.comment", conditions)]);
    Expect.same(["test.comment"], registries.keyBindings.completing(pressed, KeyBindingRegistryTests.press("Control+c"), conditions).select(t => t.command).toArray());
    Expect.same([], registries.keyBindings.completing(pressed, KeyBindingRegistryTests.press("Control+u"), conditions).select(t => t.command).toArray());
    Expect.same([], registries.keyBindings.matches(KeyBindingRegistryTests.press("Control+k"), conditions).select(t => t.command).toArray());

    registries.keyBindings.setUserRules(new List([new KeyBindingRule("-test.comment", "ctrl+k")]));
    Assert.areEqual("ctrl+k ctrl+c", registries.keyBindings.keyOf("test.comment", conditions));
    registries.keyBindings.setUserRules(new List([new KeyBindingRule("-test.comment", "ctrl+k ctrl+c")]));
    Assert.areEqual(null, registries.keyBindings.continuing(none, KeyBindingRegistryTests.press("Control+k"), conditions));
    Assert.areEqual(null, registries.keyBindings.keyOf("test.comment", conditions));
  }

  @TestMethod
  public refusesAKeyWithAnUnknownModifierOrNoKey(): void {
    const keyBindings = new KeyBindingRegistry();

    Expect.throwsWhere(() => keyBindings.addDefaults("test", new List([new KeyBindingRule("test.a", "hyper+a")])), KeySyntaxException, t => t.text === "hyper+a");
    Expect.throwsWhere(() => keyBindings.setUserRules(new List([new KeyBindingRule("test.a", "ctrl+")])), KeySyntaxException, t => t.text === "ctrl+");
  }

  private static commands(platform: string, keys: readonly string[] = KEYS): readonly string[] {
    const registries: EditorRegistries = Contexts.core();
    const conditions: ConditionValues = KeyBindingRegistryTests.on(registries, platform);
    conditions.set(CoreConditions.tabIndents, true);

    return keys.map(t => registries.keyBindings.matches(KeyBindingRegistryTests.press(t), conditions).firstOrDefault()?.command ?? NONE);
  }

  private static ids(registries: EditorRegistries, text: string, platform: string): readonly string[] {
    return registries.keyBindings.matches(KeyBindingRegistryTests.press(text), KeyBindingRegistryTests.on(registries, platform)).select(t => t.command).toArray();
  }

  private static on(registries: EditorRegistries, platform: string): ConditionValues {
    const conditions: ConditionValues = new ConditionValues(registries.conditions);
    conditions.set(CoreConditions.platform, platform);

    return conditions;
  }

  private static press(text: string): KeyPress {
    const parts: readonly string[] = text.split("+");
    const key: string = parts.at(-1) ?? text;
    const code: string = key.length === 1 ? `Key${key.toUpperCase()}` : key;

    return new KeyPress(key, code, parts.includes("Shift"), parts.includes("Control"), parts.includes("Alt"), parts.includes("Meta"));
  }
}
