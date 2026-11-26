/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CoreSettings, RegistrationExistsException, Setting, SettingRegistry } from "@noldova/code.editor";

import { Contexts } from "../support/contexts.js";
import { Expect } from "../support/expect.js";

const UNDECLARED_SETTING: string = "editor.tabSize";

@TestClass
export class SettingRegistryTests {
  @TestMethod
  public readsTheLanguagesUserValueThenTheLanguagesDefaultThenTheUserValueThenTheDeclaredDefault(): void {
    const settings = new SettingRegistry();
    settings.declare(CoreSettings.indentSize);

    Assert.areEqual(2, settings.get(CoreSettings.indentSize, "python"));
    settings.setUserValues({ [CoreSettings.indentSize.id]: 3 });
    Assert.areEqual(3, settings.get(CoreSettings.indentSize, "python"));
    const defaults = settings.addLanguageDefaults({ "[python]": { [CoreSettings.indentSize.id]: 4 } });
    Assert.areEqual(4, settings.get(CoreSettings.indentSize, "python"));
    Assert.areEqual(3, settings.get(CoreSettings.indentSize, "go"));
    Assert.areEqual(3, settings.get(CoreSettings.indentSize));
    settings.setUserValues({ [CoreSettings.indentSize.id]: 3, "[python]": { [CoreSettings.indentSize.id]: 8 } });
    Assert.areEqual(8, settings.get(CoreSettings.indentSize, "python"));
    defaults[Symbol.dispose]();
    settings.setUserValues({});
    Assert.areEqual(2, settings.get(CoreSettings.indentSize, "python"));
  }

  @TestMethod
  public skipsAValueOfTheWrongTypeOrOutsideItsRangeForTheNextOneDown(): void {
    const settings = new SettingRegistry();
    const mode = Setting.choice<"auto" | "lf">("test.mode", "auto", new List<"auto" | "lf">(["auto", "lf"]), "Mode.");
    const ratio = Setting.number("test.ratio", 0.5, "Ratio.", 0, 1);
    const name = Setting.string("test.name", "none", "Name.");
    const scale = Setting.number("test.scale", 1, "Scale.");
    settings.setUserValues({ "test.scale": -1e9 });
    Assert.areEqual(-1e9, settings.get(scale));
    settings.setUserValues({
      [CoreSettings.indentSize.id]: 2.5, [CoreSettings.insertSpaces.id]: "yes", "test.mode": "cr", "test.ratio": 2, "test.name": 7, "[python]": [1], "[go]": null,
      "[c]": { "test.ratio": "half", [CoreSettings.indentSize.id]: 17 }, "[d]": { "test.ratio": -1 },
      "[rust]": { "test.mode": "lf", "test.ratio": Number.NaN, "test.name": "rust", [CoreSettings.indentSize.id]: 0, [CoreSettings.insertSpaces.id]: false }
    });

    Expect.same([2, true, "auto", 0.5, "none"], [settings.get(CoreSettings.indentSize), settings.get(CoreSettings.insertSpaces), settings.get(mode),
      settings.get(ratio), settings.get(name)]);
    Expect.same([2, false, "lf", 0.5, "rust"], [settings.get(CoreSettings.indentSize, "rust"), settings.get(CoreSettings.insertSpaces, "rust"),
      settings.get(mode, "rust"), settings.get(ratio, "rust"), settings.get(name, "rust")]);
    Assert.areEqual(2, settings.get(CoreSettings.indentSize, "python"));
    Expect.same([2, 0.5, 0.5], [settings.get(CoreSettings.indentSize, "c"), settings.get(ratio, "c"), settings.get(ratio, "d")]);
  }

  @TestMethod
  public letsAChildOverrideItsParentsValuesAndTellsListenersOnBothWhichIdsChanged(): void {
    const parent = new SettingRegistry();
    parent.declare(CoreSettings.insertSpaces);
    const child = new SettingRegistry(parent);
    const heard: string[][] = [];
    const listening = child.onChange(t => heard.push([...t]));

    parent.setUserValues({ [CoreSettings.insertSpaces.id]: false });
    Assert.areEqual(false, child.get(CoreSettings.insertSpaces));
    child.setUserValues({ "[go]": { [CoreSettings.insertSpaces.id]: true } });
    Assert.areEqual(true, child.get(CoreSettings.insertSpaces, "go"));
    parent.addLanguageDefaults({ "[go]": { [UNDECLARED_SETTING]: 8 } })[Symbol.dispose]();
    child.addLanguageDefaults({ "plain": 1 });
    listening[Symbol.dispose]();
    parent.setUserValues({});

    Expect.same([[CoreSettings.insertSpaces.id], [CoreSettings.insertSpaces.id], [UNDECLARED_SETTING], [UNDECLARED_SETTING]], heard);
    Assert.areEqual(CoreSettings.insertSpaces, child.find(CoreSettings.insertSpaces.id));
    Expect.same([CoreSettings.insertSpaces.id], child.all().select(t => t.id).toArray());
  }

  @TestMethod
  public refusesASecondDeclarationOfTheSameId(): void {
    const registries = Contexts.core();

    Assert.throws(() => registries.settings.declare(Setting.boolean(CoreSettings.insertSpaces.id, false, "Again.")), RegistrationExistsException);
  }
}
