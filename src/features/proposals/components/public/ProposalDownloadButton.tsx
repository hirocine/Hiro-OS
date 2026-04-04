import { Download, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Props {
  whatsappNumber: string | null
  projectName: string
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const MARGIN_MM = 10
const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2
const SECTION_GAP_MM = 3

const waitForMedia = async (root: HTMLElement) => {
  if ('fonts' in document) {
    await document.fonts.ready
  }

  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            })
    )
  )

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

const createCanvasSlice = (sourceCanvas: HTMLCanvasElement, startY: number, sliceHeight: number) => {
  const sliceCanvas = document.createElement('canvas')
  sliceCanvas.width = sourceCanvas.width
  sliceCanvas.height = sliceHeight

  const context = sliceCanvas.getContext('2d')
  if (!context) {
    throw new Error('Não foi possível preparar uma página do PDF.')
  }

  context.drawImage(
    sourceCanvas,
    0,
    startY,
    sourceCanvas.width,
    sliceHeight,
    0,
    0,
    sourceCanvas.width,
    sliceHeight
  )

  return sliceCanvas
}

export function ProposalDownloadButton({ whatsappNumber, projectName }: Props) {
  const [visible, setVisible] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const investimento = document.getElementById('investimento')
    const passos = document.getElementById('proximos-passos')
    if (!investimento && !passos) return

    const observer = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.1 }
    )
    if (investimento) observer.observe(investimento)
    if (passos) observer.observe(passos)
    return () => observer.disconnect()
  }, [])

  const handleDownloadPDF = async () => {
    const root = document.querySelector('.proposal-page') as HTMLElement | null
    if (!root || isGenerating) return

    try {
      setIsGenerating(true)
      await waitForMedia(root)

      const sections = Array.from(root.children).filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement &&
          !node.classList.contains('no-print') &&
          getComputedStyle(node).position !== 'absolute'
      )

      if (sections.length === 0) {
        throw new Error('Nenhuma seção encontrada para exportar.')
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      let currentY = MARGIN_MM
      let isFirstRender = true

      for (const section of sections) {
        if (section.offsetWidth === 0 || section.offsetHeight === 0) continue

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0A0A0A',
          logging: false,
          windowWidth: document.documentElement.clientWidth,
          onclone: (clonedDocument) => {
            const clonedRoot = clonedDocument.querySelector('.proposal-page') as HTMLElement | null
            if (!clonedRoot) return

            clonedRoot.style.background = '#0A0A0A'

            clonedRoot.querySelectorAll('.no-print, iframe').forEach((element) => {
              ;(element as HTMLElement).style.display = 'none'
            })

            clonedRoot.querySelectorAll('.proposal-bounce-slow, .proposal-gradient-1, .proposal-gradient-2, .proposal-invest-gradient-1, .proposal-invest-gradient-2').forEach((element) => {
              ;(element as HTMLElement).style.display = 'none'
            })

            clonedRoot.querySelectorAll('.proposal-clients-slider').forEach((element) => {
              ;(element as HTMLElement).style.display = 'none'
            })

            clonedRoot.querySelectorAll('.proposal-clients-static').forEach((element) => {
              const htmlElement = element as HTMLElement
              htmlElement.style.display = 'grid'
            })

            clonedRoot.querySelectorAll('*').forEach((element) => {
              const htmlElement = element as HTMLElement
              htmlElement.style.animation = 'none'
              htmlElement.style.transition = 'none'
              htmlElement.style.opacity = '1'
            })
          },
        })

        const sectionHeightMm = (canvas.height * CONTENT_WIDTH_MM) / canvas.width

        if (sectionHeightMm <= CONTENT_HEIGHT_MM) {
          if (currentY + sectionHeightMm > A4_HEIGHT_MM - MARGIN_MM && currentY > MARGIN_MM) {
            pdf.addPage()
            currentY = MARGIN_MM
          }

          const imageData = canvas.toDataURL('image/png')
          if (!isFirstRender) {
            pdf.setPage(pdf.getNumberOfPages())
          }
          pdf.addImage(imageData, 'PNG', MARGIN_MM, currentY, CONTENT_WIDTH_MM, sectionHeightMm)
          currentY += sectionHeightMm + SECTION_GAP_MM
          isFirstRender = false
          continue
        }

        if (currentY > MARGIN_MM) {
          pdf.addPage()
          currentY = MARGIN_MM
        }

        const maxSliceHeightPx = Math.floor((CONTENT_HEIGHT_MM * canvas.width) / CONTENT_WIDTH_MM)
        let renderedHeightPx = 0
        let lastSliceHeightMm = 0

        while (renderedHeightPx < canvas.height) {
          const sliceHeightPx = Math.min(maxSliceHeightPx, canvas.height - renderedHeightPx)
          const sliceCanvas = createCanvasSlice(canvas, renderedHeightPx, sliceHeightPx)
          const sliceHeightMm = (sliceCanvas.height * CONTENT_WIDTH_MM) / sliceCanvas.width

          if (!isFirstRender || renderedHeightPx > 0) {
            pdf.addPage()
          }

          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, sliceHeightMm)

          renderedHeightPx += sliceHeightPx
          lastSliceHeightMm = sliceHeightMm
          isFirstRender = false
        }

        currentY = MARGIN_MM + lastSliceHeightMm + SECTION_GAP_MM
      }

      const safeName = projectName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'proposta'

      pdf.save(`${safeName}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF da proposta:', error)
      window.alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const message = `Olá! Gostaria de aprovar a proposta do projeto ${projectName}.`
  const encodedMessage = encodeURIComponent(message)
  const rawPhone = (whatsappNumber || '5511951513862').replace(/\D/g, '')
  const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isInIframe = (() => {
    try {
      return window.self !== window.top
    } catch {
      return true
    }
  })()
  const whatsappUrl = isMobile
    ? `https://wa.me/${phone}?text=${encodedMessage}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
  const linkTarget = isInIframe ? '_top' : '_blank'

  return (
    <div
      className={`no-print fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-3 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <a
        href={whatsappUrl}
        target={linkTarget}
        rel='noopener noreferrer'
        className='inline-flex items-center gap-2.5 bg-[#4CFF5C] text-black px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-[2px] hover:bg-[#5fff6b] hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(76,255,92,0.3)] transition-all duration-300 shadow-[0_4px_20px_rgba(76,255,92,0.3)]'
      >
        <MessageCircle className='w-4 h-4' />
        WhatsApp para Aprovação
      </a>
      <button
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className='group relative overflow-hidden bg-white/10 backdrop-blur-sm text-[#f0f0f0] hover:bg-white/20 border border-gray-700 hover:border-[#4CFF5C] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 uppercase tracking-wider text-xs font-bold rounded-xl px-8 py-3.5 h-auto inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed'
      >
        <Download size={14} strokeWidth={2} className='mr-2' />
        {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
      </button>
    </div>
  )
}
