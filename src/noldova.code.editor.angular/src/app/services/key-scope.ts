/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { inject, Injectable } from "@angular/core";
import { type CommandContext, KeyDispatcher, type KeyDispatchResult, type KeyPress } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

@Injectable()
export class KeyScope {
  private readonly parent: KeyScope | null = inject(KeyScope, { optional: true, skipSelf: true });
  private readonly dispatcher: KeyDispatcher = this.parent?.dispatcher ?? new KeyDispatcher();
  private readonly listeners: List<(label: string | null) => void> = new List<(label: string | null) => void>();
  private contextOf: ((time: number) => CommandContext) | null = null;

  public attach(contextOf: (time: number) => CommandContext): void {
    this.contextOf = contextOf;
  }

  public listen(listener: (label: string | null) => void): void {
    this.listeners.add(listener);
  }

  public dispatch(press: KeyPress, context: CommandContext): KeyDispatchResult {
    const contexts: List<CommandContext> = new List<CommandContext>([context]);
    this.parent?.collect(contexts, context.time);
    const pending: string | null = this.dispatcher.pendingLabel(context.conditions);
    const result: KeyDispatchResult = this.dispatcher.dispatch(press, contexts);
    const label: string | null = this.dispatcher.pendingLabel(context.conditions);
    if (label !== pending)
      this.report(label);

    return result;
  }

  public cancel(): void {
    if (this.dispatcher.cancel())
      this.report(null);
  }

  private collect(contexts: List<CommandContext>, time: number): void {
    if (!Object.isNull(this.contextOf))
      contexts.add(this.contextOf(time));
    this.parent?.collect(contexts, time);
  }

  private report(label: string | null): void {
    for (const listener of this.listeners)
      listener(label);
    this.parent?.report(label);
  }
}
