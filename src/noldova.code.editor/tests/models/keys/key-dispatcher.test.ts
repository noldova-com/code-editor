/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { type CommandContext, CoreConditions, KeyDispatchResult, KeyPress } from "@noldova/code.editor";

import { DispatchFixture } from "../../fixtures/dispatch.fixture.js";
import { Contexts } from "../../support/contexts.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class KeyDispatcherTests {
  @TestMethod
  public waitsAfterASequencesFirstChordIgnoringModifiersAndRunsTheCommandItCompletesOverTheSingleChordBinding(): void {
    const view: DispatchFixture = new DispatchFixture("windows");

    const first: KeyDispatchResult = view.dispatch("k", true);
    const label: string | null = view.dispatcher.pendingLabel(view.context.conditions);
    const modifier: KeyDispatchResult = view.dispatcher.dispatch(new KeyPress("Control", "ControlLeft", false, true, false, false), new List([view.context]));
    const second: KeyDispatchResult = view.dispatch("c", true);

    Expect.same([KeyDispatchResult.Pending, "Ctrl+K", KeyDispatchResult.Pending, KeyDispatchResult.Handled], [first, label, modifier, second]);
    Expect.same([1, 0, false, null], [view.comment.runs, view.single.runs, view.dispatcher.pending, view.dispatcher.pendingLabel(view.context.conditions)]);
  }

  @TestMethod
  public dropsThePendingSequenceAndUsesUpThePressWhenNoBindingCompletesItEscapeToo(): void {
    const view: DispatchFixture = new DispatchFixture("mac");

    view.dispatch("k", true);
    const label: string | null = view.dispatcher.pendingLabel(view.context.conditions);
    const plain: KeyDispatchResult = view.dispatch("x");
    view.dispatch("k", true);
    const escape: KeyDispatchResult = view.dispatch("Escape");
    view.dispatch("k", true);
    const declined: KeyDispatchResult = view.dispatch("x", true);

    Expect.same(["\u2303K", KeyDispatchResult.Cancelled, KeyDispatchResult.Cancelled, KeyDispatchResult.Cancelled], [label, plain, escape, declined]);
    Expect.same([0, 1, false], [view.comment.runs, view.declining.runs, view.dispatcher.pending]);
  }

  @TestMethod
  public dropsTheSequenceOnCancelAndSaysWhetherOneWasPending(): void {
    const view: DispatchFixture = new DispatchFixture("linux");

    view.dispatch("k", true);

    Expect.same([true, false, false], [view.dispatcher.cancel(), view.dispatcher.cancel(), view.dispatcher.pending]);
  }

  @TestMethod
  public triesEachContextInTurnSoAnInnerViewsPressReachesItsHostsSequences(): void {
    const host: DispatchFixture = new DispatchFixture("windows");
    const inner: CommandContext = Contexts.of(Contexts.core());
    inner.conditions.set(CoreConditions.platform, "windows");
    const contexts: List<CommandContext> = new List([inner, host.context]);

    const first: KeyDispatchResult = host.dispatcher.dispatch(DispatchFixture.press("k", true), contexts);
    const second: KeyDispatchResult = host.dispatcher.dispatch(DispatchFixture.press("c", true), contexts);
    const alone: KeyDispatchResult = host.dispatcher.dispatch(DispatchFixture.press("k", true), new List([inner]));

    Expect.same([KeyDispatchResult.Pending, KeyDispatchResult.Handled, KeyDispatchResult.None, 1], [first, second, alone, host.comment.runs]);
  }

  @TestMethod
  public runsSingleChordBindingsAndLeavesAPressNoBindingTakesToTheBrowser(): void {
    const view: DispatchFixture = new DispatchFixture("linux");

    Expect.same([KeyDispatchResult.Handled, KeyDispatchResult.None], [view.dispatch("F2"), view.dispatch("q")]);
    Assert.areEqual(1, view.single.runs);
  }
}
