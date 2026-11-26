/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ConflictMarkersException } from "@noldova/code.editor.merge";
import { ConflictMarkers } from "@noldova/code.editor.merge/services/conflict-markers.js";

import { Expect } from "../support/expect.js";

@TestClass
export class ConflictMarkersTests {
  @TestMethod
  public readsAZdiff3ConflictsThreeSidesKeepingTheBasesTextInTheResultAndEachLinesBreak(): void {
    const start = ConflictMarkers.parse("a\r\n<<<<<<< HEAD\r\nours\r\n||||||| base\r\nbase\r\n=======\r\ntheirs\r\n>>>>>>> topic\r\nz");

    Assert.areEqual("a\r\nbase\r\nz", start.text);
    Assert.areEqual(1, start.conflicts.count());
    const conflict = start.conflicts.tryGet(0);
    Assert.isDefined(conflict);
    Expect.same([0, "ours\r\n", "base\r\n", "theirs\r\n", 3, 9], [conflict.index, conflict.ours, conflict.base, conflict.theirs, conflict.start, conflict.end]);
  }

  @TestMethod
  public readsAConflictWithNoBaseSectionAndMarkersWithNoLabelsAsAnEmptyBase(): void {
    const start = ConflictMarkers.parse("<<<<<<<\nx\n=======\ny\n>>>>>>>\n<<<<<<< a\n=======\n>>>>>>> b\n");

    Assert.areEqual("", start.text);
    Expect.same([["x\n", "", "y\n", 0, 0], ["", "", "", 0, 0]], start.conflicts.select(t => [t.ours, t.base, t.theirs, t.start, t.end]).toArray());
  }

  @TestMethod
  public keepsMarkerLikeLinesAsTextOutsideAConflictAndLinesThatOnlyStartLikeAMarkerAnywhere(): void {
    const start = ConflictMarkers.parse("=======\n>>>>>>> x\n|||||||\n<<<<<<< h\n<<<<<<<< long\n=======x\n=======\n>>>>>>> t");

    Assert.areEqual("=======\n>>>>>>> x\n|||||||\n", start.text);
    Assert.areEqual("<<<<<<<< long\n=======x\n", start.conflicts.tryGet(0)?.ours);
  }

  @TestMethod
  public refusesAMarkerOutOfPlaceNamingItsLine(): void {
    const refused = ["<<<<<<< a\n<<<<<<< b\n", "<<<<<<< a\n>>>>>>> b\n", "<<<<<<< a\n||||||| b\n||||||| c\n", "<<<<<<< a\n=======\n||||||| c\n"].map(t => ConflictMarkersTests.refusal(t));

    Expect.same([2, 2, 3, 3], refused.map(t => t.line));
    Assert.isTrue(refused.every(t => t.message.endsWith("is out of place.")));
    Assert.isTrue(refused.every(t => t.name === "ConflictMarkersException"));
  }

  @TestMethod
  public refusesAConflictThatNeverEndsNamingTheLineItStartsOn(): void {
    const error = ConflictMarkersTests.refusal("a\n<<<<<<< x\nb\n=======\nc\n");

    Assert.areEqual(2, error.line);
    Assert.areEqual("The conflict markers don't parse at line 2: the conflict that starts here has no end marker.", error.message);
  }

  private static refusal(merged: string): ConflictMarkersException {
    try {
      ConflictMarkers.parse(merged);
    }
    catch (error) {
      if (error instanceof ConflictMarkersException)
        return error;
      throw error;
    }
    Assert.fail("The markers parsed.");
  }
}
