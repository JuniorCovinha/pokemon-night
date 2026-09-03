---
name: champion-video-prompts
description: Criar ou refinar prompts para vídeos pixelados em loop usados como fundo do card do campeão no projeto Pokemon Night. Use ao planejar uma animação temática para uma tipagem ou adaptar o prompt a um gerador de vídeo.
---

# Prompts de vídeo do campeão

Crie prompts em inglês e entregue o negative prompt separadamente. Estes vídeos são
fundos internos do `ChampionCard`, atrás do Pokémon e das informações; não são fundos
da página.

## Padrão visual

- Canvas de `1536 × 1024`, proporção 3:2.
- Duração de 5 segundos a 30 fps.
- Pixel art nítida, com câmera fixa e quadro inteiro preenchido.
- Movimento contínuo na direção definida pelo preset da tipagem.
- Loop temporal perfeito: o fluxo que sai por uma borda deve reaparecer naturalmente
  pela borda oposta, sem pausa, corte, fade ou mudança de velocidade.
- Movimento perceptível, uniforme e previsível; evite eventos únicos que denunciem o
  ponto de repetição.
- Preserve contraste suficiente para o Pokémon, o nome e o selo do deck permanecerem
  legíveis, mas não deixe uma região central vazia.
- Não inclua texto, logos, bordas, interface, personagens, Pokémon ou Poké Bolas.

Ao criar um prompt para uma tipagem, leia
[`references/type-presets.md`](references/type-presets.md), use o preset correspondente
e preserve o mesmo formato-base. Se a tipagem ainda não tiver preset, proponha
movimento, paleta e elementos coerentes e registre-os somente quando o usuário pedir
para atualizar a skill.

Se o gerador não aceitar dimensões, duração ou negative prompt em campos próprios,
incorpore essas restrições no prompt principal sem mudar a direção artística.
