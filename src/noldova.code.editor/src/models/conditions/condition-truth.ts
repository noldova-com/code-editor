/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { ConditionValue } from "./condition-value.js";

export class ConditionTruth {
  public static of(value: ConditionValue): boolean {
    if (Object.isString(value))
      return !String.isNullOrEmpty(value);
    if (Object.isNumber(value))
      return value !== 0 && !Number.isNaN(value);

    return value;
  }
}
