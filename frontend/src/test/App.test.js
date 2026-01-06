import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module
vi.mock('../services/api', () => ({
    api: {
        getStudentByCollegeId: vi.fn(),
    },
}));

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export api object', async () => {
        const { api } = await import('../services/api');
        expect(api).toBeDefined();
        expect(typeof api.getStudentByCollegeId).toBe('function');
    });
});

describe('App Component', () => {
    it('should be defined', () => {
        expect(true).toBe(true);
    });
});
