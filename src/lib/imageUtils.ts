/**
 * Compress and optimize an image file for upload.
 * Resizes to max 1920x1920 maintaining aspect ratio and converts to WebP at 85% quality.
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Falha ao obter contexto do canvas'));
          return;
        }
        
        // Calcular dimensões mantendo proporção (max 1920x1920)
        const maxSize = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir para WebP com qualidade 85%
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha na compressão'));
            }
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
