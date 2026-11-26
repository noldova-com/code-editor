/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandContext, ConditionValues, EditorFeatureSet, EditorRegistries } from "@noldova/code.editor";
import { describe, expect, it } from "vitest";

import type { ICodeEditorView } from "../../../src/app/interfaces/i-code-editor-view.ts";
import { CodeEditorView } from "../../../src/app/models/code-editor-view.ts";
import { ViewCommand } from "../../../src/app/models/view-command.ts";
import { CodeEditorFeatures } from "../../../src/app/services/code-editor-features.ts";

describe("ViewCommand", () => {
  it("runs its action on the editor's view and leaves the key to others when the editor has no view", () => {
    const registries: EditorRegistries = new EditorRegistries();
    const features: EditorFeatureSet = new EditorFeatureSet();
    const context: CommandContext = new CommandContext(registries, new ConditionValues(registries.conditions), features, null, 0, 1);
    const opened: ICodeEditorView[] = [];
    const command: ViewCommand = new ViewCommand("test.open", t => opened.push(t));

    expect(command.run(context)).toBe(false);
    const view: CodeEditorView = new CodeEditorView(() => undefined, () => undefined, () => undefined);
    using _provided = features.provide(CodeEditorFeatures.view, view);
    expect([command.run(context), opened]).toEqual([true, [view]]);
  });
});
