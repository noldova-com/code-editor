/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, type ExceptionOptions } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class SearchPatternException extends Exception {
  public override readonly name: string = Resources.searchPatternExceptionName;

  public readonly pattern: string;

  public constructor(pattern: string, reason: string, options?: ExceptionOptions) {
    super(Resources.formatSearchPattern(pattern, reason), options);

    this.pattern = pattern;
  }
}
