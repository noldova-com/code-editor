/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class KeySyntaxException extends Exception {
  public override readonly name: string = Resources.keySyntaxExceptionName;

  public readonly text: string;

  public constructor(text: string) {
    super(Resources.formatKeySyntax(text));

    this.text = text;
  }
}
