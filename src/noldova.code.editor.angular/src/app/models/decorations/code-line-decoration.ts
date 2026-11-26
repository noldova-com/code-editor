/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextPosition } from "@noldova/code.editor";

import { Resources } from "../../../resources.ts";

export class CodeLineDecoration {
  public readonly startLine: number;
  public readonly lineCount: number;
  public readonly background: string;

  public constructor(startLine: number, lineCount: number, background: string) {
    TextPosition.requireCount(startLine, Resources.startLineParameter);
    TextPosition.requireCount(lineCount, Resources.lineCountParameter);

    this.startLine = startLine;
    this.lineCount = lineCount;
    this.background = background;
  }
}
