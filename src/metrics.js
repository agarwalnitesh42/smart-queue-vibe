import SmartQueue from './queue.js';

SmartQueue.prototype.updateMetrics = function (task) {
    const waitTime = Date.now() - task.startTime;
    this.metricsData.waitTimes.push(waitTime);
    if (this.metricsData.waitTimes.length > 100) {
        this.metricsData.waitTimes.shift(); // Keep last 100
    }
    if (task.status === 'completed') {
        this.metricsData.completed++;
    }
};