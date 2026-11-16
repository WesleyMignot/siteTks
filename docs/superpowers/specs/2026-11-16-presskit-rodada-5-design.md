# Press kit Brunin Tks — Rodada 5 (design)

**Data:** 2026-11-16
**Status:** o Wesley escolheu as opções no protótipo: Sets A, Line-up A (com a Nanda Tsunami no grupo de destaque) e Agenda B. Ele também escolheu a agenda automática pelo Ayon "por hora". Como o robô publica foi proposto na conversa e aceito sem objeção.
**Base:** o site no ar (GitHub Pages, `main` 20fb95c). Tudo que esta spec não muda continua valendo: movimento reduzido, modo estático, sem JS, acessibilidade e as viradas de morcegos.
**Referência visual aprovada:** `docs/identidade/rodada-5.html` (Sets A, Line-up A, Agenda B). O protótipo lê trechos em `bruto/prototipo-r5/`, que não vai para o git, então só funciona na máquina que os gerou.

## 1. Intenção

O site foi publicado e compartilhado com amigos. O Wesley viu no celular e pediu três coisas:

1. **Sets no celular.** O vídeo horizontal é ampliado até cobrir a tela em pé, e só aparece a faixa do meio, com uns 22% da largura. No Senso aparece a parede e o ombro do Bruno, e a imagem fica borrada, porque são uns 210 px de origem esticados. Ele quer ver o Bruno tocando.
2. **"Já dividiu line com".** A seção "não tem o devido peso". Os nomes grandes com quem ele tocou são prova para quem contrata, e hoje parecem só um bloco de texto.
3. **Agenda.** Uma seção com os próximos shows e o link do ingresso, como a página do Bruno no Ayon. Quem atualiza é o próprio Ayon, que o Bruno já mantém, e ninguém mexe no site para isso. É uma solução "por hora": depois o Wesley quer algo mais independente.

**Sucesso:**
- No celular em pé, cada set mostra o Bruno, nítido.
- O line-up parece um cartaz de festival em que ele está escalado.
- A agenda fica sempre certa sem que ninguém edite o site.

## 2. Objetivos, não objetivos e anti-objetivos

**Objetivos:** os três pedidos acima, com as opções escolhidas.

**Não objetivos:**
- mudar os Sets no computador ou no celular deitado;
- trocar trechos de vídeo, exceto para enquadrar;
- agenda editada à mão;
- mostrar shows passados;
- avatares do line-up dos eventos;
- independência do Ayon (fica para depois).

**Anti-objetivos.** Seria um fracasso mesmo funcionando:
- a agenda mostrar um show que já passou;
- uma falha do Ayon apagar ou quebrar a agenda que estava certa;
- uma marca de canal ou logo de transmissão aparecer no recorte do celular;
- um nome do cartaz quebrar no meio, ou um morcego abrir a linha;
- o computador baixar as versões de celular;
- o robô publicar algo errado sem avisar.

## 3. Restrições

- **Hospedagem:** site estático no GitHub Pages, publicado da `main`, na raiz, com `.nojekyll`. Os caminhos são relativos, porque o site mora em `/siteTks/`.
- **Ayon:** não manda cabeçalho CORS e responde `X-Frame-Options: SAMEORIGIN`. O navegador não lê nem embute a página; os dados só vêm por fora, pelo robô. O `robots.txt` permite as páginas públicas.
  - O robô lê só o perfil do Bruno e as páginas dos eventos dele.
  - O User-Agent identifica o site e não leva e-mail.
- **Testes:** `node --test`, unitários e e2e com puppeteer-core, e2e com `--test-concurrency=1`.
- **Dependências:** nada novo no navegador. No Node, pode entrar uma dependência de desenvolvimento para reduzir imagens (ver §7.7).

## 4. Abordagens

### Sets no celular
| Opção | Como | Troca |
|---|---|---|
| **A · enquadrado no Bruno (escolhida)** | Uma versão vertical de cada vídeo horizontal, recortada em cima dele, a partir do original em 1080p | Mantém a tela cheia e fica nítida. Custa 6 vídeos a mais, baixados só no celular. |
| B · vídeo inteiro | Vídeo inteiro na largura, com uma cópia desfocada no fundo | Fica fiel e nítido, mas o vídeo vira uma faixa pequena. |
| Descartada | Só `object-position` nos clipes atuais | Enquadra, mas continua borrado. |

### Line-up
| Opção | Troca |
|---|---|
| **A · cartaz de festival (escolhida)** | Peso por parecer um objeto real, o flyer. Lê tudo de uma vez. |
| B · letreiro | Muito movimento. Os nomes passam e não ficam. |
| C · um por vez | Muito foco, mas a rolagem fica longa (20 nomes). |

### Agenda: de onde vêm os dados
| Opção | Troca |
|---|---|
| **A · automática pelo Ayon (escolhida, "por hora")** | Zero trabalho, mas depende do formato do Ayon. |
| B · lista à mão | Independente, mas é trabalho repetido e corre o risco de ficar velha. |
| C · só um botão para o Ayon | Sempre certa, mas a agenda não aparece no site. |

### Agenda: formato
**B · flyers (escolhido)** contra A · lista de turnê.

### Agenda: como o robô publica (decisão minha, apresentada ao Wesley)
- **Escolhida:** o robô grava a agenda no `index.html` e os flyers em `assets/agenda/`.
  - Ele só faz commit na `main` quando algo muda, e então pede a publicação ao Pages pela API.
  - O Pages continua como está.
  - O histórico da agenda fica no git.
  - Os commits do robô mantêm vivo o agendamento: o GitHub pausa agendamentos depois de 60 dias sem atividade.
- **Alternativa:** publicar o Pages por um workflow que monta a agenda na hora, sem commits.
  - Exigiria trocar a configuração do Pages.
  - Cada publicação dependeria do Ayon estar no ar.
  - Sem commits, o agendamento pausaria depois de 60 dias sem atividade humana.

## 5. Sets no celular (opção A)

### 5.1 Quais
Os 6 sets horizontais: `senso`, `grau`, `ataque`, `veneno-lab`, `sensi` e `reel-c`. `reel-a` e `reel-b` já são verticais e não mudam.

O Wesley conferiu os enquadramentos no protótipo e só apontou o Ataque. O trecho do Grau continua. Leitura minha: ele não confirmou se quem toca ali é o Bruno, mas aprovou o enquadramento.

### 5.2 Versões de celular
Arquivos: `assets/video/sets/<nome>-cel.mp4` e `<nome>-cel.jpg`.

**Vídeo:**
- 9:16, 540 × 960, 24 fps, sem áudio, `+faststart`;
- mesmo trecho (início e duração) do vídeo atual do set.

**Fonte:**
- YouTube: o original em **1080p**. `tools/baixar-sets.sh` passa a baixar até 1080p em `bruto/sets/`.
- `reel-c`: o reel `DG_97MaOjeD`, que tem 720 × 1280 e foi gravado deitado. Ele é endireitado (`transpose=2`), como hoje, e é a única fonte em 720.

**Recorte:**
- Altura: do `topo` até o pé do quadro.
- Largura: altura × 9/16.
- Centro horizontal: no **foco**, uma fração da largura do quadro original, preso dentro do quadro.

| set | foco | topo |
|---|---|---|
| senso | 0,25 | 0 |
| grau | 0,47 | 0 |
| ataque | 0,86 | 0,14 (tira o letreiro "Boiler Baile · Ataque Sonoro" do canto superior direito) |
| veneno-lab | 0,50 | 0 |
| sensi | 0,84 | 0 |
| reel-c | 0,50 | 0 |

**Marcas:**
- Nenhuma marca de canal fica visível na versão do celular. O recorte de 76% do computador existe para isso.
- O construtor confere cada versão por uma folha de quadros e ajusta o `topo` se aparecer alguma marca. Uma marca escondida pela sombra escura de baixo, que cobre os 40% inferiores, não conta.

**Pôster:** o quadro em início + 0,6 s, com o mesmo recorte.

**Orçamento:** vídeo ≤ 700 KB; pôster ≤ 120 KB.

**Ferramenta:** `tools/baixar-sets.sh` e `tools/baixar-reels.sh` ganham as colunas `foco` e `topo`, e o `cortar` gera as versões `-cel`.

### 5.3 Escolha no site
- **Cada `<video class="set__video">` dos 6 sets** ganha `data-src-cel` e `data-poster-cel`.
- **Em retrato** (`matchMedia('(orientation: portrait)')`), o vídeo usa a versão `-cel`: o `data-src` efetivo e o `poster` passam a ser os `-cel`. Em paisagem, usa os atuais.
- **Escolha antes do carregamento:** ela acontece antes do primeiro carregamento (`tocar()` lê `data-src`) e roda também com movimento reduzido. No modo reduzido, os sets mostram só o pôster, que então também é o `-cel`.
- **Ao girar o aparelho,** os vídeos dos sets trocam de versão. Os que já tinham `src` recarregam a outra versão e continuam tocando se estavam tocando, e o pôster acompanha.
- **O computador e o celular deitado** nunca baixam as versões `-cel` (`preload="none"` + `data-src`).
- **Sem JS,** o pôster continua o horizontal de hoje. Aceito, porque é um caso raro.
- **Geometria do vídeo:** continua igual (`inset -8%`, altura 116%, `object-fit: cover`, paralaxe `yPercent -15`). Como a versão `-cel` já vem enquadrada, ela usa o centro.

## 6. Line-up: cartaz (opção A)

### 6.1 Conteúdo (de cima para baixo)
1. **Cabeçalho do cartaz:** "Brunin Tks já dividiu o line com". "Brunin Tks" fica em vermelho.
2. **Nível 1** (gótica, o maior): KL Jay, Rincon Sapiência.
3. **Nível 2** (gótica): Pocah, Raffa Moreira, MC Binn, MC Felipinho, Wesley Gonzaga, **Nanda Tsunami**. Ela vem do underground, a pedido do Wesley.
4. **Nível 3** (mono, caixa alta, 12 nomes): DJ Patife, Caio Prince, Bonekinha Iraquiana, Ramon Sucesso, Young Clubber, Carlos do Complexo, Idlibra, Dayeh, Bassan, Kenan e Kel, DJ Lorrany, Brum.
5. **Rodapé:** "Palcos, festas e rádios" seguido de Onze Bar · Senso Radio · Trinka · Lóbulo · Function · Guilda · Veneno · Relativa (Madri).
6. **Selo** redondo vermelho "3× Planeta Atlântida", no canto superior direito, saindo para fora do cartaz.

**O que sai e o que fica:**
- A lista de pílulas `.lineup__palcos` sai: o conteúdo dela foi para o rodapé do cartaz e para o selo.
- O topo da seção fica como está: "Nº 004 — Line-up", o título, a introdução e o fundo vermelho.

### 6.2 Visual
- **Cartaz:** preto (`--preto`) com grão, texto creme e sombra. A inclinação final é −2°.
- **Largura:** `min(1080px, 100% − 2·gutter)` no computador; perto de 92% da largura no celular.
- **Tamanhos:** os do protótipo.
  - Computador: nível 1 em 104 px, nível 2 em 64 px, nível 3 em 15 px.
  - Celular: 46 / 29 / 10,5 px.
  - Use `clamp` entre esses extremos.
- **Separadores:** os morcegos que batem as asas (`.div-morcego` de hoje), em vermelho.
  - Cada nome fica preso ao morcego seguinte (`nowrap`, como o `.cartaz__par`): um nome nunca quebra no meio e um morcego nunca abre uma linha.
  - Os níveis 1 e 2 usam `text-wrap: balance`.

### 6.3 Animação (modo animado)
- **Rolagem:** o cartaz acompanha a rolagem (scrub). Ele sobe de `translateY(75%) rotate(−8°)` até `0` e `−2°`.
- **Carimbos:** depois os níveis "carimbam" em sequência, com escala 1,25 → 1 e opacidade 0 → 1, nesta ordem: nível 1, nível 2, nível 3, rodapé.
- **Selo:** carimba por último, com escala 2,2 → 1 e giro −30° → +12°.
- **Ponto de leitura:** o cartaz está no estado final, todo legível, quando o centro dele chega ao meio da tela. Os pontos exatos de início e de fim ficam com o construtor.
- **Animação antiga:** sai a `anima-cartaz`, em que os nomes acendiam de 0,18 para 1.
- **Movimento reduzido, modo estático e sem JS:** o cartaz já aparece no estado final.

### 6.4 Acessibilidade
- O leitor de tela ouve os nomes separados, com as vírgulas visualmente ocultas de hoje. Os morcegos ficam `aria-hidden`.
- O selo tem texto acessível: "3 edições do Planeta Atlântida".

## 7. Agenda (opção B · flyers)

### 7.1 Lugar
- **Seção nova `#agenda`,** entre `#lineup` e `#assinatura`.
- **Texto:** rótulo "Nº 005 — Agenda" e título "Próximos shows" (`h2`).
- **Visual:** fundo preto, no tema escuro, com `chamas-topo` como as outras seções.
- **Menu:** ganha "Nº 005 Agenda". O Contrate passa a "Nº 006", no menu e no `.contrate__num`.

### 7.2 Cartões
Cada evento é um `article` com:
- **Flyer** (proporção 1200:630, `cover`), com `alt` "Flyer de <nome>".
- **Selo vermelho** no canto, com dia e mês.
- **Linha de detalhes:** "<dia da semana> · <hora> · <local>", por exemplo "sáb · 19:00 · Céu zona sul".
- **Nome do evento** (`h3`, gótica), exatamente como vem do Ayon.
- **Line-up:** "com A, B, C +N", com até 3 nomes.
- **Botão "Ingressos ↗"** para o link do ingresso. Sem link de ingresso, "Ver evento ↗" para a página do evento no Ayon. Os links abrem em nova aba, com `rel="noopener"`.

**Regras gerais:**
- **Rodapé da seção:** "Agenda completa no Ayon ↗", para `https://useayon.com/djbrunintks`.
- **Fuso:** data e hora sempre no fuso `America/Sao_Paulo`, em pt-BR.
- **Quantidade:** no máximo 6 eventos, do mais próximo para o mais distante.
- **Layout:** no computador, uma grade de 3 colunas. No celular, um carrossel horizontal com encaixe (`scroll-snap`), com cartões de uns 300 px e o próximo aparecendo na borda. A página nunca ganha rolagem horizontal.

### 7.3 Sem datas
Aparece "Agenda aberta" (gótica, vermelho) com o texto "Nenhuma data anunciada agora. Quer o Brunin Tks no seu line?". Depois vêm o botão "Contrate ↓", que leva a `#contrate`, e o rodapé do Ayon.

### 7.4 Shows que já passaram
- Cada cartão leva `data-fim`, em ISO: o `endDate`, ou o início + 6 h se não houver `endDate`.
- Ao carregar a página, o JS esconde os cartões com fim anterior ao momento atual. Se todos sumirem, mostra o estado "Agenda aberta".
- Sem JS, o robô mantém a agenda em dia, com no máximo 6 h de atraso.

### 7.5 Line-up do evento
São os `performer[].name` do Ayon, na ordem do Ayon, sem o próprio Bruno:
- tira "Brunin TKS" (em qualquer caixa);
- se sobrar "b2b X", vira "X (b2b)";
- se não sobrar nada, o nome sai;
- tira o que vem depois de " — " (o papel no line, como "— Warm-up").

### 7.6 Dados do Ayon
- **Perfil:** `https://useayon.com/djbrunintks`. O `<script type="application/ld+json">` traz um `@graph` com um `Person`, cujo `@id` termina em `#profile`, e os próximos eventos como nós `Event`. Cada `Event` tem `name`, `startDate`, `endDate`, `location.name`, `location.address.addressLocality`, `image[0]` e `url`.
- **Página de cada evento** (`url`): o JSON-LD do `Event` traz `offers.url` (o ingresso) e `performer[]` (o line-up).
- **Filtro:** só entram eventos com fim ≥ agora, ordenados por `startDate`.

### 7.7 Robô
**`tools/agenda.mjs`** (Node, sem navegador; também roda local com `node tools/agenda.mjs`):
- **Lê:** o perfil e as páginas dos eventos.
- **Flyers:** reduz cada flyer para `assets/agenda/<slug>.jpg`, com 640 px de largura e ≤ 120 KB. A ferramenta de redução fica com o construtor (sugestão: `sharp`, como dependência de desenvolvimento). Os flyers que saíram da agenda são apagados.
- **Página:** reescreve o bloco entre `<!-- agenda:inicio -->` e `<!-- agenda:fim -->` no `index.html`.

**Falhas:**
- **Erro sem mexer em nada:** o perfil não responde 200; ou não tem o JSON-LD com o `Person` do perfil; ou algum `Event` não tem `name`, `startDate` válido ou `url`. Nesses casos o robô sai com erro e a agenda no ar continua a mesma.
- **Página de um evento falha:** o cartão sai assim mesmo, com o link do Ayon e sem line-up.
- **Flyer falha:** o cartão usa um fundo neutro com o logo. O desenho fica com o construtor.

**`.github/workflows/agenda.yml`:**
- **Quando roda:** a cada 6 h, num minuto fora da hora cheia, e também por um botão manual (`workflow_dispatch`). Um `concurrency` impede duas execuções ao mesmo tempo.
- **Passos:** `actions/checkout`, Node LTS, `npm ci` e `node tools/agenda.mjs`.
- **Se o git mostrar mudança:**
  1. commit "agenda: atualiza pelo Ayon", feito como `github-actions[bot]`;
  2. push na `main`;
  3. pedido de publicação ao Pages: `POST /repos/{owner}/{repo}/pages/builds`, com o token do workflow.
- **Permissões:** `contents: write`, `pages: write`.
- **User-Agent:** `siteTks-agenda (+https://wesleymignot.github.io/siteTks/)`. São 1 + N pedidos por execução.

**Primeira carga:** o bloco inicial do `index.html` é gerado rodando o robô local na implementação, com os eventos reais.

### 7.8 Trabalho local
Depois que o robô roda, a `main` do GitHub fica à frente da local. Antes de começar uma branch, `git pull`. O README explica.

## 8. Documentação
O README cobre:
- **Sets:** as versões `-cel`.
- **Cartaz:** como ficou o line-up.
- **Agenda:** como funciona; como rodar o robô à mão (local e pelo botão no GitHub); o que fazer quando ele falha; como reativar o agendamento pausado.

## 9. Testes

### Unitários
**Robô:**
- O parser lê fixtures salvas do Ayon (só os blocos JSON-LD do perfil e de 3 eventos, em `tests/fixtures/ayon/`).
- Filtragem de eventos futuros (incluindo um que está acontecendo agora), ordenação e limite de 6.
- Datas no fuso de São Paulo.
- Line-up: tira o Bruno, trata o b2b, tira o papel depois de " — ".
- Ingresso sem link cai na página do Ayon.
- Gera os cartões e o estado vazio.
- Dá erro quando o formato muda, por exemplo sem `Person` ou sem `startDate`.

**`index.html`:**
- O bloco da agenda está entre os marcadores.
- O cartaz tem os níveis com os nomes certos.
- O menu tem Agenda Nº 005 e Contrate Nº 006.

**Assets:**
- As 6 versões `-cel` existem e cabem no orçamento.
- Os flyers da agenda cabem em ≤ 120 KB.

### E2E
**Sets:**
- No celular em pé, o set carrega o `-cel` (src e pôster).
- No computador e no celular deitado, carrega o atual.
- Girar troca a versão.
- Com movimento reduzido no celular, o pôster é o `-cel`.

**Cartaz:**
- Estado final legível no ponto de leitura.
- Nenhum nome quebrado e nenhuma linha começando por morcego, em 1440, 390 e 320 px.
- Com movimento reduzido, o cartaz fica parado.
- O leitor de tela ouve os nomes separados.

**Agenda:**
- Os cartões aparecem.
- Um show passado some, com o relógio simulado.
- Com todos passados, aparece "Agenda aberta".
- No celular, o carrossel não cria rolagem horizontal na página.

## 10. O que fica para o construtor
- Os pontos exatos de início e fim e os easings do cartaz, respeitando §6.3.
- O `topo` de cada recorte (só o do Ataque é conhecido) e a conferência visual pela folha de quadros.
- A ferramenta de redução dos flyers e o fundo neutro do cartão sem flyer.
- A estrutura interna do `tools/agenda.mjs`, separando funções puras (testáveis) da rede e do disco.

## 11. Riscos e fora do escopo
- **Mudança no Ayon:** se o formato mudar, o robô falha de forma visível (e-mail do GitHub) e a agenda fica parada na última versão boa.
- **Agendamento pausado:** o GitHub pausa agendamentos depois de 60 dias sem atividade. Os commits do robô contam, mas meses sem nenhum show novo podem pausar. Reativa com um clique, e o README explica.
- **Peso no git:** os flyers aumentam o histórico em uns 100 KB por evento.
- **Termos do Ayon:** o robô lê só dados públicos estruturados do próprio artista. Se o Ayon objetar, troca-se pela lista própria, que é a solução independente que o Wesley quer depois.
- **Minors adiados das rodadas anteriores:** continuam adiados.
