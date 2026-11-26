/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { KeyDispatchResult } from "../../enums/key-dispatch-result.js";
import { Resources } from "../../resources.js";
import type { ConditionValues } from "../../services/conditions/condition-values.js";
import type { CommandContext } from "../commands/command-context.js";
import type { KeyChord } from "./key-chord.js";
import type { KeyPress } from "./key-press.js";

export class KeyDispatcher {
  private readonly pressed: List<KeyChord> = new List<KeyChord>();

  public get pending(): boolean {
    return this.pressed.count() > 0;
  }

  public pendingLabel(conditions: ConditionValues): string | null {
    const platform: string = String(conditions.get(Resources.platformCondition));

    return this.pending ? this.pressed.select(t => t.label(platform)).toArray().join(Resources.sequenceJoiner) : null;
  }

  public dispatch(press: KeyPress, contexts: IReadOnlyList<CommandContext>): KeyDispatchResult {
    if (this.pending && Resources.modifierKeys.contains(press.key))
      return KeyDispatchResult.Pending;
    const next: KeyChord | null = contexts.select(t => t.registries.keyBindings.continuing(this.pressed, press, t.conditions)).firstOrDefault(t => !Object.isNull(t)) ?? null;
    if (!Object.isNull(next)) {
      this.pressed.add(next);

      return KeyDispatchResult.Pending;
    }
    const wasPending: boolean = this.pending;
    const ran: boolean = contexts.any(t => t.registries.keyBindings.dispatchAfter(this.pressed, press, t));
    this.pressed.clear();
    if (ran)
      return KeyDispatchResult.Handled;

    return wasPending ? KeyDispatchResult.Cancelled : KeyDispatchResult.None;
  }

  public cancel(): boolean {
    const wasPending: boolean = this.pending;
    this.pressed.clear();

    return wasPending;
  }
}
