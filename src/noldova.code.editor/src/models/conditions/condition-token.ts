/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ConditionToken {
  public readonly text: string;
  public readonly offset: number;
  public readonly quoted: boolean;

  public constructor(text: string, offset: number, quoted: boolean) {
    this.text = text;
    this.offset = offset;
    this.quoted = quoted;
  }
}
