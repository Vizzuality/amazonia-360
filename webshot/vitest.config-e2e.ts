import { defineConfig } from 'vitest/config';
import { resolveAlias } from './vitest.config';

export default defineConfig({
    resolve: resolveAlias,
    test: {
        environment: 'node',
        include: ['**/*.e2e-spec.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        testTimeout: 0,
        globals: true,
        setupFiles: [],
    }
});
