/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEnvironmentInjector, EnvironmentInjector } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { CommandContext, ConditionValues, CoreConditions, CoreContribution, EditorFeatureSet, EditorRegistries, type IKeyBindingRule, KeyBindingRule, type KeyDispatchResult,
  KeyPress } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

import { KeyScope } from "../../src/app/services/key-scope.ts";
import { CountCommand } from "./count-command.fixture.ts";

export class ScopeFixture {
  public readonly command: CountCommand = new CountCommand();
  public readonly outer: KeyScope;
  public readonly middle: KeyScope;
  public readonly inner: KeyScope;
  public readonly heard: string[] = [];
  public readonly innerContext: CommandContext = ScopeFixture.contextOf(ScopeFixture.registries());

  public constructor() {
    const outer: EnvironmentInjector = createEnvironmentInjector([KeyScope], TestBed.inject(EnvironmentInjector));
    const middle: EnvironmentInjector = createEnvironmentInjector([KeyScope], outer);
    const inner: EnvironmentInjector = createEnvironmentInjector([KeyScope], middle);
    this.outer = outer.get(KeyScope);
    this.middle = middle.get(KeyScope);
    this.inner = inner.get(KeyScope);
    const hosting: EditorRegistries = ScopeFixture.registries();
    hosting.commands.register(this.command);
    hosting.keyBindings.addDefaults("test", new List<IKeyBindingRule>([new KeyBindingRule(this.command.id, "ctrl+k ctrl+c")]));
    const hostContext: CommandContext = ScopeFixture.contextOf(hosting);
    this.middle.attach(() => hostContext);
    this.outer.listen(t => this.heard.push(`outer:${t}`));
    this.middle.listen(t => this.heard.push(`middle:${t}`));
    this.inner.listen(t => this.heard.push(`inner:${t}`));
  }

  public press(key: string): KeyDispatchResult {
    return this.inner.dispatch(new KeyPress(key, `Key${key.toUpperCase()}`, false, true, false, false), this.innerContext);
  }

  private static registries(): EditorRegistries {
    const registries: EditorRegistries = new EditorRegistries();
    registries.add(new CoreContribution());

    return registries;
  }

  private static contextOf(registries: EditorRegistries): CommandContext {
    const conditions: ConditionValues = new ConditionValues(registries.conditions);
    conditions.set(CoreConditions.platform, "windows");

    return new CommandContext(registries, conditions, new EditorFeatureSet(), null, 0, 0);
  }
}
