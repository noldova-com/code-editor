/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Condition } from "../models/conditions/condition.js";

export interface IKeyBindingRule {
  readonly command: string;
  readonly key?: string | undefined;
  readonly when?: string | Condition | undefined;
  readonly args?: unknown;
}
