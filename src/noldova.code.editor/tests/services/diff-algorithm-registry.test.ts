/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { DiffAlgorithmRegistry, DiffSpan, RegistrationExistsException, RegistrationMissingException } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { Resources } from "@noldova/code.editor/resources.js";

import { NamedAlgorithm } from "../fixtures/named-algorithm.fixture.js";
import { Expect } from "../support/expect.js";

@TestClass
export class DiffAlgorithmRegistryTests {
  private static readonly FIRST_ALGORITHM: string = "test.first";
  private static readonly SECOND_ALGORITHM: string = "test.second";
  private static readonly MISSING_ALGORITHM: string = "test.none";
  private static readonly ONLY_ALGORITHM: string = "test.only";

  @TestMethod
  public diffsWithTheAlgorithmASettingNamesOrElseTheLastRegisteredLookingInItsParentToo(): void {
    const parent: DiffAlgorithmRegistry = new DiffAlgorithmRegistry();
    const child: DiffAlgorithmRegistry = new DiffAlgorithmRegistry(parent);
    parent.register(new NamedAlgorithm(DiffAlgorithmRegistryTests.FIRST_ALGORITHM));
    child.register(new NamedAlgorithm(DiffAlgorithmRegistryTests.SECOND_ALGORITHM));

    Expect.same([DiffAlgorithmRegistryTests.FIRST_ALGORITHM, DiffAlgorithmRegistryTests.SECOND_ALGORITHM, DiffAlgorithmRegistryTests.SECOND_ALGORITHM, DiffAlgorithmRegistryTests.SECOND_ALGORITHM, DiffAlgorithmRegistryTests.FIRST_ALGORITHM],
      [child.current(DiffAlgorithmRegistryTests.FIRST_ALGORITHM).id, child.current().id, child.current(DiffAlgorithmRegistryTests.MISSING_ALGORITHM).id, child.get(DiffAlgorithmRegistryTests.SECOND_ALGORITHM).id, parent.current().id]);
    Expect.same([[DiffAlgorithmRegistryTests.FIRST_ALGORITHM, DiffAlgorithmRegistryTests.SECOND_ALGORITHM], null], [child.ids().toArray(), parent.find(DiffAlgorithmRegistryTests.SECOND_ALGORITHM)]);
    Expect.same([new DiffSpan(0, 1, 0, 2)], child.current().lines(new List(["a"]), new List(["b", "c"])).toArray());
  }

  @TestMethod
  public refusesASecondAlgorithmOfTheSameIdAndThrowsWhenItHoldsNoneToDiffWith(): void {
    const algorithms: DiffAlgorithmRegistry = new DiffAlgorithmRegistry();
    const registration: Disposable = algorithms.register(new NamedAlgorithm(DiffAlgorithmRegistryTests.ONLY_ALGORITHM));

    Expect.throwsWhere(() => algorithms.register(new NamedAlgorithm(DiffAlgorithmRegistryTests.ONLY_ALGORITHM)), RegistrationExistsException, t => t.registry === Resources.diffAlgorithmRegistry && t.id === DiffAlgorithmRegistryTests.ONLY_ALGORITHM);
    registration[Symbol.dispose]();
    Expect.throwsWhere(() => algorithms.current(), RegistrationMissingException, t => t.message === "The diff algorithms registry holds no algorithm.");
    Expect.throwsWhere(() => algorithms.current(DiffAlgorithmRegistryTests.ONLY_ALGORITHM), RegistrationMissingException, t => t.id === DiffAlgorithmRegistryTests.ONLY_ALGORITHM);
    Assert.areEqual(null, algorithms.find(DiffAlgorithmRegistryTests.ONLY_ALGORITHM));
  }
}
