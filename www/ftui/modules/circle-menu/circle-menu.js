/*
* Circle menu lib module for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*
* adapted from https://github.com/zikes/circle-menu
* Copyright (c) Jason Hutchinson (zikes@zikes.me)
* DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
* Version 2, December 2004
*
*/

export class CircleMenu {

  constructor(element, options) {

    const defaults = {
      depth: 1,
      item_diameter: 100,
      circle_radius: 6,
      angle: {
        start: 0,
        end: 90
      },
      speed: 500,
      delay: 1000,
      step_out: 20,
      step_in: -20,
      trigger: 'hover',
      close_event: 'click',
      transition_function: 'ease'
    };
    this._timeouts = [];
    this.element = element;
    this.options = Object.assign({}, defaults, options);
    this._defaults = defaults;
    this.init();
    this.hook();
  }

  init() {
    this.menu_items = this.element.querySelectorAll('*:not(:first-child)');
    this.firstItem = this.element.querySelector('*:first-child');
    this.submenus = [];
    const directions = {
      'vertical': [-400, 0],
      'vertical-top': [-800, 0],
      'horizontal-right': [400, 0],
      'horizontal-left': [800, 0],
      'horizontal': [400, 0],
      'bottom-left': [180, 90],
      'bottom': [135, 45],
      'right': [-45, 45],
      'left': [225, 135],
      'top': [225, 315],
      'bottom-half': [180, 0],
      'right-half': [-90, 90],
      'left-half': [270, 90],
      'top-half': [180, 360],
      'top-left': [270, 180],
      'top-right': [270, 360],
      'full': [-90, 270 - Math.floor(360 / (this.menu_items.length))],
      'bottom-right': [0, 90]
    };

    this._state = 'closed';
    this.element.classList.add('closed');

    if (typeof this.options.direction === 'string') {
      const dir = directions[this.options.direction.toLowerCase()];
      if (dir) {
        this.options.angle.start = dir[0];
        this.options.angle.end = dir[1];
      }
    }

    this.initCss();
    this.item_count = this.menu_items.length;
    this._step = (this.options.angle.end - this.options.angle.start) / (this.item_count - 1);
    this.menu_items.forEach((item, index) => {
      const angle = (this.options.angle.start + (this._step * index)) * (Math.PI / 180);
      const linearRadius = this.options.circle_radius * 0.75;
      let x = Math.round(this.options.circle_radius * Math.cos(angle));
      let y = Math.round(this.options.circle_radius * Math.sin(angle));

      // vertical
      if (this.options.angle.start < -360) { x = 0; y = index * linearRadius + linearRadius; }
      // vertical-top
      if (this.options.angle.start < -790) { x = 0; y = -(index * linearRadius + linearRadius * 0.75); }
      // horizontal
      if (this.options.angle.start > 360) { x = index * linearRadius + linearRadius; y = 0; }
      // horizontal-left
      if (this.options.angle.start > 790) { x = -(index * linearRadius + linearRadius); y = 0; }

      item.posX = x;
      item.posY = y;

      item.addEventListener(this.options.close_event, () => {
        this.select(index + 2);
      });
    });

    // Initialize event hooks from options
    ['open', 'close', 'init', 'select'].forEach((evt) => {
      let fn;

      if (this.options[evt]) {
        fn = this.options[evt];
        this.element.addEventListener(evt, (event) => {
          return fn.apply(this, [event.detail]);
        });
        delete this.options[evt];
      }
    });

    this.menu_items.forEach((item) => {
      const subItem = item.querySelectorAll('ul');
      if (subItem && subItem.length) {
        this.submenus.push(subItem);
        subItem.cm = new CircleMenu(subItem, Object.assign(({}, this.options, { depth: this.options.depth + 1 })));
      }
    });
    this.trigger('init');
  }

  trigger() {
    const event = new CustomEvent(arguments[0], {
      detail: arguments[1]
    });
    this.element.dispatchEvent(event);
  }

  hook() {

    if (this.options.trigger === 'hover') {
      this.element.addEventListener('mouseenter', () => {
        this.open();
      });
      this.element.addEventListener('mouseleave', () => {
        this.close();
      });
    } else if (this.options.trigger === 'click' && this.firstItem) {
      this.firstItem.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (this._state === 'closed' || this._state === 'closing') {
          this.open();
        } else {
          this.close(true);
        }
        return false;
      });
    } else if (this.options.trigger === 'none') {
      // Do nothing
    }
  }

  open() {
    const start = 0;
    let set;

    this.clearTimeouts();
    if (this._state === 'open') return this;
    this.element.classList.add('open');
    this.element.classList.remove('closed');
    this.firstItem.style.zIndex = parseInt(this.firstItem.style.zIndex) + 100;
    if (this.options.step_out >= 0) {
      set = this.menu_items;
    } else {
      set = [...this.menu_items].reverse();
    }
    set.forEach((item, index) => {

      this._timeouts.push(setTimeout(() => {
        item.style.left = item.posX + 'em';
        item.style.top = item.posY + 'em';
        item.style.transform = 'scale(1)';
        item.style.zIndex = parseInt(item.style.zIndex) + 100;
      }
      ), start + Math.abs(this.options.step_out) * index)
    });

    this._timeouts.push(setTimeout(() => {
      if (this._state === 'opening') this.trigger('open');
      this._state = 'open';
    }, start + Math.abs(this.options.step_out) * set.length));
    this._state = 'opening';
    return this;
  }

  close(immediate) {
    const do_animation = () => {
      const start = 0;
      let set;

      this.submenus.forEach((subItem) => subItem.cm.close());
      this.clearTimeouts();
      if (this._state === 'closed') return this;
      if (this.options.step_in >= 0) {
        set = this.menu_items;
      } else {
        set = [...this.menu_items].reverse();
      }
      set.forEach((item, index) => {
        this._timeouts.push(setTimeout(() => {
          item.style.top = '-2em';
          item.style.left = '-2em';
          item.style.transform = 'scale(0)';
          item.style.zIndex = parseInt(item.style.zIndex) - 100;
        }, start + Math.abs(this.options.step_in) * index));
      });
      this._timeouts.push(setTimeout(() => {
        if (this._state === 'closing') this.trigger('close');
        this._state = 'closed';
      }, start + Math.abs(this.options.step_in) * set.length));
      this.element.classList.remove('open');
      this.element.classList.add('closed');
      this.firstItem.style.zIndex = parseInt(this.firstItem.style.zIndex) - 100;
      this._state = 'closing';
      return this;
    };
    if (immediate) {
      do_animation();
    } else {
      this._timeouts.push(setTimeout(do_animation, this.options.delay));
    }
    return this;
  }

  select(index) {

    if (this._state === 'open' || this._state === 'opening') {
      this.clearTimeouts();
      const set_other = this.element.querySelectorAll('*:not(:nth-child(' + index + ')):not(:first-child)');
      const selected = this.element.querySelector('*:nth-child(' + index + ')');
      this.trigger('select', selected);
      this.menu_items.forEach((item) => {
        item.style.transition = 'all 500ms ease-out';
      });
      selected.style.transform = 'scale(2)';
      selected.style.opacity = 0;
      set_other.forEach((item) => {
        item.style.transform = 'scale(0)';
        item.style.opacity = 0;
      });

      this.element.classList.remove('open');
      setTimeout(() => this.initCss(), 500);
    }
  }

  clearTimeouts() {
    for (const timeout of this._timeouts) {
      clearTimeout(timeout);
    }
    this._timeouts = [];
  }

  initCss() {
    this._state = 'closed';
    this.element.classList.remove('open');
    this.menu_items.forEach((item) => {
      item.style = null;
      item.style.top = '-2em';
      item.style.left = '-2em';
      item.style.transform = 'scale(0)';
      item.style.zIndex = 1;
      item.style.opacity = null;
    });

    window.requestAnimationFrame(() => {
      this.menu_items.forEach((item) => {
        item.style.transition = 'all ' + this.options.speed + 'ms ' + this.options.transition_function;
      });
    });
  }
}
