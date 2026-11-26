/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CodeEditorComponent } from "../../src/app/components/code-editor/code-editor.component.ts";

export class EmbeddedInputs {
  public static readonly document: keyof CodeEditorComponent = "document";
  public static readonly history: keyof CodeEditorComponent = "history";
  public static readonly label: keyof CodeEditorComponent = "label";
  public static readonly decorations: keyof CodeEditorComponent = "decorations";
}
