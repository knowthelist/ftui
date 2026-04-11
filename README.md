# FHEM Tablet UI (FTUI)

## UI Builder Framework for FHEM

A modern, flexible UI builder framework for [FHEM](http://fhem.de/fhem.html) home automation.  
Built with a clear intention: **Keep it short and simple!**

**Version 3** - Built with [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) using pure ES2020 JavaScript.

> **⚠️ Important Notes:**
> - This version is **not compatible** with older FTUI versions (v1/v2)
> - Supports multiple backends: **FHEM** and **Home Assistant**
> - Active development - new features are continuously added

![FTUI Screenshot](http://knowthelist.github.io/ftui/screenshot.png)

---

## Table of Contents

- [Installation](#installation)
- [Backend Configuration](#backend-configuration)
  - [FHEM Backend](#fhem-backend)
  - [Home Assistant Backend](#home-assistant-backend)
  - [Dual Backend Setup](#dual-backend-setup)
- [Update](#update)
- [Docker Setup](#docker-setup)
- [Development](#development)
- [Usage](#usage)
- [Binding](#binding)
- [Pipes](#pipes)
- [Colors](#colors)
- [Components](#components)
- [Examples](#examples)
- [Support & Donation](#donation)
- [License](#license)

---

## Installation

### Quick Install

1. **Download and extract FTUI:**
   ```bash
   wget https://github.com/knowthelist/ftui/tarball/master -O /tmp/ftui.tar
   cd /tmp && tar xvzf /tmp/ftui.tar
   mv /tmp/knowthelist-ftui-*/www/ftui /opt/fhem/www
   ```

2. **Customize your page:**
   - Edit `index.html` according to your needs
   - Add your FHEM devices and readings

3. **Access your UI:**
   - Open in browser: `http://<fhem-url>:8083/fhem/ftui/index.html`

---

## Backend Configuration

FTUI supports two powerful backends that can be used independently or simultaneously:

### FHEM Backend

FTUI works out-of-the-box with FHEM. Simply ensure your FHEM instance is running and accessible.

Home Assistant support stays dormant unless FTUI sees valid Home Assistant configuration and actual HA bindings.

If you are a FHEM-only user, leave `homeAssistant.enabled` at `false` or omit the `homeAssistant` block entirely in `config.local.js`.

**Example usage:**
```html
<ftui-label [text]="WeatherDevice:temperature" unit="°C"></ftui-label>
<ftui-switch [(value)]="lamp1"></ftui-switch>
<ftui-button (value)="dummy1">Toggle</ftui-button>
```

### Home Assistant Backend

To connect FTUI to Home Assistant, you need to configure CORS and create an access token.

Activation checklist:
- Add `enabled: true` in `config.local.js`
- Set a valid Home Assistant `url`
- Set a valid long-lived `token`
- Use `ha:` prefixed entities in your HTML

#### Setup Steps:

1. **Configure CORS in Home Assistant**

   Add the following to your `configuration.yaml`:
   ```yaml
   http:
     cors_allowed_origins:
       - http://fhem.home.arpa:8083
       - http://fhem:8083
       - http://localhost:8083
     use_x_forwarded_for: true
     trusted_proxies:
       - 172.168.101.0/24
   ```

2. **Create a Long-Lived Access Token**
   - In Home Assistant, go to: **Profile** → **Security** → **Long-lived access tokens**
   - Click "Create Token"
   - Give it a meaningful name (e.g., "FTUI Access")
   - Copy the generated token

3. **Configure FTUI**

  Create a `config.local.js` file in your FTUI installation directory (`www/ftui/config.local.js`):
   ```javascript
   export const config = {
       homeAssistant: {
           enabled: true,
           url: 'http://homeassistant:8123',
           token: 'YOUR_LONG_LIVED_ACCESS_TOKEN_HERE',
       },
   };
   ```

   > **Note:** You can also edit `config.js` directly, but using `config.local.js` is recommended to avoid conflicts during updates.
  > After changing `config.local.js`, reload the browser page.

   Required switches:
   - `enabled: true` turns on Home Assistant support for pages that use `ha:` bindings.
   - `url` must point to your Home Assistant instance.
   - `token` must be a Home Assistant long-lived access token.
   - Leave `enabled: false` for FHEM-only setups.

4. **Use Home Assistant in HTML**

   Prefix all Home Assistant entities with `ha:`:
   ```html
   <ftui-label [text]="ha:weather.forecast_home:temperature" size="3" unit="°C"></ftui-label>
   
   <ftui-label [text]="ha:weather.forecast_home:humidity" size="3" unit="%"></ftui-label>
   
   <ftui-switch [(value)]="ha:light.living_room"></ftui-switch>
   
   <ftui-knob 
       [value]="ha:sensor.outdoor_temperature"
       [color]="ha:sensor.outdoor_temperature | step('-99: blue, 10: ok, 20: warning, 25: danger')"
       width="130" 
       offset-y="10"
       type="handle" 
       min="-10" 
       max="40" 
       decimals="1" 
       unit="°C" 
       readonly 
       has-value-text>
   </ftui-knob>
   ```

5. **Access Your Page:**
  - Open the dedicated HA example: `http://fhem:8083/fhem/ftui/examples/ha.html`
  - Additional generic HA examples: `http://fhem:8083/fhem/ftui/examples/ha-basic.html` and `http://fhem:8083/fhem/ftui/examples/ha-mobile.html`
  - Pages with `ha:` bindings require `enabled: true`, `url`, and `token`.
  - Private local dashboards should use the underscore convention in the FTUI root, for example `http://fhem:8083/fhem/ftui/_mobile_full.html`.
  - Private partials can also use underscore names, for example `_mobile-solar.html`.
  - If you see `Home Assistant support is disabled`, then `enabled: true` is missing.
  - If you see `Home Assistant is not fully configured`, then `url` or `token` is missing or invalid.

### Dual Backend Setup

FTUI can communicate with **both FHEM and Home Assistant simultaneously**! This is perfect if you're migrating between systems or want to use the best features of both platforms.

#### Configuration Example:

```javascript
export const config = {
    homeAssistant: {
    enabled: true,
        url: 'http://homeassistant:8123',
        token: 'YOUR_HA_TOKEN_HERE',
    },
    // FHEM is automatically detected from the web server
};
```

#### Usage Example - Mixed Backends:

```html
<!-- FHEM devices -->
<ftui-label [text]="FHEMWeather:temperature" unit="°C"></ftui-label>
<ftui-button (value)="FHEMDummy">FHEM Device</ftui-button>

<!-- Home Assistant devices -->
<ftui-switch [(value)]="ha:light.bedroom"></ftui-switch>
<ftui-label [text]="ha:sensor.temperature" unit="°C"></ftui-label>

<!-- Combined example -->
<ftui-grid base-width="100" base-height="100">
    <ftui-grid-tile row="1" col="1">
        <ftui-row>
            <ftui-column>
                <h3>FHEM Devices</h3>
                <ftui-button (value)="lamp1">FHEM Lamp</ftui-button>
            </ftui-column>
            <ftui-column>
                <h3>Home Assistant</h3>
                <ftui-switch [(value)]="ha:light.kitchen"></ftui-switch>
            </ftui-column>
        </ftui-row>
    </ftui-grid-tile>
</ftui-grid>
```

**Key Points:**
- Use **no prefix** for FHEM devices: `devicename:reading`
- Use **`ha:` prefix** for Home Assistant: `ha:entity.name`
- Both backends update in real-time
- Pipes and bindings work with both backends

---

## Update

To update FTUI to the latest version via FHEM:

```
update all https://raw.githubusercontent.com/knowthelist/ftui/master/controls_ftui.txt
```

Enter this command in the FHEM command field of FHEMWEB.

---

## Docker Setup

You can host FTUI on your own web server using Docker instead of via FHEMWEB.

### Steps:

1. **Pull the Docker image:**
   ```bash
   docker pull knowthelist/ftui
   ```

2. **Prepare your index.html:**
   - Place your customized `index.html` in an accessible location
   - Add the FHEMWEB URL to the `<head>` section:
     ```html
     <meta name="fhemweb_url" content="http://<your_fhem_url>:8083/fhem/">
     ```

3. **Run the container:**
   ```bash
   docker run -d \
     -p 8080:80 \
     -v <path>/index.html:/usr/share/nginx/html/index.html \
     --name ftui3 \
     knowthelist/ftui
   ```

4. **Access your UI:**
   - Open in browser: `http://<docker_host>:8080`

### Docker Compose Example:

```yaml
version: '3.8'
services:
  ftui:
    image: knowthelist/ftui
    container_name: ftui3
    ports:
      - "8080:80"
    volumes:
      - ./index.html:/usr/share/nginx/html/index.html
    restart: unless-stopped
```

---

## Development

For developers who want to contribute or customize FTUI:

1. **Clone the repository:**
   ```bash
   cd ~
   git clone https://github.com/knowthelist/ftui.git
   ```

2. **Link to FHEM's www directory:**
   ```bash
   ln -s $HOME/ftui/www/ftui /opt/fhem/www/ftui_dev
   ```

3. **Access the development version:**
   - Open: `http://<fhem-url>:8083/fhem/ftui_dev/index.html`

4. **Snippet Tester:**
   - Test components live: `http://<fhem-url>:8083/fhem/ftui_dev/ftui-snippet-tester.html`
   - Paste HTML snippets and see them rendered in real-time

---

## Usage

Add FTUI web components to your HTML code. Components support powerful data binding and real-time updates.

### Basic Examples:

**Button:**
```html
<ftui-button (value)="dummy1">on/off</ftui-button>
```

**Label:**
```html
<ftui-label [text]="dummy1"></ftui-label>
```

**Icon with dynamic properties:**
```html
<ftui-icon 
    [name]="dummy1 | map('on: lightbulb-on, off: lightbulb')"
    [color]="temperature | step('0: success, 50: warning, 80: danger')">
</ftui-icon>
```

---

## Binding

FTUI uses a powerful data binding system inspired by modern frameworks. Bindings connect your HTML elements to FHEM/Home Assistant data sources.

### No Binding - Fixed Value

```html
<ftui-label color="danger">demo</ftui-label>
```

### Input Binding (One-Way: Backend → UI)

Updates the UI when the backend reading changes.

**Long format:**
```html
<ftui-label get-color="dummy1:color">demo</ftui-label>
```

**Short format (recommended):**
```html
<ftui-label [color]="dummy1:color">demo</ftui-label>
```

#### Reading Format:

```
[attribute]="DEVICE:READING:PROPERTY"
```

- **DEVICE**: Name of the FHEM/HA device (e.g., `lamp1`, `WeatherLocal`, `ha:light.bedroom`)
- **READING**: Name of the reading (e.g., `state`, `temperature`) - Default: `STATE`
- **PROPERTY**: Property of the reading - Default: `value`
  - `value` - The current value
  - `time` - Timestamp when the reading was set
  - `update` - Last update timestamp in FTUI
  - `invalid` - `true` if reading doesn't exist

**Example - Show timestamp:**
```html
<ftui-label [text]="WeatherLocal:state:time | toDate() | format('HH:mm:ss')"></ftui-label>
```

### Attribute Binding

Set HTML attributes dynamically:

```html
<ftui-label [attr.data-my]="dummy1:status">demo</ftui-label>
```

### Output Binding (One-Way: UI → Backend)

Updates the backend when UI changes.

**Long format:**
```html
<ftui-button set-value="dummy1"></ftui-button>
```

**Short format (recommended):**
```html
<ftui-button (value)="dummy1"></ftui-button>
```

### Two-Way Binding (Bidirectional)

Synchronizes both directions automatically.

**Long format:**
```html
<ftui-button getset-value="dummy1"></ftui-button>
```

**Short format - "Banana in a Box" (recommended):**
```html
<ftui-button [(value)]="dummy1"></ftui-button>
```

### Local Binding

The device name `local` is reserved for client-side binding that doesn't sync with backends.

```html
<link href="themes/mobile-dark-theme.css" rel="stylesheet"
      ftui-binding [disabled]="local:dark">
```

**Built-in local variables:**
- `local:dark` - Automatically set to `true` when OS switches to dark mode

### Events

Components provide events that trigger on attribute changes. The `$event` object contains a `detail` property with the changed data.

```html
<ftui-colorpicker @color-change="console.log($event.detail.hexString)"></ftui-colorpicker>
```

```html
<ftui-dropdown 
    [list]="deviceList:list" 
    [(value)]="selectedDevice" 
    @value-change="console.log('Selected:', $event.detail)">
</ftui-dropdown>
```

Use events to communicate between components and trigger custom JavaScript.

---

## Pipes

Binding values can be transformed using pipe functions. Multiple pipes can be chained together.

### Available Pipes:

| Pipe | Description | Example |
|------|-------------|---------|
| `part(number)` | Extract part of string by index | `"one two three" \| part(1)` → `"two"` |
| `toDate(format)` | Convert to date object | `"2024-01-15" \| toDate()` |
| `toBool()` | Convert to boolean | `"1" \| toBool()` → `true` |
| `toInt()` | Convert to integer | `"3.14" \| toInt()` → `3` |
| `toNumber()` | Convert to float | `"3.14" \| toNumber()` → `3.14` |
| `format(string)` | Format date/time | `date \| format('YYYY-MM-DD HH:mm')` |
| `humanized()` | Human-readable duration | `3600 \| humanized()` → `"1 hour"` |
| `round(decimals)` | Round number | `3.14159 \| round(2)` → `3.14` |
| `fix(decimals)` | Fixed decimal places | `3.1 \| fix(2)` → `"3.10"` |
| `roundMoney()` | Format as currency | `1234.5 \| roundMoney()` → `"1,234.50"` |
| `slice(start, end)` | Extract substring | `"hello" \| slice(0,2)` → `"he"` |
| `encode()` | URL encode | `"hello world" \| encode()` → `"hello%20world"` |
| `add(number)` | Add to value | `10 \| add(5)` → `15` |
| `multiply(number)` | Multiply value | `5 \| multiply(2)` → `10` |
| `divide(number)` | Divide value | `10 \| divide(2)` → `5` |
| `replace(find, replace)` | Replace text | `"hello" \| replace('h', 'H')` → `"Hello"` |
| `map('in:out,...')` | Map values | `"on" \| map('on:green,off:red')` → `"green"` |
| `filter('val,val,...')` | Filter matching values | `"test" \| filter('test,demo')` → `"test"` |
| `step('val:out,...')` | Step-based mapping | `15 \| step('0:cold,10:ok,20:warm')` → `"ok"` |
| `scale(minIn,maxIn,minOut,maxOut)` | Scale value range | `50 \| scale(0,100,0,255)` → `127.5` |
| `ago()` | Time ago | `timestamp \| ago()` → `"2 hours ago"` |
| `till()` | Time until | `timestamp \| till()` → `"in 3 hours"` |
| `timeFormat(format,inputMode,formatMode)` | Format time | `3661 \| timeFormat('HH:mm:ss')` → `"01:01:01"` |
| `minusBlue(threshold)` | Return blue if below threshold | `5 \| minusBlue(10)` → `"blue"` |
| `contains(value)` | Check if contains value | `"hello" \| contains('ell')` → `true` |
| `not()` | Logical NOT | `true \| not()` → `false` |
| `is(value)` | Check equality | `"on" \| is('on')` → `true` |
| `isNot(value)` | Check inequality | `"on" \| isNot('off')` → `true` |
| `pad(count, char)` | Pad string with character | `"5" \| pad(3,'0')` → `"005"` |
| `append(text)` | Append text | `"hello" \| append(' world')` → `"hello world"` |
| `prepend(text)` | Prepend text | `"world" \| prepend('hello ')` → `"hello world"` |
| `capitalize()` | Capitalize first letter | `"hello" \| capitalize()` → `"Hello"` |

### Input Examples (Backend → UI):

```html
<!-- Chain multiple pipes -->
<ftui-label [text]="WeatherLocal:state | part(4) | toInt() | multiply(2) | round(1)"></ftui-label>

<!-- Map values to text -->
<ftui-icon [name]="lamp:state | map('on:lightbulb-on,off:lightbulb')"></ftui-icon>

<!-- Step-based color -->
<ftui-label 
    [text]="temperature" 
    [color]="temperature | step('0:blue,10:green,20:yellow,30:red')">
</ftui-label>

<!-- Format timestamp -->
<ftui-label [text]="sensor:state:time | toDate() | format('DD.MM.YYYY HH:mm')"></ftui-label>
```

### Output Examples (UI → Backend):

```html
<!-- Remove # from color before sending -->
<ftui-colorpicker (hex)="HUEDevice:rgb | replace('#','')"></ftui-colorpicker>

<!-- Scale slider value -->
<ftui-slider (value)="dimmer:pct | scale(0,100,0,255)"></ftui-slider>
```

---

## Colors

FTUI provides a comprehensive color palette with named colors for consistent theming.

### Color Categories

Color values shown are from the default **ftui-theme**. Available themes may use different values.

**Main Colors:**
- `primary` - <span style="color:#20639b">**#20639b**</span> - Primary brand color
- `secondary` - <span style="color:#173f5f">**#173f5f**</span> - Secondary accent color
- `light` - <span style="color:#bfbfbf">**#bfbfbf**</span> - Light theme color
- `medium` - <span style="color:#5d5d5d">**#5d5d5d**</span> - Medium gray
- `dark` - <span style="color:#3f3f3f">**#3f3f3f**</span> - Dark theme color

**Status Colors:**
- `success` - <span style="color:#05aaad">**#05aaad**</span> - Positive/success state
- `warning` - <span style="color:#eeca82">**#eeca82**</span> - Warning/caution state  
- `danger` - <span style="color:#db5d3a">**#db5d3a**</span> - Error/danger state

**Alternative Status:**
- `ok` - Same as `success`
- `error` - Same as `danger`

**Spectrum Colors:**
- `red` - <span style="color:#db5d3a">**#db5d3a**</span>
- `orange` - <span style="color:#f8b13e">**#f8b13e**</span>
- `yellow` - <span style="color:#eeca82">**#eeca82**</span>
- `green` - <span style="color:#05aaad">**#05aaad**</span>
- `blue` - <span style="color:#3062a0">**#3062a0**</span>
- `violet` - <span style="color:#9400d3">**#9400d3**</span>

**Neutral Colors:**
- `white` - **#fff**
- `black` - **#000**
- `gray` - Same as `medium`
- `brown` - <span style="color:#bf7a37">**#bf7a37**</span>
- `grid` - Inherits from grid tile background
- `translucent` - Semi-transparent overlay

### Available Themes

FTUI includes several pre-built themes. Include them in your HTML `<head>`:

**Default Theme (Dark):**
```html
<link href="themes/ftui-theme.css" rel="stylesheet">
```

**Bright Theme (Light):**
```html
<link href="themes/bright-theme.css" rel="stylesheet">
```
Clean, bright interface with light backgrounds. Colors: Primary <span style="color:#3880ff">**#3880ff**</span>, Success <span style="color:#32a054">**#32a054**</span>, Danger <span style="color:#ed553b">**#ed553b**</span>

**Vivid Theme (Vibrant):**
```html
<link href="themes/vivid-theme.css" rel="stylesheet">
```
High-contrast vibrant colors. Colors: Primary <span style="color:#007bff">**#007bff**</span>, Success <span style="color:#28a745">**#28a745**</span>, Warning <span style="color:#ffc107">**#ffc107**</span>

**Retro Theme:**
```html
<link href="themes/retro-theme.css" rel="stylesheet">
```
Classic retro styling with warm tones.

**Mobile Themes:**
```html
<!-- Light mobile theme -->
<link href="themes/mobile-theme.css" rel="stylesheet">

<!-- Dark mobile theme -->
<link href="themes/mobile-dark-theme.css" rel="stylesheet">

<!-- iOS-inspired theme -->
<link href="themes/mobile-ios.css" rel="stylesheet">
```

### Usage Examples

```html
<ftui-button color="primary">Primary Button</ftui-button>
<ftui-label color="danger">Error Message</ftui-label>
<ftui-icon name="warning" color="warning"></ftui-icon>

<!-- Dynamic color based on value -->
<ftui-label 
    [text]="temperature" 
    [color]="temperature | step('0:blue,15:green,25:yellow,30:red')">
</ftui-label>

<!-- Multiple colored components -->
<ftui-row>
  <ftui-button color="success">Success</ftui-button>
  <ftui-button color="warning">Warning</ftui-button>
  <ftui-button color="danger">Danger</ftui-button>
</ftui-row>
```

[**View Color Examples**](https://knowthelist.github.io/ftui/www/ftui/examples/colors.html)

---

## Components

FTUI provides a rich set of web components for building interactive UIs.

### Layout Components

- **Tab** - Tabbed navigation
- **Grid** - Responsive grid layout
- **Circlemenu** - Circular menu
- **Row** - Horizontal layout container
- **Column** - Vertical layout container
- **Cell** - Grid cell container
- **View, ViewStage, ViewSection, ViewItem** - View hierarchy for mobile UIs
- **Swiper** - Touch-enabled slider/carousel

### Display Components

- **[Label](#label)** - Text display with formatting
- **Icon** - Icon display with color and size options
- **[Image](#image)** - Image display with auto-refresh
- **[Badge](#badge)** - Notification badges
- **Clock** - Time display
- **Weather** - Weather information display

### Input Components

- **[Button](#button)** - Interactive button
- **SegmentedButton** - Multi-option button group
- **Knob** - Rotary knob control
- **Slider** - Linear slider control
- **Checkbox** - Toggle checkbox
- **Dropdown** - Selection dropdown
- **Colorpicker** - Color selection tool

### Data Visualization

- **[Chart](#chart)** - Charts and graphs (powered by Chart.js)
- **Medialist** - Media list display

### Special Components

- **[Speak](#speak)** - Text-to-speech output

> **Note:** All components support the following common attributes:
> - `hidden` - Hide component
> - `disabled` - Disable interaction
> - `readonly` - Read-only mode
> - `margin` - Outer spacing
> - `padding` - Inner spacing

---

## Mobile UI

FTUI is perfect for creating responsive mobile interfaces using the `ftui-view` component.

![Mobile Screenshot](http://knowthelist.github.io/ftui/screenshot-mobile.png)

**[View Mobile Demo](https://knowthelist.github.io/ftui/www/ftui/examples/mobile_plain.html)**

---

## Component Reference

### Button

Interactive buttons with multiple states and styles.

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **color** | Color palette selection | `"primary"` \| `"secondary"` \| `"success"` \| `"warning"` \| `"danger"` \| `"light"` \| `"medium"` \| `"dark"` | `"primary"` |
| **fill** | Button fill style | `"clear"` \| `"outline"` \| `"solid"` | `"solid"` |
| **size** | Button size | `"small"` \| `"normal"` \| `"large"` | `"normal"` |
| **shape** | Button shape | `"round"` \| `"normal"` \| `"circle"` | `"normal"` |
| **value** | Current state value | String | `"off"` |
| **states** | Available states (comma-separated) | String | `"on,off"` |

**Example:**
```html
<ftui-button color="success" fill="solid" shape="round" [(value)]="lamp1">
    Toggle Light
</ftui-button>
```

---

### Label

Display text with formatting options.

| Attribute | Description | Type | Default | Example |
|-----------|-------------|------|---------|---------|
| **text** | Text to display | String | `""` | |
| **color** | Text color | Color name | `""` | `"danger"` |
| **unit** | Unit suffix | String | `""` | `"°C"` |
| **interval** | Auto-reload interval (seconds) | Number | `0` | `60` |
| **size** | Font size | Number \| String | `0` | `3` or `"80%"` or `"12px"` |

#### Size Mapping

When size is a number, it maps to these font sizes:

| Size | Font Size | Size | Font Size |
|------|-----------|------|-----------|
| -4 | 0.125em | 0 | 1em |
| -3 | 0.25em | 1 | 1.25em |
| -2 | 0.5em | 2 | 1.5em |
| -1 | 0.75em | 3 | 1.75em |
| | | 4 | 2em |
| | | 5 | 2.5em |
| | | 6-12 | 3em-12em |

Size can also be specified as `%`, `px`, or `em` strings.

**Examples:**
```html
<ftui-label [text]="temperature" size="3" unit="°C" color="primary"></ftui-label>
<ftui-label text="System Status" size="80%" color="success"></ftui-label>
<ftui-label [text]="sensor:state" size="12px"></ftui-label>
```

---

### Image

Display images with refresh capabilities.

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **base** | Base URL path | String | `""` |
| **src** | Image filename or full URL | String | `""` |
| **width** | Image width | Number \| `"auto"` | `"auto"` |
| **height** | Image height | Number \| `"auto"` | `"auto"` |
| **interval** | Auto-reload interval (seconds) | Number | `0` |
| **refresh** | Reload trigger attribute | String | `""` |
| **nocache** | Bypass cache | Boolean | `false` |

**Examples:**
```html
<!-- Simple image -->
<ftui-image src="weather.png" width="200"></ftui-image>

<!-- Auto-refresh every 30 seconds -->
<ftui-image src="camera/snapshot.jpg" interval="30" nocache></ftui-image>

<!-- Refresh on device change -->
<ftui-image 
    base="/fhem/images/" 
    src="floorplan.png" 
    [refresh]="motion_sensor:state">
</ftui-image>
```

---

### Badge

Display notification badges that disappear when empty.

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **color** | Badge color | Color name | `"primary"` |
| **text** | Badge content | String | `""` |

**Examples:**
```html
<!-- Static badge -->
<ftui-badge text="5" color="danger"></ftui-badge>

<!-- Dynamic notification count -->
<ftui-badge [text]="notifications:count" color="warning"></ftui-badge>
```

---

### Speak

Text-to-speech synthesis using the Web Speech API.

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **lang** | Language code | `"en-US"` \| `"de-DE"` \| etc. | User agent default |
| **pitch** | Voice pitch (0.0-2.0) | Float | `0.9` |
| **rate** | Speech rate (0.1-10) | Float | `1.0` |
| **volume** | Volume (0.0-1.0) | Float | `1.0` |
| **text** | Text to speak | String | `""` |

**Examples:**
```html
<!-- Announce temperature changes -->
<ftui-speak 
    lang="en-US" 
    rate="1.2" 
    [text]="temperature | format('Temperature is now {0} degrees')">
</ftui-speak>

<!-- German announcement -->
<ftui-speak 
    lang="de-DE" 
    pitch="1.0" 
    [text]="doorbell:state | map('on:Jemand ist an der Tür')">
</ftui-speak>
```

---

### Colorpicker

Advanced color selection supporting RGB, HSL, and hex formats.

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **hex** | RGB hex value (#ffffff) | String | `""` |
| **hue** | Hue (0-360) | Number | `0` |
| **saturation** | Saturation (0-100) | Number | `0` |
| **brightness** | Brightness (0-100) | Number | `0` |

**Examples:**
```html
<!-- Simple hex color picker -->
<ftui-colorpicker [(hex)]="rgbLamp:rgb"></ftui-colorpicker>

<!-- HSL color picker for Hue lights -->
<ftui-colorpicker 
    [(hue)]="ha:light.bedroom:hs_color[0]"
    [(saturation)]="ha:light.bedroom:hs_color[1]">
</ftui-colorpicker>

<!-- With change event -->
<ftui-colorpicker 
    [(hex)]="colorLight:hex"
    @color-change="console.log('New color:', $event.detail.hexString)">
</ftui-colorpicker>
```

---

### Chart

Powerful charting component powered by [Chart.js](https://www.chartjs.org/).

**Supported Chart Types:**
- Line chart
- Bar chart
- Radar chart
- Doughnut and Pie chart
- Polar chart
- Bubble chart
- Area chart
- Mixed types

#### Main Component: `ftui-chart`

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **title** | Chart title | String | `""` |
| **type** | Chart type | String | `"line"` |
| **width** | Chart width | String | `""` |
| **height** | Chart height | String | `""` |
| **unit** | Time unit | `"day"` \| `"hour"` \| `"minute"` | `"day"` |
| **offset** | Time offset | Number | `0` |
| **prefetch** | Data prefetch amount | Number | `0` |
| **extend** | Extend data range | Boolean | `false` |
| **noscale** | Disable auto-scaling | Boolean | `false` |
| **no-y** | Hide Y-axis | Boolean | `false` |
| **no-y1** | Hide secondary Y-axis | Boolean | `false` |
| **no-x** | Hide X-axis | Boolean | `false` |
| **y-min** | Y-axis minimum | Number | `0` |
| **y-max** | Y-axis maximum | Number | `0` |
| **y1-min** | Y1-axis minimum | Number | `0` |
| **y1-max** | Y1-axis maximum | Number | `0` |
| **y-label** | Y-axis label | String | `""` |
| **y1-label** | Y1-axis label | String | `""` |

#### Child Component: `ftui-chart-data`

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **label** | Data series label | String | `""` |
| **type** | Chart type override | String | `"line"` |
| **fill** | Fill under line | Boolean | `false` |
| **hidden** | Hide series | Boolean | `false` |
| **background-color** | Fill color | Color | `""` |
| **border-color** | Line/border color | Color | Primary color |
| **border-width** | Line width | Number | `1.2` |
| **point-radius** | Point size | Number | `2` |
| **log** | FHEM DbLog device | String | `"-"` |
| **file** | Log file type | String | `"-"` |
| **spec** | Reading specification | String | `"4:.*"` |
| **unit** | Data unit | String | `"°C"` |
| **start-date** | Start date | Date | `""` |
| **end-date** | End date | Date | `""` |
| **update** | Update trigger | String | `""` |
| **tension** | Line curve tension | Number | `0.0` |
| **stepped** | Stepped line | Boolean | `false` |
| **y-axis-id** | Y-axis assignment | Number | `0` |

**Examples:**

```html
<!-- Simple temperature chart -->
<ftui-chart title="Temperature History" height="300px">
    <ftui-chart-data 
        label="Living Room"
        log="DBLogDevice" 
        file="history" 
        spec="TempSensor:temperature"
        border-color="red"
        fill>
    </ftui-chart-data>
</ftui-chart>

<!-- Multi-series chart with auto-update -->
<ftui-chart title="Climate Data" type="line" height="400px">
    <ftui-chart-data 
        label="Temperature"
        log="DBLog" 
        file="history" 
        spec="Climate:temperature"
        unit="°C"
        border-color="orange"
        [update]="Climate:temperature:time">
    </ftui-chart-data>
    
    <ftui-chart-data 
        label="Humidity"
        log="DBLog" 
        file="history" 
        spec="Climate:humidity"
        unit="%"
        border-color="blue"
        y-axis-id="1">
    </ftui-chart-data>
</ftui-chart>

<!-- Mixed chart types -->
<ftui-chart title="Energy Consumption">
    <ftui-chart-data 
        label="Daily Usage"
        type="bar"
        log="DBLog" 
        file="history" 
        spec="Power:daily"
        background-color="green">
    </ftui-chart-data>
    
    <ftui-chart-data 
        label="Average"
        type="line"
        log="DBLog" 
        file="history" 
        spec="Power:average"
        border-color="red"
        tension="0.4">
    </ftui-chart-data>
</ftui-chart>
```

---

### Icon

Display icons from the built-in icon library.

| Attribute | Description | Type | Default |
|-----------|-------------|------|---------|
| **type** | Icon type | String | `""` |
| **path** | Icon path | String | `""` |
| **name** | Icon name | String | `""` |
| **color** | Icon color | Color name | `""` |
| **rgb** | RGB color value | String | `""` |
| **size** | Icon size | Number \| String | `0` |
| **height** | Icon height | String | `""` |
| **width** | Icon width | String | `""` |
| **rotate** | Rotation in degrees | Number | `0` |

#### Size Mapping (same as Label)

When size is a number, it maps to font sizes from 0.125em to 12em.

**Examples:**
```html
<!-- Simple icon -->
<ftui-icon name="lightbulb" color="yellow" size="3"></ftui-icon>

<!-- Dynamic icon based on state -->
<ftui-icon 
    [name]="lamp:state | map('on:lightbulb-on,off:lightbulb')"
    [color]="lamp:state | map('on:yellow,off:gray')"
    size="4">
</ftui-icon>

<!-- Rotated icon -->
<ftui-icon name="arrow-up" rotate="45" color="primary" size="2"></ftui-icon>
```

[**View All Icons**](https://knowthelist.github.io/ftui/www/ftui/icons/demo.html)

---

### Layout Components

Build complex layouts with Row, Column, and Cell components using a flexible CSS Flexbox-based system.

#### Component Overview

- **`<ftui-row>`** - Horizontal container (flex-direction: row)
- **`<ftui-column>`** - Vertical container (flex-direction: column)
- **`<ftui-cell>`** - Generic flexible container for content grouping
- **`<ftui-grid>`** + **`<ftui-grid-tile>`** - Responsive grid system with tile positioning

#### Common Attributes

All layout components support:

| Attribute | Values | Description |
|-----------|--------|-------------|
| `align-items` | `left`, `right`, `top`, `bottom`, `center`, `around`, `stretch` | Flexbox alignment control |
| `margin` | CSS value (e.g., `"1"`, `"1em"`, `"0 0 0 10px"`) | Outer spacing |
| `padding` | CSS value | Inner spacing |
| `width` | CSS value (e.g., `"50%"`, `"200px"`) | Component width |
| `height` | CSS value (e.g., `"70%"`, `"600px"`) | Component height |
| `gap` | CSS value (e.g., `"0.5"`) | Spacing between child elements |

#### Practical Examples

**Basic Row Layout** - Horizontal button arrangement:
```html
<ftui-row align-items="stretch">
  <ftui-button [(value)]="device1">Device 1</ftui-button>
  <ftui-button [(value)]="device2">Device 2</ftui-button>
  <ftui-button [(value)]="device3">Device 3</ftui-button>
</ftui-row>
```

**Nested Row & Column** - Multi-room light controls:
```html
<ftui-row>
  <ftui-column>
    <ftui-row>
      <ftui-label text="Living Room"></ftui-label>
      <ftui-button shape="circle" [(value)]="room1">
        <ftui-icon name="lightbulb"></ftui-icon>
      </ftui-button>
    </ftui-row>
    <ftui-row>
      <ftui-label text="Kitchen"></ftui-label>
      <ftui-button shape="circle" [(value)]="room2">
        <ftui-icon name="lightbulb"></ftui-icon>
      </ftui-button>
    </ftui-row>
  </ftui-column>
  <ftui-column>
    <ftui-row>
      <ftui-label text="Bedroom"></ftui-label>
      <ftui-button shape="circle" [(value)]="room3">
        <ftui-icon name="lightbulb"></ftui-icon>
      </ftui-button>
    </ftui-row>
  </ftui-column>
</ftui-row>
```

**Column with Alignment** - Sensor data display:
```html
<ftui-row>
  <ftui-column align-items="left" margin="1">
    <ftui-label text="Thermostat"></ftui-label>
    <ftui-label text="Radiator"></ftui-label>
    <ftui-label text="Heater"></ftui-label>
  </ftui-column>
  <ftui-column align-items="left" margin="1">
    <ftui-label [text]="device:temp1" unit="°C"></ftui-label>
    <ftui-label [text]="device:temp2" unit="°C"></ftui-label>
    <ftui-label [text]="device:temp3" unit="°C"></ftui-label>
  </ftui-column>
</ftui-row>
```

**Cell for Content Grouping** - Weather display with gap spacing:
```html
<ftui-cell align-items="left" gap="0.5">
  <ftui-label color="medium" size="1">Temperature</ftui-label>
  <ftui-label [text]="weather:temp | fix(1)" unit="°" size="8" thin></ftui-label>
</ftui-cell>
<ftui-cell align-items="left" margin="1em 0 0" gap="0.5">
  <ftui-label color="medium">Rain</ftui-label>
  <ftui-label [text]="weather:rain" size="3" unit="mm" thin></ftui-label>
</ftui-cell>
```

**Responsive Height** - Full-height column:
```html
<ftui-column height="70%">
  <ftui-button>Button 1</ftui-button>
  <ftui-button>Button 2</ftui-button>
</ftui-column>
```

#### Tips

- **Nesting**: Freely nest Row inside Column and vice versa for complex layouts
- **Alignment**: Use `align-items="around"` for evenly distributed spacing
- **Margins**: Support CSS shorthand: `margin="1"` (all sides) or `margin="0 0 0 10px"` (top right bottom left)
- **Mobile**: Combine with `<ftui-view>` components for mobile-optimized interfaces

---

## Examples

Explore the full capabilities of FTUI with these live examples:

### Layout & Structure
- [**Tab**](https://knowthelist.github.io/ftui/www/ftui/examples/tab.html) - Tabbed navigation
- [**Grid**](https://knowthelist.github.io/ftui/www/ftui/examples/grid.html) - Responsive grid layouts
- [**Circlemenu**](https://knowthelist.github.io/ftui/www/ftui/examples/circlemenu.html) - Circular menu navigation

### Display Components
- [**Label**](https://knowthelist.github.io/ftui/www/ftui/examples/label.html) - Text display
- [**Icon**](https://knowthelist.github.io/ftui/www/ftui/examples/icon.html) - Icon usage
- [**Image**](https://knowthelist.github.io/ftui/www/ftui/examples/image.html) - Image display
- [**Badge**](https://knowthelist.github.io/ftui/www/ftui/examples/badge.html) - Notification badges

### Input & Control
- [**Button**](https://knowthelist.github.io/ftui/www/ftui/examples/button.html) - Buttons and interactions
- [**Knob**](https://knowthelist.github.io/ftui/www/ftui/examples/knob.html) - Rotary controls
- [**Slider**](https://knowthelist.github.io/ftui/www/ftui/examples/slider.html) - Linear sliders
- [**Checkbox**](https://knowthelist.github.io/ftui/www/ftui/examples/checkbox.html) - Toggle controls
- [**Dropdown**](https://knowthelist.github.io/ftui/www/ftui/examples/dropdown.html) - Selection menus
- [**Colorpicker**](https://knowthelist.github.io/ftui/www/ftui/examples/colorpicker.html) - Color selection
- [**SegmentedButton**](https://knowthelist.github.io/ftui/www/ftui/examples/segment.html) - Multi-option buttons

### Advanced Components
- [**Chart**](https://knowthelist.github.io/ftui/www/ftui/examples/chart.html) - Data visualization
- [**Popup**](https://knowthelist.github.io/ftui/www/ftui/examples/popup.html) - Modal dialogs
- [**Swiper**](https://knowthelist.github.io/ftui/www/ftui/examples/swiper.html) - Touch carousels
- [**Medialist**](https://knowthelist.github.io/ftui/www/ftui/examples/medialist.html) - Media galleries
- [**Departure**](https://knowthelist.github.io/ftui/www/ftui/examples/departure.html) - Transit information
- [**Speak**](https://knowthelist.github.io/ftui/www/ftui/examples/speak.html) - Text-to-speech

### Mobile UIs
- [**View (Plain)**](https://knowthelist.github.io/ftui/www/ftui/examples/mobile_plain.html) - Basic mobile interface
- [**View (Full)**](https://knowthelist.github.io/ftui/www/ftui/examples/mobile_full.html) - Complete mobile UI (FHEM-only public example)
- [**Home Assistant**](https://knowthelist.github.io/ftui/www/ftui/examples/ha.html) - Dedicated Home Assistant example
- [**Home Assistant (Basic)**](https://knowthelist.github.io/ftui/www/ftui/examples/ha-basic.html) - Generic HA grid example
- [**Home Assistant (Mobile)**](https://knowthelist.github.io/ftui/www/ftui/examples/ha-mobile.html) - Generic HA mobile example

Files prefixed with `_` are private/local dashboard variants and are intentionally not part of the public example set.

### Theming
- [**Colors**](https://knowthelist.github.io/ftui/www/ftui/examples/colors.html) - Color palette
- [**Themes**](https://knowthelist.github.io/ftui/www/ftui/examples/themes.html) - Theme examples

---

## Troubleshooting

### Common Issues

**Backend Connection Errors:**
- Verify FHEM/Home Assistant is running and accessible
- Check CORS settings for Home Assistant
- Ensure access token is valid and has appropriate permissions
- Check network connectivity between client and server

**Components Not Rendering:**
- Open browser console (F12) to check for JavaScript errors
- Verify component names are correctly spelled
- Ensure all required attributes are provided
- Check that backend prefix (`ha:`) is used correctly

**Updates Not Working:**
- Clear browser cache
- Verify reading names match your FHEM/HA configuration
- Check that bindings use correct syntax `[attribute]="device:reading"`
- Ensure FHEM DbLog is properly configured for chart components

---

## Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

Report bugs and feature requests on the [GitHub Issues](https://github.com/knowthelist/ftui/issues) page.

---

## Donation

Support the continued development of this versatile UI framework:

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PD4C2XM2VTD9A">
  <img src="https://www.paypalobjects.com/de_DE/DE/i/btn/btn_donateCC_LG.gif" alt="Donate via PayPal" />
</a>

**Many thanks to all donors and contributors!**

---

## License

This project is licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.php).

---

## Community & Support

- **Documentation:** [GitHub Pages](https://knowthelist.github.io/ftui/)
- **Source Code:** [GitHub Repository](https://github.com/knowthelist/ftui)
- **Issues:** [Bug Reports & Feature Requests](https://github.com/knowthelist/ftui/issues)
- **FHEM Forum:** [FHEM Community](https://forum.fhem.de/)

---

**Built with ❤️ for the FHEM and Home Assistant communities**
  
