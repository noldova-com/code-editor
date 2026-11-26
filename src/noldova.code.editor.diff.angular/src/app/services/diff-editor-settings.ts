/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Setting } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../resources.ts";

export class DiffEditorSettings {
  public static readonly contextLines: Setting<number> = Setting.integer(Resources.contextLinesSetting, Resources.defaultContextLines, Resources.contextLinesDescription,
    Resources.contextLinesMinimum);
  public static readonly minimumHiddenLines: Setting<number> = Setting.integer(Resources.minimumHiddenLinesSetting, Resources.defaultMinimumHiddenLines,
    Resources.minimumHiddenLinesDescription, Resources.minimumHiddenLinesMinimum);
  public static readonly characterDiffLimit: Setting<number> = Setting.integer(Resources.characterDiffLimitSetting, Resources.defaultCharacterDiffLimit,
    Resources.characterDiffLimitDescription, Resources.characterDiffLimitMinimum);
  public static readonly inlineBreakpoint: Setting<number> = Setting.number(Resources.inlineBreakpointSetting, Resources.defaultInlineBreakpoint, Resources.inlineBreakpointDescription,
    Resources.inlineBreakpointMinimum);

  public static readonly all: IReadOnlyList<Setting<number>> = new List<Setting<number>>([DiffEditorSettings.contextLines, DiffEditorSettings.minimumHiddenLines,
    DiffEditorSettings.characterDiffLimit, DiffEditorSettings.inlineBreakpoint]);
}
