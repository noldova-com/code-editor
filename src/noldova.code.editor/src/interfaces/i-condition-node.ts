/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConditionValue } from "../models/conditions/condition-value.js";
import type { ConditionValues } from "../services/conditions/condition-values.js";

export interface IConditionNode {
  valueIn(values: ConditionValues): ConditionValue;
}
