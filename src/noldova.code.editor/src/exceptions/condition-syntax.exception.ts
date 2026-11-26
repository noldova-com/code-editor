/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class ConditionSyntaxException extends Exception {
  public override readonly name: string = Resources.conditionSyntaxExceptionName;

  public readonly text: string;
  public readonly offset: number;

  public constructor(text: string, offset: number) {
    super(Resources.formatConditionSyntax(text, offset));

    this.text = text;
    this.offset = offset;
  }
}
