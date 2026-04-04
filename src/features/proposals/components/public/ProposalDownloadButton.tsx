import { Download, MessageCircle } from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ProposalPdfDocument } from './ProposalPdfDocument'
import { svgToPngDataUri } from './asset3DataUri'
import type { Proposal } from '../../types'

interface Props {
  whatsappNumber: string | null
  projectName: string
  proposal: Proposal
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

async function waitForMedia(root: HTMLElement) {
  if ('fonts' in document) await document.fonts.ready

  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
    )
  )
  // Give browser 2 frames to layout
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
}

async function fetchCaseThumbnails(cases: Proposal['cases']): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  await Promise.all(
    cases
      .filter((c) => c.vimeoId)
      .map(async (c) => {
        try {
          const hashSegment = c.vimeoHash ? `/${c.vimeoHash}` : ''
          const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${c.vimeoId}${hashSegment}`)
          if (!res.ok) throw new Error()
          const data = await res.json()
          const url = (data.thumbnail_url as string)?.replace(/-d_\d+x\d+/, '-d_1280x720') || data.thumbnail_url
          result[c.vimeoId!] = url
        } catch {
          result[c.vimeoId!] = `https://vumbnail.com/${c.vimeoId}.jpg`
        }
      })
  )
  return result
}

export function ProposalDownloadButton({ whatsappNumber, projectName, proposal }: Props) {
  const [visible, setVisible] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPdfDoc, setShowPdfDoc] = useState(false)
  const [caseThumbnails, setCaseThumbnails] = useState<Record<string, string>>({})
  const [footerPng, setFooterPng] = useState<string>('')
  const pdfRef = useRef<HTMLDivElement>(null)

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

  const handleDownloadPDF = useCallback(async () => {
    if (isGenerating) return
    setIsGenerating(true)

    try {
      // 1. Pre-fetch thumbnails
      const thumbs = await fetchCaseThumbnails(proposal.cases)
      setCaseThumbnails(thumbs)

      // 2. Mount the off-screen PDF document
      setShowPdfDoc(true)

      // 3. Wait for the component to render + images to load
      await new Promise((r) => setTimeout(r, 300))
      const root = pdfRef.current
      if (!root) throw new Error('PDF document not mounted')
      await waitForMedia(root)
      // Extra settle time for complex layouts
      await new Promise((r) => setTimeout(r, 500))

      // 4. Find all pages
      const pages = Array.from(root.querySelectorAll('.proposal-pdf-page')) as HTMLElement[]
      if (pages.length === 0) throw new Error('No pages found')

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0A0A0A',
          logging: false,
          width: page.scrollWidth,
          height: page.scrollHeight,
        })

        if (i > 0) pdf.addPage()

        // Paint background black
        pdf.setFillColor(10, 10, 10)
        pdf.rect(0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, 'F')

        // Calculate how to fit the canvas into A4
        const imgRatio = canvas.height / canvas.width
        const pageRatio = A4_HEIGHT_MM / A4_WIDTH_MM

        let imgWidth = A4_WIDTH_MM
        let imgHeight = A4_WIDTH_MM * imgRatio

        // If the image is taller than A4, scale to fit height
        if (imgHeight > A4_HEIGHT_MM) {
          imgHeight = A4_HEIGHT_MM
          imgWidth = A4_HEIGHT_MM / imgRatio
        }

        const offsetX = (A4_WIDTH_MM - imgWidth) / 2
        const offsetY = 0 // top-aligned

        const imageData = canvas.toDataURL('image/jpeg', 0.92)
        pdf.addImage(imageData, 'JPEG', offsetX, offsetY, imgWidth, imgHeight)
      }

      // Save
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
      setShowPdfDoc(false)
    }
  }, [isGenerating, proposal, projectName])

  const message = `Olá! Gostaria de aprovar a proposta do projeto ${projectName}.`
  const encodedMessage = encodeURIComponent(message)
  const rawPhone = (whatsappNumber || '5511951513862').replace(/\D/g, '')
  const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isInIframe = (() => {
    try { return window.self !== window.top } catch { return true }
  })()
  const whatsappUrl = isMobile
    ? `https://wa.me/${phone}?text=${encodedMessage}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
  const linkTarget = isInIframe ? '_top' : '_blank'

  return (
    <>
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

      {showPdfDoc && createPortal(
        <ProposalPdfDocument
          ref={pdfRef}
          proposal={proposal}
          caseThumbnails={caseThumbnails}
        />,
        document.body
      )}
    </>
  )
}
