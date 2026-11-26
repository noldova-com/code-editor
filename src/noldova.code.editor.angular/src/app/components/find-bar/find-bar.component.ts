/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { afterNextRender, Component, ElementRef, input, type InputSignal, output, type OutputEmitterRef, signal, type Signal, viewChild,
  type WritableSignal } from "@angular/core";
import { Required, SearchQuery } from "@noldova/code.editor";
import { IconButtonComponent, TextFieldComponent } from "@noldova/ui.components.angular";

import { Resources } from "../../../resources.ts";

@Component({
  selector: "noldova-find-bar",
  imports: [IconButtonComponent, TextFieldComponent],
  templateUrl: "./find-bar.component.html",
  styleUrl: "./find-bar.component.css",
  host: {
    "class": Resources.findBarClass
  }
})
export class FindBarComponent {
  private readonly findField: Signal<ElementRef<HTMLInputElement>> = viewChild.required<string, ElementRef<HTMLInputElement>>("find", { read: ElementRef });
  private readonly replaceField: Signal<ElementRef<HTMLInputElement> | undefined> = viewChild<string, ElementRef<HTMLInputElement>>("replaceField", { read: ElementRef });

  public readonly seed: InputSignal<string> = input<string>(Resources.empty);
  public readonly status: InputSignal<string> = input.required<string>();
  public readonly replacing: InputSignal<boolean> = input<boolean>(false);
  public readonly queryChange: OutputEmitterRef<SearchQuery> = output<SearchQuery>();
  public readonly next: OutputEmitterRef<void> = output<void>();
  public readonly previous: OutputEmitterRef<void> = output<void>();
  public readonly replace: OutputEmitterRef<string> = output<string>();
  public readonly replaceAll: OutputEmitterRef<string> = output<string>();
  public readonly dismiss: OutputEmitterRef<void> = output<void>();

  protected readonly text: WritableSignal<string> = signal<string>(Resources.empty);
  protected readonly caseSensitive: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly wholeWord: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly regex: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly replacement: WritableSignal<string> = signal<string>(Resources.empty);
  protected readonly resources: typeof Resources = Resources;

  public constructor() {
    afterNextRender(() => this.open(this.seed()));
  }

  public open(text: string): void {
    this.text.set(text);
    this.emitQuery();
    const field: HTMLInputElement = this.findField().nativeElement;
    field.value = text;
    field.focus();
    field.select();
  }

  protected onText(): void {
    this.text.set(this.findField().nativeElement.value);
    this.emitQuery();
  }

  protected onReplacement(): void {
    this.replacement.set(Required.value(this.replaceField()).nativeElement.value);
  }

  protected toggle(option: WritableSignal<boolean>): void {
    option.update(t => !t);
    this.emitQuery();
  }

  protected onFindKey(event: KeyboardEvent): void {
    if (event.key === Resources.keyEnter) {
      event.preventDefault();
      if (event.shiftKey)
        this.previous.emit();
      else
        this.next.emit();
    } else if (event.key === Resources.keyEscape) {
      event.preventDefault();
      this.dismiss.emit();
    }
  }

  protected onReplaceKey(event: KeyboardEvent): void {
    if (event.key === Resources.keyEnter) {
      event.preventDefault();
      this.replace.emit(this.replacement());
    } else if (event.key === Resources.keyEscape) {
      event.preventDefault();
      this.dismiss.emit();
    }
  }

  private emitQuery(): void {
    this.queryChange.emit(new SearchQuery(this.text(), this.regex(), this.caseSensitive(), this.wholeWord()));
  }
}
