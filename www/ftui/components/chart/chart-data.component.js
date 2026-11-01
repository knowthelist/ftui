/*
* Chart data component for FTUI version 3
*
* Copyright (c) 2020-2022 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { fhemService } from '../../modules/ftui/fhem.service.js';
import { haService } from '../../modules/ftui/ha.service.js';
import { Chart } from '../../modules/chart.js/chart.min.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';


export class FtuiChartData extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChartData.properties, properties));

    if (this.backgroundColor.length === 0) {
      if (this.type === 'bubble') {
        this.backgroundColor = ftuiHelper.getStylePropertyValue('--color-base', this) || this.color;
      } else {
        this.hasCalculatedBackgroundColor = true;
      }
    }
  }

  static get properties() {
    const primaryColor = ftuiHelper.getStylePropertyValue('--primary-color');
    return {
      label: '',
      type: 'line',
      fill: false,
      hidden: false,
      pointBackgroundColor: primaryColor,
      backgroundColor: '',
      color: primaryColor,
      borderColor: '',
      borderWidth: 1.2,
      pointRadius: 2,
      title: '-',
      log: '-',
      entity: '',
      file: '-',
      spec: '4:.*',
      unit: '',
      startDate: '',
      endDate: '',
      prefetch: 0,
      extend: false,
      update: '',
      tension: '0.0',
      stepped: false,
      offset: 0,
      stack: '',
      yAxisID: 'y',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChartData.properties), ...super.observedAttributes];
  }

  fetch() {
    const chartElement = this.closest('ftui-chart');
    if (!this.isLoading && ftuiHelper.isVisible(chartElement || this)) {
      if (this.entity) {
        this.fetchHAHistory(this.entity);
      } else {
        this.fetchLogItems(this.log, this.file, this.spec);
      }
    }
  }

  fetchHAHistory(entityId) {
    this.isLoading = true;
    const startDate = ftuiHelper.dateFromString(this.startDate);
    const endDate = ftuiHelper.dateFromString(this.endDate);
    const requestStart = new Date(startDate.getTime());
    requestStart.setSeconds(requestStart.getSeconds() - this.prefetch);
    const requestEnd = new Date(endDate.getTime());
    requestEnd.setSeconds(requestEnd.getSeconds() + this.prefetch);

    haService.getHistory(entityId, requestStart.toISOString(), requestEnd.toISOString())
      .then(history => {
        const states = history && history[0] ? history[0] : [];
        const { labels, data } = this.parseHAHistory(states, startDate, endDate);
        this.data = data;
        this.labels = labels;
        this.updateColor();
        ftuiHelper.triggerEvent('ftuiDataChanged', this);
        this.isLoading = false;
      }).catch(() => {
        this.isLoading = false;
      });
  }

  parseHAHistory(states, startDate, endDate) {
    const labels = [];
    const data = [];
    const startTime = startDate.getTime();
    const endTime = Math.min(endDate.getTime(), Date.now());
    const sortedStates = states.slice().sort((first, second) => {
      const firstTime = ftuiHelper.dateFromString(first.last_changed || first.last_updated).getTime();
      const secondTime = ftuiHelper.dateFromString(second.last_changed || second.last_updated).getTime();
      return firstTime - secondTime;
    });
    const chartElement = this.closest('ftui-chart');
    const monthly = chartElement && chartElement.unit === 'year';
    const buckets = {};
    let cursor = startTime;
    let currentState = '';
    let hasStartingState = false;

    const addDuration = (from, to) => {
      let segmentStart = from;
      while (segmentStart < to) {
        const bucketStart = new Date(segmentStart);
        bucketStart.setHours(0, 0, 0, 0);
        if (monthly) {
          bucketStart.setDate(1);
        }
        const bucketKey = ftuiHelper.dateFormat(bucketStart, 'YYYY-MM-DD_hh:mm:ss');
        const bucketEnd = new Date(bucketStart.getTime());
        if (monthly) {
          bucketEnd.setMonth(bucketEnd.getMonth() + 1);
        } else {
          bucketEnd.setDate(bucketEnd.getDate() + 1);
        }
        const segmentEnd = Math.min(to, bucketEnd.getTime());

        buckets[bucketKey] = buckets[bucketKey] || 0;
        if (currentState === 'on') {
          buckets[bucketKey] += (segmentEnd - segmentStart) / 3600000;
        }
        segmentStart = segmentEnd;
      }
    };

    sortedStates.forEach(state => {
      const changedAt = ftuiHelper.dateFromString(state.last_changed || state.last_updated).getTime();
      if (!Number.isFinite(changedAt)) {
        return;
      }
      if (changedAt <= startTime) {
        currentState = state.state;
        hasStartingState = true;
        return;
      }
      if (!hasStartingState) {
        cursor = changedAt;
        hasStartingState = true;
      } else {
        addDuration(cursor, Math.min(changedAt, endTime));
        cursor = changedAt;
      }
      currentState = state.state;
    });

    if (hasStartingState && cursor < endTime) {
      addDuration(cursor, endTime);
    }

    Object.keys(buckets).sort().forEach(bucketKey => {
      labels.push(bucketKey);
      data.push({ x: bucketKey, y: Number(buckets[bucketKey].toFixed(2)) });
    });

    return { labels, data };
  }

  fetchLogItems(log, file, spec) {
    this.isLoading = true;
    const startDate = ftuiHelper.dateFromString(this.startDate);
    startDate.setSeconds(startDate.getSeconds() - this.prefetch);
    const startDateFormatted = ftuiHelper.dateFormat(startDate, 'YYYY-MM-DD_hh:mm:ss');
    const endDate = ftuiHelper.dateFromString(this.endDate);
    endDate.setSeconds(endDate.getSeconds() + this.prefetch);
    const endDateFormatted = ftuiHelper.dateFormat(endDate, 'YYYY-MM-DD_hh:mm:ss');
    this.rangeDate = endDate.getTime() - startDate.getTime();
    const cmd = 'get ' + log + ' ' + file + ' - ' + startDateFormatted + ' ' + endDateFormatted + ' ' + spec;
    //const cmd ="{getChartData()}";
    fhemService.sendCommand(cmd)
      .then((response) => {
        if (response.status >= 200 && response.status <= 299) {
          return response.text();
        }
        throw new Error(response.statusText);
      })
      .then((response) => {
        const { labels, data } = this.parseLogItems(response);
        this.data = data;
        this.labels = labels;
        this.updateColor();
        ftuiHelper.triggerEvent('ftuiDataChanged', this);
        this.isLoading = false;
      }).catch(() => {
        this.isLoading = false;
      });
  }

  parseLogItems(response) {
    const data = [];
    const labels = [];
    const lines = response.split('\n').filter(l => l.length > 0 && !l.startsWith('#'));
    if (lines.length === 0) {
      return { labels, data };
    }

    const timeStep = this.rangeDate / 150;
    let risingDate = this.startDate;
    const risingValue = this.offset + 1;
    const lastLine = lines[lines.length - 1].split(' ');
    const lastDate = lastLine[0];
    const lastValue = lastLine[1];
    const extendDate = this.getExtendDate(lastDate);

    if (this.type === 'bubble' && this.stepped) {
      // fill missing start and end points
      if (lines[0].split(' ')[1] === '0') {
        lines.unshift(this.startDate + ' 1');
      }
      if (lastValue !== '0') {
        const endMarkerDate = extendDate || this.endDate;
        if (endMarkerDate !== lastDate) {
          lines.push(endMarkerDate + ' 0');
        }
      }
    }

    lines.forEach(line => {
      const [date, value] = line.split(' ');
      if (date && ftuiHelper.isNumeric(value)) {
        const parsedValue = parseFloat(value) + parseFloat(this.offset);
        if (parseFloat(value) > 0 || this.type !== 'bubble') {
          risingDate = date;
          data.push({ 'x': date, 'y': parsedValue });
          labels.push(date);
        } else if (this.type === 'bubble'
          && (parseFloat(value) === 0)
          && this.stepped) {
          // interpolate times between rising and falling flank
          // to create a kind of gantt chart
          const startDate = ftuiHelper.dateFromString(risingDate).getTime();
          const endDate = ftuiHelper.dateFromString(date).getTime();
          for (let i = startDate; i < endDate; i += timeStep) {
            const interpolatedDate = ftuiHelper.dateFormat(new Date(i), 'YYYY-MM-DD_hh:mm:ss');
            data.push({ 'x': interpolatedDate, 'y': risingValue });
            labels.push(interpolatedDate);
          }
        }
      }
    });

    if (extendDate && this.type !== 'bubble' && ftuiHelper.isNumeric(lastValue)) {
      data.push({ 'x': extendDate, 'y': parseFloat(lastValue) + parseFloat(this.offset) });
      labels.push(extendDate);
    }

    return { labels, data };
  }

  getExtendDate(lastDate) {
    if (!this.extend || !lastDate) {
      return null;
    }

    const endDate = ftuiHelper.dateFromString(this.endDate);
    const now = new Date();
    const targetDate = endDate.getTime() > now.getTime() ? now : endDate;
    const lastTimestamp = ftuiHelper.dateFromString(lastDate).getTime();

    if (targetDate.getTime() <= lastTimestamp) {
      return null;
    }

    return ftuiHelper.dateFormat(targetDate, 'YYYY-MM-DD_hh:mm:ss');
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'color':
        this.updateColor();
        break;
      case 'update':
        this.fetch();
        break;
      case 'hidden':
        if (typeof this.data !== 'undefined') {
          ftuiHelper.triggerEvent('ftuiDataChanged', this);
        }
        break;
    }
  }

  updateColor() {
    this.borderColor = ftuiHelper.getStylePropertyValue('--color-base', this) || this.color;
    if (this.hasCalculatedBackgroundColor) {
      this.backgroundColor = Chart.helpers.color(this.borderColor).alpha(0.2).rgbString();
    }
    this.pointBackgroundColor = this.borderColor;
  }

}

window.customElements.define('ftui-chart-data', FtuiChartData);
