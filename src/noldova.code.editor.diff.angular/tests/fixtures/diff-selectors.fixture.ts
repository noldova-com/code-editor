/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BuiltInTokenTypes } from "@noldova/code.editor";
import { CodeEditorClasses } from "@noldova/code.editor.angular";

import { DiffEditorClasses } from "../../src/app/services/diff-editor-classes.ts";

export class DiffSelectors {
  public static readonly caret: string = `.${CodeEditorClasses.caret}`;
  public static readonly change: string = `.${CodeEditorClasses.change}`;
  public static readonly foldIcon: string = `.${CodeEditorClasses.foldIcon}`;
  public static readonly foldToggle: string = `.${CodeEditorClasses.foldToggle}`;
  public static readonly input: string = `.${CodeEditorClasses.input}`;
  public static readonly line: string = `.${CodeEditorClasses.line}`;
  public static readonly lineFold: string = `.${CodeEditorClasses.lineFold}`;
  public static readonly lineNumber: string = `.${CodeEditorClasses.lineNumber}`;
  public static readonly match: string = `.${CodeEditorClasses.match}`;
  public static readonly number: string = `.${CodeEditorClasses.number}`;
  public static readonly paint: string = `.${CodeEditorClasses.paint}`;
  public static readonly row: string = `.${CodeEditorClasses.row}`;
  public static readonly rowFold: string = `.${CodeEditorClasses.rowFold}`;
  public static readonly scroller: string = `.${CodeEditorClasses.scroller}`;
  public static readonly sign: string = `.${CodeEditorClasses.sign}`;
  public static readonly lineSpan: string = `${DiffSelectors.line} span`;
  public static readonly keywordToken: string = `.${CodeEditorClasses.token(BuiltInTokenTypes.keyword.id)}`;
  public static readonly pane: string = `.${DiffEditorClasses.pane}`;
  public static readonly status: string = `.${DiffEditorClasses.status}`;
  public static readonly findField: string = `.${CodeEditorClasses.findField}`;
}
