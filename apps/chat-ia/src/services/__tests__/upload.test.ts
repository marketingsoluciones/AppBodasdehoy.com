import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileEnv } from '@/envs/file';
import { lambdaClient } from '@/libs/trpc/client';
import { API_ENDPOINTS } from '@/services/_url';
import { clientS3Storage } from '@/services/file/ClientS3';

import { UPLOAD_NETWORK_ERROR, uploadService } from '../upload';

// Mock dependencies
vi.mock('@lobechat/const', () => ({
  isDesktop: false,
  isServerMode: false,
}));

vi.mock('@lobechat/model-runtime', () => ({
  parseDataUri: vi.fn(),
}));

vi.mock('@lobechat/utils', () => ({
  uuid: () => 'mock-uuid',
}));

vi.mock('@/libs/trpc/client', () => ({
  lambdaClient: {
    upload: {
      createS3PreSignedUrl: {
        mutate: vi.fn(),
      },
    },
  },
}));

vi.mock('@/services/file/ClientS3', () => ({
  clientS3Storage: {
    putObject: vi.fn(),
  },
}));

vi.mock('@/store/electron', () => ({
  getElectronStoreState: vi.fn(() => ({})),
}));

vi.mock('@/store/electron/selectors', () => ({
  electronSyncSelectors: {
    isSyncActive: vi.fn(() => false),
  },
}));

vi.mock('@/services/electron/file', () => ({
  desktopFileAPI: {
    uploadFile: vi.fn(),
  },
}));

vi.mock('js-sha256', () => ({
  sha256: vi.fn((data) => 'mock-hash-' + data.byteLength),
}));

// Helper: mock R2 upload response
const MOCK_R2_METADATA = {
  date: '1',
  dirname: 'bodasdehoy/events/event-123',
  filename: 'test.png',
  path: 'bodasdehoy/events/event-123/test.png',
};

describe('UploadService', () => {
  const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
  const mockPreSignUrl = 'https://example.com/presign';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockImplementation(() => 3600000);
    // Seed localStorage so user identity check passes
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => {
          if (key === 'dev-user-config') {
            return JSON.stringify({
              development: 'bodasdehoy',
              eventos: [{ _id: 'event-123' }],
              user_email: 'test@bodasdehoy.com',
              user_id: 'user-abc',
            });
          }
          return null;
        }),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  describe('uploadFileToS3', () => {
    it('should call uploadToStorageR2 with correct args for image file', async () => {
      const r2Spy = vi
        .spyOn(uploadService, 'uploadToStorageR2')
        .mockResolvedValue({ isCaptation: false, metadata: MOCK_R2_METADATA });

      const result = await uploadService.uploadFileToS3(mockFile, { userId: 'user-abc' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(MOCK_R2_METADATA);
      expect(r2Spy).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({ userId: 'user-abc' }),
      );
    });

    it('should upload any file type (type validation is done at the action layer)', async () => {
      const nonImageFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      vi.spyOn(uploadService, 'uploadToStorageR2').mockResolvedValue({
        isCaptation: false,
        metadata: { ...MOCK_R2_METADATA, filename: 'test.txt' },
      });

      const result = await uploadService.uploadFileToS3(nonImageFile, { userId: 'user-abc' });

      expect(result.success).toBe(true);
    });

    it('should skip file type check when skipCheckFileType is true', async () => {
      const nonImageFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      vi.spyOn(uploadService, 'uploadToStorageR2').mockResolvedValue({
        isCaptation: false,
        metadata: { ...MOCK_R2_METADATA, filename: 'test.txt' },
      });

      const result = await uploadService.uploadFileToS3(nonImageFile, {
        skipCheckFileType: true,
        userId: 'user-abc',
      });

      expect(result.success).toBe(true);
    });

    it('should upload video files', async () => {
      const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const r2Spy = vi.spyOn(uploadService, 'uploadToStorageR2').mockResolvedValue({
        isCaptation: false,
        metadata: { ...MOCK_R2_METADATA, filename: 'test.mp4' },
      });

      const result = await uploadService.uploadFileToS3(videoFile, { userId: 'user-abc' });

      expect(result.success).toBe(true);
      expect(r2Spy).toHaveBeenCalled();
    });
  });

  describe('uploadBase64ToS3', () => {
    it('should upload base64 data successfully', async () => {
      const { parseDataUri } = await import('@lobechat/model-runtime');
      vi.mocked(parseDataUri).mockReturnValueOnce({
        base64: 'dGVzdA==', // "test" in base64
        mimeType: 'image/png',
        type: 'base64',
      });
      vi.spyOn(uploadService, 'uploadToStorageR2').mockResolvedValue({
        isCaptation: false,
        metadata: MOCK_R2_METADATA,
      });

      const base64Data = 'data:image/png;base64,dGVzdA==';
      const result = await uploadService.uploadBase64ToS3(base64Data, { userId: 'user-abc' });

      expect(result).toMatchObject({
        fileType: 'image/png',
        hash: expect.any(String),
        metadata: expect.objectContaining({ path: MOCK_R2_METADATA.path }),
        size: expect.any(Number),
      });
    });

    it('should throw error for invalid base64 data', async () => {
      const { parseDataUri } = await import('@lobechat/model-runtime');
      vi.mocked(parseDataUri).mockReturnValueOnce({
        base64: null,
        mimeType: null,
        type: 'url',
      });

      const invalidBase64 = 'not-a-base64-string';

      await expect(uploadService.uploadBase64ToS3(invalidBase64)).rejects.toThrow(
        'Invalid base64 data for image',
      );
    });

    it('should use custom filename when provided', async () => {
      const { parseDataUri } = await import('@lobechat/model-runtime');
      vi.mocked(parseDataUri).mockReturnValueOnce({
        base64: 'dGVzdA==',
        mimeType: 'image/png',
        type: 'base64',
      });
      vi.spyOn(uploadService, 'uploadToStorageR2').mockResolvedValue({
        isCaptation: false,
        metadata: { ...MOCK_R2_METADATA, filename: 'custom-image.png' },
      });

      const base64Data = 'data:image/png;base64,dGVzdA==';
      const result = await uploadService.uploadBase64ToS3(base64Data, {
        filename: 'custom-image',
        userId: 'user-abc',
      });

      expect(result.metadata.filename).toContain('custom-image');
    });
  });

  describe('uploadDataToS3', () => {
    it('should upload JSON data successfully', async () => {
      vi.spyOn(uploadService, 'uploadToStorageR2').mockResolvedValue({
        isCaptation: false,
        metadata: { ...MOCK_R2_METADATA, filename: 'data.json' },
      });

      const data = { key: 'value', number: 123 };
      const result = await uploadService.uploadDataToS3(data, {
        skipCheckFileType: true,
        userId: 'user-abc',
      });

      expect(result.success).toBe(true);
    });

    it('should use custom filename when provided', async () => {
      vi.spyOn(uploadService, 'uploadToStorageR2').mockResolvedValue({
        isCaptation: false,
        metadata: { ...MOCK_R2_METADATA, filename: 'custom.json' },
      });

      const data = { test: true };
      const result = await uploadService.uploadDataToS3(data, {
        filename: 'custom.json',
        skipCheckFileType: true,
        userId: 'user-abc',
      });

      expect(result.success).toBe(true);
      expect(result.data.filename).toBe('custom.json');
    });
  });

  describe('uploadToServerS3', () => {
    beforeEach(() => {
      // Mock XMLHttpRequest
      const xhrMock = {
        addEventListener: vi.fn(),
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn(),
        status: 200,
        upload: {
          addEventListener: vi.fn(),
        },
      };
      global.XMLHttpRequest = vi.fn(() => xhrMock) as any;

      // Mock createS3PreSignedUrl
      vi.mocked(lambdaClient.upload.createS3PreSignedUrl.mutate).mockResolvedValue(mockPreSignUrl);
    });

    it('should upload file successfully with progress', async () => {
      const onProgress = vi.fn();
      const xhr = new XMLHttpRequest();

      // Simulate successful upload
      vi.spyOn(xhr, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'load') {
          // @ts-expect-error - mock implementation
          handler({ target: { status: 200 } });
        }
      });

      const result = await uploadService.uploadToServerS3(mockFile, { onProgress });

      expect(result).toEqual({
        date: '1',
        dirname: `${fileEnv.NEXT_PUBLIC_S3_FILE_PATH}/1`,
        filename: 'mock-uuid.png',
        path: `${fileEnv.NEXT_PUBLIC_S3_FILE_PATH}/1/mock-uuid.png`,
      });
    });

    it('should report progress during upload', async () => {
      const onProgress = vi.fn();
      const xhr = new XMLHttpRequest();

      // Simulate progress events
      vi.spyOn(xhr.upload, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'progress') {
          // @ts-expect-error - mock implementation
          handler({
            lengthComputable: true,
            loaded: 500,
            total: 1000,
          });
        }
      });

      vi.spyOn(xhr, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'load') {
          // @ts-expect-error - mock implementation
          handler({ target: { status: 200 } });
        }
      });

      await uploadService.uploadToServerS3(mockFile, { onProgress });

      expect(onProgress).toHaveBeenCalledWith(
        'uploading',
        expect.objectContaining({
          progress: expect.any(Number),
          restTime: expect.any(Number),
          speed: expect.any(Number),
        }),
      );
    });

    it('should handle network error', async () => {
      const xhr = new XMLHttpRequest();

      // Simulate network error
      vi.spyOn(xhr, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'error') {
          Object.assign(xhr, { status: 0 });
          // @ts-expect-error - mock implementation
          handler({});
        }
      });

      await expect(uploadService.uploadToServerS3(mockFile, {})).rejects.toBe(UPLOAD_NETWORK_ERROR);
    });

    it('should handle upload error', async () => {
      const xhr = new XMLHttpRequest();

      // Simulate upload error
      vi.spyOn(xhr, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'load') {
          Object.assign(xhr, { status: 400, statusText: 'Bad Request' });

          // @ts-expect-error - mock implementation
          handler({});
        }
      });

      await expect(uploadService.uploadToServerS3(mockFile, {})).rejects.toBe('Bad Request');
    });

    it('should use custom directory when provided', async () => {
      const xhr = new XMLHttpRequest();
      vi.spyOn(xhr, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'load') {
          // @ts-expect-error - mock implementation
          handler({ target: { status: 200 } });
        }
      });

      const result = await uploadService.uploadToServerS3(mockFile, {
        directory: 'custom/dir',
      });

      expect(result.dirname).toContain('custom/dir');
    });

    it('should use custom pathname when provided', async () => {
      const xhr = new XMLHttpRequest();
      vi.spyOn(xhr, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'load') {
          // @ts-expect-error - mock implementation
          handler({ target: { status: 200 } });
        }
      });

      const customPath = 'custom/path/file.png';
      const result = await uploadService.uploadToServerS3(mockFile, {
        pathname: customPath,
      });

      expect(result.path).toBe(customPath);
    });
  });

  describe('uploadToClientS3', () => {
    it('should upload file to client S3 successfully', async () => {
      const hash = 'test-hash';
      const expectedResult = {
        date: '1',
        dirname: '',
        filename: mockFile.name,
        path: `client-s3://${hash}`,
      };

      vi.mocked(clientS3Storage.putObject).mockResolvedValue(undefined);

      const result = await uploadService['uploadToClientS3'](hash, mockFile);

      expect(clientS3Storage.putObject).toHaveBeenCalledWith(hash, mockFile);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getImageFileByUrlWithCORS', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should fetch and create file from URL', async () => {
      const url = 'https://example.com/image.png';
      const filename = 'test.png';
      const mockArrayBuffer = new ArrayBuffer(8);

      vi.mocked(global.fetch).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      } as Response);

      const result = await uploadService.getImageFileByUrlWithCORS(url, filename);

      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.proxy, {
        body: url,
        method: 'POST',
      });
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe(filename);
      expect(result.type).toBe('image/png');
    });

    it('should handle custom file type', async () => {
      const url = 'https://example.com/image.jpg';
      const filename = 'test.jpg';
      const fileType = 'image/jpeg';
      const mockArrayBuffer = new ArrayBuffer(8);

      vi.mocked(global.fetch).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      } as Response);

      const result = await uploadService.getImageFileByUrlWithCORS(url, filename, fileType);

      expect(result.type).toBe(fileType);
    });
  });
});
