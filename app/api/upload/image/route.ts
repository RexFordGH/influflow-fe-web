import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 },
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 },
      );
    }

    const bucketName = 'images';
    const fileExtension = file.name.split('.').pop();
    const filePath = `public/${uuidv4()}.${fileExtension}`;

    // Use admin client to upload file
    const supabaseAdmin = createAdminClient();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image.' },
        { status: 500 },
      );
    }

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ imageUrl: data.publicUrl }, { status: 200 });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
