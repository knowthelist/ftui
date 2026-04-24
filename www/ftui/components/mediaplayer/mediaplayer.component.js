/*
* Mediaplayer component for FTUI version 3
*
* Copyright (c) 2026 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/
import { FtuiElement } from '../element.component.js';
import { config } from '../../config.js';
import { getStylePropertyValue, debounce } from '../../modules/ftui/ftui.helper.js';

export class FtuiMediaplayer extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiMediaplayer.properties, properties));

    this.cardElement = this.shadowRoot.querySelector('.card');
    this.labelElement = this.shadowRoot.querySelector('.device-label');
    this.titleElement = this.shadowRoot.querySelector('.media-title');
    this.subtitleElement = this.shadowRoot.querySelector('.media-subtitle');
    this.artworkElement = this.shadowRoot.querySelector('.artwork');
    this.artworkImageElement = this.shadowRoot.querySelector('.artwork-image');
    this.volumeInputElement = this.shadowRoot.querySelector('.volume-input');
    this.volumeValueElement = this.shadowRoot.querySelector('.volume-value');
    this.progressInputElement = this.shadowRoot.querySelector('.progress-input');
    this.progressPositionElement = this.shadowRoot.querySelector('.progress-position');
    this.progressDurationElement = this.shadowRoot.querySelector('.progress-duration');
    this.debouncedVolumeSubmit = debounce(function(value) {
      this.submitChange('volume', value);
    }, this);
    this.debouncedSeekSubmit = debounce(function(value) {
      this.submitChange('seek', value);
    }, this);
    this.pickerButtonElement = this.shadowRoot.querySelector('.picker-trigger');
    this.badgeElement = this.shadowRoot.querySelector('.selection-badge');
    this.pickerBackdropElement = this.shadowRoot.querySelector('.picker-backdrop');
    this.pickerListElement = this.shadowRoot.querySelector('.picker-list');
    this.emptyStateElement = this.shadowRoot.querySelector('.picker-empty');
    this.selectAllElement = this.shadowRoot.querySelector('.picker-select-all');
    this.cancelButtonElements = Array.from(this.shadowRoot.querySelectorAll('.picker-cancel'));
    this.applyButtonElement = this.shadowRoot.querySelector('.picker-apply');

    this.currentArtworkUrl = null;
    this.currentArtworkObjectUrl = '';
    this.artworkLoaded = false;
    this.dynamicTheme = null;
    this.draftselectedplayers = [];
    this.paletteToken = 0;
    this.artworkRequestToken = 0;
    this.boundUpdatePickerPosition = this.updatePickerPosition.bind(this);
    this.boundUpdateCardScale = this.updateCardScale.bind(this);

    this.shadowRoot.addEventListener('click', this.onControlClick.bind(this));
    this.artworkImageElement.addEventListener('load', this.onArtworkLoad.bind(this));
    this.artworkImageElement.addEventListener('error', this.onArtworkError.bind(this));
    this.volumeInputElement.addEventListener('input', this.onVolumeInput.bind(this));
    this.progressInputElement.addEventListener('input', this.onProgressInput.bind(this));
    this.pickerButtonElement.addEventListener('click', this.openPicker.bind(this));
    this.pickerBackdropElement.addEventListener('click', this.onPickerBackdropClick.bind(this));
    this.selectAllElement.addEventListener('click', this.selectAllPlayers.bind(this));
    this.cancelButtonElements.forEach(function(button) {
      button.addEventListener('click', this.closePicker.bind(this));
    }.bind(this));
    this.applyButtonElement.addEventListener('click', this.applyPlayerSelection.bind(this));
    this.pickerListElement.addEventListener('click', this.onPickerListClick.bind(this));

    this.artworkElement.classList.add('is-empty');
    this.applyTheme(this.createDefaultTheme());

    this._positionBase = 0;
    this._positionTimestamp = 0;
    this._positionTicker = null;
    this.boundTickPosition = this._tickPosition.bind(this);
  }

  template() {
    return `
      <style> @import "components/mediaplayer/mediaplayer.component.css"; </style>
      <div class="card">
        <div class="device-row">
          <span class="device-icon">
            <span class="device-icon-base">
              <svg class="device-icon-svg" viewBox="90 -960 850 850" aria-hidden="true">
                <path class="device-shape" d="M680-80H280q-33 0-56.5-23.5T200-160v-640q0-33 23.5-56.5T280-880h400q33 0 56.5 23.5T760-800v640q0 33-23.5 56.5T680-80Zm0-80v-640H280v640h400ZM536.5-623.5Q560-647 560-680t-23.5-56.5Q513-760 480-760t-56.5 23.5Q400-713 400-680t23.5 56.5Q447-600 480-600t56.5-23.5ZM593-247q47-47 47-113t-47-113q-47-47-113-47t-113 47q-47 47-47 113t47 113q47 47 113 47t113-47Zm-169.5-56.5Q400-327 400-360t23.5-56.5Q447-440 480-440t56.5 23.5Q560-393 560-360t-23.5 56.5Q513-280 480-280t-56.5-23.5ZM280-800v640-640Z"/>
                <circle class="device-state-bubble" cx="698" cy="-262" r="128"></circle>
                <path class="device-state-play" d="M660-346v168l114-84-114-84Z"/>
                <path class="device-state-pause" d="M635-356h42v188h-42v-188Zm82 0h42v188h-42v-188Z"/>
              </svg>
            </span>
          </span>
          <span class="device-meta">
            <span class="device-label"></span>
          </span>
        </div>

        <div class="content-row">
          <div class="text-column">
            <div class="media-title"></div>
            <div class="media-subtitle"></div>
          </div>
        </div>

        <div class="artwork-row">
          <div class="artwork-shell">
            <div class="artwork">
              <img class="artwork-image" alt="" />
              <span class="artwork-fallback">
                <svg viewBox="0 -960 960 960"><path d="M127-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T320-418v-342l480-80v480q0 66-47 113t-113 47q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T720-498v-165l-320 63v320q0 66-47 113t-113 47q-66 0-113-47Z"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div class="controls controls-mini">
          <button class="control-button" type="button" aria-label="Previous" data-action="previous">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>
          <button class="control-button play-toggle" type="button" aria-label="Start playback" data-action="toggle">
            <span class="icon-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
            <span class="icon-pause"><svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></span>
          </button>
          <button class="control-button" type="button" aria-label="Next" data-action="next">
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <div class="progress-row">
          <input class="progress-input" type="range" min="0" max="100" value="0" step="1" />
          <div class="progress-times">
            <span class="progress-position">0:00</span>
            <span class="progress-duration">0:00</span>
          </div>
        </div>

        <div class="controls controls-maxi">
          <button class="control-button" type="button" aria-label="Previous" data-action="previous">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>
          <button class="control-button play-toggle" type="button" aria-label="Start playback" data-action="toggle">
            <span class="icon-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
            <span class="icon-pause"><svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></span>
          </button>
          <button class="control-button" type="button" aria-label="Next" data-action="next">
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <div class="volume-row">
          <span class="volume-icon">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          </span>
          <input class="volume-input" type="range" />
          <span class="volume-value"></span>
        </div>

        <div class="footer-actions">
          <button class="footer-button picker-trigger" type="button" aria-label="Select players">
            <span class="selection-badge is-hidden"></span>
            <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 8a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81A2.99 2.99 0 0 0 6 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 2.99 2.99 0 0 0 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z"/></svg>
          </button>
        </div>

        <div class="picker-backdrop">
          <div class="picker-sheet">
            <div class="picker-header">
              <button class="picker-close picker-cancel" type="button" aria-label="Close">
                <svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
              <span class="picker-title">Players</span>
              <button class="picker-select-all" type="button">Select all</button>
            </div>
            <div class="picker-list"></div>
            <div class="picker-empty">No players available</div>
            <div class="picker-actions">
              <button class="picker-cancel" type="button">Cancel</button>
              <button class="picker-apply" type="button">Apply</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      variant: 'mini',
      label: '',
      title: '',
      subtitle: '',
      artwork: '',
      state: 'paused',
      action: '',
      volume: 35,
      volumemin: 0,
      volumemax: 100,
      volumestep: 1,
      volumescale: 1,
      position: 0,
      duration: 0,
      seek: 0,
      playerlist: '',
      selectedplayers: '',
      currentplayer: '',
      delimiter: '',
      color: '',
      backgroundcolor: '',
    };
  }

  static get observedAttributes() {
    return [].concat(Object.keys(FtuiMediaplayer.properties), super.observedAttributes).filter(function(attribute, index, allAttributes) {
      return allAttributes.indexOf(attribute) === index;
    });
  }

  onConnected() {
    window.addEventListener('resize', this.boundUpdateCardScale);
    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.boundUpdateCardScale);
    window.removeEventListener('resize', this.boundUpdatePickerPosition);
    window.removeEventListener('scroll', this.boundUpdatePickerPosition, true);
    this.revokeArtworkObjectUrl();
    this._stopPositionTicker();
  }

  onAttributeChanged(name) {
    if (['hidden', 'disabled', 'readonly', 'margin', 'padding'].indexOf(name) > -1) {
      return;
    }
    if (name === 'volume' && this.isVolumeInteracting) {
      return;
    }
    if ((name === 'position' || name === 'duration') && this.isProgressInteracting) {
      return;
    }
    // Sync position ticker when position or state changes without full re-render
    if (name === 'position' && !this.isProgressInteracting) {
      this._syncPositionBase();
      if (!this.isPlaying()) {
        this._stopPositionTicker();
      }
      return;
    }
    this.render();
  }

  onControlClick(event) {
    var button = event.target.closest('[data-action]');

    if (!button) {
      return;
    }

    this.onAction(button.getAttribute('data-action'));
  }

  onPickerBackdropClick(event) {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.closePicker();
  }

  onAction(action) {
    var targetAction = action;

    if (action === 'toggle') {
      targetAction = this.isPlaying() ? 'pause' : 'play';
    }

    this.submitChange('action', targetAction);
  }

  onVolumeInput() {
    var scale = this.toNumber(this.volumescale, 1) || 1;
    var displayValue = Number(this.volumeInputElement.value);
    this.volumeValueElement.textContent = this.formatVolume(displayValue, this.toNumber(this.volumemax, 100));
    var outValue = scale === 1 ? displayValue : Math.round(displayValue / scale * 1000) / 1000;

    this.isVolumeInteracting = true;
    clearTimeout(this.volumeInteractTimeout);
    this.volumeInteractTimeout = setTimeout(() => {
      this.isVolumeInteracting = false;
    }, 500);

    this.debouncedVolumeSubmit(200, outValue);
  }

  onProgressInput() {
    var pct = Number(this.progressInputElement.value);
    var durSec = this.toNumber(this.duration, 0);
    var seekSec = durSec > 0 ? Math.round(pct / 100 * durSec) : 0;

    this.progressInputElement.style.setProperty('--progress-pct', pct.toFixed(2) + '%');
    this.progressPositionElement.textContent = this.formatTime(seekSec);

    this.isProgressInteracting = true;
    clearTimeout(this.progressInteractTimeout);
    this.progressInteractTimeout = setTimeout(function() {
      this.isProgressInteracting = false;
    }.bind(this), 600);

    this.debouncedSeekSubmit(200, seekSec);
  }

  _syncPositionBase() {
    this._positionBase = this.toNumber(this.position, 0);
    this._positionTimestamp = Date.now();
  }

  _startPositionTicker() {
    if (this._positionTicker) {
      return;
    }
    this._positionTicker = setInterval(this.boundTickPosition, 1000);
  }

  _stopPositionTicker() {
    if (this._positionTicker) {
      clearInterval(this._positionTicker);
      this._positionTicker = null;
    }
  }

  _tickPosition() {
    if (this.isProgressInteracting) {
      return;
    }
    var elapsed = (Date.now() - this._positionTimestamp) / 1000;
    var durSec = this.toNumber(this.duration, 0);
    var posSec = Math.min(this._positionBase + elapsed, durSec || Infinity);
    this._paintProgress(posSec, durSec);
    if (durSec > 0 && posSec >= durSec) {
      this._stopPositionTicker();
    }
  }

  _paintProgress(posSec, durSec) {
    var progressPct = durSec > 0 ? Math.min(100, (posSec / durSec) * 100) : 0;
    this.progressInputElement.value = String(Math.round(progressPct));
    this.progressInputElement.style.setProperty('--progress-pct', progressPct.toFixed(2) + '%');
    this.progressPositionElement.textContent = this.formatTime(posSec);
  }

  onArtworkLoad() {
    this.artworkLoaded = true;
    this.artworkElement.classList.remove('is-empty');
    this.artworkElement.classList.add('has-image');

    if (!this.color) {
      this.extractArtworkTheme(this.currentArtworkUrl);
    }
  }

  onArtworkError() {
    this.artworkLoaded = false;
    this.artworkElement.classList.remove('has-image');
    this.artworkElement.classList.add('is-empty');
    this.dynamicTheme = null;

    if (!this.color) {
      this.applyTheme(this.createDefaultTheme());
    }
  }

  isPlaying() {
    var state = String(this.state || '').toLowerCase();
    return ['playing', 'play', 'on', 'true', 'buffering', 'running'].indexOf(state) > -1;
  }

  render() {
    var players = this.parsePlayerList();
    var selectedplayers = this.parseselectedplayers();
    var scale = this.toNumber(this.volumescale, 1) || 1;
    var volume = this.toNumber(this.volume, 0) * scale;
    var volumeMin = this.toNumber(this.volumemin, 0);
    var volumeMax = this.toNumber(this.volumemax, 100);
    var volumeStep = this.toNumber(this.volumestep, 1);
    var safeMax = volumeMax > volumeMin ? volumeMax : volumeMin + volumeStep;
    var clampedVolume = Math.max(volumeMin, Math.min(safeMax, volume));
    var isPlaying = this.isPlaying();
    var variant = this.variant === 'maxi' ? 'maxi' : 'mini';
    var resolvedArtworkUrl = this.resolveArtworkUrl(this.artwork);
    var hasPlayers = players.length > 0;

    this.cardElement.setAttribute('data-variant', variant);
    this.cardElement.classList.toggle('is-playing', isPlaying);
    this.cardElement.classList.toggle('has-players', hasPlayers);

    this.labelElement.textContent = this.label;
    this.titleElement.textContent = this.title;
    this.subtitleElement.textContent = this.subtitle;
    this.titleElement.classList.toggle('is-empty', !this.title);
    this.subtitleElement.classList.toggle('is-empty', !this.subtitle);

    this.updateArtwork(resolvedArtworkUrl);
    this.updatePlaybackState(isPlaying);
    this.updateTheme(resolvedArtworkUrl);

    this.volumeInputElement.min = String(volumeMin);
    this.volumeInputElement.max = String(safeMax);
    this.volumeInputElement.step = String(volumeStep);
    this.volumeInputElement.value = String(clampedVolume);
    this.volumeValueElement.textContent = this.formatVolume(clampedVolume, safeMax);
    this.updateVolumeProgress(clampedVolume, volumeMin, safeMax);

    var posSec = this.toNumber(this.position, 0);
    var durSec = this.toNumber(this.duration, 0);
    this._syncPositionBase();
    this._paintProgress(posSec, durSec);
    this.progressDurationElement.textContent = this.formatTime(durSec);

    if (isPlaying) {
      this._startPositionTicker();
    } else {
      this._stopPositionTicker();
    }

    this.draftselectedplayers = selectedplayers.slice();
    this.badgeElement.textContent = String(selectedplayers.length);
    this.badgeElement.classList.toggle('is-hidden', selectedplayers.length < 2 || !hasPlayers);
    this.pickerButtonElement.classList.toggle('is-hidden', !hasPlayers);

    this.renderPlayerSelection();
    this.updateCardScale();

    if (this.hasAttribute('picker-open')) {
      this.updatePickerPosition();
    }
  }

  updateCardScale() {
    var rect = this.getBoundingClientRect();
    var widthScale;
    var heightScale;
    var scale;

    if (!rect.width || !rect.height) {
      return;
    }

    widthScale = rect.width / 320;
    heightScale = rect.height / 150;
    console.log('Card size:',   heightScale.toFixed(2));
    scale = Math.min(2, heightScale);// Math.max(0.92, Math.min(1.45, Math.min(widthScale, heightScale)));

    this.style.setProperty('--mediaplayer-scale', scale.toFixed(3));
  }

  updatePlaybackState(isPlaying) {
    var toggleButtons = Array.from(this.shadowRoot.querySelectorAll('.play-toggle'));

    toggleButtons.forEach(function(button) {
      button.classList.toggle('is-playing', isPlaying);
      button.setAttribute('aria-label', isPlaying ? 'Pause playback' : 'Start playback');
    });
  }

  async updateArtwork(url) {
    var requestToken = ++this.artworkRequestToken;

    if (url === this.currentArtworkUrl) {
      if (!url) {
        this.artworkElement.classList.add('is-empty');
      }
      return;
    }

    this.currentArtworkUrl = url;
    this.artworkLoaded = false;
    this.dynamicTheme = null;
    this.artworkElement.classList.remove('has-image');
    this.revokeArtworkObjectUrl();

    if (url) {
      this.artworkElement.classList.remove('is-empty');
      try {
        this.artworkImageElement.src = await this.createArtworkSource(url, requestToken);
      } catch (error) {
        if (requestToken !== this.artworkRequestToken) {
          return;
        }

        this.artworkImageElement.removeAttribute('src');
        this.onArtworkError();
      }
    } else {
      this.artworkImageElement.removeAttribute('src');
      this.artworkElement.classList.add('is-empty');
    }
  }

  async createArtworkSource(url, requestToken) {
    var token = this.getHomeAssistantToken();
    var response;
    var blob;
    var objectUrl;

    if (!this.isHomeAssistantUrl(url) || !token) {
      return url;
    }

    response = await fetch(url, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    if (!response.ok) {
      throw new Error('Artwork request failed with status ' + response.status);
    }

    blob = await response.blob();

    if (requestToken !== this.artworkRequestToken || url !== this.currentArtworkUrl) {
      throw new Error('Stale artwork response');
    }

    objectUrl = URL.createObjectURL(blob);
    this.currentArtworkObjectUrl = objectUrl;
    return objectUrl;
  }

  revokeArtworkObjectUrl() {
    if (!this.currentArtworkObjectUrl) {
      return;
    }

    URL.revokeObjectURL(this.currentArtworkObjectUrl);
    this.currentArtworkObjectUrl = '';
  }

  updateTheme(resolvedArtworkUrl) {
    if (this.color) {
      this.applyTheme(this.createColorTheme());
      return;
    }

    if (this.backgroundcolor) {
      this.applyTheme(this.createLegacyBackgroundTheme());
      return;
    }

    if (resolvedArtworkUrl && this.dynamicTheme && this.dynamicTheme.source === resolvedArtworkUrl) {
      this.applyTheme(this.dynamicTheme);
      return;
    }

    this.applyTheme(this.createDefaultTheme());
  }

  createColorTheme() {
    var surface = getStylePropertyValue('--color-base', this) || this.color || '#20639b';
    var ink = getStylePropertyValue('--color-contrast', this) || '#ffffff';
    var parsedInk = this.parseColor(ink);
    var isLightInk = parsedInk ? this.isLightColor(parsedInk) : false;

    return {
      surface: surface,
      ink: ink,
      muted: this.toAlpha(ink, 0.76),
      controlSurface: isLightInk ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.18)',
      controlSurfaceStrong: isLightInk ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.3)',
      accent: ink,
      accentContrast: isLightInk ? '#ffffff' : '#111111',
    };
  }

  createLegacyBackgroundTheme() {
    return {
      surface: this.backgroundcolor,
      ink: '#ffffff',
      muted: 'rgba(255, 255, 255, 0.76)',
      controlSurface: 'rgba(255, 255, 255, 0.18)',
      controlSurfaceStrong: 'rgba(255, 255, 255, 0.3)',
      accent: '#ffffff',
      accentContrast: '#111111',
    };
  }

  createDefaultTheme() {
    var primary = this.parseColor(getStylePropertyValue('--primary-color', this) || '#20639b');
    return this.createThemeFromRgb(primary || { r: 32, g: 99, b: 155 }, 'default');
  }

  applyTheme(theme) {
    this.cardElement.style.setProperty('--mediaplayer-surface', theme.surface);
    this.cardElement.style.setProperty('--mediaplayer-ink', theme.ink);
    this.cardElement.style.setProperty('--mediaplayer-muted', theme.muted);
    this.cardElement.style.setProperty('--mediaplayer-control-surface', theme.controlSurface);
    this.cardElement.style.setProperty('--mediaplayer-control-surface-strong', theme.controlSurfaceStrong);
    this.cardElement.style.setProperty('--mediaplayer-accent', theme.accent);
    this.cardElement.style.setProperty('--mediaplayer-accent-contrast', theme.accentContrast);
    this.style.color = theme.ink;
  }

  extractArtworkTheme(url) {
    var token = ++this.paletteToken;
    var theme;

    if (!url || !this.artworkLoaded || this.color) {
      return;
    }

    try {
      theme = this.createThemeFromImage(this.artworkImageElement, url);
      if (theme && token === this.paletteToken && this.currentArtworkUrl === url && !this.color) {
        this.dynamicTheme = theme;
        this.applyTheme(theme);
      }
    } catch (error) {
      this.dynamicTheme = null;
    }
  }

  createThemeFromImage(image, url) {
    var canvas = document.createElement('canvas');
    var context;
    var pixelData;
    var dominant;
    var size = 24;

    canvas.width = size;
    canvas.height = size;
    context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, size, size);
    pixelData = context.getImageData(0, 0, size, size).data;
    dominant = this.findDominantColor(pixelData);

    if (!dominant) {
      return null;
    }

    return this.createThemeFromRgb(dominant, url);
  }

  findDominantColor(pixelData) {
    var buckets = {};
    var bestBucket = null;
    var bestKey = '';
    var index = 0;

    while (index < pixelData.length) {
      var red = pixelData[index];
      var green = pixelData[index + 1];
      var blue = pixelData[index + 2];
      var alpha = pixelData[index + 3];
      var max = Math.max(red, green, blue);
      var min = Math.min(red, green, blue);
      var brightness = (red + green + blue) / 3;
      var saturation = max - min;
      var weight;
      var bucketKey;
      var bucket;

      index += 4;

      if (alpha < 80 || brightness < 18 || brightness > 244) {
        continue;
      }

      weight = 0.35 + (saturation / 255) * 2 + (brightness / 255) * 0.25;
      bucketKey = [
        Math.min(255, Math.round(red / 32) * 32),
        Math.min(255, Math.round(green / 32) * 32),
        Math.min(255, Math.round(blue / 32) * 32),
      ].join(',');
      bucket = buckets[bucketKey];

      if (!bucket) {
        bucket = {
          score: 0,
          red: 0,
          green: 0,
          blue: 0,
        };
        buckets[bucketKey] = bucket;
      }

      bucket.score += weight;
      bucket.red += red * weight;
      bucket.green += green * weight;
      bucket.blue += blue * weight;

      if (!bestBucket || bucket.score > bestBucket.score) {
        bestBucket = bucket;
        bestKey = bucketKey;
      }
    }

    if (!bestKey) {
      return null;
    }

    bestBucket = buckets[bestKey];
    return {
      r: Math.round(bestBucket.red / bestBucket.score),
      g: Math.round(bestBucket.green / bestBucket.score),
      b: Math.round(bestBucket.blue / bestBucket.score),
    };
  }

  createThemeFromRgb(rgb, source) {
    var light = this.adjustColor(rgb, 0.08);
    var dark = this.adjustColor(rgb, -0.2);
    var highlight = this.adjustColor(rgb, 0.24);
    var ink = this.getContrastColor(light);
    var parsedInk = this.parseColor(ink);
    var isLightInk = parsedInk ? this.isLightColor(parsedInk) : true;
    var accent = isLightInk ? '#111111' : '#ffffff';

    return {
      source: source,
      surface: 'linear-gradient(145deg, ' + this.rgbToCss(highlight, 0.98) + ', ' + this.rgbToCss(light, 0.95) + ' 45%, ' + this.rgbToCss(dark, 0.92) + ')',
      ink: ink,
      muted: this.toAlpha(ink, 0.76),
      controlSurface: isLightInk ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.2)',
      controlSurfaceStrong: isLightInk ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.32)',
      accent: accent,
      accentContrast: isLightInk ? '#ffffff' : '#111111',
    };
  }

  updateVolumeProgress(value, min, max) {
    var percent = max === min ? 0 : ((this.toNumber(value, min) - min) / (max - min)) * 100;
    this.volumeInputElement.style.setProperty('--volume-progress', percent + '%');
  }

  formatVolume(value, max) {
    var volume = this.toNumber(value, 0);
    var safeMax = this.toNumber(max, 100);

    if (safeMax <= 1) {
      return Math.round(volume * 100) + '%';
    }

    return Math.round(volume) + '%';
  }

  formatTime(seconds) {
    var s = Math.max(0, Math.round(this.toNumber(seconds, 0)));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  openPicker() {
    if (!this.parsePlayerList().length) {
      return;
    }

    this.draftselectedplayers = this.parseselectedplayers().slice();
    this.renderPlayerSelection();
    this.updatePickerPosition();
    window.addEventListener('resize', this.boundUpdatePickerPosition);
    window.addEventListener('scroll', this.boundUpdatePickerPosition, true);
    this.setAttribute('picker-open', '');
  }

  closePicker() {
    window.removeEventListener('resize', this.boundUpdatePickerPosition);
    window.removeEventListener('scroll', this.boundUpdatePickerPosition, true);
    this.removeAttribute('picker-open');
  }

  updatePickerPosition() {
    var rect = this.getBoundingClientRect();
    var margin = 8;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    var pickerWidth = Math.min(384, Math.max(260, viewportWidth - margin * 2));
    var pickerHeight = Math.min(420, Math.max(220, viewportHeight - margin * 2));
    var left = rect.left + rect.width / 2;
    var top = rect.top + rect.height / 2;
    var halfWidth = pickerWidth / 2;
    var halfHeight = pickerHeight / 2;

    left = Math.max(margin + halfWidth, Math.min(viewportWidth - margin - halfWidth, left));
    top = Math.max(margin + halfHeight, Math.min(viewportHeight - margin - halfHeight, top));

    this.style.setProperty('--picker-left', left + 'px');
    this.style.setProperty('--picker-top', top + 'px');
    this.style.setProperty('--picker-width', pickerWidth + 'px');
    this.style.setProperty('--picker-max-height', pickerHeight + 'px');
  }

  selectAllPlayers() {
    this.draftselectedplayers = this.parsePlayerList().filter(function(player) {
      return !this.isCurrentPlayer(player.value);
    }.bind(this)).map(function(player) {
      return player.value;
    });
    this.renderPlayerSelection();
  }

  applyPlayerSelection() {
    this.submitChange('selectedplayers', this.draftselectedplayers.join(','));
    this.closePicker();
  }

  onPickerListClick(event) {
    var item = event.target.closest('[data-player-value]');

    if (!item) {
      return;
    }

    this.togglePlayer(item.getAttribute('data-player-value'));
  }

  togglePlayer(value) {
    if (this.isCurrentPlayer(value)) {
      return;
    }

    var normalizedValue = this.normalizePlayerValue(value);
    var index = this.draftselectedplayers.findIndex(function(item) {
      return this.normalizePlayerValue(item) === normalizedValue;
    }.bind(this));

    if (index > -1) {
      this.draftselectedplayers.splice(index, 1);
    } else {
      this.draftselectedplayers.push(value);
    }

    this.renderPlayerSelection();
  }

  renderPlayerSelection() {
    var players = this.parsePlayerList();
    var html = '';

    this.emptyStateElement.classList.toggle('is-visible', players.length === 0);
    this.pickerListElement.classList.toggle('is-hidden', players.length === 0);

    players.forEach(function(player) {
      var isCurrentPlayer = this.isCurrentPlayer(player.value);
      var isSelected = isCurrentPlayer || this.isPlayerSelected(player.value);
      var readonlyLabel = isCurrentPlayer ? '<span class="picker-item-lock">Current</span>' : '';

      html += '<button class="picker-item' + (isSelected ? ' is-selected' : '') + (isCurrentPlayer ? ' is-readonly' : '') + '" type="button" data-player-value="' + this.escapeHtml(player.value) + '"' + (isCurrentPlayer ? ' disabled aria-disabled="true"' : '') + '>';
      html += '<span class="picker-item-icon" aria-hidden="true">';
      html += '<svg viewBox="0 0 24 24"><path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm6 4.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z"></path><path d="M12 16.4c-3 0-5.5 1.7-6.4 4.2h12.8c-.9-2.5-3.4-4.2-6.4-4.2z"></path></svg>';
      html += '</span>';
      html += '<span class="picker-item-copy">';
      html += '<span class="picker-item-heading"><span class="picker-item-title">' + this.escapeHtml(player.text) + '</span>' + readonlyLabel + '</span>';
      html += '<span class="picker-item-subtitle">' + this.escapeHtml(player.subtitle || player.text) + '</span>';
      html += '</span>';
      html += '<span class="picker-switch' + (isSelected ? ' is-on' : '') + (isCurrentPlayer ? ' is-readonly' : '') + '" aria-hidden="true"><span class="picker-switch-thumb"></span></span>';
      html += '</button>';
    }.bind(this));

    this.pickerListElement.innerHTML = html;
  }

  isPlayerSelected(value) {
    var normalizedValue = this.normalizePlayerValue(value);

    return this.draftselectedplayers.some(function(item) {
      return this.normalizePlayerValue(item) === normalizedValue;
    }.bind(this));
  }

  isCurrentPlayer(value) {
    var currentPlayer = this.getCurrentPlayerValue();

    if (!currentPlayer) {
      return false;
    }

    return this.normalizePlayerValue(value) === currentPlayer;
  }

  parsePlayerList() {
    return this.splitList(this.playerlist).map(function(entry) {
      return this.parsePlayerEntry(entry);
    }.bind(this)).filter(function(player) { return player.value; });
  }

  parsePlayerEntry(entry) {
    var parts = String(entry || '').split(':');
    var value = (parts.shift() || '').trim();
    var text = (parts.shift() || value).trim();
    var subtitle = parts.join(':').trim();

    return {
      value: value,
      text: text,
      subtitle: subtitle,
    };
  }

  getCurrentPlayerValue() {
    var explicitValue = this.normalizePlayerValue(this.currentplayer);
    var label = String(this.label || '').trim().toLowerCase();
    var matchedPlayer;

    if (explicitValue) {
      return explicitValue;
    }

    if (!label) {
      return '';
    }

    matchedPlayer = this.parsePlayerList().find(function(player) {
      var value = String(player.value || '').trim().toLowerCase();
      var text = String(player.text || '').trim().toLowerCase();
      var subtitle = String(player.subtitle || '').trim().toLowerCase();

      return value === label || text === label || subtitle === label;
    });

    return matchedPlayer ? this.normalizePlayerValue(matchedPlayer.value) : '';
  }

  parseselectedplayers() {
    return this.splitList(this.selectedplayers).map(function(item) {
      return String(item || '').trim();
    }).filter(function(item) { return item !== ''; });
  }

  splitList(list) {
    var source = String(list || '').trim();
    var delimiter;
    var jsonList;

    if (!source) {
      return [];
    }

    if (source.charAt(0) === '[' && source.charAt(source.length - 1) === ']') {
      try {
        jsonList = JSON.parse(source);
        if (Array.isArray(jsonList)) {
          return jsonList.map(function(item) { return String(item).trim(); });
        }
      } catch (error) {
        source = source.slice(1, -1);
      }
    }

    delimiter = this.getDelimiter(source);
    return source.split(delimiter).map(function(item) { return item.trim(); }).filter(function(item) { return item !== ''; });
  }

  normalizePlayerValue(value) {
    var normalized = String(value || '').trim();

    normalized = normalized.replace(/^['"\[]+|['"\]]+$/g, '');

    if (normalized.indexOf('.') > -1) {
      normalized = normalized.split('.').pop();
    }

    return normalized.trim();
  }

  getDelimiter(list) {
    if (this.delimiter) {
      return this.delimiter;
    }
    if (list.indexOf('|') > -1) {
      return '|';
    }
    if (list.indexOf(';') > -1) {
      return ';';
    }
    if (list.indexOf('\n') > -1) {
      return '\n';
    }
    return ',';
  }

  resolveArtworkUrl(url) {
    var source = String(url || '').trim();
    var baseUrl;

    if (!source) {
      return '';
    }

    source = source.replace(/&amp;/g, '&');

    if (/^(data:|https?:)/i.test(source)) {
      return source;
    }

    if (source.indexOf('//') === 0) {
      return window.location.protocol + source;
    }

    baseUrl = this.getHomeAssistantBaseUrl();

    if (source.charAt(0) === '/' && baseUrl) {
      return baseUrl + source;
    }

    if (baseUrl) {
      return baseUrl + '/' + source.replace(/^\/+/, '');
    }

    return source;
  }

  getHomeAssistantBaseUrl() {
    var appConfig = window.ftuiApp && window.ftuiApp.config && window.ftuiApp.config.homeAssistant;
    var baseUrl = appConfig && appConfig.url ? appConfig.url : '';

    if (!baseUrl && config.homeAssistant && config.homeAssistant.url) {
      baseUrl = config.homeAssistant.url;
    }

    return String(baseUrl || '').replace(/\/+$/, '');
  }

  getHomeAssistantToken() {
    var appConfig = window.ftuiApp && window.ftuiApp.config && window.ftuiApp.config.homeAssistant;
    var token = appConfig && appConfig.token ? appConfig.token : '';

    if (!token && config.homeAssistant && config.homeAssistant.token) {
      token = config.homeAssistant.token;
    }

    return String(token || '').trim();
  }

  isHomeAssistantUrl(url) {
    var baseUrl = this.getHomeAssistantBaseUrl();

    if (!baseUrl || !url) {
      return false;
    }

    return String(url).indexOf(baseUrl) === 0;
  }

  parseColor(value) {
    var color = String(value || '').trim();
    var match;

    if (!color || color.indexOf('gradient') > -1 || color === 'currentColor') {
      return null;
    }

    if (color.charAt(0) === '#') {
      if (color.length === 4) {
        return {
          r: parseInt(color.charAt(1) + color.charAt(1), 16),
          g: parseInt(color.charAt(2) + color.charAt(2), 16),
          b: parseInt(color.charAt(3) + color.charAt(3), 16),
        };
      }

      if (color.length >= 7) {
        return {
          r: parseInt(color.slice(1, 3), 16),
          g: parseInt(color.slice(3, 5), 16),
          b: parseInt(color.slice(5, 7), 16),
        };
      }
    }

    match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (match) {
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
      };
    }

    return null;
  }

  adjustColor(rgb, delta) {
    return {
      r: this.clamp(rgb.r + (255 * delta)),
      g: this.clamp(rgb.g + (255 * delta)),
      b: this.clamp(rgb.b + (255 * delta)),
    };
  }

  clamp(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  getContrastColor(rgb) {
    var luminance = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    return luminance > 156 ? '#111111' : '#ffffff';
  }

  isLightColor(rgb) {
    return this.getContrastColor(rgb) === '#111111';
  }

  rgbToCss(rgb, alpha) {
    if (typeof alpha === 'number') {
      return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
    }
    return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
  }

  toAlpha(color, alpha) {
    var parsed = this.parseColor(color);

    if (!parsed) {
      return color;
    }

    return this.rgbToCss(parsed, alpha);
  }

  toNumber(value, fallback) {
    var parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

window.customElements.define('ftui-mediaplayer', FtuiMediaplayer);