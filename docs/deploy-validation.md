# Validação da saída de produção — 10 de outubro de 2026

Saída local `dist/`, servida em HTTP. Não houve publicação na Vercel nesta validação.

## Build

- Instalação reproduzida com `npm ci` usando o lockfile.
- HTML/CSS/JS: 171.585 → 141.213 bytes, redução de 17,7%.
- Saída: 263 arquivos, 24.490.010 bytes (23,36 MiB).
- Verificação automática: caminhos HTML/CSS/JS, âncoras, ordem dos scripts, quatro capas e 239 frames.
- Imagens e áudio conferidos byte a byte contra os fontes; não foram recomprimidos.
- Materiais de referência, temporários, `.DS_Store`, manifesto editorial e source maps não fazem parte da saída.

## Navegador

Conferido no navegador integrado, com viewport móvel de 390 × 844 e desktop de 1440 × 900.

- Menu móvel: abertura, Escape com retorno do foco e fechamento após navegação.
- Nenhum overflow horizontal nas verificações móvel e desktop.
- Organograma: seleção de Base 12, seis cards no modo base, 50 na matriz, zoom, setas do teclado e arraste (scrollLeft de 168 para 343).
- Livros: quatro capas locais carregadas, transformação 3D e troca da obra ativa de Transição para CEO durante a rolagem.
- Diálogo de livro: título correto, fechamento por Escape e retorno do foco ao botão de origem.
- Sequência de Davi: canvas pronto, reprodução até “O rei guerreiro” com progresso completo.
- Áudio: inicialmente pausado, ativado por interação, reproduzido junto à sequência e desativado pelo controle.
- Controle de movimento: portal estático, conteúdo do hero acessível e quatro capas estáticas quando pausado.
- Nenhum erro ou aviso de console no site após essas interações.
- 404: layout móvel sem overflow; três imagens de marca carregadas; links de retorno funcionando desde `/nao-existe/subpagina`.
- HTTP: endereço inexistente responde 404 e o CSS da página de erro responde 200.

## Limites

O navegador disponível não oferece emulação de `prefers-reduced-motion`. A preferência do sistema foi revisada nos media queries e na escuta `matchMedia`; a pausa manual foi testada em execução. Não houve teste em dispositivos físicos ou em outros motores de navegador. O status 404 na Vercel depende da publicação, ainda não realizada.

As pendências de conteúdo continuam registradas em `editorial-review.md`.
