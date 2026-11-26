/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { TextDocument, UndoHistory } from "@noldova/code.editor";
import { DocumentDiff } from "@noldova/code.editor.diff";
import { afterAll, describe, it } from "vitest";

import { DiffEditorComponent } from "../../src/app/components/diff-editor/diff-editor.component.ts";
import { DiffLayout } from "../../src/app/enums/diff-layout.ts";
import { DiffWorker } from "../../src/app/services/diff-worker.ts";
import { DiffInputs } from "../fixtures/diff-inputs.fixture.ts";
import { DiffSelectors } from "../fixtures/diff-selectors.fixture.ts";
import { DomWait } from "../fixtures/dom-wait.fixture.ts";
import { PerfReport } from "./perf-report.fixture.ts";

const LINES: number = 100_000;
const CHANGE_EVERY: number = 100;
const CHANGED_AT: number = 5;
const RUNS: number = 5;
const BOUND: number = 120_000;
const TIMEOUT: number = 600_000;
const ORIGINAL: string = Array.from({ length: LINES }, (_, i) => `line ${i}`).join("\n");
const MODIFIED: string = Array.from({ length: LINES }, (_, i) => i % CHANGE_EVERY === CHANGED_AT ? `changed ${i}` : `line ${i}`).join("\n");

describe("Diff view of two 100,000-line documents", () => {
  afterAll(() => PerfReport.saveAsync("diff-editor"));

  it("diffs them in a worker until the changes show", async () => {
    using runner = DiffWorker.create();
    for (let run: number = 0; run < RUNS; run++) {
      const start: number = performance.now();
      using diff = new DocumentDiff(TextDocument.fromText(ORIGINAL), TextDocument.fromText(MODIFIED), undefined, runner);
      const fixture: ComponentFixture<DiffEditorComponent> = TestBed.createComponent(DiffEditorComponent);
      const host: HTMLElement = fixture.nativeElement;
      host.style.height = "45rem";
      host.style.width = "75rem";
      fixture.componentRef.setInput(DiffInputs.diff, diff);
      fixture.componentRef.setInput(DiffInputs.history, new UndoHistory(diff.modified));
      fixture.componentRef.setInput(DiffInputs.originalLabel, "Original");
      fixture.componentRef.setInput(DiffInputs.modifiedLabel, "Modified");
      fixture.componentRef.setInput(DiffInputs.layout, DiffLayout.SideBySide);
      fixture.autoDetectChanges();
      await DomWait.untilAsync("the changes show", () => !diff.pending && host.querySelectorAll(DiffSelectors.change).length > 0, BOUND);
      await PerfReport.paintAsync();
      PerfReport.since("diff, 100,000 lines", start);
      fixture.destroy();
    }
  }, TIMEOUT);
});
