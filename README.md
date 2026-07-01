# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

---

# HealthPhysics Lab 🏥

A premium React healthcare app with a 2D physics engine and mobile device sensor integration.

---

## Features

### Module 1 — Balance Rehab ⚖️
- Matter.js marble maze controlled by phone tilt (gyroscope)
- Real-time **Stability Score** from accelerometer variance
- Best-score tracking + session timer
- Haptic feedback on perfect balance streaks

### Module 2 — Pill Organizer 💊
- Colorful pill bodies fall from the top of the screen
- Tilt device left/right to sort **Morning** and **Evening** pills into their buckets
- Wrong-bucket detection bounces pills back
- Visual burst + double-vibrate on correct sort

### Module 3 — Stress Relief Room 🫧
- 12 floating stress-labelled bubbles in near-zero gravity
- **Shake your phone** → massive random force applied to all bubbles
- **Tap any bubble** → pops with animation and haptic pulse
- Optional breathing guide overlay

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# 3. Open on mobile
#    - Your terminal will show a Local Network URL like http://192.168.x.x:3000
#    - Open that on your phone's browser
#    - On iOS: tap "Enable Motion Sensors" when prompted
```

---

## Project Structure

```
src/
├── App.jsx                    # Root router & sensor orchestration
├── index.js                   # React entry point
├── index.css                  # Global styles & animations
├── hooks/
│   └── useSensors.js          # DeviceOrientation + DeviceMotion hook
└── components/
    ├── UI.jsx                 # Reusable: buttons, modals, ScoreRing, Burst
    ├── PermissionModal.jsx    # iOS permission gate
    ├── ModuleSelector.jsx     # Home screen with 3 module cards
    ├── BalanceModule.jsx      # Physics marble maze
    ├── PillsModule.jsx        # Medication sorting game
    └── StressModule.jsx       # Anxiety bubble room
```

---

## Integrating Into Your Existing App

### Option A — Drop in as routes

If you already have React Router:

```jsx
// In your router file
import HealthPhysicsApp from './healthcare-physics-app/src/App';

<Route path="/health-lab" element={<HealthPhysicsApp />} />
```

### Option B — Import individual modules

```jsx
import BalanceModule from './components/BalanceModule';
import { useSensors }  from './hooks/useSensors';

function MyScreen() {
  const { orientation, active, requestPermission } = useSensors();
  return <BalanceModule orientation={active ? orientation : null} onBack={() => {}} />;
}
```

### Option C — Use as a fullscreen overlay

```jsx
import { useState } from 'react';
import HealthPhysicsApp from './healthcare-physics-app/src/App';

function Dashboard() {
  const [showLab, setShowLab] = useState(false);
  return (
    <>
      <button onClick={() => setShowLab(true)}>Open Health Lab</button>
      {showLab && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
          <HealthPhysicsApp />
        </div>
      )}
    </>
  );
}
```

---

## Sensor Notes

| Platform | Orientation | Motion | Permission |
|----------|-------------|--------|------------|
| iOS 13+  | ✅          | ✅     | Required (`DeviceOrientationEvent.requestPermission()`) |
| Android  | ✅          | ✅     | Automatic |
| Desktop  | ❌          | ❌     | Mouse/drag fallback |

- The `useSensors` hook handles iOS permission automatically
- Desktop automatically falls back to mouse drag for gravity control
- Haptic feedback via `navigator.vibrate()` (Android Chrome; iOS Safari does not support)

---

## Customising

### Add more pills to Module 2
Edit `PILL_DEFS` in `PillsModule.jsx`:
```js
const PILL_DEFS = [
  { type: 'morning', color: '#10b981', stroke: '#6ee7b7', label: 'Vitamin D' },
  { type: 'evening', color: '#f59e0b', stroke: '#fcd34d', label: 'Omega-3' },
  // ...
];
```

### Add stressors to Module 3
Edit `STRESSORS` in `StressModule.jsx`:
```js
const STRESSORS = [
  { label: 'Overwhelm', color: '#6366f1', size: 44 },
  // ...
];
```

### Adjust physics gravity strength
In any module, change the `scale` value in `Engine.create`:
```js
const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.003 } });
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18 | UI framework |
| react-dom | ^18 | DOM rendering |
| matter-js | ^0.19 | 2D physics engine |
| react-scripts | 5 | CRA build tooling |

---

## License
MIT — use freely in your healthcare app.
