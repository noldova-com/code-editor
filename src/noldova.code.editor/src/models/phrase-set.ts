/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PhraseText } from "./phrase-text.js";

export class PhraseSet {
  public readonly locale: string;
  public readonly phrases: ReadonlyMap<string, PhraseText>;

  public constructor(locale: string, phrases: ReadonlyMap<string, PhraseText>) {
    this.locale = locale;
    this.phrases = phrases;
  }
}
