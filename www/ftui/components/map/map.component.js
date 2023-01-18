/*
* Map component

* for FTUI version 3
*
* Copyright (c) 2023 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { isVisible } from '../../modules/ftui/ftui.helper.js';

export class FtuiMap extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiMap.properties, properties));

    this.map = {};
    this.canvas = this.shadowRoot.querySelector('#map-canvas');

    document.addEventListener('ftuiVisibilityChanged', () => {
      if (isVisible(this)) {
        this.refresh();
      }
    }, false);

    if (isVisible(this)) {
      this.refresh();
    }
  }

  template() {
    return `
    <style>
    :host { height: 100%;
      width: 100%;}
    #map-canvas {
      height: ${this.height};
      width: ${this.width};
    }
    </style>
    <div id="map-canvas"></div>`;
  }

  static get properties() {
    return {
      height: '100%',
      width: '100%',
      latitude: 0,
      longitude: 0,
      zoom: 11,
      traffic: false,
      transit: false,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiMap.properties), ...super.observedAttributes];
  }

  refresh() {
    // eslint-disable-next-line no-undef
    const maps = google.maps;
    const mapOptions = {
      zoom: this.zoom,
      disableDefaultUI: true,
      center: new maps.LatLng(this.latitude, this.longitude),
      mapTypeId: maps.MapTypeId.ROADMAP,
    };
    this.map = new maps.Map(this.canvas, mapOptions);

    let layer;
    if (this.traffic) {
      layer = new maps.TrafficLayer();
    }
    if (this.transit) {
      layer = new maps.TransitLayer();
    }
    if (layer) {
      layer.setMap(this.map);
    }
  }

}

window.initMap = function(){}
const metaKey = document.querySelector('meta[name=\'maps_api_key\']');
const key = metaKey ? metaKey.getAttribute('content') : '';
const js = document.createElement('script');
js.type = 'text/javascript';
js.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap`;
js.onload = ()=> {
  window.customElements.define('ftui-map', FtuiMap);
}
document.head.appendChild(js);
