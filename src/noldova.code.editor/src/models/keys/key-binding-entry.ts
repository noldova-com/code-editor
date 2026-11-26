/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IReadOnlyList } from "@noldova/context.collections";

import type { IKeyBindingRule } from "../../interfaces/i-key-binding-rule.js";
import { Resources } from "../../resources.js";
import type { ConditionValues } from "../../services/conditions/condition-values.js";
import { Condition } from "../conditions/condition.js";
import type { KeyChord } from "./key-chord.js";
import type { KeyPress } from "./key-press.js";
import { KeySequence } from "./key-sequence.js";

export class KeyBindingEntry {
  public readonly rule: IKeyBindingRule;
  public readonly condition: Condition;
  public readonly removes: boolean;
  public readonly command: string;
  private readonly macSequence: KeySequence | null;
  private readonly otherSequence: KeySequence | null;

  public constructor(rule: IKeyBindingRule) {
    this.rule = rule;
    this.condition = KeyBindingEntry.conditionOf(rule.when);
    this.removes = rule.command.startsWith(Resources.removeCommandPrefix);
    this.command = this.removes ? rule.command.slice(Resources.removeCommandPrefix.length) : rule.command;
    this.macSequence = Object.isUndefined(rule.key) ? null : KeySequence.parse(rule.key, Resources.modifierMeta);
    this.otherSequence = Object.isUndefined(rule.key) ? null : KeySequence.parse(rule.key, Resources.modifierControl);
  }

  private static conditionOf(when: string | Condition | undefined): Condition {
    if (Object.isUndefined(when))
      return Condition.always;

    return Object.isString(when) ? Condition.parse(when) : when;
  }

  public sequenceIn(conditions: ConditionValues): KeySequence | null {
    return conditions.get(Resources.platformCondition) === Resources.platformMac ? this.macSequence : this.otherSequence;
  }

  public continuing(pressed: IReadOnlyList<KeyChord>, press: KeyPress, conditions: ConditionValues): KeyChord | null {
    const sequence: KeySequence | null = this.following(pressed, press, conditions);

    return Object.isNull(sequence) || sequence.chords.count() === pressed.count() + 1 ? null : sequence.chords.get(pressed.count());
  }

  public completes(pressed: IReadOnlyList<KeyChord>, press: KeyPress, conditions: ConditionValues): boolean {
    return this.following(pressed, press, conditions)?.chords.count() === pressed.count() + 1;
  }

  public removesEntry(entry: KeyBindingEntry, conditions: ConditionValues): boolean {
    if (!this.removes || entry.command !== this.command)
      return false;
    const mine: KeySequence | null = this.sequenceIn(conditions);
    const theirs: KeySequence | null = entry.sequenceIn(conditions);

    return Object.isNull(mine) || !Object.isNull(theirs) && mine.equals(theirs);
  }

  private following(pressed: IReadOnlyList<KeyChord>, press: KeyPress, conditions: ConditionValues): KeySequence | null {
    const sequence: KeySequence | null = this.sequenceIn(conditions);
    if (Object.isNull(sequence) || sequence.chords.count() <= pressed.count() || !this.condition.holds(conditions))
      return null;
    const follows: boolean = pressed.select((chord, index) => chord.equals(sequence.chords.get(index))).all(t => t);

    return follows && sequence.chords.get(pressed.count()).matches(press) ? sequence : null;
  }
}
