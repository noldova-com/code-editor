/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ILineTokenizer } from "@noldova/code.editor";

export class RenderOptions {
  public readonly tokenizer: ILineTokenizer | null;
  public readonly readOnly: boolean;
  public readonly tabIndents: boolean;

  public constructor(tokenizer: ILineTokenizer | null = null, readOnly: boolean = false, tabIndents: boolean = false) {
    this.tokenizer = tokenizer;
    this.readOnly = readOnly;
    this.tabIndents = tabIndents;
  }
}
