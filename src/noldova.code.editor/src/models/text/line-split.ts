/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../resources.js";

export class LineSplit {
  public readonly texts: IReadOnlyList<string>;
  public readonly endings: IReadOnlyList<string>;

  private constructor(texts: IReadOnlyList<string>, endings: IReadOnlyList<string>) {
    this.texts = texts;
    this.endings = endings;
  }

  public static of(text: string): LineSplit {
    const texts: List<string> = new List<string>();
    const endings: List<string> = new List<string>();
    let start: number = 0;
    for (const match of text.matchAll(Resources.lineBreakPattern)) {
      texts.add(text.slice(start, match.index));
      endings.add(match[0]);
      start = match.index + match[0].length;
    }
    texts.add(text.slice(start));
    endings.add(String.empty);

    return new LineSplit(texts, endings);
  }
}
