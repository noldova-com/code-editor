/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextDocument } from "@noldova/code.editor";
import { type MockInstance, vi } from "vitest";

export class LineReads {
  public static count(document: TextDocument, action: () => void): number {
    let clock: number = performance.now();
    const now: MockInstance<() => number> = vi.spyOn(performance, "now").mockImplementation(() => clock++);
    const reads: MockInstance<(line: number) => string> = vi.spyOn(document, "lineText");
    try {
      action();

      return reads.mock.calls.length;
    } finally {
      reads.mockRestore();
      now.mockRestore();
    }
  }
}
