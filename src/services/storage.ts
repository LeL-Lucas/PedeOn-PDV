import { supabase } from './supabase'
import imageCompression from 'browser-image-compression'

export async function uploadImage(
  file: File,
  storeId: string,
  folder: string = 'products'
): Promise<string> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    const fileExt = file.name.split('.').pop()
    const fileName = `${storeId}/${folder}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('pedeon-images')
      .upload(fileName, compressedFile)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('pedeon-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch (error) {
    console.error('Erro no upload:', error)
    throw error
  }
}