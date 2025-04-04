/*
* Solar FLow component for FTUI version 3
*
* Copyright (c) 2025 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiSolarFlow extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiSolarFlow.properties, properties));

    this.flowElement = this.shadowRoot.querySelector('svg.solar-flow');
    this.solarElement = this.shadowRoot.querySelector('text.solar');
    this.batteryElement = this.shadowRoot.querySelector('text.battery');
    this.inverterElement = this.shadowRoot.querySelector('text.inverter');
    this.gridElement = this.shadowRoot.querySelector('text.grid');
    this.homeElement = this.shadowRoot.querySelector('text.home');

    this.solarAnimation = this.shadowRoot.querySelector('circle.solar animateMotion');
    this.batteryAnimation = this.shadowRoot.querySelector('circle.battery animateMotion');
    this.gridAnimation = this.shadowRoot.querySelector('circle.grid animateMotion');
    this.inverterAnimation = this.shadowRoot.querySelector('circle.inverter animateMotion');
    this.homeAnimation = this.shadowRoot.querySelector('circle.home animateMotion');
  }

  template() {
    return `
    <style> @import "components/solar/solar-flow.component.css"; </style>

        <svg class="solar-flow" viewBox="0 0 200 200">
          <!-- Define the filters for the shadows -->
          <defs>
            <filter id="greenBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feFlood flood-color="#0bec7c" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feFlood flood-color="rgba(0, 190, 124, 0.5)" result="glowColor"/>
              <feComposite in2="blur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="yellowBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feFlood flood-color="yellow" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="yellowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feFlood flood-color="rgba(255, 255, 0, 0.5)" result="glowColor"/>
              <feComposite in2="blur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>            
            <filter id="blueBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feFlood flood-color="#3498db" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="grayBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feFlood flood-color="#7f8c8d" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="grayGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
              <feFlood flood-color="rgba(85, 90, 91, 0.7)" result="glowColor"/>
              <feComposite in2="blur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

          </defs>

          <!-- Draw the circles -->
          <circle cx="60" cy="27" r="20" filter="url(#yellowBlur)" fill="rgb(51,51,51)" />
          <circle cx="140" cy="27" r="20" filter="url(#greenBlur)" fill="rgb(51,51,51)" />
          <circle cx="100" cy="100" r="20" filter="url(#grayBlur)" fill="rgb(51,51,51)" />
          <circle cx="60" cy="172" r="20" filter="url(#blueBlur)" fill="rgb(51,51,51)" />
          <circle cx="140" cy="172" r="20" filter="url(#grayBlur)" fill="rgb(51,51,51)" />

          <!-- Draw the curved lines -->
          <path id="path-solar" class="path solar" d="M80 29C98 29 94 29 95 81" />
          <path id="path-battery-in" class="path battery" d="M118 29C101 29 104 29 104 81" />
          <path id="path-battery-out" class="path battery" d="M104 81C104 29 101 29 118 29" />
          <path id="path-home" class="path home" d="M96 124C96 176 99 176 81 176" />
          <path id="path-grid-in" class="path grid" d="M119 176C101 176 104 176 104 124" />
          <path id="path-grid-out" class="path grid" d="M104 124C104 176 101 176 119 176" />

          <!-- Draw a linear path from grid to home -->
          <path id="path-grid-home" class="path grid-home" d="M120 184L77 184" />

          <!-- Draw the moving dots -->
          <circle r="3" class="dot solar" filter="url(#yellowGlow)">
            <animateMotion dur="2s" begin="0s" repeatCount="0" fill="freeze" >
              <mpath href="#path-solar" />
            </animateMotion>
          </circle>
          <circle r="3" class="dot battery" filter="url(#greenGlow)">
            <animateMotion dur="3s" begin="0s" repeatCount="0" fill="freeze" >
              <mpath href="#path-battery-in" />
            </animateMotion>
          </circle>
          <circle r="3" class="dot inverter" filter="url(#grayGlow)">
            <animateMotion dur="3s" begin="0s" repeatCount="0" fill="freeze" >
              <mpath href="#path-home" />
            </animateMotion>
          </circle>
          <circle r="3" class="dot grid" filter="url(#grayGlow)">
            <animateMotion dur="5s" begin="0s" repeatCount="0" fill="freeze" >
              <mpath href="#path-grid-in" />
            </animateMotion>
          </circle>
          <circle r="3" class="dot home" filter="url(#grayGlow)">
            <animateMotion dur="5s" begin="0s" repeatCount="indefinite" fill="freeze" >
              <mpath href="#path-grid-home" />
            </animateMotion>
          </circle>

          <!-- Draw the labels -->
          <text x="60" y="38" class="text solar" text-anchor="middle">0 W</text>
          <text x="140" y="38" class="text battery" text-anchor="middle">0 %</text>
          <text x="100" y="112" class="text inverter" text-anchor="middle">0 W</text>
          <text x="140" y="185" class="text grid" text-anchor="middle">0 W</text>
          <text x="60" y="185" class="text home" text-anchor="middle">0 W</text> 

          <!-- Draw the icons -->
          <path class="icon solar" d="M53.666 13C52.751 13 51.965 13.645 51.785 14.542L50.249 22.222C50.012 23.41 50.918 24.52 52.13 24.52l6.51 0 0 1.92-1.92 0c-.531 0-.96.429-.96.96s.429.96.96.96l5.76 0c.531 0 .96-.429.96-.96s-.429-.96-.96-.96l-1.92 0 0-1.92 6.51 0c1.212 0 2.121-1.107 1.884-2.298l-1.536-7.68C67.235 13.645 66.449 13 65.534 13L53.666 13zM57.827 14.92l3.546 0 .312 3.12-4.17 0L57.827 14.92zM56.069 18.04l-3.024 0L53.666 14.92l2.712 0L56.069 18.04zM52.754 19.48l3.168 0L55.613 22.6 52.13 22.6 52.754 19.48zm4.617 0 4.458 0 .312 3.12-5.082 0 .312-3.12zm5.904 0 3.168 0L67.07 22.6l-3.48 0L63.275 19.48zm2.88-1.44-3.024 0L62.819 14.92l2.712 0 .942-.189L65.534 14.92l.624 3.12z" />
          <path class="icon battery" d="M133 12H137M134 20.5H138M143 12H147M142 20.5H146M144 18.5V22.5M134.2 26H145.8C146.9201 26 147.4802 26 147.908 25.782 148.2843 25.5903 148.5903 25.2843 148.782 24.908 149 24.4802 149 23.9201 149 22.8V18.2C149 17.0799 149 16.5198 148.782 16.092 148.5903 15.7157 148.2843 15.4097 147.908 15.218 147.4802 15 146.9201 15 145.8 15H134.2C133.0799 15 132.5198 15 132.092 15.218 131.7157 15.4097 131.4097 15.7157 131.218 16.092 131 16.5198 131 17.0799 131 18.2V22.8C131 23.9201 131 24.4802 131.218 24.908 131.4097 25.2843 131.7157 25.5903 132.092 25.782 132.5198 26 133.0799 26 134.2 26Z" />
          <path class="icon inverter" d="M109 90H105.8174M109 94H106M109 98H105.8174M94.1826 90H91M96 88.1826V85M96 103 96 99.8174M100 88V85M100 103V100M104 88.1826V85M104 103V99.8174M94 94H91M94.1826 98H91M98.8 100H101.2C102.8802 100 103.7202 100 104.362 99.673 104.9265 99.3854 105.3854 98.9265 105.673 98.362 106 97.7202 106 96.8802 106 95.2V92.8C106 91.1198 106 90.2798 105.673 89.638 105.3854 89.0735 104.9265 88.6146 104.362 88.327 103.7202 88 102.8802 88 101.2 88H98.8C97.1198 88 96.2798 88 95.638 88.327 95.0735 88.6146 94.6146 89.0735 94.327 89.638 94 90.2798 94 91.1198 94 92.8V95.2C94 96.8802 94 97.7202 94.327 98.362 94.6146 98.9265 95.0735 99.3854 95.638 99.673 96.2798 100 97.1198 100 98.8 100ZM98 92H102V96H98V92Z" />
          <path class="icon home" d="M59.5 162.5 57 166H61L58.5 169.5M50 167.6V165.1301C50 163.9814 50 163.4071 50.148 162.8781 50.2792 162.4096 50.4947 161.9689 50.7841 161.5777 51.1107 161.1361 51.564 160.7835 52.4708 160.0783L55.0708 158.0561C56.4761 156.963 57.1787 156.4165 57.9546 156.2065 58.6392 156.0211 59.3608 156.0211 60.0454 156.2065 60.8213 156.4165 61.5239 156.9631 62.9292 158.0561L65.5292 160.0783C66.436 160.7835 66.8893 161.1361 67.2159 161.5777 67.5053 161.9689 67.7208 162.4096 67.8519 162.8781 68 163.4071 68 163.9814 68 165.1301V167.6C68 169.8402 68 170.9603 67.564 171.816 67.1805 172.5686 66.5686 173.1805 65.816 173.564 64.9603 174 63.8402 174 61.6 174H56.4C54.1598 174 53.0397 174 52.184 173.564 51.4314 173.1805 50.8195 172.5686 50.436 171.816 50 170.9603 50 169.8402 50 167.6Z"  />
          <path class="icon grid" d="M136.9631 158.2125h0L139.1242 155.7286A.2462.2222 0 01139.466 155.692a.2236.2018 0 01.0502.0483L141.619 158.2141l.0146.0175 3.969 1.6389a.2479.2237 0 01-.0826.4386H145.1036v.5088a.3029.2734 0 11-.6059 0V160.3048H144.1996v.5088a.3029.2734 0 01-.6059 0V160.3048H141.6692v1.0322L145.6026 162.9292a.2479.2237 0 01-.0826.4386H145.1036v.5424a.3029.2734 0 11-.6059 0V163.3634H144.1996v.5424a.3029.2734 0 11-.6059 0V163.3634H141.6692V165.6017l1.5714 3.1332a.2479.2237 0 01.0632.1199.0113.0102 0 000 0l1.7042 3.3979h1.0611v1.3495H142.6963v-1.3495H144.3406L139.756 169.1078H138.8018L134.2496 172.2599h1.62v1.3495H132.5v-1.3495H133.5692L136.9129 165.6003V163.3634H134.8263v.5424a.3029.2734 0 11-.6059 0V163.3634h-.324v.5424a.3046.2749 0 01-.6075 0V163.3634H133.0605a.2479.2237 0 01-.1004-.4268l3.9528-1.6215V160.3048H134.8263v.5088a.3029.2734 0 11-.6059 0V160.3048h-.324v.5088a.3046.2749 0 01-.6075 0V160.3048H133.0605A.2479.2237 0 01132.9568 159.8837l4.0063-1.6668ZM137.4086 164.9877l1.6087-1.6638L137.4442 161.6937H137.4086V164.9877ZM139.291 163.0403l1.296-1.3465H137.9918l1.296 1.3465Zm1.85-1.3465L139.5664 163.3239l1.6054 1.6638V161.6937ZM139.291 163.6075 137.5382 165.422H141.0439L139.291 163.6075ZM137.4086 160.9993l1.5082-1.139L137.4086 158.7214V160.9993Zm1.8824-1.4211 1.2474-.9415H138.0453l1.2458.9415Zm1.8808-.8524-1.505 1.136 1.505 1.139V158.7257Zm-1.8792 1.4196-1.458 1.1024h2.916l-1.458-1.1024ZM144.1057 171.5362 142.8858 169.1078H140.5708L144.1057 171.5362ZM137.9902 169.1078H135.6946l-1.2231 2.4358L137.9902 169.1078Zm4.1472-.4386L139.2927 167.0872 136.4479 168.656ZM138.818 166.8255l-1.5503-.8582L136.077 168.3446 138.818 166.8255Zm.4714-.2617 1.2555-.6944H138.0372l1.2555.6944Zm2.0185-.5936-1.5471.8553L142.5003 168.3402 141.3112 165.9702Zm.358-6.1113H144.3859L141.6692 158.736v1.1229ZM136.9129 158.7242 134.188 159.8589H136.9129V158.7242ZM141.6692 161.8253v1.0921H144.3665L141.6692 161.8253ZM136.9129 162.9174V161.8049L134.2026 162.9174ZM140.9483 158.1556 139.3153 156.2286 137.6419 158.1556Z"/>
</svg>`;
  }

  static get properties() {
    return {
      width: '100%',
      height: 'auto',
      solarPower: 0,
      maxSolarPower: 1200,
      soc: 100,
      batteryCurrent: 0,
      maxBatteryCurrent: 10,
      minBatteryCurrent: -10,
      inverterPower: 0,
      maxInverterPower: 800,
      homePower: 0,
      gridPower: 0,
      gridInputPower: 0,
      maxGridPower: 3000,
      maxHomePower: 3000,
      minHomePower: 30,
    }
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSolarFlow.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    switch (name) {
      case 'width':
      case 'height':
        console.log('setting', name, 'to', value);
        this.style[name] = value;
        break;
      case 'solar-power':
        this.updatePower('solar', value);
        this.updateAnimation('solar', value);
        break;
      case 'soc':
        this.updateSoc(value);
        break;
      case 'inverter-power':
        this.updatePower('inverter', value);
        this.updateAnimation('inverter', value);
        break;
      case 'home-power':
        this.updatePower('home', value);
        break;
      case 'grid-power':
        // - : inverter > grid
        // + : grid > home
        this.updatePower('grid', value);
        if (value < 0) {
          this.updateAnimation('grid', value);
          this.updateAnimation('home', 0);
        } else if (value >this.minHomePower) {
          this.updateAnimation('home', value);
          this.updateAnimation('grid', 0); 
        } else {
          this.updateAnimation('home', 0);
          this.updateAnimation('grid', 0);
        }
        break;
      case 'grid-input-power':
        // grid > inverter
        if (this.gridPower > 0) {
          console.log('------------- grind in', value);
          this.updateAnimation('grid', value);
        }
        break;
      case 'battery-current':
        this.updateAnimation('battery', value);
        break;
    }
  }

  updatePower(type, value) {
    const element = this[type + 'Element'];
    if (element) {
      element.textContent = `${value} W`;
    }
  }

  updateSoc(value) {
    const element = this.batteryElement;
    if (element) {
      element.textContent = `${value} %`;
    }
  }

  updateAnimation(type, value) {
    const animation = this[type + 'Animation'];
    if (animation) {
      const unit = type === 'battery' ? 'Current' : 'Power';
      const maxValue = this['max' + type.charAt(0).toUpperCase() + type.slice(1) + unit];
      const percent = Math.min(value / maxValue, 1);
      const duration = 5 - (4 * percent);
      const pathElement = animation.querySelector('mpath');
      animation.setAttribute('dur', `${Math.max(1, Math.round(duration))}s`);

      // set path to in or out
      if (type === 'battery' || type === 'grid') {
        if (value > 0 && !pathElement.getAttribute('href').includes('out')) {
          pathElement.setAttribute('href', `#path-${type}-out`);
        } if (value < 0 && !pathElement.getAttribute('href').includes('in')) {
          pathElement.setAttribute('href', `#path-${type}-in`);
        }
      }
      console.log('type', type, 'value', value, 'maxValue', maxValue, 'percent', percent, 'duration', duration);
      if (value !== 0) {
        if (!animation.parentElement.classList.contains('animated')) {
          console.log('beginning animation for ', type);
          // start animation
          animation.parentElement.classList.add('animated');
          animation.beginElement();
          animation.setAttribute('repeatCount', 'indefinite');
          
        }
      } else {
        console.log('ending animation for ', type);
        // end animation
        animation.setAttribute('repeatCount', '0');
        animation.parentElement.classList.remove('animated');
        animation.endElement();

      }
    } else {
      console.error('No animation found for', type);
    }
  }

}

window.customElements.define('ftui-solar-flow', FtuiSolarFlow);
