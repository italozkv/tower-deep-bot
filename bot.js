const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ]
});

// ─────────────────────────────────────────────────────────────
//  CONFIGURAÇÕES — adicione no Railway como variáveis de ambiente
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  DISCORD_TOKEN:    process.env.DISCORD_TOKEN,
  GITHUB_TOKEN:     process.env.GITHUB_TOKEN,
  GIST_ID:          process.env.GIST_ID,
  CANAL_UPDATE_ID:  process.env.CANAL_ID,          // canal de comandos (!update)
  CANAL_ANUNCIO_ID: process.env.CANAL_ANUNCIO_ID,  // canal #anuncios
  CANAL_BUGS_ID:    process.env.CANAL_BUGS_ID,      // canal #bugs
  OPENAI_KEY:       process.env.OPENAI_KEY,         // chave da API OpenAI (ChatGPT)
};
// ─────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════
//  CONHECIMENTO DO JOGO
//  Edite esta seção para ensinar a IA sobre o Tower Deep.
//  Quanto mais detalhes, melhores as respostas.
// ══════════════════════════════════════════════════════════════
const CONHECIMENTO_DO_JOGO = `
Você é o ORÁCULO, a IA oficial do Tower Deep — um jogo Tower Defense no Roblox com tema de deuses gregos.
Seu papel: responder dúvidas dos jogadores, analisar sugestões e ajudar no suporte técnico.

PERSONALIDADE:
- Tom épico, sábio e levemente misterioso, como um oráculo grego
- Seja sempre claro e útil, mesmo usando linguagem temática
- Respostas curtas e diretas — máximo 4 parágrafos
- Nunca invente informações sobre o jogo

SOBRE O JOGO:
- Gênero: Tower Defense no Roblox
- Tema: Deuses gregos (Zeus, Poseidon, Ares, Hades, Artemis...)
- Versão atual: Alpha v0.3.0

TORRES DISPONÍVEIS:
- Torre de Zeus: Raios em inimigos aleatórios. Habilidade: Tempestade do Olimpo
- Torre de Poseidon: Congela e causa dano em área. Habilidade: Tsunami Eterno
- Torre de Ares: Chamas sagradas em área. Habilidade: Fúria do Olimpo (destrói tudo na tela, cooldown 3 ondas)
- Torre de Hades: Em desenvolvimento (v0.4.0)
- Torre de Artemis: Em desenvolvimento (v0.5.0)

INIMIGOS:
- Guardiões de Tártaro: imunes a fogo, vulneráveis a gelo
- Sereias Corrompidas: desativam torres temporariamente
- Almas Errantes: rápidos e numerosos
- Cerontes: tanques com muita vida

MAPAS:
- Portal dos Deuses: 20 ondas, mapa inicial
- Ruínas do Olimpo: 25 ondas, com obstáculos
- Portões do Érebo: em desenvolvimento (v0.4.0)

MECÂNICAS:
- Bênçãos Divinas: buffs escolhidos entre as ondas
- Sistema de moedas e upgrades de torres
- Habilidades divinas com cooldown por ondas

PRÓXIMAS ATUALIZAÇÕES:
- v0.4.0 (Abr 2026): Torre de Hades, Mapa Portões do Érebo, sistema de recordes
- v0.5.0 (Mai-Jun 2026): Torre de Artemis, missões diárias, modo caçada

BUGS CONHECIDOS E SOLUÇÕES:
- "Torre de Poseidon não ataca voadores": corrigido na v0.2.5, atualize o jogo
- "Lag no mapa": reduza qualidade gráfica nas configurações do Roblox
- "Não consigo comprar upgrade": precisa de mais moedas (dropdas pelos inimigos)
- "Crash na cutscene de vitória": corrigido na v0.2.5

REGRAS DO SERVIDOR:
- Respeito entre todos os membros
- Bugs no canal #bugs, sugestões no #sugestões
- Sem spam ou conteúdo impróprio
`;
// ══════════════════════════════════════════════════════════════

// Histórico de conversa por usuário (memória de curto prazo)
const historicos = new Map();
const MAX_HISTORICO = 10; // Últimas 10 mensagens por usuário

// Sessões do formulário de update
const sessoes = new Map();

// ─────────────────────────────────────────────────────────────
//  SISTEMA DE XP — Nível 1 a 10 com nomes de deuses gregos
// ─────────────────────────────────────────────────────────────
const xpData = new Map(); // userId -> { xp, nivel, lastMsg }

const NIVEIS = [
  { nivel: 1,  nome: 'Mortal Comum',    xpMin: 0    },
  { nivel: 2,  nome: 'Mensageiro de Hermes', xpMin: 50  },
  { nivel: 3,  nome: 'Guardião de Atena',    xpMin: 150 },
  { nivel: 4,  nome: 'Guerreiro de Ares',    xpMin: 300 },
  { nivel: 5,  nome: 'Navegante de Poseidon',xpMin: 500 },
  { nivel: 6,  nome: 'Arauto de Zeus',       xpMin: 750 },
  { nivel: 7,  nome: 'Campeão de Apolo',     xpMin: 1050},
  { nivel: 8,  nome: 'Semideus do Olimpo',   xpMin: 1400},
  { nivel: 9,  nome: 'Herói Imortal',        xpMin: 1800},
  { nivel: 10, nome: 'Divindade do Olimpo',  xpMin: 2300},
];

function getNivel(xp) {
  let atual = NIVEIS[0];
  for (const n of NIVEIS) { if (xp >= n.xpMin) atual = n; }
  return atual;
}

function getProximoNivel(xp) {
  for (const n of NIVEIS) { if (xp < n.xpMin) return n; }
  return null;
}

function ganharXP(userId) {
  const agora = Date.now();
  if (!xpData.has(userId)) xpData.set(userId, { xp: 0, nivel: 1, lastMsg: 0 });
  const dados = xpData.get(userId);
  if (agora - dados.lastMsg < 30000) return null; // cooldown 30s
  const ganho = Math.floor(Math.random() * 6) + 5; // 5-10 XP por msg
  const nivelAntes = getNivel(dados.xp);
  dados.xp += ganho;
  dados.lastMsg = agora;
  const nivelDepois = getNivel(dados.xp);
  if (nivelDepois.nivel > nivelAntes.nivel) return { subiu: true, nivel: nivelDepois };
  return { subiu: false };
}

// ─────────────────────────────────────────────────────────────
//  SESSÕES DO FORMULÁRIO DE BUG E SUGESTÃO
// ─────────────────────────────────────────────────────────────
const sessoesBug = new Map();
const sessoesSugestao = new Map();

// Tags de update
const TAGS = {
  '1': { key: 'novo',    label: '🟢 Novo'    },
  '2': { key: 'fix',     label: '🔵 Fix'     },
  '3': { key: 'balance', label: '🟠 Balance' },
  '4': { key: 'evento',  label: '🩷 Evento'  },
  '5': { key: 'divino',  label: '✨ Divino'  },
};

// ─────────────────────────────────────────────────────────────
//  OPENAI API (ChatGPT)
// ─────────────────────────────────────────────────────────────
function chamarClaude(mensagens, promptExtra = '') {
  return new Promise((resolve, reject) => {
    const sistema = CONHECIMENTO_DO_JOGO + (promptExtra ? '\n\n' + promptExtra : '');

    // OpenAI espera o system como primeira mensagem com role "system"
    const mensagensComSistema = [
      { role: 'system', content: sistema },
      ...mensagens,
    ];

    const body = JSON.stringify({
      model: 'gpt-4o-mini', // rápido, barato e poderoso — ideal para bot
      max_tokens: 500,
      messages: mensagensComSistema,
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.OPENAI_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const texto = json.choices?.[0]?.message?.content;
          if (texto) resolve(texto);
          else reject(new Error('Resposta inválida: ' + data));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────
//  DETECTAR INTENÇÃO DA MENSAGEM
// ─────────────────────────────────────────────────────────────
function detectarIntencao(texto) {
  const t = texto.toLowerCase();

  const ehSugestao = ['sugest', 'ideia', 'deveria ter', 'podia ter', 'seria legal',
    'que tal', 'por que não', 'adicionem', 'coloquem'].some(p => t.includes(p));

  const ehSuporte = ['bug', 'erro', 'não funciona', 'nao funciona', 'travou',
    'crash', 'problema', 'não consigo', 'nao consigo', 'como faço',
    'como faz', 'como funciona', 'não abre', 'nao abre'].some(p => t.includes(p));

  if (ehSugestao) return 'sugestao';
  if (ehSuporte)  return 'suporte';
  return 'pergunta';
}

// ─────────────────────────────────────────────────────────────
//  RESPONDER COM IA
// ─────────────────────────────────────────────────────────────
async function responderComIA(message, pergunta) {
  const userId = message.author.id;
  const intencao = detectarIntencao(pergunta);

  // Histórico do usuário
  if (!historicos.has(userId)) historicos.set(userId, []);
  const historico = historicos.get(userId);

  // Prompt adicional por intenção
  const promptsExtras = {
    sugestao: `O jogador está fazendo uma SUGESTÃO.
Analise com sabedoria:
1. Diga se é viável para um Tower Defense
2. Aponte pontos positivos
3. Mencione possíveis desafios
4. Dê uma nota de viabilidade: ★☆☆☆☆ a ★★★★★
5. Sugira como melhorar a ideia
Seja construtivo e entusiasmado.`,

    suporte: `O jogador está com um PROBLEMA ou DÚVIDA TÉCNICA.
Responda de forma direta:
1. Identifique o problema
2. Ofereça a solução mais provável
3. Se não souber, peça mais detalhes ou oriente a aguardar um moderador
Seja eficiente — jogadores com problema querem solução rápida.`,

    pergunta: `O jogador está fazendo uma PERGUNTA GERAL sobre o jogo.
Responda de forma completa mas concisa.
Se a resposta não estiver no seu conhecimento, diga honestamente que não sabe.`,
  };

  // Adiciona ao histórico
  historico.push({ role: 'user', content: pergunta });
  if (historico.length > MAX_HISTORICO) historico.splice(0, historico.length - MAX_HISTORICO);

  // Mostra que está digitando
  await message.channel.sendTyping();

  try {
    const resposta = await chamarClaude([...historico], promptsExtras[intencao]);

    // Salva resposta no histórico
    historico.push({ role: 'assistant', content: resposta });

    // Prefixo visual por intenção
    const prefixos = {
      sugestao: '🔮 **Análise do Oráculo:**\n\n',
      suporte:  '⚡ **O Oráculo responde:**\n\n',
      pergunta: '✨ **O Oráculo fala:**\n\n',
    };

    const mensagemFinal = prefixos[intencao] + resposta;

    // Discord tem limite de 2000 chars
    if (mensagemFinal.length <= 2000) {
      await message.reply(mensagemFinal);
    } else {
      await message.reply(prefixos[intencao] + resposta.substring(0, 1900) + '\n*...(continua)*');
    }

  } catch (err) {
    console.error('Erro na IA:', err.message);
    await message.reply('⚠️ Os ventos do Olimpo perturbaram a visão do Oráculo. Tente novamente em instantes.');
  }
}

// ─────────────────────────────────────────────────────────────
//  GIST (changelog)
// ─────────────────────────────────────────────────────────────
function lerGist() {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.github.com',
      path: `/gists/${CONFIG.GIST_ID}`,
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(JSON.parse(data).files ? Object.values(JSON.parse(data).files)[0].content : '{}')); }
        catch { resolve({ updates: [] }); }
      });
    }).on('error', reject);
  });
}

function salvarGist(dados) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ files: { 'tower-deep-updates.json': { content: JSON.stringify(dados, null, 2) } } });
    const req = https.request({
      hostname: 'api.github.com', path: `/gists/${CONFIG.GIST_ID}`, method: 'PATCH',
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
}

// ─────────────────────────────────────────────────────────────
//  FORMULÁRIO DE UPDATE
// ─────────────────────────────────────────────────────────────
async function iniciarFormulario(message) {
  const userId = message.author.id;
  if (sessoes.has(userId)) return message.reply('⚠️ *Mortal, um decreto já está sendo redigido! Proclama `cancelar` para encerrar o ritual atual antes de iniciar outro.*');
  sessoes.set(userId, { etapa: 'versao', dados: {} });
  await message.reply('⚡ **OS DEUSES CONVOCAM UM NOVO DECRETO**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Os pergaminhos do Olimpo aguardam suas palavras...*\n\nDigite `cancelar` a qualquer momento para silenciar os deuses.\n\n**— Pergaminho I de VI — A Versão —**\nQual selo carregará este decreto? *(ex: v0.4.0)*');
}

async function processarEtapa(message) {
  const userId = message.author.id;
  const sessao = sessoes.get(userId);
  if (!sessao) return;
  const texto = message.content.trim();
  if (texto.toLowerCase() === 'cancelar') { sessoes.delete(userId); return message.reply('🌑 *Os pergaminhos foram lançados às chamas... O decreto foi esquecido pelos deuses.*'); }
  const { etapa, dados } = sessao;

  if (etapa === 'versao') { dados.versao = texto.startsWith('v') ? texto : `v${texto}`; sessao.etapa = 'titulo'; return message.reply('⚡ *O selo foi gravado nos pergaminhos.*\n\n**— Pergaminho II de VI — O Título —**\nCom que nome os mortais conhecerão este decreto?'); }
  if (etapa === 'titulo') { dados.titulo = texto; sessao.etapa = 'subtitulo'; return message.reply('⚡ *O título ecoa pelos salões do Olimpo.*\n\n**— Pergaminho III de VI — A Profecia —**\nUma frase sábia para acompanhar o decreto... *(ou `pular`)*'); }
  if (etapa === 'subtitulo') { dados.subtitulo = texto.toLowerCase() === 'pular' ? '' : texto; sessao.etapa = 'tags'; const lista = Object.entries(TAGS).map(([n, t]) => `**${n}** — ${t.label}`).join('\n'); return message.reply('⚡ *As palavras foram inscritas.*\n\n**— Pergaminho IV de VI — Os Estandartes —**\nQuais símbolos divinos carregarão este decreto? *(ex: 1,3)*\n\n' + lista); }
  if (etapa === 'tags') { dados.tags = texto.split(',').map(s => s.trim()).filter(n => TAGS[n]).map(n => TAGS[n].key); if (!dados.tags.length) dados.tags = ['novo']; sessao.etapa = 'mudancas'; dados.mudancas = []; return message.reply('⚡ *Os estandartes foram hasteados.*\n\n**— Pergaminho V de VI — As Obras dos Deuses —**\nRelate cada mudança, uma por mensagem.\nQuando terminar, proclame: `pronto`'); }
  if (etapa === 'mudancas') {
    if (texto.toLowerCase() === 'pronto') { if (!dados.mudancas.length) return message.reply('⚠️ *Os deuses exigem ao menos uma obra registrada, mortal.*'); sessao.etapa = 'proximo'; return message.reply(`⚡ *${dados.mudancas.length} obra(s) registrada(s) nos pergaminhos eternos.*\n\n**— Pergaminho VI de VI — O Horizonte —**\nHá visões do próximo decreto? *(ou \`pular\`)*`); }
    dados.mudancas.push(texto); return message.react('✅');
  }
  if (etapa === 'proximo') {
    dados.proximo = texto.toLowerCase() === 'pular' ? null : texto; sessao.etapa = 'confirmacao';
    const tagLabels = dados.tags.map(t => Object.values(TAGS).find(x => x.key === t)?.label || t).join(', ');
    return message.reply(`🔱 **O DECRETO ESTÁ PRONTO PARA SER PROCLAMADO**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚔️ **Versão:** ${dados.versao}\n📖 **Título:** ${dados.titulo}\n🌟 **Profecia:** ${dados.subtitulo || '*(silêncio dos deuses)*'}\n🏛️ **Estandartes:** ${tagLabels}\n📜 **Obras:** ${dados.mudancas.length} registrada(s)\n🔮 **Horizonte:** ${dados.proximo || '*(os oráculos silenciam)*'}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Proclame* **\`confirmar\`** *para gravar nos anais eternos, ou* **\`cancelar\`** *para retornar ao silêncio.*`);
  }
  if (etapa === 'confirmacao') {
    if (texto.toLowerCase() !== 'confirmar') { sessoes.delete(userId); return message.reply('🌑 *Que assim seja... O decreto retorna ao silêncio eterno. Os pergaminhos aguardam nova convocação.*'); return; }
    await message.reply('⚡ *Os trovões de Zeus ressoam... O decreto está sendo gravado nos anais eternos do Olimpo...*');
    try {
      const dadosAtuais = await lerGist();
      const mes = new Date().toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      dadosAtuais.updates = dadosAtuais.updates || [];
      dadosAtuais.updates.unshift({ id: Date.now(), versao: dados.versao, titulo: dados.titulo, subtitulo: dados.subtitulo, tags: dados.tags, mudancas: dados.mudancas, data: mes });
      if (dados.proximo) dadosAtuais.proximaUpdate = dados.proximo;
      await salvarGist(dadosAtuais);
      sessoes.delete(userId);
      await message.reply(`🔱 **DECRETO PROCLAMADO!**\n*Os deuses selaram* **${dados.versao} — ${dados.titulo}** *nos pergaminhos eternos. Os mortais já podem contemplar.*`);

      // ── Anúncio automático no canal #anúncios ──────────────
      if (CONFIG.CANAL_ANUNCIO_ID) {
        try {
          const canalAnuncio = await client.channels.fetch(CONFIG.CANAL_ANUNCIO_ID);
          const tagLabels = dados.tags.map(t => Object.values(TAGS).find(x => x.key === t)?.label || t).join(' ');
          const mudancasTexto = dados.mudancas.map(m => '> ' + m).join('\n');
          const linhas = [
            '@everyone',
            '',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '⚡ **DECRETO DIVINO PROCLAMADO** ⚡',
            '**' + dados.versao + ' — ' + dados.titulo + '**',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            dados.subtitulo ? ('*"' + dados.subtitulo + '"*') : '',
            '',
            tagLabels,
            '',
            '📜 **Obras dos Deuses:**',
            mudancasTexto,
            dados.proximo ? ('🔮 **Próxima update:** ' + dados.proximo) : '',
            '',
            '',
            '🌐 **Pergaminhos Eternos:** https://italozkv.github.io/tower-deep/changelog.html',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          ].filter(l => l !== null);
          await canalAnuncio.send(linhas.join('\n'));
        } catch (err) { console.error('Erro ao anunciar:', err.message); }
      }
    } catch (err) { console.error(err); sessoes.delete(userId); await message.reply('⚠️ *Os ventos do Érebo interferiram na proclamação. Os deuses pedem que verifiques as configurações e tentes novamente.*'); }
  }
}

// ─────────────────────────────────────────────────────────────
//  FORMULÁRIO DE BUG
// ─────────────────────────────────────────────────────────────
async function iniciarBug(message) {
  const userId = message.author.id;
  if (sessoesBug.has(userId)) return message.reply('⚠️ *Mortal, já tens um relato em andamento. Proclama `cancelarbug` para encerrar.*');
  sessoesBug.set(userId, { etapa: 'titulo', dados: {} });
  await message.reply('🐛 **RELATO DE ANOMALIA DIVINA**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Os oráculos registrarão tua visão...*\n\nDigite `cancelarbug` a qualquer momento.\n\n**— Etapa 1/3 — O Fenômeno —**\nDescreva brevemente o bug em uma frase:');
}

async function processarBug(message) {
  const userId = message.author.id;
  const sessao = sessoesBug.get(userId);
  if (!sessao) return;
  const texto = message.content.trim();
  if (texto.toLowerCase() === 'cancelarbug') {
    sessoesBug.delete(userId);
    return message.reply('🌑 *O relato foi descartado pelos ventos do Olimpo.*');
  }
  const { etapa, dados } = sessao;
  if (etapa === 'titulo') {
    dados.titulo = texto; sessao.etapa = 'descricao';
    return message.reply('⚡ *Registrado.*\n\n**— Etapa 2/3 — Os Detalhes —**\nComo reproduzir o bug? Descreva o passo a passo:');
  }
  if (etapa === 'descricao') {
    dados.descricao = texto; sessao.etapa = 'versao';
    return message.reply('⚡ *Anotado pelos escribas.*\n\n**— Etapa 3/3 — A Versão —**\nQual versão do jogo você estava jogando? *(ex: v0.3.0 ou "não sei")*');
  }
  if (etapa === 'versao') {
    dados.versao = texto;
    sessoesBug.delete(userId);
    // Postar no canal #bugs
    if (CONFIG.CANAL_BUGS_ID) {
      try {
        const canal = await client.channels.fetch(CONFIG.CANAL_BUGS_ID);
        await canal.send(
          '🐛 **NOVA ANOMALIA RELATADA**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          `👤 **Mortal:** ${message.author.tag}\n` +
          `📋 **Fenômeno:** ${dados.titulo}\n` +
          `📝 **Detalhes:** ${dados.descricao}\n` +
          `🎮 **Versão:** ${dados.versao}\n` +
          `⏰ **Quando:** <t:${Math.floor(Date.now()/1000)}:R>\n` +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        );
      } catch (err) { console.error('Erro ao postar bug:', err.message); }
    }
    return message.reply('🔱 *Os oráculos registraram tua visão nos pergaminhos sagrados. Os deuses-desenvolvedores serão notificados, mortal. Que Atena guie a correção.*');
  }
}

// ─────────────────────────────────────────────────────────────
//  FORMULÁRIO DE SUGESTÃO
// ─────────────────────────────────────────────────────────────
async function iniciarSugestao(message) {
  const userId = message.author.id;
  if (sessoesSugestao.has(userId)) return message.reply('⚠️ *Mortal, já tens uma visão em andamento. Proclama `cancelarsugestao` para encerrar.*');
  sessoesSugestao.set(userId, { etapa: 'titulo', dados: {} });
  await message.reply('💡 **VISÃO PARA O OLIMPO**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Os deuses ouvirão tua ideia...*\n\nDigite `cancelarsugestao` a qualquer momento.\n\n**— Etapa 1/3 — O Título da Visão —**\nResuma sua sugestão em uma frase:');
}

async function processarSugestao(message) {
  const userId = message.author.id;
  const sessao = sessoesSugestao.get(userId);
  if (!sessao) return;
  const texto = message.content.trim();
  if (texto.toLowerCase() === 'cancelarsugestao') {
    sessoesSugestao.delete(userId);
    return message.reply('🌑 *Tua visão retornou ao silêncio eterno.*');
  }
  const { etapa, dados } = sessao;
  if (etapa === 'titulo') {
    dados.titulo = texto; sessao.etapa = 'descricao';
    return message.reply('⚡ *O título foi inscrito.*\n\n**— Etapa 2/3 — Os Detalhes —**\nDescreva melhor sua ideia. Como funcionaria no jogo?');
  }
  if (etapa === 'descricao') {
    dados.descricao = texto; sessao.etapa = 'categoria';
    return message.reply('⚡ *A visão foi registrada.*\n\n**— Etapa 3/3 — O Domínio —**\nQual categoria melhor descreve sua sugestão?\n\n**1** — ⚔️ Torre nova\n**2** — 🗺️ Mapa novo\n**3** — ⚙️ Mecânica\n**4** — 🎉 Evento\n**5** — 🔧 Outro');
  }
  if (etapa === 'categoria') {
    const cats = { '1':'⚔️ Torre nova', '2':'🗺️ Mapa novo', '3':'⚙️ Mecânica', '4':'🎉 Evento', '5':'🔧 Outro' };
    dados.categoria = cats[texto] || '🔧 Outro';
    sessoesSugestao.delete(userId);
    // Criar enquete no canal atual
    try {
      const msg = await message.channel.send(
        '💡 **NOVA VISÃO DOS MORTAIS**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        `👤 **Mortal:** ${message.author.tag}\n` +
        `🏷️ **Categoria:** ${dados.categoria}\n` +
        `📋 **Ideia:** ${dados.titulo}\n` +
        `📝 **Detalhes:** ${dados.descricao}\n` +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '*Os deuses aguardam o veredito dos mortais...*\n\n' +
        '👍 — Apoio esta visão!\n👎 — Os deuses rejeitam'
      );
      await msg.react('👍');
      await msg.react('👎');
    } catch (err) { console.error('Erro ao postar sugestão:', err.message); }
    return message.reply('🔱 *Tua visão foi proclamada no Olimpo! Os mortais irão julgá-la. Que os deuses decidam seu destino.*');
  }
}

// ─────────────────────────────────────────────────────────────
//  EVENTOS
// ─────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`\n🔱 Tower Deep Bot online — ${client.user.tag}`);
  console.log(`🤖 IA (Oráculo): ${CONFIG.OPENAI_KEY ? '✅ Ativada' : '❌ DESATIVADA — adicione OPENAI_KEY no Railway'}`);
  console.log(`📜 Canal de updates: ${CONFIG.CANAL_UPDATE_ID || '❌ não configurado'}`);
  console.log(`📢 Canal de anúncios: ${CONFIG.CANAL_ANUNCIO_ID || '❌ não configurado'}`);
  console.log(`🐛 Canal de bugs: ${CONFIG.CANAL_BUGS_ID || '❌ não configurado'}\n`);
});

// ─────────────────────────────────────────────────────────────
//  BOAS-VINDAS POR DM
// ─────────────────────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  try {
    const dm = await member.createDM();
    const botName = member.guild.members.me?.user.username || 'Bot';
    await dm.send([
      `⚡ **OS DEUSES DO OLIMPO NOTARAM SUA CHEGADA, ${member.user.username}!** ⚡`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Um novo mortal adentra os salões sagrados...*`,
      ``,
      `Você foi convocado para o servidor oficial do **Tower Deep** — o Tower Defense de deuses gregos no Roblox. Seu destino foi inscrito nos pergaminhos do Olimpo.`,
      ``,
      ``,
      `🏛️ **O que os deuses te permitem aqui:**`,
      `> ⚔️ Enfrentar as hostes do Tártaro e deixar sua marca`,
      `> 🗳️ Votar nos decretos futuros do Olimpo`,
      `> 📜 Acompanhar os decretos divinos`,
      `> 🔮 Consultar o Oráculo (@${botName}) para sabedoria sobre o jogo`,
      ``,
      `🌐 **Site oficial:** https://italozkv.github.io/tower-deep/`,
      `📜 **Changelog:** https://italozkv.github.io/tower-deep/changelog.html`,
      `🗳️ **Votar em features:** https://italozkv.github.io/tower-deep/votos.html`,
      ``,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Que Zeus ilumine teu caminho e Ares fortaleça teu braço, mortal.* 🔱`,
    ].join('\n'));
  } catch (err) {
    console.error(`Não foi possível enviar DM para ${member.user.tag}:`, err.message);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const texto = message.content.trim();
  const mencionouBot = message.mentions.has(client.user);

  // ── IA: menção em qualquer canal ──────────────────────────
  if (mencionouBot) {
    if (!CONFIG.OPENAI_KEY) {
      return message.reply('🌑 *O Oráculo mergulhou em sono profundo... Sua sabedoria aguarda ser despertada. Configure a variável `OPENAI_KEY` no Railway para invocar sua presença.*');
    }
    const pergunta = texto.replace(/<@!?\d+>/g, '').trim();
    if (!pergunta) {
      return message.reply('✨ *O Oráculo te observa, mortal... Mas nenhuma palavra foi proferida. Qual é o teu questionamento?*');
    }
    return await responderComIA(message, pergunta);
  }

  // ── Comandos do canal de updates ─────────────────────────
  if (message.channelId === CONFIG.CANAL_UPDATE_ID) {
    if (texto === '!update') return iniciarFormulario(message);
    if (texto === '!listar') {
      try {
        const dados = await lerGist();
        if (!dados.updates?.length) return message.reply('📜 *Os pergaminhos estão em branco, mortal. Nenhum decreto foi proclamado ainda.*');
        return message.reply('📜 **ANAIS DO OLIMPO — Decretos Proclamados**\n━━━━━━━━━━━━━━━━━━━━━━━━━\n' + dados.updates.map(u => `⚔️ **${u.versao}** — ${u.titulo} *(${u.data})*`).join('\n'));
      } catch { return message.reply('⚠️ *As brumas do Érebo ocultam os pergaminhos... Não foi possível invocar os decretos. Tente novamente.'); }
    }
    if (texto === '!ajuda') {
      return message.reply(
        '🔱 **GRIMÓRIO DO OLIMPO — Poderes Disponíveis**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📣 **Comandos Globais** *(qualquer canal)*\n🐛 `!bug`             — Relatar uma anomalia\n💡 `!sugestao`        — Enviar uma visão ao Olimpo\n🏆 `!rank`            — Ver teu título divino\n🗳️ `!enquete <texto>` — Convocar um julgamento\n\n⚔️ **Canal de Decretos** *(canal de comandos)*\n📜 `!update`          — Ritual de novo decreto\n📋 `!listar`          — Consultar os anais\n📖 `!ajuda`           — Invocar este grimório\n\n✨ **O Oráculo** *(mencione em qualquer canal)*\n`@Bot qual torre é melhor?` — Consulta geral\n`@Bot tenho um bug` — Auxílio técnico\n`@Bot sugestão: torre de Apolo` — Análise de visão'
      );
    }
  }

  // ── !enquete — funciona em qualquer canal ─────────────────
  if (texto.startsWith('!enquete ')) {
    const pergunta = texto.slice(9).trim();
    if (!pergunta) return message.reply('⚠️ *Os deuses precisam de uma questão para julgar, mortal. Use: `!enquete Sua pergunta aqui`*');
    try {
      const msg = await message.channel.send(
        '⚡ **JULGAMENTO DIVINO DO OLIMPO** ⚡\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔮 ' + pergunta + '\n\n*Os deuses aguardam o veredicto dos mortais...*\n\n✅ — Aprovo / A favor\n❌ — Rejeito / Contra'
      );
      await msg.react('✅');
      await msg.react('❌');
      await message.delete().catch(() => {});
    } catch (err) {
      console.error('Erro ao criar enquete:', err.message);
      message.reply('⚠️ *As forças do Caos interferiram no julgamento. O Olimpo não pôde ser convocado neste momento.*');
    }
    return;
  }

  // ── Formulário de bug em andamento ──────────────────────────
  if (sessoesBug.has(message.author.id)) return await processarBug(message);

  // ── Formulário de sugestão em andamento ──────────────────────
  if (sessoesSugestao.has(message.author.id)) return await processarSugestao(message);

  // ── Formulário de update em andamento ────────────────────────
  if (sessoes.has(message.author.id)) return await processarEtapa(message);

  // ── Comandos globais (!bug, !sugestao, !rank) ─────────────────
  if (texto === '!bug') return iniciarBug(message);
  if (texto === '!sugestao') return iniciarSugestao(message);

  if (texto === '!rank') {
    const userId = message.author.id;
    if (!xpData.has(userId)) xpData.set(userId, { xp: 0, nivel: 1, lastMsg: 0 });
    const dados = xpData.get(userId);
    const nivel = getNivel(dados.xp);
    const proximo = getProximoNivel(dados.xp);
    const faltam = proximo ? proximo.xpMin - dados.xp : 0;
    return message.reply(
      `✨ **PERGAMINHO DE ${message.author.username.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛️ **Título:** ${nivel.nome}\n` +
      `⚡ **XP Total:** ${dados.xp}\n` +
      `📊 **Nível:** ${nivel.nivel}/10\n` +
      (proximo ? `🔮 **Próximo título:** ${proximo.nome} *(faltam ${faltam} XP)*` : `🌟 *Atingiste a divindade máxima, imortal!*`) +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  // ── Respostas automáticas por palavras-chave ──────────────────
  const t = texto.toLowerCase();
  const ehComando = texto.startsWith('!');
  if (!ehComando && !mencionouBot) {
    if (t.includes('bug') || t.includes('erro') || t.includes('bugado')) {
      await message.reply('🐛 *Encontraste uma anomalia, mortal? Os oráculos estão prontos para registrá-la!*\nUse **`!bug`** para relatar com detalhes e notificar os desenvolvedores.');
    } else if ((t.includes('quando sai') || t.includes('quando lança') || t.includes('quando vai sair') || t.includes('proxima update') || t.includes('próxima update'))) {
      try {
        const dados = await lerGist();
        const previa = dados.proximaUpdate;
        if (previa) await message.reply(`🔮 *Os oráculos revelam...*\n\n**Próximo Decreto:** ${previa}\n\n*Acompanhe os anais: https://italozkv.github.io/tower-deep/changelog.html*`);
        else await message.reply('🔮 *Os oráculos permanecem em silêncio sobre o próximo decreto... Aguarda, mortal.*');
      } catch { await message.reply('🔮 *As visões dos oráculos estão turvas no momento...*'); }
    } else if (t.includes('sugestão') || t.includes('sugestao') || t.includes('ideia')) {
      await message.reply('💡 *Tens uma visão para o Olimpo, mortal?*\nUse **`!sugestao`** para submeter tua ideia e deixar os outros mortais votarem!');
    } else if (t.includes('update') || t.includes('atualização') || t.includes('atualizacao')) {
      await message.reply('📜 *Buscas os decretos divinos?*\nUse **`!listar`** no canal de comandos ou veja em: https://italozkv.github.io/tower-deep/changelog.html');
    } else if (t.includes('ajuda') || t.includes('como funciona') || t.includes('o que o bot faz')) {
      await message.reply('📖 *O Grimório do Olimpo está à tua disposição, mortal!*\n\n⚔️ `!bug` — Relatar um bug\n💡 `!sugestao` — Enviar sugestão\n🏆 `!rank` — Ver teu título divino\n🗳️ `!enquete` — Criar enquete\n\n*Ou me mencione diretamente para falar com o Oráculo!*');
    }
  }

  // ── Sistema de XP ─────────────────────────────────────────────
  if (message.guild && !ehComando) {
    const resultado = ganharXP(message.author.id);
    if (resultado?.subiu) {
      await message.channel.send(
        `⚡ **ASCENSÃO DIVINA!** ⚡\n` +
        `${message.author} subiu para o título de **${resultado.nivel.nome}** (Nível ${resultado.nivel.nivel})!\n` +
        `*Os deuses do Olimpo reconhecem tua dedicação, mortal.* 🔱`
      );
    }
  }
});

client.login(CONFIG.DISCORD_TOKEN);
