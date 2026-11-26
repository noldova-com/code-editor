/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { inject, Injectable } from "@angular/core";
import { EditorRegistries } from "@noldova/code.editor";
import { CodeEditorRegistries } from "@noldova/code.editor.angular";
import { DiffContribution } from "@noldova/code.editor.diff";

import { DiffEditorContribution } from "./diff-editor-contribution.ts";

@Injectable({ providedIn: "root" })
export class DiffEditorRegistries {
  public readonly registries: EditorRegistries = new EditorRegistries(inject(CodeEditorRegistries).registries);

  public constructor() {
    this.registries.add(new DiffContribution(), new DiffEditorContribution());
  }
}
