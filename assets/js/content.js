/* Cadastro editorial. Preencher apenas com dados reais e imagens locais em WebP. */
window.HDS_ORGANOGRAM = {
  pastor: { name: '', role: 'Pastor principal', photo: '' },
  principal: { name: '', role: 'Líder principal do ministério', photo: '' },
  bases: Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `Base ${String(i + 1).padStart(2, '0')} · nome a cadastrar`,
    manager: { name: '', role: 'Gestor da base', photo: '' },
    leaders: [
      { name: '', role: 'Líder de base', photo: '' },
      { name: '', role: 'Líder de base', photo: '' }
    ]
  }))
};

window.HDS_BOOKS = [
  {
    id: 'transicao', title: 'O Maior Inimigo da Transição: Ansiedade',
    theme: 'Transições', author: 'Jairo Manhães',
    description: 'Uma leitura sobre a ansiedade nas fases de transição.',
    cover: 'assets/images/books/transicao-original.webp',
    geometry: { width: 328, height: 500, corners: [[0, 0], [328, 0], [328, 500], [0, 500]] },
    source: 'https://lojacassiane.lojavirtualnuvem.com.br/produtos/livro-o-maior-inimigo-da-transicao-ansiedade-jairo-manhaes/',
    url: null, checked: '2026-10-09', status: 'Link da loja oficial em atualização.'
  },
  {
    id: 'sabedoria', title: 'A Recompensa da Sabedoria',
    theme: 'Sabedoria e decisões', author: 'Jairo Manhães',
    description: 'Uma reflexão sobre sabedoria divina, discernimento e escolhas que orientam uma vida com propósito.',
    cover: 'assets/images/books/sabedoria-original.webp',
    geometry: { width: 409, height: 488, corners: [[72, 81], [311, 82], [310, 443], [72, 440]] },
    source: 'https://lojacassiane.lojavirtualnuvem.com.br/produtos/livro-jairo-manhaes-a-recompensa-da-sabedoria-frete-gratis/',
    url: null, checked: '2026-10-09', status: 'Link da loja oficial em atualização.'
  },
  {
    id: 'vontade', title: 'Vontade de Deus ou Meus Planos?',
    theme: 'Propósito e direção', author: 'Jairo Manhães',
    preface: 'Prefácio de Hernandes Dias Lopes',
    description: 'Uma leitura sobre propósito, decisões e discernimento da vontade de Deus.',
    cover: 'assets/images/books/vontade-original.webp',
    geometry: { width: 387, height: 516, corners: [[58, 154], [207, 65], [352, 309], [204, 399]] },
    source: 'https://lojacassiane.lojavirtualnuvem.com.br/produtos/vontade-de-deus-ou-meus-planos-jairo-manhaes/',
    url: null, checked: '2026-10-09', status: 'Link da loja oficial em atualização.'
  },
  {
    id: 'ceo', title: '(CEO) do Universo',
    theme: 'Liderança', author: 'Jairo Manhães',
    preface: 'Prefácio da cantora Cassiane',
    description: 'Princípios de liderança e gestão da carreira de Cassiane, ADAlpha Church e Reuel Studios.',
    cover: 'assets/images/books/ceo-original.webp',
    geometry: { width: 201, height: 251, corners: [[43, 38], [156, 38], [156, 207], [43, 207]] },
    source: 'https://lojacassiane.lojavirtualnuvem.com.br/',
    url: null, checked: '2026-10-09', status: 'Link da loja oficial em atualização.'
  }
];
