import SmartQueue from './queue.js';

SmartQueue.prototype.estimateWaitTime = function () {
    const lambda = this.metricsData.queueLength / (1000 * 60); // Arrival rate (tasks/min)
    const mu = this.maxConcurrency / 1000; // Service rate (tasks/sec)
    if (lambda >= mu) return Infinity; // Queue is overloaded
    return lambda / (mu * (mu - lambda)) * 1000; // Wait time in ms
};

SmartQueue.prototype.adjustConcurrency = function () {
    const waitTime = this.estimateWaitTime();
    if (waitTime > 5000 && this.maxConcurrency > 1) {
        this.maxConcurrency--; // Reduce concurrency if wait time is too high
    } else if (waitTime < 1000 && this.maxConcurrency < 10) {
        this.maxConcurrency++; // Increase concurrency if queue is underutilized
    }
};