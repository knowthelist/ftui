/*
* Badge component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiLabel } from '../label/label.component.js';


export class FtuiBadge extends FtuiLabel {
  constructor() {
    super();
  }

  template() {
    return `
      <style>
      :host {
        --background: var(--primary-color, #3880ff);
        --color: var(--primary-contrast-color, #fff);
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        --padding-left: 0.3em;
        --padding-right: 0.3em;
        --padding-top: 0.2em;
        --padding-bottom: 0.2em;
        padding-top:var(--padding-top);
        padding-bottom:var(--padding-bottom);
        padding-left:var(--padding-left);
        padding-right:var(--padding-right);
        min-width: 1.5em;
        min-height: 1.5em;
        background: var(--background);
        color: var(--color);
        font-size: 1em;
        line-height: 1;
        text-align: center;
        white-space: nowrap;
        vertical-align: baseline
      }
      
      :host([color]:not([color=""])) {
        background: var(--color-base);
        color: var(--color-contrast)
      }
      
      :host([text^="0"]),
      :host(:empty:not([text])),
      :host([text=""]) {
        display: none
      }
      
      :host {
        border-radius: 0.75em;
      }
      </style>
      <slot></slot><slot name="content"></slot>
      `;
  }

}

window.customElements.define('ftui-badge', FtuiBadge);
