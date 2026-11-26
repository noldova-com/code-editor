/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { KeyChord, KeySequence, KeySyntaxException } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

const TOO_LONG: string = "ctrl+k ctrl+c ctrl+d";

@TestClass
export class KeySequenceTests {
  @TestMethod
  public readsOneOrTwoChordsSeparatedBySpacesAndRefusesAThirdOrNoKey(): void {
    const two: KeySequence = KeySequence.parse("ctrl+k  ctrl+c", "ctrl");

    Expect.same([2, "ctrl+k  ctrl+c", "ctrl+k"], [two.chords.count(), two.text, two.first.text]);
    Assert.areEqual(1, KeySequence.parse("f4", "ctrl").chords.count());
    Expect.throwsWhere(() => KeySequence.parse(TOO_LONG, "ctrl"), ArgumentException, t => t.parameterName === "key" && t.message.includes(TOO_LONG));
    Expect.throwsWhere(() => KeySequence.parse("", "ctrl"), KeySyntaxException, t => t.text === "");
    Expect.throwsWhere(() => KeySequence.parse("ctrl+k hyper+c", "ctrl"), KeySyntaxException, t => t.text === "hyper+c");
  }

  @TestMethod
  public matchesAnotherSequenceChordByChordInOrder(): void {
    const sequence: KeySequence = KeySequence.parse("ctrl+k ctrl+c", "ctrl");

    Expect.same([true, false, false], [
      sequence.equals(KeySequence.parse("control+k control+c", "ctrl")),
      sequence.equals(KeySequence.parse("ctrl+k", "ctrl")),
      sequence.equals(KeySequence.parse("ctrl+k ctrl+d", "ctrl"))
    ]);
  }

  @TestMethod
  public labelsEachChordAsThePlatformShowsIt(): void {
    Expect.same([
      "\u2303\u2325\u21e7\u2318F4", "\u21e7\u2318K \u2318C", "\u2303Space",
      "Ctrl+Shift+Alt+Win+ArrowLeft", "Ctrl+Shift+Alt+Super+ArrowLeft", "Ctrl+K Ctrl+C", "K"
    ], [
      KeyChord.parse("ctrl+alt+shift+cmd+f4", "cmd").label("mac"),
      KeySequence.parse("mod+shift+k mod+c", "cmd").label("mac"),
      KeyChord.parse("ctrl+space", "cmd").label("mac"),
      KeyChord.parse("ctrl+alt+shift+cmd+left", "ctrl").label("windows"),
      KeyChord.parse("ctrl+alt+shift+cmd+left", "ctrl").label("linux"),
      KeySequence.parse("mod+k mod+c", "ctrl").label("windows"),
      KeyChord.parse("k", "ctrl").label("linux")
    ]);
  }
}
