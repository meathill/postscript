import { useRecipientsStore } from './recipients';
import { api } from '../lib/api';
import { getLocalRecipients, saveLocalRecipients, addLocalRecipient, deleteLocalRecipient } from '../lib/db';

// Mock dependencies
jest.mock('../lib/api', () => ({
  api: {
    recipients: {
      list: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../lib/db', () => ({
  getLocalRecipients: jest.fn(),
  saveLocalRecipients: jest.fn(),
  addLocalRecipient: jest.fn(),
  deleteLocalRecipient: jest.fn(),
}));

describe('Recipients Store', () => {
  const mockRecipients = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useRecipientsStore.setState({ recipients: [], isLoading: false });
  });

  it('should load recipients from cache', () => {
    (getLocalRecipients as jest.Mock).mockReturnValue(mockRecipients);

    useRecipientsStore.getState().loadFromCache();

    expect(getLocalRecipients).toHaveBeenCalled();
    expect(useRecipientsStore.getState().recipients).toEqual(mockRecipients);
  });

  it('should fetch recipients from API and update cache', async () => {
    (api.recipients.list as jest.Mock).mockResolvedValue(mockRecipients);

    await useRecipientsStore.getState().fetchRecipients();

    expect(api.recipients.list).toHaveBeenCalled();
    expect(saveLocalRecipients).toHaveBeenCalledWith(mockRecipients);
    expect(useRecipientsStore.getState().recipients).toEqual(mockRecipients);
    expect(useRecipientsStore.getState().isLoading).toBe(false);
  });

  it('should add a recipient', async () => {
    const newRecipient = { name: 'Charlie', email: 'charlie@example.com' };
    const createdRecipient = { id: '3', ...newRecipient };

    (api.recipients.create as jest.Mock).mockResolvedValue({ id: '3' });
    // Mock refresh behavior (fetchRecipients is called internally)
    (api.recipients.list as jest.Mock).mockResolvedValue([...mockRecipients, createdRecipient]);

    await useRecipientsStore.getState().addRecipient(newRecipient);

    expect(api.recipients.create).toHaveBeenCalledWith(newRecipient);
    expect(addLocalRecipient).toHaveBeenCalledWith(createdRecipient);
    // Note: addRecipient also calls fetchRecipients in background, so list is called
    expect(api.recipients.list).toHaveBeenCalled();

    // Check if store updated (optimistically or via fetch)
    const storeRecipients = useRecipientsStore.getState().recipients;
    expect(storeRecipients).toContainEqual(createdRecipient);
  });

  it('should delete a recipient', async () => {
    useRecipientsStore.setState({ recipients: mockRecipients });

    await useRecipientsStore.getState().deleteRecipient('1');

    expect(api.recipients.delete).toHaveBeenCalledWith('1');
    expect(deleteLocalRecipient).toHaveBeenCalledWith('1');
    expect(useRecipientsStore.getState().recipients).toHaveLength(1);
    expect(useRecipientsStore.getState().recipients[0].id).toBe('2');
  });
});
