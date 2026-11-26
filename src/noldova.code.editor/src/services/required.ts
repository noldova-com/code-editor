/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { IndexOutOfRangeException } from "@noldova/context.exceptions";

import { ValueMissingException } from "../exceptions/value-missing.exception.js";
import { Resources } from "../resources.js";

export class Required {
  public static at<T>(values: readonly T[], index: number): T {
    const value: T | undefined = values[index];
    if (Object.isUndefined(value))
      throw new IndexOutOfRangeException(Resources.formatIndexOutOfRange(index, values.length));

    return value;
  }

  public static value<T>(value: T | null | undefined): T {
    if (Object.isNull(value) || Object.isUndefined(value))
      throw new ValueMissingException();

    return value;
  }
}
