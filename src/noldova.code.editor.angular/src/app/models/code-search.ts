/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type SearchQuery, type SearchResults, type TextDocument, TextRange, TextSearch, type TextSelection } from "@noldova/code.editor";

import { Resources } from "../../resources.ts";
import type { LayoutRow } from "./rows/layout-row.ts";
import { MatchShape } from "./shapes/match-shape.ts";
import type { RowLayout } from "./rows/row-layout.ts";
import type { TextMeasure } from "./text-measure.ts";

export class CodeSearch {
  public static rangeOf(selection: TextSelection): TextRange {
    return selection.anchor.compareTo(selection.head) > 0 ? new TextRange(selection.head, selection.anchor) : new TextRange(selection.anchor, selection.head);
  }

  public static searchOf(query: SearchQuery | null): TextSearch | null {
    if (Object.isNull(query) || String.isNullOrEmpty(query.text))
      return null;
    try {
      return new TextSearch(query);
    } catch {
      return null;
    }
  }

  public static statusOf(query: SearchQuery | null, results: SearchResults | null, current: TextRange): string {
    if (Object.isNull(query) || String.isNullOrEmpty(query.text))
      return Resources.empty;
    if (Object.isNull(results))
      return Resources.invalidPattern;
    const deadline: number = performance.now() + Resources.statusSliceMilliseconds;
    if (results.advance(() => performance.now() < deadline))
      return Resources.formatMatches(0, results.count, false);
    if (results.count === 0)
      return Resources.noResults;

    return Resources.formatMatches(results.indexOf(current) + 1, results.count, true);
  }

  public static shapesOf(results: SearchResults, document: TextDocument, layout: RowLayout, rows: readonly number[], measure: TextMeasure,
    current: TextRange): readonly MatchShape[] {
    const shapes: MatchShape[] = [];
    for (const row of rows) {
      const item: LayoutRow = layout.rowAt(row);
      if (!Object.isNull(item.block))
        continue;
      const text: string = document.lineText(item.line);
      for (const match of results.matchesIn(item.line, item.line + 1)) {
        const left: number = measure.x(text, match.start.column);
        shapes.push(new MatchShape(row * measure.lineHeight, left, measure.x(text, match.end.column) - left, match.equals(current)));
      }
    }

    return shapes;
  }
}
