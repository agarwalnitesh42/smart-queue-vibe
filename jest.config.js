export default {
    // preset: 'default',
    // extensionsToTreatAsEsm: ['.js'],
    globals: {
        'ts-jest': {
            useESM: true
        }
    },
    transform: {},
    testEnvironment: 'node'
};