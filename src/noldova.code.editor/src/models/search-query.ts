/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class SearchQuery {
  public readonly text: string;
  public readonly isRegex: boolean;
  public readonly isCaseSensitive: boolean;
  public readonly isWholeWord: boolean;

  public constructor(text: string, isRegex: boolean = false, isCaseSensitive: boolean = false, isWholeWord: boolean = false) {
    this.text = text;
    this.isRegex = isRegex;
    this.isCaseSensitive = isCaseSensitive;
    this.isWholeWord = isWholeWord;
  }
}
