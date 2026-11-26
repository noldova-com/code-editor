/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextPosition } from "@noldova/code.editor";

import { Resources } from "../../../resources.ts";

export class CodeFold {
  public readonly startLine: number;
  public readonly lineCount: number;
  public readonly collapsed: boolean;
  public readonly label: string | null;

  public constructor(startLine: number, lineCount: number, collapsed: boolean, label: string | null = null) {
    TextPosition.requireCount(startLine, Resources.startLineParameter);
    TextPosition.requireCount(lineCount, Resources.lineCountParameter);

    this.startLine = startLine;
    this.lineCount = lineCount;
    this.collapsed = collapsed;
    this.label = label;
  }
}
