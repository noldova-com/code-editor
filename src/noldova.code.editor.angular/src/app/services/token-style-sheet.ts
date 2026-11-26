/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DestroyRef, DOCUMENT, inject, Injectable } from "@angular/core";
import "@noldova/context.core";

import { TokenStyles, type TokenTypeRegistry } from "@noldova/code.editor";

import { Resources } from "../../resources.ts";

@Injectable({ providedIn: "root" })
export class TokenStyleSheet {
  private readonly document: Document = inject(DOCUMENT);
  private readonly sheets: Map<string, Map<TokenTypeRegistry, HTMLStyleElement>> = new Map();

  public constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const sheet of this.sheets.values())
        for (const style of sheet.values())
          style.remove();
      this.sheets.clear();
    });
  }

  public apply(registry: TokenTypeRegistry, prefix: string): void {
    const sheets: Map<TokenTypeRegistry, HTMLStyleElement> = this.sheets.get(prefix) ?? new Map();
    this.sheets.set(prefix, sheets);
    let style: HTMLStyleElement | undefined = sheets.get(registry);
    if (Object.isUndefined(style)) {
      style = this.document.createElement(Resources.styleElement);
      style.setAttribute(Resources.tokenStyleAttribute, prefix);
      this.document.head.append(style);
      sheets.set(registry, style);
    }
    const rules: string = TokenStyles.styleSheet(registry, prefix);
    if (style.textContent !== rules)
      style.textContent = rules;
  }
}
