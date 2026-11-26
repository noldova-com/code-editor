/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class TextMateGrammarMissingException extends Exception {
  public override readonly name: string = Resources.grammarMissingExceptionName;
  public readonly languageId: string;

  public constructor(languageId: string) {
    super(Resources.formatGrammarMissing(languageId));
    this.languageId = languageId;
  }
}
