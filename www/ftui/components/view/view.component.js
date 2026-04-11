/*
* View component
*
* for FTUI version 3
*
* Copyright (c) 2020-2024 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { supportsPassive } from '../../modules/ftui/ftui.helper.js';
import { backendService } from '../../modules/ftui/backend.service.js';

export class FtuiView extends FtuiElement {

  constructor() {
    super(FtuiView.properties);

    const header = this.querySelector('ftui-view-toolbar');
    this.content = this.shadowRoot.querySelector('.content');
    this.pullIndicator = this.shadowRoot.querySelector('.pull-indicator');
    header && header.setAttribute('slot', 'header');

    this.initialX = null;
    this.initialY = null;
    this.currentPullDistance = 0;
    this.pullDistanceThreshold = 72;
    this.pullMaxDistance = 132;
    this.isPulling = false;
    this.isRefreshing = false;

    const usePassive = supportsPassive();
    const touchOptions = usePassive ? { passive: true } : false;

    this.addEventListener('touchstart', this.startTouch, touchOptions);
    this.addEventListener('touchmove', this.moveTouch, touchOptions);
    this.addEventListener('touchend', this.endTouch, touchOptions);
    this.addEventListener('touchcancel', this.endTouch, touchOptions);
  }

  template() {
    return `
          <style>
            :host {
              background: var(--view-background-color);
              will-change: transform;
              width: 100vw;
              height: 100vh;
              position: fixed;
              left: 0;
              top: 0;
              transform: translateX(0);
              transition: transform 0.3s cubic-bezier(0.465, 0.183, 0.153, 0.946);
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            :host([outside]) {
              transform: translateX(100vw);
            }
            .content {
              padding-top: 44px;
              height: 100vh;
              overflow: scroll;
              overscroll-behavior-y: contain;
              -webkit-overflow-scrolling: touch;
              transition: transform 0.2s ease;
            }
            .pull-indicator {
              position: absolute;
              left: 50%;
              top: 44px;
              transform: translate(-50%, calc(-100% + var(--pull-indicator-offset, 0px)));
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5em;
              min-width: 9em;
              padding: 0.5em 0.9em;
              border-radius: 999px;
              border: 1px solid rgba(0, 0, 0, 0.08);
              background: var(--view-item-background-color);
              color: var(--primary-color, currentColor);
              box-shadow: 0 0.2em 0.8em rgba(0, 0, 0, 0.18);
              font: var(--text-font);
              font-size: 0.85em;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.2s ease, transform 0.2s ease;
              z-index: 2;
            }
            .pull-indicator::before {
              content: '';
              width: 0.9em;
              height: 0.9em;
              border-radius: 50%;
              border: 0.15em solid currentColor;
              border-right-color: transparent;
              box-sizing: border-box;
              opacity: 0.65;
              transform: rotate(var(--pull-indicator-rotation, 0deg));
            }
            :host([pull-down-refresh]) .pull-indicator {
              opacity: var(--pull-indicator-opacity, 0);
            }
            :host([pull-down-refresh][refreshing]) .pull-indicator {
              opacity: 1;
            }
            :host([pull-down-refresh][refreshing]) .pull-indicator::before {
              animation: pull-spin 0.75s linear infinite;
              opacity: 1;
            }
            @keyframes pull-spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          </style>
          <slot name="header"></slot>
          <div class="pull-indicator">${this.pullDownText}</div>
          <div class="content">
            <slot></slot>
          </div>`;
  }

  static get properties() {
    return {
      pullDownRefresh: false,
      pullDownText: 'Pull to refresh',
      releaseText: 'Release to refresh',
      refreshingText: 'Refreshing',
      pullDownThreshold: 72,
      pullDownMax: 132,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiView.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.pullDistanceThreshold = this.pullDownThreshold || 72;
    this.pullMaxDistance = this.pullDownMax || 132;
  }

  onAttributeChanged(name, value) {
    if (!this.pullIndicator) {
      return;
    }

    switch (name) {
      case 'pull-down-text':
        if (!this.isPulling && !this.isRefreshing) {
          this.pullIndicator.textContent = value;
        }
        break;
      case 'release-text':
        if (this.isPulling && this.currentPullDistance >= this.pullDistanceThreshold) {
          this.pullIndicator.textContent = value;
        }
        break;
      case 'refreshing-text':
        if (this.isRefreshing) {
          this.pullIndicator.textContent = value;
        }
        break;
      case 'pull-down-threshold':
        this.pullDistanceThreshold = Number(value) || 72;
        break;
      case 'pull-down-max':
        this.pullMaxDistance = Number(value) || 132;
        break;
    }
  }

  startTouch(e) {
    if (!this.pullDownRefresh || this.isRefreshing || e.touches.length !== 1) {
      return;
    }

    this.initialX = e.touches[0].clientX;
    this.initialY = e.touches[0].clientY;
    this.isPulling = this.content.scrollTop <= 0;
    this.currentPullDistance = 0;
  }

  moveTouch(e) {
    if (!this.pullDownRefresh || this.isRefreshing || this.initialX === null || this.initialY === null) {
      return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = this.initialX - currentX;
    const diffY = this.initialY - currentY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      this.resetPullState();
      return;
    }

    if (!this.isPullDown(this.content.scrollTop, diffY)) {
      if (diffY > 0) {
        this.resetPullState();
      }
      return;
    }

    this.isPulling = true;
    this.currentPullDistance = Math.min(Math.abs(diffY) * 0.5, this.pullMaxDistance);
    this.renderPullState();
  }

  endTouch() {
    if (!this.pullDownRefresh) {
      return;
    }

    if (this.isPulling && this.currentPullDistance >= this.pullDistanceThreshold && !this.isRefreshing) {
      this.triggerRefresh();
    } else if (!this.isRefreshing) {
      this.resetPullState();
    }

    this.initialX = null;
    this.initialY = null;
  }

  isPullDown(scrollTop, diffY) {
    return scrollTop <= 0 && diffY < 0;
  }

  renderPullState() {
    const progress = Math.min(this.currentPullDistance / this.pullDistanceThreshold, 1);
    const rotation = Math.round(progress * 180);
    const isReady = this.currentPullDistance >= this.pullDistanceThreshold;

    this.style.setProperty('--pull-indicator-offset', `${this.currentPullDistance}px`);
    this.style.setProperty('--pull-indicator-opacity', Math.max(progress, 0.15));
    this.style.setProperty('--pull-indicator-rotation', `${rotation}deg`);
    this.content.style.transform = `translateY(${this.currentPullDistance}px)`;
    this.pullIndicator.textContent = isReady ? this.releaseText : this.pullDownText;
  }

  resetPullState() {
    this.isPulling = false;
    this.currentPullDistance = 0;
    this.style.setProperty('--pull-indicator-offset', '0px');
    this.style.setProperty('--pull-indicator-opacity', '0');
    this.style.setProperty('--pull-indicator-rotation', '0deg');
    this.content.style.transform = '';

    if (!this.isRefreshing) {
      this.pullIndicator.textContent = this.pullDownText;
    }
  }

  async triggerRefresh() {
    this.isRefreshing = true;
    this.isPulling = false;
    this.currentPullDistance = this.pullDistanceThreshold;
    this.setAttribute('refreshing', '');
    this.style.setProperty('--pull-indicator-offset', `${this.pullDistanceThreshold}px`);
    this.style.setProperty('--pull-indicator-opacity', '1');
    this.content.style.transform = `translateY(${this.pullDistanceThreshold}px)`;
    this.pullIndicator.textContent = this.refreshingText;

    const refreshEvent = new CustomEvent('ftuiRefresh', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    if (this.dispatchEvent(refreshEvent)) {
      backendService.forceRefresh();
    }

    await new Promise(resolve => window.setTimeout(resolve, 600));

    this.removeAttribute('refreshing');
    this.isRefreshing = false;
    this.resetPullState();
    this.initialX = null;
    this.initialY = null;
  }
}

window.customElements.define('ftui-view', FtuiView);
