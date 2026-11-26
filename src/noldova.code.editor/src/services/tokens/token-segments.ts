/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { LineSegment } from "../../models/text/line-segment.js";
import type { LineToken } from "../../models/tokens/line-token.js";

export class TokenSegments {
  public static fill(length: number, tokens: IReadOnlyList<LineToken>): IReadOnlyList<LineSegment> {
    const segments: List<LineSegment> = new List<LineSegment>();
    let at: number = 0;
    for (const token of tokens) {
      const start: number = Math.max(at, token.start);
      const end: number = Math.min(length, token.end);
      if (end <= start)
        continue;
      if (start > at)
        segments.add(new LineSegment(at, start, null));
      segments.add(new LineSegment(start, end, token.type, token.modifiers));
      at = end;
    }
    if (at < length)
      segments.add(new LineSegment(at, length, null));

    return segments;
  }
}
