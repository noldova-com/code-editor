/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Setting } from "@noldova/code.editor";

import { Resources } from "../resources.js";

export class TextMateSettings {
  public static readonly lineLengthLimit: Setting<number> = Setting.integer(Resources.lineLengthLimitSetting, Resources.lineLengthLimit,
    Resources.lineLengthLimitDescription, Resources.lineLengthLimitMinimum);
}
