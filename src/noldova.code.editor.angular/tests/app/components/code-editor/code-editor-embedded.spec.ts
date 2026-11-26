/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { CodeDecorations } from "../../../../src/app/models/decorations/code-decorations.ts";
import type { CodeGutterMarker } from "../../../../src/app/models/decorations/code-gutter-marker.ts";
import type { CodeLineDecoration } from "../../../../src/app/models/decorations/code-line-decoration.ts";
import type { CodeRangeDecoration } from "../../../../src/app/models/decorations/code-range-decoration.ts";
import { CodeEmbeddedLines } from "../../../../src/app/models/rows/code-embedded-lines.ts";
import type { CodeInsertedRows } from "../../../../src/app/models/rows/code-inserted-rows.ts";
import { DomWait } from "../../../fixtures/dom-wait.fixture.ts";
import { EmbeddedSelectors } from "../../../fixtures/embedded-selectors.fixture.ts";
import { EmbeddedValues } from "../../../fixtures/embedded-values.fixture.ts";
import { EmbeddedFixture } from "../../../fixtures/embedded.fixture.ts";
import { OffsetNumbering } from "../../../fixtures/offset-numbering.fixture.ts";

const MAC: boolean = navigator.platform.startsWith(EmbeddedValues.macPlatform);
const MOD: string = MAC ? EmbeddedValues.macModifier : EmbeddedValues.modifier;

describe("CodeEditorComponent's embedded lines", () => {
  it("numbers another document's lines in the other column when a set numbers the view's own lines", async () => {
    const other: TextDocument = TextDocument.fromText(Array.from({ length: 120 }, (_, i) => `other ${i}`).join("\n"));
    const view: EmbeddedFixture = await EmbeddedFixture.renderAsync("a\nb", [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([new CodeEmbeddedLines(1, other, 98, 1)]), new OffsetNumbering(200))]);

    expect(view.texts(EmbeddedSelectors.line)).toEqual(["a", "other 98", "b"]);
    expect(view.numbers()).toEqual(["|1", "99|", "101|2"]);
  });

  it("puts the caret at the start of the line after an embedded row pressed, or at the end of the last line after the last one", async () => {
    const other: TextDocument = TextDocument.fromText("x\ny");
    const view: EmbeddedFixture = await EmbeddedFixture.renderAsync("a\nbc", [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([new CodeEmbeddedLines(1, other, 0, 1), new CodeEmbeddedLines(2, other, 1, 1)]))]);

    expect(view.texts(EmbeddedSelectors.line)).toEqual(["a", "x", "bc", "y"]);
    view.pressRow(1);
    await view.stableAsync();
    expect(EmbeddedFixture.where(view.editor.caret())).toBe("1:0");
    view.pressRow(3);
    await view.stableAsync();
    expect(EmbeddedFixture.where(view.editor.caret())).toBe("1:2");
  });

  it("marks search matches on its own lines only, never on an embedded row, and says whether it has the focus", async () => {
    const other: TextDocument = TextDocument.fromText("foo foo");
    const view: EmbeddedFixture = await EmbeddedFixture.renderAsync("foo\nfoo", [new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([new CodeEmbeddedLines(1, other, 0, 1)]))]);

    expect(view.editor.hasFocus()).toBe(false);
    view.editor.select(new List<TextSelection>([new TextSelection(new TextPosition(0, 0), new TextPosition(0, 3))]));
    view.editor.focus();
    await view.stableAsync();
    expect(view.editor.hasFocus()).toBe(true);
    await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
    await view.stableAsync();
    await DomWait.untilAsync("a match is marked", () => view.all(EmbeddedSelectors.match).length > 0);

    const rows: readonly HTMLElement[] = view.all(EmbeddedSelectors.line);
    const embedded: DOMRect | undefined = rows[1]?.getBoundingClientRect();
    expect(view.all(EmbeddedSelectors.match).length).toBe(2);
    expect(view.all(EmbeddedSelectors.match).some(t => t.getBoundingClientRect().top === embedded?.top)).toBe(false);
  });
});
