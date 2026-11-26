/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { describe, expect, it } from "vitest";

import { DiffEditorClasses, DiffEditorCommands, DiffEditorComponent, DiffEditorContribution, DiffEditorFeatures, DiffEditorRegistries, DiffEditorSettings, DiffLayout, DiffWorker } from "../../src/api/index.ts";
import { Resources } from "../../src/resources.ts";

describe("the package's API", () => {
  it("exports the diff editor, its layouts, its commands, its settings, its registries and its worker", () => {
    expect([DiffEditorComponent, DiffEditorContribution, DiffEditorRegistries, DiffWorker].every(t => !Object.isUndefined(t))).toBe(true);
    expect([DiffEditorFeatures.navigator.name, DiffEditorFeatures.inDiffEditor.name]).toEqual([Resources.navigatorFeature, Resources.inDiffEditorCondition]);
    expect([DiffEditorClasses.host, DiffEditorClasses.inline, DiffEditorClasses.pane, DiffEditorClasses.status].every(t => !String.isNullOrEmpty(t))).toBe(true);
    expect(DiffEditorCommands.all.toArray()).toEqual([DiffEditorCommands.nextChange, DiffEditorCommands.previousChange]);
    expect(Object.values(DiffLayout)).toEqual([DiffLayout.Automatic, DiffLayout.SideBySide, DiffLayout.Inline]);
    expect(DiffEditorSettings.all.toArray()).toEqual([DiffEditorSettings.contextLines, DiffEditorSettings.minimumHiddenLines, DiffEditorSettings.characterDiffLimit,
      DiffEditorSettings.inlineBreakpoint]);
    expect(DiffEditorSettings.all.select(t => t.defaultValue).toArray()).toEqual([3, 3, 20000, 50]);
  });
});
