/**
 * Copia texto para o clipboard com fallback robusto.
 * Resolve o problema de user activation expirada em chamadas async.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Tenta API moderna primeiro
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallthrough para método legado
      console.warn('Clipboard API failed, trying fallback:', e);
    }
  }
  
  // Fallback: método legado com textarea invisível
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // Evitar scroll e tornar invisível
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const success = document.execCommand('copy');
    return success;
  } catch (e) {
    console.error('Fallback clipboard copy failed:', e);
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}
