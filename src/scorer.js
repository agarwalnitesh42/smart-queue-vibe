import SmartQueue from './queue.js';

SmartQueue.prototype.getScore = function (task) {
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
};

SmartQueue.prototype.getState = function (task) {
    return {
        resource: this.state.resource().toFixed(2),
        userContext: this.state.userContext().toFixed(2),
        urgency: task.urgency.toFixed(2),
    };
};

SmartQueue.prototype.updateQValue = function (task, reward) {
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
};