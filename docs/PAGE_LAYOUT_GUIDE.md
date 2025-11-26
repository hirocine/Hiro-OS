# Guia de Layout de Páginas

Este documento define o padrão de layout para todas as páginas da aplicação, garantindo consistência visual e responsividade em todos os dispositivos.

## Estrutura Padrão de Páginas

Todas as páginas devem usar o componente `ResponsiveContainer` para garantir espaçamento consistente e responsivo. Este componente substitui o uso manual de `<div className="container mx-auto p-6">`.

### Padrão Recomendado

```tsx
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export default function MinhaNovaPage() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Título da Página"
        subtitle="Descrição opcional da funcionalidade"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        }
      />
      
      {/* Conteúdo da página */}
      <Card>
        <CardHeader>
          <CardTitle>Seção Principal</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Conteúdo do card */}
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
```

## Benefícios do ResponsiveContainer

1. **Espaçamento Responsivo Automático**: 
   - Mobile: `px-6 py-4`
   - Tablet: `px-8 py-6`
   - Desktop: `px-10 lg:px-12 py-6 lg:py-8`

2. **Espaçamento entre Elementos**: 
   - Aplica automaticamente `space-y-4` (mobile), `space-y-5` (tablet), `space-y-6` (desktop)

3. **Largura Máxima Consistente**:
   - Use `maxWidth="7xl"` para páginas com tabelas/listas
   - Use `maxWidth="4xl"` para páginas de formulários
   - Use `maxWidth="full"` para páginas que precisam de largura total

4. **Safe Areas para Mobile**:
   - Inclui automaticamente a classe `mobile-safe` para respeitar áreas de notch/status bar

## Quando NÃO Usar ResponsiveContainer

### Páginas de Detalhes com Layout Customizado

Páginas de detalhes (como `ProjectDetails.tsx`, `EquipmentDetails.tsx`) que precisam de estrutura de header customizada podem usar layout manual, mas devem manter os mesmos valores de padding:

```tsx
export default function MinhaPageDeDetalhes() {
  return (
    <div className="container mx-auto px-10 lg:px-12 py-6 lg:py-8 space-y-6 animate-fade-in">
      {/* Header customizado com botão voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Detalhes do Item</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Editar</Button>
          <Button variant="destructive">Excluir</Button>
        </div>
      </div>
      
      {/* Conteúdo */}
    </div>
  );
}
```

## Exemplos de Páginas que Seguem o Padrão

✅ **Páginas Corretas (usam ResponsiveContainer)**:
- `src/pages/PlatformAccesses.tsx`
- `src/pages/Suppliers.tsx`
- `src/pages/Policies.tsx`
- `src/pages/Equipment.tsx`
- `src/pages/Projects.tsx`
- `src/pages/SSDs.tsx`

✅ **Páginas com Layout Customizado Correto**:
- `src/pages/ProjectDetails.tsx`
- `src/pages/SupplierDetails.tsx`
- `src/pages/PolicyView.tsx`

## Checklist para Novas Páginas

Ao criar uma nova página, verifique:

- [ ] Importou `ResponsiveContainer` de `@/components/ui/responsive-container`
- [ ] Envolveu todo o conteúdo da página com `<ResponsiveContainer>`
- [ ] Definiu `maxWidth` apropriado (geralmente `"7xl"`)
- [ ] Usou `PageHeader` para título e ações principais
- [ ] Removeu classes de padding/spacing manuais (`p-6`, `space-y-6`, etc)
- [ ] Testou a responsividade em mobile, tablet e desktop

## Anti-Padrões a Evitar

❌ **NÃO faça isso**:
```tsx
// Spacing manual inconsistente
<div className="container mx-auto p-6 space-y-6">
  <PageHeader title="Título" />
</div>
```

❌ **NÃO faça isso**:
```tsx
// Padding diferente de outras páginas
<div className="container mx-auto px-4 py-8">
  <PageHeader title="Título" />
</div>
```

✅ **FAÇA isso**:
```tsx
// Usa ResponsiveContainer para consistência
<ResponsiveContainer maxWidth="7xl">
  <PageHeader title="Título" />
</ResponsiveContainer>
```

## Migração de Páginas Existentes

Se você encontrar uma página usando layout manual (`<div className="container mx-auto p-6">`), siga estes passos para migrar:

1. Importe `ResponsiveContainer`
2. Substitua o `<div>` externo por `<ResponsiveContainer maxWidth="7xl">`
3. Remova classes de padding e spacing (`p-6`, `space-y-6`)
4. Teste a página em diferentes tamanhos de tela
5. Verifique que o espaçamento ficou consistente com outras páginas

---

**Última atualização**: 26/11/2025
