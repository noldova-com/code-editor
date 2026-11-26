/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class ValueMissingException extends Exception {
  public override readonly name: string = Resources.valueMissingExceptionName;

  public constructor() {
    super(Resources.valueMissing);
  }
}
