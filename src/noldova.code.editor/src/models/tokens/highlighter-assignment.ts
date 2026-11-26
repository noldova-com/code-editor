/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class HighlighterAssignment {
  public readonly languageId: string;
  public readonly highlighterId: string;

  public constructor(languageId: string, highlighterId: string) {
    this.languageId = languageId;
    this.highlighterId = highlighterId;
  }
}
