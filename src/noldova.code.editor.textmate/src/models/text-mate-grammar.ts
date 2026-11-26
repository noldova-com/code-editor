/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { LanguageInput } from "@shikijs/primitive/types";

export class TextMateGrammar {
  public readonly name: string;
  public readonly load: LanguageInput;

  public constructor(name: string, load: LanguageInput) {
    this.name = name;
    this.load = load;
  }
}
