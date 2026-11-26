/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injectable } from "@angular/core";
import { CoreContribution, EditorRegistries } from "@noldova/code.editor";

import { CodeEditorContribution } from "./code-editor-contribution.ts";

@Injectable({ providedIn: "root" })
export class CodeEditorRegistries {
  public readonly registries: EditorRegistries = new EditorRegistries();

  public constructor() {
    this.registries.add(new CoreContribution(), new CodeEditorContribution());
  }
}
