/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BackgroundJobRegistry, RegistrationExistsException, RegistrationMissingException } from "@noldova/code.editor";
import { Resources } from "@noldova/code.editor/resources.js";

import { NamedJob } from "../../fixtures/named-job.fixture.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class BackgroundJobRegistryTests {
  private static readonly SHARED_JOB: string = "test.shared";
  private static readonly OWN_JOB: string = "test.own";
  private static readonly MISSING_JOB: string = "test.none";
  private static readonly JOB: string = "test.job";

  @TestMethod
  public findsAJobByItsNameInItselfOrItsParentAndListsTheNamesTheParentsFirst(): void {
    const parent: BackgroundJobRegistry = new BackgroundJobRegistry();
    const child: BackgroundJobRegistry = new BackgroundJobRegistry(parent);
    const shared: NamedJob = new NamedJob(BackgroundJobRegistryTests.SHARED_JOB);
    const own: NamedJob = new NamedJob(BackgroundJobRegistryTests.OWN_JOB);
    parent.register(shared);
    child.register(own);

    Expect.same([true, true, null, null], [child.find(BackgroundJobRegistryTests.SHARED_JOB) === shared, child.get(BackgroundJobRegistryTests.OWN_JOB) === own, parent.find(BackgroundJobRegistryTests.OWN_JOB), child.find(BackgroundJobRegistryTests.MISSING_JOB)]);
    Expect.same([BackgroundJobRegistryTests.SHARED_JOB, BackgroundJobRegistryTests.OWN_JOB], child.names().toArray());
  }

  @TestMethod
  public refusesASecondJobOfTheSameNameThrowsForAMissingOneAndForgetsAJobOnceItsRegistrationIsDisposed(): void {
    const jobs: BackgroundJobRegistry = new BackgroundJobRegistry();
    const registration: Disposable = jobs.register(new NamedJob(BackgroundJobRegistryTests.JOB));

    Expect.throwsWhere(() => jobs.register(new NamedJob(BackgroundJobRegistryTests.JOB)), RegistrationExistsException, t => t.registry === Resources.backgroundJobRegistry && t.id === BackgroundJobRegistryTests.JOB);
    registration[Symbol.dispose]();
    Expect.throwsWhere(() => jobs.get(BackgroundJobRegistryTests.JOB), RegistrationMissingException, t => t.registry === Resources.backgroundJobRegistry && t.id === BackgroundJobRegistryTests.JOB);
    Assert.areEqual(0, jobs.names().count());
  }
}
