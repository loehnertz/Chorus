/**
 * Tests for user synchronization logic
 */

import type { NeonAuthUser } from '@/types/auth';

import { syncUser } from '../user-sync';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: false,
      });

      await syncUser(mockNeonUser);

      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          id: mockNeonUser.id,
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: false,
        },
      });
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('should create a new user with approved=true when explicitly set', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser, true);

      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          id: mockNeonUser.id,
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: true,
        },
      });
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('should handle null/undefined values for name and image', async () => {
      const userWithNulls: NeonAuthUser = {
        ...mockNeonUser,
        name: '',
        image: undefined,
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockResolvedValue({
        id: userWithNulls.id,
        name: null,
        image: null,
        approved: false,
      });

      await syncUser(userWithNulls);

      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          id: userWithNulls.id,
          name: null,
          image: null,
          approved: false,
        },
      });
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('should handle create races by falling back to findUnique', async () => {
      (db.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: mockNeonUser.id,
          name: mockNeonUser.name,
          image: mockNeonUser.image,
          approved: false,
        });

      const raceError = Object.assign(new Error('Unique constraint'), { code: 'P2002' });

      (db.user.create as jest.Mock).mockRejectedValue(raceError);

      const result = await syncUser(mockNeonUser);

      expect(db.user.create).toHaveBeenCalled();
      expect(db.user.findUnique).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: false,
      });
    });
  });

  describe('when user exists', () => {
    it('should update existing user with new data', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: 'Old Name',
        image: null,
        approved: true,
      });
      (db.user.update as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: mockNeonUser.id },
        data: {
          name: mockNeonUser.name,
          image: mockNeonUser.image,
        },
      });
    });

    it('should not change approval status unless explicitly set', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: 'Old Name',
        image: mockNeonUser.image,
        approved: true,
      });
      (db.user.update as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser);

      // Approval should not be in the update data
      const call = (db.user.update as jest.Mock).mock.calls[0][0];
      expect(call.data).not.toHaveProperty('approved');
    });

    it('should update approval status when explicitly set', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: false,
      });
      (db.user.update as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser, true);

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: mockNeonUser.id },
        data: {
          approved: true,
        },
      });
    });

    it('should not update when nothing changed', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockNeonUser.id,
        name: mockNeonUser.name,
        image: mockNeonUser.image,
        approved: true,
      });

      await syncUser(mockNeonUser);

      expect(db.user.update).not.toHaveBeenCalled();
      expect(db.user.create).not.toHaveBeenCalled();
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
      expect(db.user.findUnique).not.toHaveBeenCalled();
      expect(db.user.create).not.toHaveBeenCalled();
      expect(db.user.update).not.toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      const dbError = new Error('Database connection failed');
      (db.user.findUnique as jest.Mock).mockRejectedValue(dbError);

      jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(syncUser(mockNeonUser)).rejects.toThrow('Failed to sync user data');
    });
  });
});
