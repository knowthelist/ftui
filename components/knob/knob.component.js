/* 
* Knob component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

class FtuiKnob extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiKnob.properties, properties));

    if ( !this.hasScale && !this.hasScaleText && !this.hasValueText && !this.hasArc && !this.hasNeedle) {
      this.hasArc = true;
    }

    this.svg = this.shadowRoot.querySelector('.typeRange');
    this.outline = this.shadowRoot.querySelector('.outline');
    this.fill = this.shadowRoot.querySelector('.fill');
    this.scale = this.shadowRoot.querySelector('.scale');
    this.needle = this.shadowRoot.querySelector('.needle');

    this.rangeAngle = Math.abs(parseInt(this.endAngle) - parseInt(this.startAngle));
    this.radian = Math.PI / 180;

    this.NS = 'http://www.w3.org/2000/svg';

    this.W = parseInt(window.getComputedStyle(this.svg, null).getPropertyValue('width'));
    this.H = parseInt(window.getComputedStyle(this.svg, null).getPropertyValue('height'));

    // ~~(..) is a faster Math.floor 
    this.centerX = ~~(this.W / 2);
    this.centerY = ~~(this.H / 2) + this.offsetY;
    this.radius = ~~(this.centerX / (this.hasScaleText ? 1.5 : 1.1));

    this.isDragging = false;

    this.svg.addEventListener('touchstart', (evt) => this.onDownEvent(evt), false);
    this.svg.addEventListener('mousedown', (evt) => this.onDownEvent(evt), false);
    this.svg.addEventListener('touchend', (evt) => this.onOutEvent(evt), false);
    this.svg.addEventListener('mouseup', (evt) => this.onOutEvent(evt), false);
    this.svg.addEventListener('mouseout', (evt) => this.onOutEvent(evt), false);
    this.svg.addEventListener('touchmove', (evt) => this.onMoveEvent(evt), false);
    this.svg.addEventListener('mousemove', (evt) => this.onMoveEvent(evt), false);

    this.draw(this.valueToAngle(this.value));
  }

  template() {
    return `
    <style> @import "components/knob/knob.component.css"</style>
    <svg class="typeRange" height="${this.height}" width="${this.width}" focusable="false">
   
      <g class="scale" stroke="gray"></g>
   
      <path class="outline" d="" fill="none" stroke-width="${this.strokeWidth}" />
      <path class="fill" d="" fill="none" stroke-width="${this.strokeWidth}" />
      <polygon class="needle" />
   
    </svg>`;
  }

  static get properties() {
    return {
      startAngle: -210,
      endAngle: 30,
      value: -1,
      min: 0,
      max: 100,
      offsetY: 20,
      height: '150',
      width: '150',
      strokeWidth: 15,
      debounce: 200,
      hasScale: false,
      hasScaleText: false,
      hasValueText: false,
      hasArc: false,
      hasNeedle: false,
      color: 'primary',
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiKnob.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (!this.isDragging) {
        this.draw(this.valueToAngle(this.value));
      }
    }
  }

  // DOM event handler
  onOutEvent(evt) {
    evt.preventDefault();
    this.isDragging = false;
  }

  onDownEvent(evt) {
    evt.preventDefault();
    this.isDragging = true;
    const mouseAngle = this.getMouseAngle(this.svg, evt);
    this.onChange(mouseAngle);
  }

  onMoveEvent(evt) {
    evt.preventDefault();
    if (this.isDragging) {
      const mouseAngle = this.getMouseAngle(this.svg, evt);
      this.onChange(mouseAngle);
    }
  }

  onChange(angle) {
    if (this.draw(angle)) {
      this.value = this.angleToValue(angle);
    }
  }

  draw(angle) {
    if ((angle <= this.endAngle || angle >= 360 + this.startAngle) && angle >= this.startAngle) {
      this.drawScale();
      if (this.hasArc) {
        this.drawArc(angle);
      } else {
        this.clearElement(this.fill);
        this.clearElement(this.outline);
      }
      if (this.hasValueText) {
        this.drawValue(this.angleToValue(angle));
      }
      if (this.hasNeedle) {
        this.drawNeedle(angle);
      }

      return true;
    }
    return false;
  }

  // draw functions

  drawScale() {
    const upperRadius = this.radius + 5;
    const lowerRadius = this.radius - this.strokeWidth
    const textRadius = this.radius + this.strokeWidth + 4

    this.clearRect(this.scale);
    if (this.hasScale) {
      for (let a = this.startAngle; a <= this.endAngle; a += this.rangeAngle / 10) {
        // ticks
        const angleInRadians = a * this.radian;
        const scaleLine = document.createElementNS(this.NS, 'line');
        const scaleLineObj = {
          class: 'scale',
          x1: this.centerX + upperRadius * Math.cos(angleInRadians),
          y1: this.centerY + upperRadius * Math.sin(angleInRadians),
          x2: this.centerX + lowerRadius * Math.cos(angleInRadians),
          y2: this.centerY + lowerRadius * Math.sin(angleInRadians)
        };
        this.setSVGAttributes(scaleLine, scaleLineObj);
        this.scale.appendChild(scaleLine);

        if (this.hasScaleText) {
          // text
          const scaleText = document.createElementNS(this.NS, 'text');
          const scaleTextObj = {
            class: 'scale',
            x: this.centerX + textRadius * Math.cos(a * this.radian),
            y: this.centerY + textRadius * Math.sin(a * this.radian)
          };
          this.setSVGAttributes(scaleText, scaleTextObj);
          scaleText.textContent = this.angleToValue(a);
          this.scale.appendChild(scaleText);
        }
      }
    }
  }

  drawArc(angle) {
    this.fill.setAttributeNS(null, 'd',
      this.describeArc(this.centerX, this.centerY, this.radius - 5, this.startAngle + 360, angle));
    this.outline.setAttributeNS(null, 'd',
      this.describeArc(this.centerX, this.centerY, this.radius - 5, this.startAngle + 360, this.endAngle + 360));
  }

  drawNeedle(angle) {

    const lowerRadius = (this.hasValueText || this.hasValueText === 'true')
      ? this.radius * 0.4 : this.radius * 0.1;
    const expansion = (this.hasValueText || this.hasValueText === 'true')
      ? 3 : 15;

    const nx1 = this.centerX + lowerRadius * Math.cos((angle - expansion) * this.radian);
    const ny1 = this.centerY + lowerRadius * Math.sin((angle - expansion) * this.radian);

    const nx2 = this.centerX + this.radius * Math.cos((angle - 3) * this.radian);
    const ny2 = this.centerY + this.radius * Math.sin((angle - 3) * this.radian);

    const nx3 = this.centerX + this.radius * Math.cos((angle + 3) * this.radian);
    const ny3 = this.centerY + this.radius * Math.sin((angle + 3) * this.radian);

    const nx4 = this.centerX + lowerRadius * Math.cos((angle + expansion) * this.radian);
    const ny4 = this.centerY + lowerRadius * Math.sin((angle + expansion) * this.radian);

    const points = nx1 + ',' + ny1 + ' ' + nx2 + ',' + ny2 + ' ' + nx3 + ',' + ny3 + ' ' + nx4 + ',' + ny4;
    this.needle.setAttributeNS(null, 'points', points);
  }

  drawValue(value) {
    const scaleText = document.createElementNS(this.NS, 'text');
    const scaleTextObj = {
      class: 'value',
      x: this.centerX,
      y: this.centerY,
      'alignment-baseline': 'middle'
    };
    this.setSVGAttributes(scaleText, scaleTextObj);
    scaleText.textContent = value;
    this.scale.appendChild(scaleText);
  }

  // helpers

  polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees) * this.radian;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  valueToAngle(val) {
    const min = parseInt(this.min);
    const max = parseInt(this.max);
    const newVal = (!isNaN(val) && val >= min && val <= max) ? parseInt(val) : min;
    return ((newVal - min) * this.rangeAngle / (max - min) - this.rangeAngle) + this.endAngle;
  }

  angleToValue(angle) {
    const min = parseInt(this.min);
    const max = parseInt(this.max);
    let normAngle = (angle - 360 >= this.startAngle) ? angle - 360 : angle;
    normAngle = (normAngle < this.startAngle) ? this.startAngle : (normAngle > this.endAngle) ? this.endAngle : normAngle;
    const value = Math.round((((normAngle - this.startAngle) * (max - min)) / this.rangeAngle) + min);

    return value
  }

  describeArc(x, y, radius, startArc, endArc) {
    const start = this.polarToCartesian(x, y, radius, endArc);
    const end = this.polarToCartesian(x, y, radius, startArc);

    let largeArcFlag = '0';
    if (endArc >= startArc) {
      largeArcFlag = endArc - startArc <= 180 ? '0' : '1';
    } else {
      largeArcFlag = (endArc + 360.0) - startArc <= 180 ? '0' : '1';
    }

    const d = [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');

    return d;
  }

  getMouseAngle(elem, evt) {
    const clientRect = elem.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    const x = Math.round(clientX - clientRect.left - this.centerX);
    const y = Math.round(clientY - clientRect.top - this.centerY);
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    angle = angle < 0 ? angle + 360 : angle;
    return Math.floor(angle);
  }

  clearRect(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  clearElement(node) {
    node.parentNode?.removeChild(node);
  }

  setSVGAttributes(elem, oAtt) {
    for (const prop in oAtt) {
      elem.setAttributeNS(null, prop, oAtt[prop]);
    }
  }
}

window.customElements.define('ftui-knob', FtuiKnob);
