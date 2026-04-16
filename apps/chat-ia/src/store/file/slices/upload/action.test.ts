import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { message } from '@/components/AntdStaticMethods';
import { uploadService } from '@/services/upload';
import { getImageDimensions } from '@/utils/client/imageDimensions';

import { useFileStore as useStore } from '../../store';

vi.mock('zustand/traditional');

// Mock AntdStaticMethods
vi.mock('@/components/AntdStaticMethods', () => ({
  message: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/utils/client/imageDimensions', () => ({
  getImageDimensions: vi.fn(),
}));

// Mock sha256
vi.mock('js-sha256', () => ({
  sha256: vi.fn(() => 'mock-hash-value'),
}));

// Mock file-type module (dynamic import)
vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(),
}));

// Mock shared/upload utilities (no-op pass-through)
vi.mock('@bodasdehoy/shared/upload', () => ({
  compressImage: vi.fn(async (f: File) => f),
  convertHeicIfNeeded: vi.fn(async (f: File) => f),
  validateFile: vi.fn(() => ({ valid: true })),
}));

// Mock File.arrayBuffer method
beforeAll(() => {
  Object.defineProperty(File.prototype, 'arrayBuffer', {
    configurable: true,
    value: function () {
      return Promise.resolve(new ArrayBuffer(8));
    },
    writable: true,
  });
});

// Seed localStorage with user identity so getUserContext() succeeds
beforeEach(() => {
  vi.clearAllMocks();
  const userConfig = {
    development: 'bodasdehoy',
    eventos: [{ _id: 'event-123' }],
    user_email: 'test@bodasdehoy.com',
    user_id: 'user-abc',
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => {
        if (key === 'dev-user-config') return JSON.stringify(userConfig);
        return null;
      }),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileUploadAction', () => {
  describe('uploadBase64FileWithProgress', () => {
    it('should upload base64 image and return result with dimensions', async () => {
      const { result } = renderHook(() => useStore());

      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const mockDimensions = { height: 100, width: 200 };
      const mockMetadata = {
        date: '12345',
        dirname: '/test',
        filename: 'test.png',
        path: '/test/test.png',
      };
      const mockUploadResult = {
        fileType: 'image/png',
        hash: 'mock-hash',
        metadata: mockMetadata,
        size: 1024,
      };

      vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);
      vi.spyOn(uploadService, 'uploadBase64ToS3').mockResolvedValue(mockUploadResult);

      const uploadResult = await act(async () => {
        return await result.current.uploadBase64FileWithProgress(base64Data);
      });

      expect(getImageDimensions).toHaveBeenCalledWith(base64Data);
      expect(uploadService.uploadBase64ToS3).toHaveBeenCalledWith(
        base64Data,
        expect.objectContaining({ eventId: 'event-123' }),
      );

      expect(uploadResult).toEqual({
        dimensions: mockDimensions,
        filename: mockMetadata.filename,
        id: mockMetadata.path,
        url: mockMetadata.path,
      });
    });

    it('should handle base64 upload without dimensions for non-image files', async () => {
      const { result } = renderHook(() => useStore());

      const base64Data = 'data:application/pdf;base64,JVBERi0xLjQK';
      const mockMetadata = {
        date: '12345',
        dirname: '/test',
        filename: 'test.pdf',
        path: '/test/test.pdf',
      };
      const mockUploadResult = {
        fileType: 'application/pdf',
        hash: 'mock-hash',
        metadata: mockMetadata,
        size: 2048,
      };

      vi.mocked(getImageDimensions).mockResolvedValue(undefined);
      vi.spyOn(uploadService, 'uploadBase64ToS3').mockResolvedValue(mockUploadResult);

      const uploadResult = await act(async () => {
        return await result.current.uploadBase64FileWithProgress(base64Data);
      });

      expect(getImageDimensions).toHaveBeenCalledWith(base64Data);
      expect(uploadResult).toEqual({
        dimensions: undefined,
        filename: mockMetadata.filename,
        id: mockMetadata.path,
        url: mockMetadata.path,
      });
    });

    it('should handle errors during base64 upload', async () => {
      const { result } = renderHook(() => useStore());

      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';

      vi.mocked(getImageDimensions).mockResolvedValue(undefined);
      vi.spyOn(uploadService, 'uploadBase64ToS3').mockRejectedValue(new Error('Upload failed'));

      await expect(
        act(async () => {
          await result.current.uploadBase64FileWithProgress(base64Data);
        }),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadWithProgress', () => {
    describe('successful upload', () => {
      it('should upload file and return result with progress callbacks', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['test content'], 'newfile.jpg', { type: 'image/jpeg' });
        const mockDimensions = { height: 150, width: 250 };
        const mockData = {
          date: '12345',
          dirname: '/uploads',
          filename: 'newfile.jpg',
          path: '/uploads/newfile.jpg',
        };
        const mockUploadResult = { data: mockData, success: true };
        const onStatusUpdate = vi.fn();

        vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);
        vi.spyOn(uploadService, 'uploadFileToS3').mockResolvedValue(mockUploadResult);

        const uploadResult = await act(async () => {
          return await result.current.uploadWithProgress({
            file: mockFile,
            onStatusUpdate,
          });
        });

        expect(uploadService.uploadFileToS3).toHaveBeenCalledWith(
          expect.any(File),
          expect.objectContaining({
            development: 'bodasdehoy',
            eventId: 'event-123',
            onNotSupported: expect.any(Function),
            onProgress: expect.any(Function),
            userEmail: 'test@bodasdehoy.com',
            userId: 'user-abc',
          }),
        );
        expect(onStatusUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'updateFile', value: expect.objectContaining({ status: 'success' }) }),
        );
        expect(uploadResult).toEqual({
          dimensions: mockDimensions,
          filename: mockFile.name,
          id: mockData.path,
          url: mockData.path,
        });
      });

      it('should call onProgress callback during upload', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['test content'], 'progress.png', { type: 'image/png' });
        const mockData = { date: '12345', dirname: '/uploads', filename: 'progress.png', path: '/uploads/progress.png' };
        const mockUploadResult = { data: mockData, success: true };
        const onStatusUpdate = vi.fn();

        vi.mocked(getImageDimensions).mockResolvedValue(undefined);
        vi.spyOn(uploadService, 'uploadFileToS3').mockImplementation(async (_file, options) => {
          (options as any)?.onProgress?.('uploading', { progress: 50, restTime: 5, speed: 1024 });
          (options as any)?.onProgress?.('success', { progress: 100, restTime: 0, speed: 2048 });
          return mockUploadResult;
        });

        await act(async () => {
          await result.current.uploadWithProgress({
            file: mockFile,
            onStatusUpdate,
          });
        });

        expect(onStatusUpdate).toHaveBeenCalledWith({
          id: mockFile.name,
          type: 'updateFile',
          value: { status: 'uploading', uploadState: { progress: 0, restTime: 0, speed: 0 } },
        });
        expect(onStatusUpdate).toHaveBeenCalledWith({
          id: mockFile.name,
          type: 'updateFile',
          value: { status: 'uploading', uploadState: { progress: 50, restTime: 5, speed: 1024 } },
        });
        expect(onStatusUpdate).toHaveBeenCalledWith({
          id: mockFile.name,
          type: 'updateFile',
          value: { status: 'processing', uploadState: { progress: 100, restTime: 0, speed: 2048 } },
        });
      });

      it('should handle upload failure and return undefined', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['test content'], 'fail.png', { type: 'image/png' });
        const mockUploadResult = { data: {} as any, success: false };
        const onStatusUpdate = vi.fn();

        vi.mocked(getImageDimensions).mockResolvedValue(undefined);
        vi.spyOn(uploadService, 'uploadFileToS3').mockResolvedValue(mockUploadResult);

        const uploadResult = await act(async () => {
          return await result.current.uploadWithProgress({
            file: mockFile,
            onStatusUpdate,
          });
        });

        expect(uploadResult).toBeUndefined();
        expect(onStatusUpdate).toHaveBeenCalledWith({
          id: mockFile.name,
          type: 'updateFile',
          value: {
            status: 'error',
            uploadState: { progress: 0, restTime: 0, speed: 0 },
          },
        });
      });

      it('should call onNotSupported when file type is not supported', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['test content'], 'unsupported.xyz', {
          type: 'application/xyz',
        });
        const onStatusUpdate = vi.fn();

        vi.mocked(getImageDimensions).mockResolvedValue(undefined);

        // Mock uploadFileToS3 to call onNotSupported
        vi.spyOn(uploadService, 'uploadFileToS3').mockImplementation(async (_file, options) => {
          (options as any)?.onNotSupported?.();
          return { data: {} as any, success: false };
        });

        await act(async () => {
          await result.current.uploadWithProgress({
            file: mockFile,
            onStatusUpdate,
          });
        });

        expect(onStatusUpdate).toHaveBeenCalledWith({
          id: mockFile.name,
          type: 'removeFile',
        });
        expect(message.info).toHaveBeenCalled();
      });
    });

    describe('skipCheckFileType option', () => {
      it('should pass skipCheckFileType to uploadFileToS3', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['test content'], 'skip.bin', {
          type: 'application/octet-stream',
        });
        const mockUploadResult = { data: { date: '12345', dirname: '/uploads', filename: 'skip.bin', path: '/uploads/skip.bin' }, success: true };

        vi.mocked(getImageDimensions).mockResolvedValue(undefined);
        vi.spyOn(uploadService, 'uploadFileToS3').mockResolvedValue(mockUploadResult);

        await act(async () => {
          await result.current.uploadWithProgress({
            file: mockFile,
            skipCheckFileType: true,
          });
        });

        expect(uploadService.uploadFileToS3).toHaveBeenCalledWith(
          expect.any(File),
          expect.objectContaining({
            skipCheckFileType: true,
          }),
        );
      });
    });

    describe('image dimensions handling', () => {
      it('should extract dimensions for image files', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['image data'], 'image.jpg', { type: 'image/jpeg' });
        const mockDimensions = { height: 300, width: 400 };
        const mockUploadResult = { data: { date: '12345', dirname: '/images', filename: 'image.jpg', path: '/images/image.jpg' }, success: true };

        vi.mocked(getImageDimensions).mockResolvedValue(mockDimensions);
        vi.spyOn(uploadService, 'uploadFileToS3').mockResolvedValue(mockUploadResult);

        const uploadResult = await act(async () => {
          return await result.current.uploadWithProgress({
            file: mockFile,
          });
        });

        expect(getImageDimensions).toHaveBeenCalledWith(mockFile);
        expect(uploadResult?.dimensions).toEqual(mockDimensions);
      });

      it('should return undefined dimensions for non-image files', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['text data'], 'document.txt', { type: 'text/plain' });
        const mockUploadResult = { data: { date: '12345', dirname: '/docs', filename: 'document.txt', path: '/docs/document.txt' }, success: true };

        vi.mocked(getImageDimensions).mockResolvedValue(undefined);
        vi.spyOn(uploadService, 'uploadFileToS3').mockResolvedValue(mockUploadResult);

        const uploadResult = await act(async () => {
          return await result.current.uploadWithProgress({
            file: mockFile,
          });
        });

        expect(uploadResult?.dimensions).toBeUndefined();
      });
    });

    describe('error handling', () => {
      it('should handle uploadFileToS3 errors gracefully', async () => {
        const { result } = renderHook(() => useStore());

        const mockFile = new File(['test content'], 'error.png', { type: 'image/png' });
        const onStatusUpdate = vi.fn();

        vi.mocked(getImageDimensions).mockResolvedValue(undefined);
        vi.spyOn(uploadService, 'uploadFileToS3').mockRejectedValue(new Error('Upload failed'));

        const uploadResult = await act(async () => {
          return await result.current.uploadWithProgress({
            file: mockFile,
            onStatusUpdate,
          });
        });

        // Error is caught internally, message.error is called, returns undefined
        expect(uploadResult).toBeUndefined();
        expect(message.error).toHaveBeenCalled();
        expect(onStatusUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'updateFile', value: expect.objectContaining({ status: 'error' }) }),
        );
      });
    });
  });
});
