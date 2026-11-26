/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

import type { ICommand } from "../interfaces/i-command.js";
import type { IKeyBindingRule } from "../interfaces/i-key-binding-rule.js";
import type { CommandContext } from "../models/commands/command-context.js";
import { KeyBindingEntry } from "../models/keys/key-binding-entry.js";
import { KeyBindingSource } from "../models/keys/key-binding-source.js";
import type { KeyChord } from "../models/keys/key-chord.js";
import type { KeyPress } from "../models/keys/key-press.js";
import type { KeySequence } from "../models/keys/key-sequence.js";
import { Registration } from "../models/registration.js";
import type { ConditionValues } from "./conditions/condition-values.js";

export class KeyBindingRegistry {
  private readonly parent: KeyBindingRegistry | null;
  private readonly sources: KeyBindingSource[] = [];
  private user: readonly KeyBindingEntry[] = [];

  public constructor(parent: KeyBindingRegistry | null = null) {
    this.parent = parent;
  }

  public addDefaults(source: string, rules: IReadOnlyList<IKeyBindingRule>): Disposable {
    const added: KeyBindingSource = new KeyBindingSource(source, rules.select(t => new KeyBindingEntry(t)).toArray());
    this.sources.push(added);

    return new Registration(() => this.sources.splice(this.sources.indexOf(added), 1));
  }

  public setUserRules(rules: IReadOnlyList<IKeyBindingRule>): void {
    this.user = rules.select(t => new KeyBindingEntry(t)).toArray();
  }

  public matches(press: KeyPress, conditions: ConditionValues): IReadOnlyList<IKeyBindingRule> {
    return this.completing(new List<KeyChord>(), press, conditions);
  }

  public completing(pressed: IReadOnlyList<KeyChord>, press: KeyPress, conditions: ConditionValues): IReadOnlyList<IKeyBindingRule> {
    return Enumerable.from(this.ranked(conditions)).where(t => t.completes(pressed, press, conditions)).select(t => t.rule).toList();
  }

  public continuing(pressed: IReadOnlyList<KeyChord>, press: KeyPress, conditions: ConditionValues): KeyChord | null {
    for (const entry of this.ranked(conditions)) {
      const chord: KeyChord | null = entry.continuing(pressed, press, conditions);
      if (!Object.isNull(chord))
        return chord;
    }

    return null;
  }

  public dispatch(press: KeyPress, context: CommandContext): boolean {
    return this.dispatchAfter(new List<KeyChord>(), press, context);
  }

  public dispatchAfter(pressed: IReadOnlyList<KeyChord>, press: KeyPress, context: CommandContext): boolean {
    for (const rule of this.completing(pressed, press, context.conditions)) {
      const command: ICommand | null = context.registries.commands.find(rule.command);
      if (!Object.isNull(command) && command.run(context, rule.args ?? null))
        return true;
    }

    return false;
  }

  public keyOf(command: string, conditions: ConditionValues): string | null {
    for (const entry of this.ranked(conditions)) {
      const sequence: KeySequence | null = entry.sequenceIn(conditions);
      if (entry.command === command && !Object.isNull(sequence) && entry.condition.holds(conditions))
        return sequence.text;
    }

    return null;
  }

  private ranked(conditions: ConditionValues): readonly KeyBindingEntry[] {
    const user: readonly KeyBindingEntry[] = this.userEntries();
    const removals: readonly KeyBindingEntry[] = user.filter(t => t.removes);

    return [
      ...user.filter(t => !t.removes),
      ...this.defaultEntries().filter(t => !removals.some(r => r.removesEntry(t, conditions)))
    ];
  }

  private userEntries(): readonly KeyBindingEntry[] {
    return [...this.user.toReversed(), ...this.parent?.userEntries() ?? []];
  }

  private defaultEntries(): readonly KeyBindingEntry[] {
    return [...this.sources.toReversed().flatMap(t => t.entries.toReversed()), ...this.parent?.defaultEntries() ?? []];
  }
}
