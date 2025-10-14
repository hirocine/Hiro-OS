import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Equipment } from '@/types/equipment';
import { logger } from '@/lib/logger';

export interface PDFProjectData {
  projectNumber?: string;
  company?: string;
  projectName: string;
  responsibleName: string;
  responsibleDepartment?: string;
  withdrawalDate?: Date;
  returnDate?: Date;
  separationDate?: Date;
  recordingType?: string;
  selectedEquipment: {
    cameras: Array<{ camera: Equipment; accessories: Equipment[] }>;
    lenses: Equipment[];
    cameraAccessories: Equipment[];
    tripods: Equipment[];
    lights: Equipment[];
    lightModifiers: Equipment[];
    machinery: Equipment[];
    electrical: Equipment[];
    storage: Equipment[];
    computers: Equipment[];
  };
}

// Helper para remover emojis
const stripEmojis = (str: string): string => {
  return (str || '').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim();
};

// Helper para converter imagem em data URL
const getImageDataURL = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logger.error('Error loading image for PDF', { error });
    throw error;
  }
};

export async function generateProjectPDF(data: PDFProjectData): Promise<void> {
  try {
    logger.info('Initiating PDF generation', {
      module: 'pdf-generator',
      action: 'generate_pdf'
    });
    
    if (!data.projectName) {
      throw new Error("Dados do projeto incompletos para gerar PDF.");
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 10;
    
    // === CARREGAR E ADICIONAR LOGO ===
    try {
      const logoDataUrl = await getImageDataURL('/src/assets/hiro-logo.png');
      doc.addImage(logoDataUrl, 'PNG', 15, yPosition, 20, 20);
    } catch (error) {
      logger.warn('Failed to load logo, using text fallback', { error });
    }
    
    // === CABEÇALHO ===
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Resumo de Projeto Audio Visual', 38, yPosition + 16, { align: 'left' });
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    const headerLineY = yPosition + 28;
    doc.line(15, headerLineY, pageWidth - 15, headerLineY);
    
    // Respiro de 6mm abaixo da linha
    yPosition = headerLineY + 10;
    
    // === INFORMAÇÕES DO PROJETO (layout melhorado) ===
    const projectFullName = data.projectNumber 
      ? `${data.projectNumber} - ${data.company}: ${data.projectName}`
      : data.projectName;
    
    // Nome do projeto (com quebra de texto se necessário)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const maxWidth = pageWidth - 30; // 15mm margem esquerda + 15mm direita
    const projectNameLines = doc.splitTextToSize(projectFullName, maxWidth);
    doc.text(projectNameLines, 15, yPosition);
    
    // Avançar Y baseado no número de linhas
    const lineStep = 5;
    yPosition += projectNameLines.length * lineStep + 1;
    
    // Responsável
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Responsável: ${data.responsibleName}`, 15, yPosition);
    yPosition += 5;
    
    // Tipo de Gravação (sem emojis)
    if (data.recordingType) {
      const recordingTypeClean = stripEmojis(data.recordingType);
      doc.text(`Tipo de Gravação: ${recordingTypeClean}`, 15, yPosition);
      yPosition += 5;
    }
    
    // Datas
    const separationDate = data.separationDate ? format(data.separationDate, 'dd/MM/yyyy', { locale: ptBR }) : '-';
    const withdrawalDate = data.withdrawalDate ? format(data.withdrawalDate, 'dd/MM/yyyy', { locale: ptBR }) : '-';
    const returnDate = data.returnDate ? format(data.returnDate, 'dd/MM/yyyy', { locale: ptBR }) : '-';
    
    doc.text(`Separação: ${separationDate}  |  Retirada: ${withdrawalDate}  |  Devolução: ${returnDate}`, 15, yPosition);
    yPosition += 5;
    
    // Dias de uso (linha própria)
    if (data.withdrawalDate && data.returnDate) {
      const days = Math.ceil((data.returnDate.getTime() - data.withdrawalDate.getTime()) / (1000 * 60 * 60 * 24));
      doc.setFont('helvetica', 'bold');
      doc.text(`(${days} ${days === 1 ? 'dia' : 'dias'} de uso)`, 15, yPosition);
      doc.setFont('helvetica', 'normal');
    }
    yPosition += 8;
    
    // === PREPARAR DADOS DE EQUIPAMENTOS (SEM EMOJIS) ===
    const categoriesData: Array<{
      name: string;
      items: Array<{ name: string; isAccessory: boolean }>;
    }> = [];
    
    // Câmeras
    if (data.selectedEquipment.cameras.length > 0) {
      const cameraItems: Array<{ name: string; isAccessory: boolean }> = [];
      data.selectedEquipment.cameras.forEach((selectedCamera) => {
        cameraItems.push({ 
          name: `${selectedCamera.camera.name} - ${selectedCamera.camera.brand}`, 
          isAccessory: false 
        });
        selectedCamera.accessories.forEach((acc) => {
          cameraItems.push({ 
            name: `${acc.name} - ${acc.brand}`, 
            isAccessory: true 
          });
        });
      });
      categoriesData.push({ name: 'CÂMERAS', items: cameraItems });
    }
    
    // Lentes
    if (data.selectedEquipment.lenses.length > 0) {
      const items = data.selectedEquipment.lenses.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'LENTES', items });
    }
    
    // Acessórios de Câmera
    if (data.selectedEquipment.cameraAccessories.length > 0) {
      const items = data.selectedEquipment.cameraAccessories.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'ACESSÓRIOS DE CÂMERA', items });
    }
    
    // Tripés
    if (data.selectedEquipment.tripods.length > 0) {
      const items = data.selectedEquipment.tripods.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'TRIPÉS E ESTABILIZADORES', items });
    }
    
    // Iluminação
    if (data.selectedEquipment.lights.length > 0) {
      const items = data.selectedEquipment.lights.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'ILUMINAÇÃO', items });
    }
    
    // Modificadores
    if (data.selectedEquipment.lightModifiers.length > 0) {
      const items = data.selectedEquipment.lightModifiers.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'MODIFICADORES DE LUZ', items });
    }
    
    // Maquinário
    if (data.selectedEquipment.machinery.length > 0) {
      const items = data.selectedEquipment.machinery.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'MAQUINÁRIO', items });
    }
    
    // Elétrica
    if (data.selectedEquipment.electrical.length > 0) {
      const items = data.selectedEquipment.electrical.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'ELÉTRICA', items });
    }
    
    // Armazenamento
    if (data.selectedEquipment.storage.length > 0) {
      const items = data.selectedEquipment.storage.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'ARMAZENAMENTO', items });
    }
    
    // Computadores
    if (data.selectedEquipment.computers.length > 0) {
      const items = data.selectedEquipment.computers.map(item => ({ 
        name: `${item.name} - ${item.brand}`, 
        isAccessory: false 
      }));
      categoriesData.push({ name: 'COMPUTADORES', items });
    }
    
    // === RENDERIZAR CATEGORIAS COM CHECKBOXES MAIORES ===
    categoriesData.forEach((category) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 15;
      }
      
      // Preparar dados para autoTable
      const head = [[{ 
        content: `${category.name} (${category.items.length} ${category.items.length === 1 ? 'item' : 'itens'})`, 
        colSpan: 2, 
        styles: { 
          fillColor: [240, 240, 240] as [number, number, number], 
          fontStyle: 'bold' as const, 
          halign: 'left' as const, 
          textColor: [0, 0, 0] as [number, number, number],
          fontSize: 10
        } 
      }]];
      
      const body = category.items.map(item => [item.name, '']);
      
      // Renderizar tabela com autoTable
      autoTable(doc, {
        startY: yPosition,
        head,
        body,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          textColor: [40, 40, 40] as [number, number, number],
          cellPadding: { top: 1.5, bottom: 1.5, left: 4, right: 4 },
          overflow: 'linebreak',
          lineColor: [220, 220, 220] as [number, number, number],
          lineWidth: 0.3
        },
        headStyles: {
          cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }
        },
        columnStyles: {
          0: { cellWidth: 'auto' },   // Descrição ocupa o espaço restante
          1: { cellWidth: 8 }         // Coluna do checkbox largura fixa
        },
        margin: { left: 15, right: 15, bottom: 20 },
        tableLineColor: [220, 220, 220] as [number, number, number],
        tableLineWidth: 0.3,
        didParseCell: (data) => {
          // Indentação de acessórios na coluna de descrição
          if (data.section === 'body' && data.column.index === 0) {
            const item = category.items[data.row.index];
            if (item?.isAccessory && data.cell.styles.cellPadding) {
              const currentPadding = data.cell.styles.cellPadding;
              if (typeof currentPadding === 'object' && !Array.isArray(currentPadding)) {
                data.cell.styles.cellPadding = { 
                  top: currentPadding.top ?? 1.5,
                  bottom: currentPadding.bottom ?? 1.5,
                  left: 12,
                  right: currentPadding.right ?? 4
                };
              }
            }
          }
        },
        didDrawCell: (data) => {
          // Desenhar checkbox centralizado na célula da coluna 1
          if (data.section === 'body' && data.column.index === 1) {
            const size = 6; // 6mm
            const x = data.cell.x + (data.cell.width - size) / 2;
            const y = data.cell.y + (data.cell.height - size) / 2;
            doc.setDrawColor(80, 80, 80);
            doc.setLineWidth(0.4);
            doc.rect(x, y, size, size);
          }
        }
      });
      
      // Atualizar yPosition após a tabela
      yPosition = (doc as any).lastAutoTable.finalY + 5;
    });
    
    // === RODAPÉ EM TODAS AS PÁGINAS ===
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        15,
        pageHeight - 8
      );
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - 15,
        pageHeight - 8,
        { align: 'right' }
      );
    }
    
    // Salvar PDF
    const projectNumber = data.projectNumber || 'Projeto';
    const fileName = `Resumo_Projeto_${projectNumber}_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`;
    doc.save(fileName);
    
    logger.info('PDF generated successfully', {
      module: 'pdf-generator',
      action: 'pdf_generated'
    });
    
  } catch (error) {
    logger.error('Error generating PDF', {
      module: 'pdf-generator',
      action: 'pdf_generation_error',
      error
    });
    throw error;
  }
}
