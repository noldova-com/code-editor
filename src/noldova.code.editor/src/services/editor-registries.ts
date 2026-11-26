/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEditorContribution } from "../interfaces/i-editor-contribution.js";
import { BackgroundJobRegistry } from "./background/background-job-registry.js";
import { CommandRegistry } from "./commands/command-registry.js";
import { ConditionRegistry } from "./conditions/condition-registry.js";
import { DiffAlgorithmRegistry } from "./diff-algorithm-registry.js";
import { HighlighterRegistry } from "./tokens/highlighter-registry.js";
import { KeyBindingRegistry } from "./key-binding-registry.js";
import { LanguageRegistry } from "./language-registry.js";
import { PhraseRegistry } from "./phrase-registry.js";
import { SettingRegistry } from "./setting-registry.js";
import { TokenTypeRegistry } from "./tokens/token-type-registry.js";

export class EditorRegistries {
  public readonly parent: EditorRegistries | null;
  public readonly commands: CommandRegistry;
  public readonly keyBindings: KeyBindingRegistry;
  public readonly conditions: ConditionRegistry;
  public readonly settings: SettingRegistry;
  public readonly phrases: PhraseRegistry;
  public readonly languages: LanguageRegistry;
  public readonly highlighters: HighlighterRegistry;
  public readonly tokenTypes: TokenTypeRegistry;
  public readonly diffAlgorithms: DiffAlgorithmRegistry;
  public readonly backgroundJobs: BackgroundJobRegistry;
  private readonly added: Set<string> = new Set<string>();

  public constructor(parent: EditorRegistries | null = null) {
    this.parent = parent;
    this.commands = new CommandRegistry(parent?.commands ?? null);
    this.keyBindings = new KeyBindingRegistry(parent?.keyBindings ?? null);
    this.conditions = new ConditionRegistry(parent?.conditions ?? null);
    this.settings = new SettingRegistry(parent?.settings ?? null);
    this.phrases = new PhraseRegistry(parent?.phrases ?? null);
    this.languages = new LanguageRegistry(parent?.languages ?? null);
    this.highlighters = new HighlighterRegistry(this, parent?.highlighters ?? null);
    this.tokenTypes = new TokenTypeRegistry(parent?.tokenTypes ?? null);
    this.diffAlgorithms = new DiffAlgorithmRegistry(parent?.diffAlgorithms ?? null);
    this.backgroundJobs = new BackgroundJobRegistry(parent?.backgroundJobs ?? null);
  }

  public add(...contributions: readonly IEditorContribution[]): void {
    for (const contribution of contributions) {
      if (this.has(contribution.id))
        continue;
      this.added.add(contribution.id);
      contribution.contribute(this);
    }
  }

  public has(id: string): boolean {
    return this.added.has(id) || (this.parent?.has(id) ?? false);
  }
}
