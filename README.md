# smart-queue-vibe

Adaptive task queue for frontend and Node.js that prioritizes asynchronous tasks using reinforcement learning and queueing theory. Optimize performance with minimal effort!

## Installation
```bash
npm install smart-queue-vibe
```

## Usage
# Frontend
``` bash
import { SmartQueue } from 'smart-queue-vibe';

const queue = new SmartQueue({
  maxConcurrency: 4,
  weights: { urgency: 0.4, resource: 0.3, userContext: 0.3 },
  state: {
    resource: () => performance.now() - lastRenderTime,
    userContext: () => document.visibilityState === 'visible' ? 1 : 0.5,
  },
  debug: true,
});

queue.add({
  id: 'fetch-data',
  urgency: 0.8,
  run: async () => (await fetch('/api/data')).json(),
}).then(result => console.log(result));
```
# Node.js
``` bash
const { SmartQueue } = require('smart-queue-vibe');

const queue = new SmartQueue({
  maxConcurrency: 10,
  state: { resource: () => process.cpuUsage().percent / 100 },
});

queue.add({
  id: 'process-job',
  urgency: 0.5,
  run: async () => heavyComputation(),
});
```

## Features
# Dynamic task prioritization with Q-learning.
# Real-time scheduling using queueing theory.
# Visual debugger for frontend.
# Lightweight (~10KB minified).
# No dependencies.

