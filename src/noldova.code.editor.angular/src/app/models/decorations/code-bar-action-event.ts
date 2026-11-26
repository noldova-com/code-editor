/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CodeBar } from "./code-bar.ts";
import type { CodeBarAction } from "./code-bar-action.ts";

export class CodeBarActionEvent {
  public readonly bar: CodeBar;
  public readonly action: CodeBarAction;

  public constructor(bar: CodeBar, action: CodeBarAction) {
    this.bar = bar;
    this.action = action;
  }
}
