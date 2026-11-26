/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Setting } from "../models/setting.js";
import { Resources } from "../resources.js";

export class CoreSettings {
  public static readonly indentSize: Setting<number> = Setting.integer(Resources.indentSizeSetting, Resources.defaultIndentSize, Resources.indentSizeDescription, Resources.minimumIndentSize, Resources.maximumIndentSize);
  public static readonly insertSpaces: Setting<boolean> = Setting.boolean(Resources.insertSpacesSetting, Resources.defaultInsertSpaces, Resources.insertSpacesDescription);
  public static readonly undoGroupMilliseconds: Setting<number> = Setting.integer(Resources.undoGroupMillisecondsSetting, Resources.undoGroupMilliseconds, Resources.undoGroupDescription, Resources.minimumUndoGroupMilliseconds);
  public static readonly undoLimit: Setting<number> = Setting.integer(Resources.undoLimitSetting, Resources.undoLimit, Resources.undoLimitDescription, Resources.minimumUndoLimit);

  public static readonly all: IReadOnlyList<Setting<unknown>> = new List<Setting<unknown>>([CoreSettings.indentSize, CoreSettings.insertSpaces, CoreSettings.undoGroupMilliseconds, CoreSettings.undoLimit]);
}
