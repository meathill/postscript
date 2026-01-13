import { useAuthStore } from './auth';
import { api } from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Mock dependencies
jest.mock('../lib/api', () => ({
  api: {
    auth: {
      loginWithApple: jest.fn(),
      getMe: jest.fn(),
    },
  },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe('Auth Store', () => {
  const mockToken = 'mock-jwt-token';
  const mockUser = { id: '123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ token: null, user: null, isLoading: false });
  });

  it('should set token and user', async () => {
    await useAuthStore.getState().setToken(mockToken);
    useAuthStore.getState().setUser(mockUser);

    expect(useAuthStore.getState().token).toBe(mockToken);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', mockToken);
  });

  it('should load token from secure store', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockToken);
    // Note: getMe is not called inside loadToken based on current implementation, it just loads token.
    // If it did, we would mock it.

    await useAuthStore.getState().loadToken();

    expect(useAuthStore.getState().token).toBe(mockToken);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('should logout correctly', async () => {
    // Setup initial state
    useAuthStore.setState({ token: mockToken, user: mockUser });

    await useAuthStore.getState().logout();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
