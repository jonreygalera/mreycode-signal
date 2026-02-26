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

### Adding a Widget (Snippet)

Open `src/config/dashboard.ts` and add a config object:

```typescript
{
  id: 'revenue-chart',
  type: 'line',
  label: 'Revenue',
  api: '/api/revenue',
  responsePath: 'result.series',
  xKey: 'day',
  yKey: 'revenue'
}
```

### Iframe Embedding (Snippet)

```html
<iframe
  src="https://your-domain.com/widget/[ID]/iframe?theme=dark"
  width="100%"
  height="400"
  frameborder="0"
></iframe>
```

---

## Credits

- **Developer**: [jonreygalera](https://jonreygalera.vercel.app)
- **Repo**: [github.com/jonreygalera/mreycode-signal](https://github.com/jonreygalera/mreycode-signal)

Project created with **Google Antigravity IDE** using the Vibe Coding approach.
