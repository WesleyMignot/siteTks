// Itens da galeria infinita, alternando fotos do ensaio (com versão colorida) e artes do PDF.
const foto = (nn, alt) => ({
  tks: `assets/img/foto-${nn}-tks.webp`,
  cor: `assets/img/foto-${nn}-cor.webp`,
  alt: `${alt}. Foto @clicksbylt`,
});
const arte = (nome, alt) => ({ tks: `assets/recortes/${nome}.webp`, alt: `${alt} — arte do press kit 2026` });

export const ITENS_GALERIA = [
  foto('21', 'Brunin Tks cobrindo o rosto com a mão, de moletom'),
  arte('p1-capa', 'Capa do press kit com o logo Brunin Tks'),
  foto('31', 'Brunin Tks puxando a gola do moletom, de óculos'),
  arte('p2-moldura', 'Brunin Tks sentado, em moldura tribal'),
  foto('57', 'Brunin Tks de capuz, fazendo um X com as mãos'),
  arte('p6-cadeira', 'Brunin Tks sentado numa cadeira de diretor'),
  foto('22', 'Brunin Tks de pé, de moletom'),
  arte('p2-maos', 'Brunin Tks com as mãos na cabeça, tatuagens à mostra'),
  foto('43', 'Brunin Tks de costas, jaqueta Cyclone'),
  arte('p3-costas', 'Brunin Tks de costas com os nomes das festas'),
  foto('29', 'Brunin Tks sentado, de óculos vermelhos'),
  arte('p7-dreads', 'Figura de dreads sobre chamas vermelhas'),
  foto('39', 'Brunin Tks de corpo inteiro, camisa estampada'),
  arte('p5-figura', 'Brunin Tks de pé com a mão no rosto'),
  foto('32', 'Brunin Tks de costas, mãos no capuz'),
];
