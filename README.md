<p align="center"><a href="https://jonreygalera.vercel.app" target="_blank"><img src="https://raw.githubusercontent.com/jonreygalera/mreydocs/refs/heads/main/assets/logo.png" alt="Mreycode Logo"></a></p>

# mreycode-signal

A single-page, elegant, bento-style metrics dashboard supporting iframe integration per widget. Built with a **Vibe Coding** approach using the **Google Antigravity IDE**.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)

## 📖 Full Documentation

For comprehensive setup guides, widget configurations, and iframe API details, please visit our official documentation:

👉 **[mreycode-signal Documentation](https://github.com/jonreygalera/mreydocs/tree/main/mreycode-signal)**

---

## Quick Start

### Installation

```bash
npm install
npm run dev
```

### Adding a Widget

To add a new widget, append a `WidgetConfig` object to the `dashboardWidgets` array in `src/config/dashboard.ts`.

#### Stat Widget

```json
{
  "id": "tpl-stat-vibe",
  "type": "stat",
  "label": "Total Vibe",
  "api": "/api/vibe",
  "config": {
    "prefix": "$",
    "suffix": "!",
    "abbreviate": true
  }
}
```

#### Chart Widget

```json
{
  "id": "gold-futures-chart",
  "type": "chart",
  "label": "Gold Price",
  "api": "/api/yahoo?symbol=GC=F",
  "config": {
    "chart": "line", // bar, area, line
    "xKey": "timestamp",
    "yKey": "price",
    "prefix": "$"
  }
}
```
---

## Credits

- **Developer**: [jonreygalera](https://jonreygalera.vercel.app)
- **Repo**: [github.com/jonreygalera/mreycode-signal](https://github.com/jonreygalera/mreycode-signal)

Project created with **Google Antigravity IDE** using the Vibe Coding approach.
