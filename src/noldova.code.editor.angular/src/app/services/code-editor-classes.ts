/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../../resources.ts";

export class CodeEditorClasses {
  public static readonly line: string = Resources.lineClass;
  public static readonly change: string = Resources.changeClass;
  public static readonly lineNumber: string = Resources.lineNumberClass;
  public static readonly paint: string = Resources.paintClass;
  public static readonly row: string = Resources.codeRowClass;
  public static readonly rowSpacer: string = Resources.rowSpacerClass;
  public static readonly rowFold: string = Resources.rowFoldClass;
  public static readonly lineFold: string = Resources.lineFoldClass;
  public static readonly foldToggle: string = Resources.foldToggleClass;
  public static readonly foldIcon: string = Resources.foldIconClass;
  public static readonly scroller: string = Resources.scrollerClass;
  public static readonly input: string = Resources.inputClass;
  public static readonly caret: string = Resources.caretClass;
  public static readonly match: string = Resources.matchClass;
  public static readonly sign: string = Resources.signClass;
  public static readonly number: string = Resources.numberClass;
  public static readonly findField: string = Resources.findFieldClass;

  public static token(type: string): string {
    return `${Resources.tokenClassPrefix}${type}`;
  }
}
