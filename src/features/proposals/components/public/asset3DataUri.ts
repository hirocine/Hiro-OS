/**
 * Converts an SVG URL to a PNG Data URI using the browser's canvas.
 * This is needed because html2canvas cannot reliably capture SVGs in <img> tags.
 */
export async function svgToPngDataUri(svgUrl: string, targetHeight = 120): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = targetHeight / img.naturalHeight
      const w = img.naturalWidth * scale
      const h = targetHeight
      const canvas = document.createElement('canvas')
      canvas.width = w * 2 // 2x for retina
      canvas.height = h * 2
      const ctx = canvas.getContext('2d')!
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load SVG'))
    img.src = svgUrl
  })
}
