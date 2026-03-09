export const appConfig = {
  name: "mreycode-signal",
  version: "2.6.0",
  description: "A single-page, elegant, bento-style metrics dashboard supporting iframe integration per widget.",
  url: "https://mreycode-signal.vercel.app",
  github: "https://github.com/jonreygalera/mreycode-signal",
  keywords: [
    "dashboard",
    "metrics",
    "bento grid",
    "real-time analytics",
    "open source",
    "iframe widget",
    "data visualization",
    "mreycode",
    "signal engine"
  ],
  developer: {
    name: "jonreygalera",
    website: "https://jonreygalera.vercel.app",
    email: "jonreygalera@gmail.com",
    paypal: "jonreygalera@gmail.com",
  },
  techStack: [
    "Next.js 16 (App Router)",
    "React 19",
    "Tailwind CSS 4",
    "Recharts 3",
    "Framer Motion 12",
    "SWR 2.4",
  ],
  statsApi: process.env.NEXT_PUBLIC_STATS_API ?? "https://api-mreyai.vercel.app",
  signalSound: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
  defaultSignalDuration: 10,
  localStorageLimit: 5,
};

