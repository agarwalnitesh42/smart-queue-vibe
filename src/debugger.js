import SmartQueue from './queue.js';

SmartQueue.prototype.initDebugger = function () {
    if (!this.debug || typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'smart-queue-debug';
    overlay.style = `
    position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8);
    color: white; padding: 10px; font-size: 12px; z-index: 9999; max-width: 300px;
  `;
    document.body.appendChild(overlay);
    this.debugOverlay = overlay;
};

SmartQueue.prototype.updateDebugger = function () {
    if (!this.debugOverlay) return;

    const tasks = Array.from(this.tasks.values()).map(t => ({
        id: t.id,
        status: t.status,
        score: this.getScore(t).toFixed(2),
    }));
    const metrics = this.metrics();

    this.debugOverlay.innerHTML = `
    <h3>Smart Queue Vibe</h3>
    <p>Queue Length: ${metrics.queueLength}</p>
    <p>Avg Wait Time: ${metrics.avgWaitTime.toFixed(2)}ms</p>
    <p>Completed: ${metrics.completed}</p>
    <p>Tasks:</p>
    <ul>
      ${tasks.map(t => `<li>${t.id}: ${t.status} (Score: ${t.score})</li>`).join('')}
    </ul>
  `;
};