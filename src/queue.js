class SmartQueue {
    constructor(options = {}) {
        this.tasks = new Map();
        this.running = new Set();
        this.maxConcurrency = options.maxConcurrency || 4;
        this.weights = options.weights || { urgency: 0.4, resource: 0.3, userContext: 0.3 };
        this.state = options.state || {
            resource: () => 0.5, // Default: neutral resource load
            userContext: () => 1, // Default: neutral context
        };
        this.alpha = options.learningRate || 0.1; // Q-learning rate
        this.gamma = options.discountFactor || 0.9; // Future reward discount
        this.qTable = new Map(); // Store Q-values
        this.metricsData = { queueLength: 0, waitTimes: [], completed: 0 };
        this.debug = options.debug || false;
        this.initDebugger();
    }

    async add({ id, urgency = 0.5, run }) {
        const task = { id, urgency, run, status: 'pending', waitTime: 0, startTime: Date.now() };
        this.tasks.set(id, task);
        this.metricsData.queueLength++;

        // Use setTimeout to ensure async execution
        setTimeout(() => this.schedule(), 0);
        return task;
    }

    async schedule() {
        if (this.running.size >= this.maxConcurrency) return;

        const pendingTasks = Array.from(this.tasks.values()).filter(t => t.status === 'pending');
        if (!pendingTasks.length) return;

        // Score tasks
        const scoredTasks = pendingTasks.map(task => ({
            task,
            score: this.getScore(task),
        }));

        // Sort by score (highest first)
        scoredTasks.sort((a, b) => b.score - a.score);

        // Run top tasks up to concurrency limit
        for (const { task } of scoredTasks.slice(0, this.maxConcurrency - this.running.size)) {
            this.running.add(task.id);
            task.status = 'running';
            this.execute(task);
        }

        if (this.debug) this.updateDebugger();
    }

    async execute(task) {
        try {
            const result = await task.run();
            task.status = 'completed';
            task.result = result;
            this.updateMetrics(task);
            this.updateQValue(task, 1); // Reward success
        } catch (error) {
            task.status = 'failed';
            task.error = error;
            this.updateQValue(task, -1); // Penalize failure
        } finally {
            this.running.delete(task.id);
            this.tasks.delete(task.id);
            this.metricsData.queueLength--;
            this.schedule();
            if (this.debug) this.updateDebugger();
        }
    }

    metrics() {
        return {
            queueLength: this.metricsData.queueLength,
            avgWaitTime: this.metricsData.waitTimes.length
                ? this.metricsData.waitTimes.reduce((a, b) => a + b, 0) / this.metricsData.waitTimes.length
                : 0,
            completed: this.metricsData.completed,
        };
    }

    // Add missing methods that are used by other modules
    initDebugger() {
        if (!this.debug || typeof document === 'undefined') return;

        const overlay = document.createElement('div');
        overlay.id = 'smart-queue-debug';
        overlay.style = `
        position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8);
        color: white; padding: 10px; font-size: 12px; z-index: 9999; max-width: 300px;
      `;
        document.body.appendChild(overlay);
        this.debugOverlay = overlay;
    }

    updateDebugger() {
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
    }

    updateMetrics(task) {
        const waitTime = Date.now() - task.startTime;
        this.metricsData.waitTimes.push(waitTime);
        if (this.metricsData.waitTimes.length > 100) {
            this.metricsData.waitTimes.shift(); // Keep last 100
        }
        if (task.status === 'completed') {
            this.metricsData.completed++;
        }
    }

    getScore(task) {
        const state = this.getState(task);
        const action = task.id;
        const stateKey = JSON.stringify(state);
        const qKey = `${stateKey}:${action}`;

        // Initialize Q-value if not exists
        if (!this.qTable.has(qKey)) {
            this.qTable.set(qKey, 0);
        }

        // Calculate score: Q-value + weighted factors
        const qValue = this.qTable.get(qKey);
        const urgency = task.urgency;
        const resource = this.state.resource();
        const userContext = this.state.userContext();

        return (
            qValue +
            this.weights.urgency * urgency +
            this.weights.resource * (1 - resource) + // Lower resource load = higher score
            this.weights.userContext * userContext
        );
    }

    getState(task) {
        return {
            resource: this.state.resource().toFixed(2),
            userContext: this.state.userContext().toFixed(2),
            urgency: task.urgency.toFixed(2),
        };
    }

    updateQValue(task, reward) {
        const state = this.getState(task);
        const action = task.id;
        const stateKey = JSON.stringify(state);
        const qKey = `${stateKey}:${action}`;

        const currentQ = this.qTable.get(qKey) || 0;
        const nextState = this.getState(task); // Simplified: use same state post-action
        const nextQ = Math.max(...Array.from(this.tasks.values()).map(t => {
            const nextKey = `${JSON.stringify(nextState)}:${t.id}`;
            return this.qTable.get(nextKey) || 0;
        })) || 0;

        const newQ = (1 - this.alpha) * currentQ + this.alpha * (reward + this.gamma * nextQ);
        this.qTable.set(qKey, newQ);
    }

    estimateWaitTime() {
        const lambda = this.metricsData.queueLength / (1000 * 60); // Arrival rate (tasks/min)
        const mu = this.maxConcurrency / 1000; // Service rate (tasks/sec)
        if (lambda >= mu) return Infinity; // Queue is overloaded
        return lambda / (mu * (mu - lambda)) * 1000; // Wait time in ms
    }

    adjustConcurrency() {
        const waitTime = this.estimateWaitTime();
        if (waitTime > 5000 && this.maxConcurrency > 1) {
            this.maxConcurrency--; // Reduce concurrency if wait time is too high
        } else if (waitTime < 1000 && this.maxConcurrency < 10) {
            this.maxConcurrency++; // Increase concurrency if queue is underutilized
        }
    }
}

export default SmartQueue;