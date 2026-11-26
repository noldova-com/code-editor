/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component, computed, inject, input, type InputSignal, type Signal } from "@angular/core";
import { EditorRegistries, type ILanguageDefinition, type ILineTokenizer, TokenStyles } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

import { Resources } from "../../../resources.ts";
import { CodeTextLine } from "../../models/code-text-line.ts";
import type { CodeTextSpan } from "../../models/code-text-span.ts";
import { LanguageTokenizer } from "../../models/language-tokenizer.ts";
import { CodeEditorRegistries } from "../../services/code-editor-registries.ts";
import { TokenStyleSheet } from "../../services/token-style-sheet.ts";

@Component({
  selector: "noldova-code-text",
  templateUrl: "./code-text.component.html",
  styleUrl: "./code-text.component.css",
  host: {
    "class": Resources.codeTextClass
  }
})
export class CodeTextComponent {
  public readonly text: InputSignal<string> = input.required<string>();
  public readonly language: InputSignal<string | ILanguageDefinition | null> = input<string | ILanguageDefinition | null>(null);

  private readonly tokenizer: Signal<ILineTokenizer | null> = LanguageTokenizer.of(this.language);
  protected readonly lines: Signal<IReadOnlyList<CodeTextLine>> = computed(() => CodeTextLine.linesOf(this.text(), this.tokenizer()));
  private readonly app: EditorRegistries = inject(CodeEditorRegistries).registries;
  private readonly registries: EditorRegistries = new EditorRegistries(this.app);

  public constructor() {
    inject(TokenStyleSheet).apply(this.app.tokenTypes, Resources.textTokenClassPrefix);
  }

  protected classOf(span: CodeTextSpan): string {
    return Resources.formatClassList(TokenStyles.classesOf(this.registries.tokenTypes, span.type, span.modifiers, Resources.textTokenClassPrefix));
  }
}
