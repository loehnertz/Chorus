/**
 * Tests for user synchronization logic
 */

import { syncUser } from '../user-sync';
import { db } from '@/lib/db';
import type { NeonAuthUser } from '@/types/auth';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      upsert: jest.fn(),
    },
  },
}));

describe('syncUser', () => {
  const mockNeonUser: NeonAuthUser = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user does not exist', () => {
    it('should create a new user with approved=false by default', async () => {
      (db.user.upsert as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: false,
      });

      await syncUser(mockNeonUser);

      expect(db.user.upsert).toHaveBeenCalledWith({
        where: { id: mockNeonUser.id },
        update: {
          name: mockNeonUser.name,
          image: mockNeonUser.image,
        },
        create: {
          id: mockNeonUser.id,
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: false,
        },
      });
    });

    it('should create a new user with approved=true when explicitly set', async () => {
      (db.user.upsert as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser, true);

      expect(db.user.upsert).toHaveBeenCalledWith({
        where: { id: mockNeonUser.id },
        update: {
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: true,
        },
        create: {
          id: mockNeonUser.id,
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: true,
        },
      });
    });

    it('should handle null/undefined values for name and image', async () => {
      const userWithNulls: NeonAuthUser = {
        ...mockNeonUser,
        name: '',
        image: undefined,
      };

      (db.user.upsert as jest.Mock).mockResolvedValue({
        id: userWithNulls.id,
        name: null,
        image: null,
        approved: false,
      });

      await syncUser(userWithNulls);

      expect(db.user.upsert).toHaveBeenCalledWith({
        where: { id: userWithNulls.id },
        update: {
          name: null,
        },
        create: {
          id: userWithNulls.id,
          name: null,
          image: null,
          approved: false,
        },
      });
    });
  });

  describe('when user exists', () => {
    it('should update existing user with new data', async () => {
      (db.user.upsert as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser);

      expect(db.user.upsert).toHaveBeenCalledWith({
        where: { id: mockNeonUser.id },
        update: {
          name: mockNeonUser.name,
          image: mockNeonUser.image,
        },
        create: {
          id: mockNeonUser.id,
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: false,
        },
      });
    });

    it('should not change approval status unless explicitly set', async () => {
      (db.user.upsert as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser);

      // Approval should not be in the update data
      const call = (db.user.upsert as jest.Mock).mock.calls[0][0];
      expect(call.update).not.toHaveProperty('approved');
    });

    it('should update approval status when explicitly set', async () => {
      (db.user.upsert as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser, true);

      expect(db.user.upsert).toHaveBeenCalledWith({
        where: { id: mockNeonUser.id },
        update: {
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: true,
        },
        create: {
          id: mockNeonUser.id,
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: true,
        },
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when user data is invalid', async () => {
      const invalid: NeonAuthUser = {
        ...mockNeonUser,
        id: 'not-a-uuid',
      };

      jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(syncUser(invalid)).rejects.toThrow('Invalid user data');
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      const dbError = new Error('Database connection failed');
      (db.user.upsert as jest.Mock).mockRejectedValue(dbError);

      jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(syncUser(mockNeonUser)).rejects.toThrow('Failed to sync user data');
    });
  });
});
