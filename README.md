# Homens de Sucesso | Igreja ADAlpha

Landing page estática. HTML em `index.html`; estilos em `assets/css`; scripts em `assets/js`; imagens e frames em `assets/images`. Sem dependências JavaScript externas no navegador. O build de produção usa Node.js para minificar os arquivos. As fontes Six Caps e Montserrat usam o CDN do Google Fonts, conforme o design system.

## Prévia

Na raiz do projeto:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Abra http://127.0.0.1:4173. O `index.html` também funciona aberto diretamente em navegador.

## Conteúdo e arquivos

- Oito seções. O hero abre com o Portal do Design System: painéis com grid, brasão central e revelação guiada pela rolagem. Os livros em CSS 3D aparecem exclusivamente na seção “Livros e leituras”.
- Quatro livros na ordem de lançamento informada. As capas originais foram convertidas sem perdas e enquadradas na página sem reescrever as letras.
- “10 / Livros e leituras” apresenta quatro linhas alternadas. Um único volume em CSS 3D gira, troca de lado e muda de capa com a rolagem, adaptando o Scroll e 3D do Design System. No celular, o livro fica acima do texto; com movimento pausado, cada linha mostra sua própria capa estática.
- Três cenas de Davi em WebP e 239 frames a 24 fps do clipe fornecido, com reprodução e áudio opcional. Imagens e frames carregam conforme a necessidade; o cache de imagens decodificadas é limitado.
- Organograma do Design System copiado e adaptado, com cinco níveis e 50 cards. Permite matriz completa, consulta por base, zoom e teclado; inicia por uma base no celular.
- Navegação móvel, perguntas de reflexão expansíveis e controles de movimento. Respeita `prefers-reduced-motion`.
- Os três valores de “Nossa caminhada” usam o coverflow do Design System, com seleção por clique, arraste, botões e teclado. As imagens de Davi e os textos originais permanecem.
- Todos os assets usados são locais. O Design System original permanece preservado.

Editar `assets/js/content.js` para cadastrar dados reais da liderança ou atualizar os destinos oficiais dos livros. Fotos novas precisam ser WebP locais. Os valores `geometry.corners` enquadram cada imagem fornecida sem modificar a arte.

O manifesto `assets/asset-manifest.json` registra conversões e a origem do clipe. Originais da antiga pasta `assets/images/temp` foram preservados em `temp/converted-originals`; a página não depende deles. Materiais de referência em `temp` não fazem parte da entrega pública.

## Build e deploy via GitHub / Vercel

Com Node.js 22 ou superior:

```sh
npm ci
npm run build
npm run preview
```

A prévia em http://127.0.0.1:4173 serve somente `dist/`, incluindo a página personalizada para caminhos inexistentes com status HTTP 404. `npm run verify` confere a saída sem refazer o build.

O build minifica HTML, CSS e JavaScript, preserva a ordem dos scripts e copia apenas a mídia declarada em `scripts/build-assets.json`, junto com os 239 frames do manifesto. Imagens e áudio não são recomprimidos. Ao adicionar novos arquivos usados pelo site, atualizar a lista de assets; o build verifica os caminhos publicados.

Os fontes e `package-lock.json` são versionados. `dist/`, dependências, originais em `temp`, referências de design e `.DS_Store` ficam fora do Git. A Vercel gera `dist` em cada build; materiais de trabalho nunca são copiados para a saída pública.

Importar o repositório `leoCardosoDev/homens-de-sucesso-adalpha-church` na Vercel com a raiz do projeto. `vercel.json` configura Framework Preset Other, instalação `npm ci`, build `npm run build` e saída `dist`. A página `404.html` fica na raiz da saída, com caminhos absolutos para funcionar em URLs de qualquer profundidade. Não adicionar uma reescrita geral para `index.html`, pois esconderia os erros 404.

Conferir as pendências editoriais em `docs/editorial-review.md` antes da publicação. A conexão com a Vercel deve ser feita na conta responsável pelo site.
