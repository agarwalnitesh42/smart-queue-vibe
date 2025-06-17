import { SmartQueue } from '../src/index.js';

test('adds and runs tasks', async () => {
    const queue = new SmartQueue({ maxConcurrency: 1 });
    let ran = false;

    // Add the task
    const task = await queue.add({
        id: 'test',
        run: async () => {
            ran = true;
            return 'done';
        },
    });

    // Wait for the task to complete
    await new Promise(resolve => {
        const checkCompletion = () => {
            if (ran && queue.metrics().completed === 1) {
                resolve();
            } else {
                setTimeout(checkCompletion, 10);
            }
        };
        checkCompletion();
    });

    expect(ran).toBe(true);
    expect(queue.metrics().completed).toBe(1);
});

test('handles multiple tasks with concurrency', async () => {
    const queue = new SmartQueue({ maxConcurrency: 2 });
    const results = [];

    const tasks = [
        queue.add({
            id: 'task1',
            urgency: 0.8,
            run: async () => {
                results.push('task1');
                return 'result1';
            }
        }),
        queue.add({
            id: 'task2',
            urgency: 0.6,
            run: async () => {
                results.push('task2');
                return 'result2';
            }
        }),
        queue.add({
            id: 'task3',
            urgency: 0.9,
            run: async () => {
                results.push('task3');
                return 'result3';
            }
        })
    ];

    await Promise.all(tasks);

    // Wait for all tasks to complete
    await new Promise(resolve => {
        const checkCompletion = () => {
            if (queue.metrics().completed === 3) {
                resolve();
            } else {
                setTimeout(checkCompletion, 10);
            }
        };
        checkCompletion();
    });

    expect(results).toHaveLength(3);
    expect(queue.metrics().completed).toBe(3);
    // Task3 should run first due to higher urgency
    expect(results[0]).toBe('task3');
});