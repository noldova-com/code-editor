/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextPosition } from "@noldova/code.editor";

import { Resources } from "../../../resources.ts";

export class CodeGutterMarker {
  public readonly line: number;
  public readonly text: string;
  public readonly color: string;

  public constructor(line: number, text: string, color: string) {
    TextPosition.requireCount(line, Resources.lineParameter);

    this.line = line;
    this.text = text;
    this.color = color;
  }
}
