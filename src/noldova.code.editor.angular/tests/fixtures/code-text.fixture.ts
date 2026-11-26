/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import type { ILineTokenizer } from "@noldova/code.editor";

import { CodeTextComponent } from "../../src/app/components/code-text/code-text.component.ts";
import { CodeEditorRegistries } from "../../src/app/services/code-editor-registries.ts";
import { FixedHighlighter } from "./fixed-highlighter.fixture.ts";

export class CodeTextFixture {
  public static render(text: string, tokenizer: ILineTokenizer | null): ComponentFixture<CodeTextComponent> {
    return CodeTextFixture.renderLanguage(text, Object.isNull(tokenizer) ? null
      : FixedHighlighter.register(TestBed.inject(CodeEditorRegistries).registries, () => Promise.resolve(tokenizer)).id);
  }

  public static renderLanguage(text: string, language: string | null): ComponentFixture<CodeTextComponent> {
    const fixture: ComponentFixture<CodeTextComponent> = TestBed.createComponent(CodeTextComponent);
    fixture.componentRef.setInput("text", text);
    fixture.componentRef.setInput("language", language);
    fixture.autoDetectChanges();

    return fixture;
  }

  public static runs(host: HTMLElement): readonly (readonly string[])[] {
    return [...host.querySelectorAll(".nol-code-text-line")].map(line => [...line.childNodes].filter(t => t.nodeType !== Node.COMMENT_NODE).map(t => t instanceof HTMLElement ? `${t.className}:${t.textContent}` : t.textContent ?? ""));
  }
}
