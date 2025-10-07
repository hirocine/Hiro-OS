# 📱 Checklist de Responsividade PWA

## ✅ Dispositivos a Testar

### Mobile iOS
- [ ] iPhone SE (375px x 667px)
- [ ] iPhone 14 (390px x 844px) - Notch
- [ ] iPhone 14 Pro (393px x 852px) - Dynamic Island
- [ ] iPhone 14 Pro Max (430px x 932px)
- [ ] iPhone 15 Pro Max (430px x 932px)

### Mobile Android
- [ ] Samsung Galaxy S21 (360px x 800px)
- [ ] Google Pixel 7 (412px x 915px)
- [ ] OnePlus 11 (448px x 992px)
- [ ] Pequenos (< 360px)

### Tablet
- [ ] iPad Mini (768px x 1024px)
- [ ] iPad Air (820px x 1180px)
- [ ] iPad Pro 11" (834px x 1194px)
- [ ] iPad Pro 12.9" (1024px x 1366px)

### Desktop
- [ ] 1366px x 768px (laptop comum)
- [ ] 1920px x 1080px (Full HD)
- [ ] 2560px x 1440px (2K)

---

## 🔄 Orientações

### Portrait (Vertical)
- [ ] iPhone (todos os modelos)
- [ ] Android (todos os modelos)
- [ ] iPad (todos os modelos)

### Landscape (Horizontal)
- [ ] iPhone (todos os modelos)
- [ ] Android (todos os modelos)
- [ ] iPad (todos os modelos)

---

## 🎯 Componentes Críticos

### 1. Header & Navegação
- [ ] Header respeita safe-area-top (notch/dynamic island)
- [ ] Z-index correto (60)
- [ ] Sidebar vertical aparece no desktop
- [ ] Sheet overlay funciona no mobile
- [ ] SidebarTrigger sempre visível no mobile
- [ ] Logo/título visível e não sobreposto

### 2. Sidebar
- [ ] VerticalSidebar fixa no desktop (96px)
- [ ] Ícones e textos legíveis
- [ ] Estado ativo com borda colorida
- [ ] Avatar do usuário na parte inferior
- [ ] AppSidebar (Sheet) funciona no mobile
- [ ] Auto-close ao navegar
- [ ] Z-index correto (70)

### 3. Dialogs & Drawers
- [ ] ResponsiveDialog alterna entre Dialog e Drawer
- [ ] DrawerContent respeita safe-area-bottom
- [ ] Altura máxima respeitando header PWA
- [ ] Z-index correto (70)
- [ ] Scroll interno funciona
- [ ] Close button sempre acessível

### 4. Dropdowns & Popovers
- [ ] DropdownMenu background opaco
- [ ] Z-index correto (75)
- [ ] Não fica atrás do header
- [ ] Items com altura mínima 44px (touch-friendly)
- [ ] Popover posicionamento inteligente
- [ ] Select dropdown visível

### 5. Forms & Inputs
- [ ] Inputs com altura mínima 44px
- [ ] Touch targets mínimo 48x48px
- [ ] Teclado virtual detectado corretamente
- [ ] Auto-scroll quando input recebe foco
- [ ] Input não fica oculto pelo teclado
- [ ] Labels sempre visíveis
- [ ] Error states evidentes
- [ ] Botões de ação adequados (min 48px mobile)

### 6. Notificações & Toasts
- [ ] OfflineIndicator z-index correto (85)
- [ ] Não sobrepõe header
- [ ] Animação de entrada/saída suave
- [ ] Toast z-index correto (90)
- [ ] Safe-areas respeitadas
- [ ] NotificationPanel dropdown visível
- [ ] Badge de contador visível

### 7. Cards & Listas
- [ ] Touch targets adequados (min 44x44px)
- [ ] Espaçamento confortável
- [ ] Scroll suave
- [ ] Loading states
- [ ] Empty states
- [ ] Hover effects no desktop
- [ ] Active/pressed states no mobile

### 8. Safe Areas
- [ ] Top: respeitado no header PWA
- [ ] Bottom: respeitado em drawers e containers
- [ ] Left: respeitado em sheets laterais
- [ ] Right: sem conflitos
- [ ] Funciona em notch e dynamic island

---

## 🧪 Funcionalidades Críticas a Testar

### Adicionar Equipamento
- [ ] Dialog abre corretamente
- [ ] Form visível completo
- [ ] Inputs acessíveis com teclado virtual
- [ ] Upload de imagem funciona
- [ ] Validação de campos
- [ ] Botões de ação acessíveis
- [ ] Salvamento funciona

### Editar Equipamento
- [ ] Dialog abre com dados corretos
- [ ] Form editável
- [ ] Inputs acessíveis
- [ ] Alterações salvas

### Criar Projeto
- [ ] Wizard funciona no mobile
- [ ] Steps navegáveis
- [ ] Forms acessíveis
- [ ] Salvamento funciona

### Adicionar Equipamento a Projeto
- [ ] Dialog de seleção funciona
- [ ] Lista de equipamentos visível
- [ ] Scroll funciona
- [ ] Seleção múltipla funciona
- [ ] Confirmação funciona

### Navegação entre Páginas
- [ ] Transições suaves
- [ ] Estado preservado
- [ ] Sidebar mobile fecha
- [ ] Header sempre visível

### Autenticação
- [ ] Login form acessível
- [ ] Inputs com teclado virtual
- [ ] Validação funciona
- [ ] Redirecionamento correto
- [ ] Logout funciona

### Upload de Imagens
- [ ] Seleção de arquivo funciona
- [ ] Preview visível
- [ ] Crop funciona (se aplicável)
- [ ] Upload progride
- [ ] Feedback visual

### Filtros e Busca
- [ ] Filtros acessíveis
- [ ] Dropdowns funcionam
- [ ] Busca responsiva
- [ ] Resultados visíveis

### Ordenação
- [ ] Controles acessíveis
- [ ] Feedback visual
- [ ] Lista atualiza

### Paginação
- [ ] Controles touch-friendly
- [ ] Números de página visíveis
- [ ] Navegação funciona

---

## 🎨 Visual & UX

### Espaçamento
- [ ] Padding adequado em todos os elementos
- [ ] Margens confortáveis
- [ ] Não há elementos colados nas bordas
- [ ] Safe-areas respeitadas

### Tipografia
- [ ] Textos legíveis (min 14px mobile)
- [ ] Hierarquia clara
- [ ] Line-height adequado
- [ ] Contrast ratio adequado

### Cores & Temas
- [ ] Light mode funciona perfeitamente
- [ ] Dark mode funciona perfeitamente
- [ ] Contraste adequado em ambos
- [ ] Bordas visíveis
- [ ] Estados hover/active/focus claros

### Animações
- [ ] Transições suaves
- [ ] Não há jank (stuttering)
- [ ] Performance adequada
- [ ] Não causam motion sickness

### Loading States
- [ ] Skeletons apropriados
- [ ] Spinners visíveis
- [ ] Feedback imediato
- [ ] Não bloqueia UI desnecessariamente

---

## ⚡ Performance

### Velocidade
- [ ] Navegação instantânea
- [ ] Scroll suave (60fps)
- [ ] Animações fluidas
- [ ] Sem delays perceptíveis

### Memória
- [ ] Sem memory leaks
- [ ] Imagens otimizadas
- [ ] Lazy loading funciona
- [ ] Cache eficiente

---

## ♿ Acessibilidade

### Keyboard Navigation
- [ ] Tab order lógico
- [ ] Focus visible
- [ ] Atalhos de teclado funcionam
- [ ] Escape fecha modals

### Screen Reader
- [ ] ARIA labels presentes
- [ ] Landmarks corretos
- [ ] Anúncios de mudança de estado
- [ ] Navegação lógica

### Touch Targets
- [ ] Mínimo 44x44px (iOS)
- [ ] Mínimo 48x48px (Android)
- [ ] Espaçamento adequado
- [ ] Feedback tátil (se suportado)

---

## 🐛 Edge Cases

### Offline
- [ ] Indicador aparece
- [ ] Funcionalidades limitadas indicadas
- [ ] Dados em cache acessíveis
- [ ] Sincronização ao voltar online

### Orientação
- [ ] Landscape funciona perfeitamente
- [ ] Portrait funciona perfeitamente
- [ ] Transição suave entre orientações
- [ ] Layout se adapta

### Teclado Virtual
- [ ] Abre corretamente
- [ ] Fecha corretamente
- [ ] Não oculta inputs
- [ ] Scroll automático funciona
- [ ] Altura detectada corretamente

### Notch / Dynamic Island
- [ ] Conteúdo não fica oculto
- [ ] Safe-areas respeitadas
- [ ] Layout se adapta

### Conexão Lenta
- [ ] Loading states apropriados
- [ ] Timeout adequado
- [ ] Retry funciona
- [ ] Feedback claro

---

## ✅ Critérios de Aprovação

### Obrigatórios (Bloqueantes)
- [ ] Todos os componentes críticos funcionam
- [ ] Safe-areas respeitadas em todos os dispositivos
- [ ] Z-index hierarchy consistente
- [ ] Teclado virtual não oculta inputs
- [ ] Touch targets ≥ 44px
- [ ] Navegação fluida
- [ ] Sem erros de console

### Recomendados (Desejáveis)
- [ ] Performance 60fps constante
- [ ] Animações suaves
- [ ] Loading states consistentes
- [ ] Acessibilidade completa
- [ ] Offline support completo

---

## 📝 Notas de Teste

### Problemas Encontrados
```
[Data] - [Dispositivo] - [Descrição do problema] - [Severidade: Alta/Média/Baixa]

Exemplo:
2025-10-07 - iPhone 14 Pro - Dropdown de perfil fica atrás do header - Alta
```

### Melhorias Sugeridas
```
[Data] - [Componente] - [Sugestão]

Exemplo:
2025-10-07 - Forms - Adicionar animação de sucesso após submit
```

---

## 🎯 Status Geral

- [ ] ✅ Aprovado para produção
- [ ] ⚠️ Aprovado com ressalvas (listar)
- [ ] ❌ Reprovado (listar blockers)

---

**Última atualização**: 2025-10-07
**Responsável pelo teste**: _____________
**Versão testada**: _____________
