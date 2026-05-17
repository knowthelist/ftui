# FTUI – FHEM Tablet UI v3

A modern web UI for [FHEM](https://fhem.de) home automation, built with Web Components.

---

## Usage

### Option A – Docker Compose (recommended)

Create a `compose.yml`:

```yaml
services:
  ftui:
    image: knowthelist/ftui
    ports:
      - "8080:80"
    volumes:
      - <path>/index.html:/usr/share/nginx/html/index.html:ro
    restart: unless-stopped
```

Then start it:

```
docker compose up -d
```

---

### Option B – docker run

**1. Pull** the image:

```
docker pull knowthelist/ftui
```

**2.** Add the `fhemweb_url` to the `<head>` of your `index.html`:

```html
<meta name="fhemweb_url" content="http://<your_fhem_url>:8083/fhem/">
```

**3. Run** the container:

```
docker run -d \
  -p 8080:80 \
  -v <path>/index.html:/usr/share/nginx/html/index.html:ro \
  --name ftui3 \
  --restart unless-stopped \
  knowthelist/ftui
```

**4. Open** in any browser on your network:

```
http://<docker_host>:8080
```

---

## Source & Documentation

[https://github.com/knowthelist/ftui](https://github.com/knowthelist/ftui)
