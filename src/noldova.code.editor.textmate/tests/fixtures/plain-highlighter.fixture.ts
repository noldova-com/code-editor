/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IHighlighter, ILanguageDefinition, ILineTokenizer } from "@noldova/code.editor";

import { PlainTokenizer } from "./plain-tokenizer.fixture.js";

export class PlainHighlighter implements IHighlighter {
  public readonly id: string = "plain";

  public supports(language: ILanguageDefinition): boolean {
    return language.id === "typescript";
  }

  public createAsync(): Promise<ILineTokenizer> {
    return Promise.resolve(new PlainTokenizer());
  }
}
