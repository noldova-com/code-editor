/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiffEditorComponent } from "../../src/app/components/diff-editor/diff-editor.component.ts";

export class DiffInputs {
  public static readonly diff: keyof DiffEditorComponent = "diff";
  public static readonly history: keyof DiffEditorComponent = "history";
  public static readonly originalHistory: keyof DiffEditorComponent = "originalHistory";
  public static readonly originalLabel: keyof DiffEditorComponent = "originalLabel";
  public static readonly modifiedLabel: keyof DiffEditorComponent = "modifiedLabel";
  public static readonly originalReadOnly: keyof DiffEditorComponent = "originalReadOnly";
  public static readonly layout: keyof DiffEditorComponent = "layout";
  public static readonly language: keyof DiffEditorComponent = "language";
}
