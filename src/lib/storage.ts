import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export interface UploadOptions {
  bucket: string
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

class StorageService {
  private readonly buckets = {
    avatars: 'avatars',
    posts: 'post-images',
    stories: 'stories',
    chat: 'chat-media',
    trips: 'trip-images',
    bikes: 'bike-images'
  }

  // Upload file to storage bucket
  async uploadFile(
    file: File, 
    options: UploadOptions,
    userId?: string
  ): Promise<UploadResult> {
    try {
      // Validate file size
      if (options.maxSize && file.size > options.maxSize) {
        return {
          url: '',
          path: '',
          error: `File size exceeds ${this.formatFileSize(options.maxSize)} limit`
        }
      }

      // Validate file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        return {
          url: '',
          path: '',
          error: `File type ${file.type} is not allowed`
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileName = `${timestamp}_${randomString}.${fileExt}`

      // Create folder structure
      const folder = options.folder || userId || 'uploads'
      const filePath = `${folder}/${fileName}`

      // Upload file
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        return {
          url: '',
          path: '',
          error: error.message
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path)

      // Save file metadata to database
      if (userId) {
        await this.saveFileMetadata({
          userId,
          filename: fileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storagePath: data.path,
          publicUrl: urlData.publicUrl,
          bucket: options.bucket
        })
      }

      return {
        url: urlData.publicUrl,
        path: data.path
      }

    } catch (error) {
      console.error('Upload error:', error)
      return {
        url: '',
        path: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  // Delete file from storage
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        console.error('Storage delete error:', error)
        return false
      }

      // Remove from database
      await supabase
        .from('media_files')
        .delete()
        .eq('storage_path', path)

      return true
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }

  // Upload profile avatar
  async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: this.buckets.avatars,
      folder: userId,
      maxSize: 10 * 1024 * 1024, // 10MB (increased from 2MB)
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }, userId)
  }

  // Upload post image
  async uploadPostImage(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: this.buckets.posts,
      folder: userId,
      maxSize: 40 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }, userId)
  }

  // Upload story media
  async uploadStoryMedia(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: this.buckets.stories,
      folder: userId,
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
    }, userId)
  }

  // Upload chat media
  async uploadChatMedia(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: this.buckets.chat,
      folder: userId,
      maxSize: 25 * 1024 * 1024, // 25MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
    }, userId)
  }

  // Upload trip image
  async uploadTripImage(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: this.buckets.trips,
      folder: userId,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }, userId)
  }

  // Upload bike image
  async uploadBikeImage(file: File, userId: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: this.buckets.bikes,
      folder: userId,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }, userId)
  }

  // Save file metadata to database
  private async saveFileMetadata(metadata: {
    userId: string
    filename: string
    originalName: string
    fileSize: number
    mimeType: string
    storagePath: string
    publicUrl: string
    bucket: string
  }) {
    try {
      await supabase
        .from('media_files')
        .insert({
          user_id: metadata.userId,
          filename: metadata.filename,
          original_name: metadata.originalName,
          file_size: metadata.fileSize,
          mime_type: metadata.mimeType,
          storage_path: metadata.storagePath,
          public_url: metadata.publicUrl,
          entity_type: this.getEntityTypeFromBucket(metadata.bucket),
          is_public: metadata.bucket !== this.buckets.chat
        })
    } catch (error) {
      console.error('Error saving file metadata:', error)
    }
  }

  // Get entity type from bucket name
  private getEntityTypeFromBucket(bucket: string): string {
    switch (bucket) {
      case this.buckets.avatars:
        return 'profile_avatar'
      case this.buckets.posts:
        return 'post_image'
      case this.buckets.stories:
        return 'story_media'
      case this.buckets.chat:
        return 'chat_media'
      case this.buckets.trips:
        return 'trip_image'
      case this.buckets.bikes:
        return 'bike_image'
      default:
        return 'unknown'
    }
  }

  // Format file size for display
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Validate image file
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    return validTypes.includes(file.type)
  }

  // Validate video file
  isValidVideo(file: File): boolean {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg']
    return validTypes.includes(file.type)
  }

  // Get user's media files
  async getUserMediaFiles(userId: string, entityType?: string): Promise<any[]> {
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching media files:', error)
      return []
    }

    return data || []
  }

  // Create image preview URL
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  // Cleanup preview URL
  cleanupPreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}

export const storageService = new StorageService()
