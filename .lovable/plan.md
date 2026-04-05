

# 3 ajustes visuais e funcionais

## 1. Portfólio — thumbnails e layout (ProposalGuidedWizard.tsx, lines 828-854)

Replace the card layout:
- Keep `vumbnail.com` URL but add fallback: if `!c.vimeo_id`, show a gray placeholder div with `<Video />` icon
- Remove `<Checkbox>` from inline flow; add it as `position: absolute` top-right corner of the card (the card becomes `relative`)
- Thumbnail gets `rounded-lg`
- Content (client, campaign, tags) gets `items-center` vertical alignment relative to thumbnail
- Selected card keeps `border-primary bg-primary/5`

## 2. Entregáveis — emoji no prompt (edge function, line 353)

In `supabase/functions/ai-proposal-assistant/index.ts`, append to the entregáveis instruction in `finalize_transcript`:

```
Para o campo 'icone', escolha o emoji mais relevante para cada entregável entre estas opções: 🎬 Cinema, 📱 Celular, 📷 Câmera, 📋 Checklist, 🎨 Arte, 🖼️ Imagem, 🎵 Música, 🖥️ Monitor, 🎙️ Microfone, 🎥 Filmadora, ✂️ Edição, 📐 Design, 🚀 Foguete, ⭐ Estrela, 💡 Ideia, 📦 Pacote, 🎯 Alvo, 📊 Gráfico, 🏆 Troféu, 🔥 Fogo, ⚡ Raio, 🎤 Karaokê, 📸 Flash, 🎞️ Película. Exemplo: para aulas EAD use 🎬, para vídeo institucional use 🎥, para webcast/live use 🖥️.
```

## 3. Depoimento — remove "Pular" + consistency (lines 1148-1162)

- Delete the "Pular sem depoimento" button block (lines 1148-1162)
- The cards already use `border-primary bg-primary/5` pattern — consistent with Portfólio. No checkbox/radio to remove (already just cards with a Check icon). Keep the Check icon for visual feedback.

## Files changed

1. `src/features/proposals/components/ProposalGuidedWizard.tsx`
2. `supabase/functions/ai-proposal-assistant/index.ts`

No files in `src/features/proposals/components/public/` touched.

