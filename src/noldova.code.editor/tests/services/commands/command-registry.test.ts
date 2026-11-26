/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CommandRegistry, CoreCommands, EditorSession, RegistrationExistsException, RegistrationMissingException,
  TextDocument, UndoHistory } from "@noldova/code.editor";

import { RecordingCommand } from "../../fixtures/recording-command.fixture.js";
import { Contexts } from "../../support/contexts.js";
import { Expect } from "../../support/expect.js";

const UNKNOWN_COMMAND: string = "editor.unknown";

@TestClass
export class CommandRegistryTests {
  @TestMethod
  public runsACommandByItsIdWithTheArgumentsGivenOrNull(): void {
    const registries = Contexts.core();
    const command = new RecordingCommand("test.record");
    registries.commands.register(command);

    Assert.areEqual(true, registries.commands.run("test.record", Contexts.of(registries), { times: 2 }));
    Assert.areEqual(true, registries.commands.run("test.record", Contexts.of(registries)));
    Expect.same([{ times: 2 }, null], command.calls);
    Assert.isTrue(registries.commands.ids().contains("test.record"));
    Assert.isTrue(registries.commands.ids().contains(CoreCommands.deleteLeft.id));
  }

  @TestMethod
  public throwsForAnUnknownIdInsteadOfRunningAnotherCommandAndLeavesTheDocumentAsItWas(): void {
    const registries = Contexts.core();
    const document = TextDocument.fromText("  indented");
    const session = new EditorSession(document, new UndoHistory(document));

    Expect.throwsWhere(() => registries.commands.run(UNKNOWN_COMMAND, Contexts.of(registries, session)), RegistrationMissingException,
      t => t.registry === "commands" && t.id === UNKNOWN_COMMAND);
    Assert.areEqual(null, registries.commands.find(UNKNOWN_COMMAND));
    Assert.areEqual("  indented", document.text());
  }

  @TestMethod
  public refusesASecondCommandWithTheSameIdAndTakesItAgainOnceTheFirstIsDisposed(): void {
    const commands = new CommandRegistry();
    const first = commands.register(new RecordingCommand("test.same"));

    Expect.throwsWhere(() => commands.register(new RecordingCommand("test.same")), RegistrationExistsException, t => t.registry === "commands" && t.id === "test.same");
    first[Symbol.dispose]();
    first[Symbol.dispose]();
    Assert.areEqual(null, commands.find("test.same"));
    commands.register(new RecordingCommand("test.same", false));
    Assert.areEqual("test.same", commands.get("test.same").id);
  }

  @TestMethod
  public letsAChildShadowItsParentsCommandAndFallsBackToTheParentsOnceTheChildsIsGone(): void {
    const parent = new CommandRegistry();
    const child = new CommandRegistry(parent);
    const own = new RecordingCommand("test.shared");
    const inherited = new RecordingCommand("test.shared");
    parent.register(inherited);
    const shadow = child.register(own);

    Assert.areEqual(own, child.get("test.shared"));
    Assert.areEqual(inherited, parent.get("test.shared"));
    Expect.same(["test.shared"], child.ids().toArray());
    shadow[Symbol.dispose]();
    Assert.areEqual(inherited, child.get("test.shared"));
  }

  @TestMethod
  public runsNoSessionCommandWhenTheEditorGivesNoSession(): void {
    const registries = Contexts.core();

    Assert.areEqual(false, registries.commands.run(CoreCommands.selectAll.id, Contexts.of(registries)));
  }
}
