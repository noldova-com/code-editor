/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert } from "@noldova/context.testing";

import type { TextEdit, TextPosition } from "@noldova/code.editor";

export class ReferenceText {
  public static lines(count: number): string {
    return Array.from({ length: count }, (_, i) => `line ${i}`).join("\n");
  }

  public static offsetAt(text: string, position: TextPosition): number {
    const pattern = /\r\n|\r|\n/g;
    let offset = 0;
    for (let line = 0; line < position.line; line++) {
      const match = pattern.exec(text);
      Assert.isNotNull(match);
      offset = match.index + match[0].length;
    }

    return offset + position.column;
  }

  public static replace(text: string, edit: TextEdit): string {
    return text.slice(0, ReferenceText.offsetAt(text, edit.range.start)) + edit.text + text.slice(ReferenceText.offsetAt(text, edit.range.end));
  }
}
