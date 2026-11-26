/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CodeEditorClasses } from "../../src/app/services/code-editor-classes.ts";

export class EmbeddedSelectors {
  public static readonly line: string = `.${CodeEditorClasses.line}`;
  public static readonly lineNumber: string = `.${CodeEditorClasses.lineNumber}`;
  public static readonly number: string = `.${CodeEditorClasses.number}`;
  public static readonly scroller: string = `.${CodeEditorClasses.scroller}`;
  public static readonly match: string = `.${CodeEditorClasses.match}`;
}
