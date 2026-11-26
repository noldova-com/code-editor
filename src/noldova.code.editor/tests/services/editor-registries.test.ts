/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { type CommandContext, CoreCommands, CoreConditions, CoreContribution, CoreSettings, EditorFeatures, EditorFeatureSet, EditorRegistries, EditorSession, KeyPress, TextDocument,
  UndoHistory } from "@noldova/code.editor";

import { LineCommentContribution } from "../fixtures/line-comment-contribution.fixture.js";
import { NamedAlgorithm } from "../fixtures/named-algorithm.fixture.js";
import { NamedJob } from "../fixtures/named-job.fixture.js";
import { Contexts } from "../support/contexts.js";
import { Expect } from "../support/expect.js";

@TestClass
export class EditorRegistriesTests {
  private static readonly DIFF_ALGORITHM: string = "test.diff";
  private static readonly BACKGROUND_JOB: string = "test.job";

  @TestMethod
  public findsTheDiffAlgorithmsAndBackgroundJobsOfItsParent(): void {
    const app = new EditorRegistries();
    const editor = new EditorRegistries(app);
    app.diffAlgorithms.register(new NamedAlgorithm(EditorRegistriesTests.DIFF_ALGORITHM));
    app.backgroundJobs.register(new NamedJob(EditorRegistriesTests.BACKGROUND_JOB));

    Expect.same([EditorRegistriesTests.DIFF_ALGORITHM, [EditorRegistriesTests.BACKGROUND_JOB], null], [editor.diffAlgorithms.current().id, editor.backgroundJobs.names().toArray(), editor.parent?.parent ?? null]);
  }

  @TestMethod
  public letsAModuleAddACommandAndItsKeyThatRunLikeTheBuiltInOnes(): void {
    const registries = Contexts.core();
    const comments = new LineCommentContribution();
    registries.add(comments, comments);
    const document = TextDocument.fromText("let a;");
    const session = new EditorSession(document, new UndoHistory(document));
    const context: CommandContext = Contexts.of(registries, session);
    context.conditions.set(CoreConditions.platform, "mac");

    Assert.areEqual(true, registries.keyBindings.dispatch(new KeyPress("/", "Slash", false, false, false, true), context));
    Assert.areEqual("// let a;", document.text());
    Assert.areEqual(1, comments.contributions);
    Assert.areEqual("mod+/", registries.keyBindings.keyOf("test.toggleLineComment", context.conditions));
  }

  @TestMethod
  public addsEachContributionOnceAcrossAParentAndItsChildAndLetsTheChildAddItsOwnOnTop(): void {
    const app = new EditorRegistries();
    app.add(new CoreContribution());
    const editor = new EditorRegistries(app);
    const comments = new LineCommentContribution();
    editor.add(new CoreContribution(), comments);

    Assert.areEqual(app, editor.parent);
    Assert.areEqual(null, app.parent);
    Expect.same([true, true, false], [editor.has("noldova.code.editor"), editor.has("test.comments"), app.has("test.comments")]);
    Assert.isNotNull(editor.commands.find("test.toggleLineComment"));
    Assert.areEqual(null, app.commands.find("test.toggleLineComment"));
    Assert.areEqual(CoreSettings.undoLimit, editor.settings.find(CoreSettings.undoLimit.id));
    Assert.isTrue(editor.conditions.names().contains("editorTabIndents"));
    editor.phrases.add("en", { "test": "Test" });
    Assert.areEqual("Test", editor.phrases.format("test"));
  }

  @TestMethod
  public withdrawsAnEditorsPartOnceItsProvisionIsDisposed(): void {
    const features = new EditorFeatureSet();
    const document = TextDocument.fromText("");
    const session = new EditorSession(document, new UndoHistory(document));
    const provided = features.provide(EditorFeatures.session, session);

    Assert.areEqual(session, features.get(EditorFeatures.session));
    provided[Symbol.dispose]();
    Assert.areEqual(null, features.get(EditorFeatures.session));
    Assert.areEqual("session", EditorFeatures.session.name);
  }

  @TestMethod
  public indentsWithTheSpacesOrTheTabTheSettingsGiveForTheEditorsLanguage(): void {
    const registries = Contexts.core();
    registries.settings.setUserValues({ "[go]": { [CoreSettings.insertSpaces.id]: false }, "[python]": { [CoreSettings.indentSize.id]: 4 } });

    Expect.same(["\tx", "    x", "  x"], ["go", "python", null].map(t => {
      const document = TextDocument.fromText("x");
      const session = new EditorSession(document, new UndoHistory(document));
      registries.commands.run(CoreCommands.indent.id, Contexts.of(registries, session, t));

      return document.text();
    }));
  }
}
