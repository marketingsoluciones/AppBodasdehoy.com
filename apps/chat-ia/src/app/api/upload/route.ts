/**
 * Upload API Endpoint
 * ===================
 * Handles file uploads for wedding images
 *
 * POST /api/upload - Upload a file
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

// Upload directory (in public folder for easy access)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'wedding');

/**
 * POST /api/upload - Upload a file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'wedding-image';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', success: false },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.', success: false },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.', success: false },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 8);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${type}-${timestamp}-${randomStr}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/wedding/${filename}`;

    return NextResponse.json({
      filename,
      size: file.size,
      success: true,
      type: file.type,
      url: publicUrl,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload?filename=xxx - Delete an uploaded file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required', success: false },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    const safeName = path.basename(filename);
    const filepath = path.join(UPLOAD_DIR, safeName);

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: 'File not found', success: false },
        { status: 404 }
      );
    }

    // Delete file
    const { unlink } = await import('node:fs/promises');
    await unlink(filepath);

    return NextResponse.json({
      message: 'File deleted successfully',
      success: true,
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', success: false },
      { status: 500 }
    );
  }
}
