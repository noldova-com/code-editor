/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

import { type CommandContext, CoreConditions, type EditorRegistries, KeyBindingRule, KeyDispatcher, type KeyDispatchResult, KeyPress } from "@noldova/code.editor";

import { Contexts } from "../support/contexts.js";
import { AnswerCommand } from "./answer-command.fixture.js";

export class DispatchFixture {
  public readonly registries: EditorRegistries = Contexts.core();
  public readonly context: CommandContext;
  public readonly dispatcher: KeyDispatcher = new KeyDispatcher();
  public readonly comment: AnswerCommand = new AnswerCommand("test.comment", true);
  public readonly single: AnswerCommand = new AnswerCommand("test.single", true);
  public readonly declining: AnswerCommand = new AnswerCommand("test.declining", false);

  public constructor(platform: string) {
    for (const command of [this.comment, this.single, this.declining])
      this.registries.commands.register(command);
    this.registries.keyBindings.addDefaults("test", new List([new KeyBindingRule("test.single", "ctrl+k"), new KeyBindingRule("test.comment", "ctrl+k ctrl+c"),
      new KeyBindingRule("test.declining", "ctrl+k ctrl+x"), new KeyBindingRule("test.other", "ctrl+j ctrl+c"), new KeyBindingRule("test.single", "f2")]));
    this.context = Contexts.of(this.registries);
    this.context.conditions.set(CoreConditions.platform, platform);
  }

  public static press(key: string, control: boolean = false): KeyPress {
    return new KeyPress(key, key.length === 1 ? `Key${key.toUpperCase()}` : key, false, control, false, false);
  }

  public dispatch(key: string, control: boolean = false): KeyDispatchResult {
    return this.dispatcher.dispatch(DispatchFixture.press(key, control), new List([this.context]));
  }
}
