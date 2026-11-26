/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { KeyDispatchResult } from "@noldova/code.editor";
import { describe, expect, it } from "vitest";

import { ScopeFixture } from "../../fixtures/scope.fixture.ts";

describe("KeyScope", () => {
  it("dispatches an inner view's press through its hosts' contexts too, on one dispatcher, telling every scope up the chain the pending chord", () => {
    const view: ScopeFixture = new ScopeFixture();

    const results: readonly KeyDispatchResult[] = [view.press("k"), view.press("c")];

    expect(results).toEqual([KeyDispatchResult.Pending, KeyDispatchResult.Handled]);
    expect(view.command.runs).toBe(1);
    expect(view.heard).toEqual(["inner:Ctrl+K", "middle:Ctrl+K", "outer:Ctrl+K", "inner:null", "middle:null", "outer:null"]);
  });

  it("drops the shared sequence from any scope, telling that scope and its hosts, and tells no one when none is pending", () => {
    const view: ScopeFixture = new ScopeFixture();

    view.press("k");
    view.heard.length = 0;
    view.middle.cancel();
    view.outer.cancel();

    expect(view.heard).toEqual(["middle:null", "outer:null"]);
    expect(view.press("c")).toBe(KeyDispatchResult.None);
  });
});
