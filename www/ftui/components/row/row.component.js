/*
* Row component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiCell } from '../cell/cell.component.js';

export class FtuiRow extends FtuiCell {

  constructor() {
    super();
  }

  onConnected() {
    this.toggleAttribute('in-view-sheet', Boolean(this.closest('ftui-view-sheet')));
  }

  template() {
    return super.template() +
      `<style>
        :host {
          flex-direction: row;
          height: 100%;
          width: 100%;
        }
        :host([align-items~=top]) {
          align-items: start;
        }
        :host([align-items~=bottom]) {
          align-items: end;
        }
        :host([align-items~=left]) {
          justify-content: flex-start;
        }
        :host([align-items~=right]) {
          justify-content: flex-end;
        }

        :host([in-view-sheet]) {
          gap: 0.75em;
          align-items: stretch;
        }

        :host([in-view-sheet]) ::slotted(ftui-button) {
          flex: 1;
          --button-height: 2.6em;
          --border-radius: 0.9em;
          --padding-start: 0.8em;
          --padding-end: 0.8em;
          --button-solid-background: rgba(127, 127, 127, 0.14);
          --button-solid-background: color-mix(in srgb, var(--view-background-color) 18%, var(--view-item-background-color) 82%);
          --button-solid-color: var(--primary-color);
          --button-inner-background: rgba(127, 127, 127, 0.14);
          --button-inner-background: color-mix(in srgb, var(--view-background-color) 18%, var(--view-item-background-color) 82%);
          --button-inner-color: var(--primary-color);
          --button-active-background: rgba(0, 122, 255, 0.14);
          --button-active-background: color-mix(in srgb, var(--primary-color) 14%, var(--view-item-background-color));
          --button-inner-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }
      </style>`;
  }
}

window.customElements.define('ftui-row', FtuiRow);
