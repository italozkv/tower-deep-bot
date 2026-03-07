const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
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
  GROK_KEY:         process.env.GROK_KEY,           // chave da API Grok (xAI)
};
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  REGISTRO DE SLASH COMMANDS
// ─────────────────────────────────────────────────────────────
const slashCommands = [
  new SlashCommandBuilder().setName('bug').setDescription('🐛 Reportar uma anomalia divina ao Olimpo'),
  new SlashCommandBuilder().setName('sugestao').setDescription('💡 Enviar uma visão para os deuses do Olimpo'),
  new SlashCommandBuilder()
    .setName('enquete')
    .setDescription('🗳️ Convocar um julgamento divino')
    .addStringOption(opt => opt.setName('pergunta').setDescription('A questão a ser julgada pelos mortais').setRequired(true)),
  new SlashCommandBuilder().setName('rank').setDescription('🏆 Consultar teu título divino no Olimpo'),
  new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('🧹 Apagar mensagens do canal (apenas moderadores)')
    .addIntegerOption(opt => opt
      .setName('quantidade')
      .setDescription('Quantas mensagens apagar (10 ou 100)')
      .setRequired(true)
      .addChoices(
        { name: 'Últimas 10 mensagens', value: 10 },
        { name: 'Últimas 100 mensagens', value: 100 },
      )),
  new SlashCommandBuilder()
    .setName('anunciar')
    .setDescription('📢 Fazer um anúncio no canal atual')
    .addStringOption(opt => opt
      .setName('mensagem')
      .setDescription('O conteúdo do anúncio')
      .setRequired(true))
    .addStringOption(opt => opt
      .setName('titulo')
      .setDescription('Título do anúncio (opcional)')
      .setRequired(false)),
  new SlashCommandBuilder()
    .setName('enquete')
    .setDescription('🗳️ Criar enquete vinculada ao site (votos.html)')
    .addStringOption(opt => opt.setName('titulo').setDescription('Título da feature/enquete').setRequired(true))
    .addStringOption(opt => opt.setName('descricao').setDescription('Descrição da feature').setRequired(true))
    .addStringOption(opt => opt.setName('categoria').setDescription('Categoria').setRequired(true)
      .addChoices(
        {name:'⚔️ Torre', value:'torre'},
        {name:'🗺️ Mapa', value:'mapa'},
        {name:'⚙️ Mecânica', value:'mecanica'},
        {name:'🎉 Evento', value:'evento'},
        {name:'🔧 Outro', value:'outro'},
      )),
  new SlashCommandBuilder()
    .setName('roadmap')
    .setDescription('🗺️ Gerenciar o roadmap do jogo')
    .addSubcommand(sub => sub
      .setName('adicionar')
      .setDescription('Adicionar nova versão ao roadmap')
      .addStringOption(opt => opt.setName('versao').setDescription('Ex: v0.6').setRequired(true))
      .addStringOption(opt => opt.setName('titulo').setDescription('Ex: A Chegada de Apolo').setRequired(true))
      .addStringOption(opt => opt.setName('status').setDescription('Status da versão').setRequired(true)
        .addChoices(
          {name:'✓ Concluído', value:'done'},
          {name:'⚡ Em Desenvolvimento', value:'active'},
          {name:'◇ Planejado', value:'planned'},
          {name:'◇ Futuro', value:'future'},
        ))
      .addStringOption(opt => opt.setName('data').setDescription('Ex: Abr 2026').setRequired(false))
      .addStringOption(opt => opt.setName('lore').setDescription('Frase épica da versão').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('item')
      .setDescription('Adicionar item a uma versão do roadmap')
      .addStringOption(opt => opt.setName('versao').setDescription('Versão alvo (ex: v0.6)').setRequired(true))
      .addStringOption(opt => opt.setName('texto').setDescription('Descrição do item').setRequired(true))
      .addStringOption(opt => opt.setName('badge').setDescription('Badge do item').setRequired(false)
        .addChoices(
          {name:'Novo', value:'Novo'},
          {name:'Divino', value:'Divino'},
          {name:'Fix', value:'Fix'},
          {name:'Evento', value:'Evento'},
        )))
    .addSubcommand(sub => sub
      .setName('concluir')
      .setDescription('Marcar item como concluído')
      .addStringOption(opt => opt.setName('versao').setDescription('Versão (ex: v0.4)').setRequired(true))
      .addStringOption(opt => opt.setName('item').setDescription('Parte do texto do item a marcar').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('status')
      .setDescription('Mudar status de uma versão')
      .addStringOption(opt => opt.setName('versao').setDescription('Versão (ex: v0.4)').setRequired(true))
      .addStringOption(opt => opt.setName('status').setDescription('Novo status').setRequired(true)
        .addChoices(
          {name:'✓ Concluído', value:'done'},
          {name:'⚡ Em Desenvolvimento', value:'active'},
          {name:'◇ Planejado', value:'planned'},
          {name:'◇ Futuro', value:'future'},
        ))),
].map(cmd => cmd.toJSON());

async function registrarSlashCommands(clientId) {
  const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
    console.log('✅ Slash commands registrados globalmente!');
  } catch (err) {
    console.error('Erro ao registrar slash commands:', err.message);
  }
}
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
//  Persistido no Gist como arquivo separado (xp-data.json)
// ─────────────────────────────────────────────────────────────
const xpData = new Map(); // userId -> { xp, nivel, lastMsg }

async function carregarXP() {
  return new Promise((resolve) => {
    https.get({
      hostname: 'api.github.com',
      path: `/gists/${CONFIG.GIST_ID}`,
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const gist = JSON.parse(data);
          const arquivo = gist.files?.['xp-data.json'];
          if (arquivo) {
            const xpJson = JSON.parse(arquivo.content);
            for (const [userId, dados] of Object.entries(xpJson)) {
              xpData.set(userId, { ...dados, lastMsg: 0 });
            }
            console.log(`✅ XP carregado — ${xpData.size} jogador(es)`);
          }
        } catch { console.log('⚠️ Nenhum XP salvo ainda, iniciando do zero.'); }
        resolve();
      });
    }).on('error', () => resolve());
  });
}

let _xpSaveTimeout = null;
function salvarXPDebounced() {
  // Agrupa saves — espera 10s de inatividade antes de salvar
  if (_xpSaveTimeout) clearTimeout(_xpSaveTimeout);
  _xpSaveTimeout = setTimeout(() => salvarXP(), 10000);
}

async function salvarXP() {
  const xpJson = {};
  for (const [userId, dados] of xpData.entries()) {
    xpJson[userId] = { xp: dados.xp, nivel: dados.nivel };
  }
  return new Promise((resolve) => {
    const body = JSON.stringify({
      files: { 'xp-data.json': { content: JSON.stringify(xpJson, null, 2) } }
    });
    const req = https.request({
      hostname: 'api.github.com', path: `/gists/${CONFIG.GIST_ID}`, method: 'PATCH',
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve()); });
    req.on('error', () => resolve());
    req.write(body); req.end();
  });
}

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
  dados.nivel = nivelDepois.nivel;
  salvarXPDebounced(); // salva no Gist com debounce
  if (nivelDepois.nivel > nivelAntes.nivel) return { subiu: true, nivel: nivelDepois };
  return { subiu: false };
}

// ─────────────────────────────────────────────────────────────
//  SESSÕES DO FORMULÁRIO DE BUG E SUGESTÃO
// ─────────────────────────────────────────────────────────────
// Sessões de bug/sugestão removidas — agora usa Modals

// Tags de update
const TAGS = {
  '1': { key: 'novo',    label: '🟢 Novo'    },
  '2': { key: 'fix',     label: '🔵 Fix'     },
  '3': { key: 'balance', label: '🟠 Balance' },
  '4': { key: 'evento',  label: '🩷 Evento'  },
  '5': { key: 'divino',  label: '✨ Divino'  },
};

// ─────────────────────────────────────────────────────────────
//  GROK API (xAI)
// ─────────────────────────────────────────────────────────────
function chamarClaude(mensagens, promptExtra = '') {
  return new Promise((resolve, reject) => {
    const sistema = CONHECIMENTO_DO_JOGO + (promptExtra ? '\n\n' + promptExtra : '');

    const body = JSON.stringify({
      model: 'grok-3-mini-fast',
      max_tokens: 500,
      messages: [
        { role: 'system', content: sistema },
        ...mensagens,
      ],
    });

    const options = {
      hostname: 'api.x.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.GROK_KEY}`,
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
//  GIST (changelog, enquetes, roadmap)
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
//  HELPERS GIST — ENQUETES
// ─────────────────────────────────────────────────────────────
async function lerEnquetes() {
  return new Promise((resolve) => {
    https.get({
      hostname: 'api.github.com',
      path: `/gists/${CONFIG.GIST_ID}`,
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const gist = JSON.parse(data);
          const arquivo = gist.files?.['enquetes.json'];
          resolve(arquivo ? JSON.parse(arquivo.content) : []);
        } catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function salvarEnquetes(lista) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ files: { 'enquetes.json': { content: JSON.stringify(lista, null, 2) } } });
    const req = https.request({
      hostname: 'api.github.com', path: `/gists/${CONFIG.GIST_ID}`, method: 'PATCH',
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve()); });
    req.on('error', () => resolve()); req.write(body); req.end();
  });
}

// ─────────────────────────────────────────────────────────────
//  HELPERS GIST — ROADMAP
// ─────────────────────────────────────────────────────────────
async function lerRoadmap() {
  return new Promise((resolve) => {
    https.get({
      hostname: 'api.github.com',
      path: `/gists/${CONFIG.GIST_ID}`,
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const gist = JSON.parse(data);
          const arquivo = gist.files?.['roadmap.json'];
          resolve(arquivo ? JSON.parse(arquivo.content) : []);
        } catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function salvarRoadmap(versoes) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ files: { 'roadmap.json': { content: JSON.stringify(versoes, null, 2) } } });
    const req = https.request({
      hostname: 'api.github.com', path: `/gists/${CONFIG.GIST_ID}`, method: 'PATCH',
      headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}`, 'User-Agent': 'TowerDeepBot', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve()); });
    req.on('error', () => resolve()); req.write(body); req.end();
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
// ─────────────────────────────────────────────────────────────
//  SLASH COMMANDS + MODALS
// ─────────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {

  // ── /bug — abre modal ──────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'bug') {
    const modal = new ModalBuilder()
      .setCustomId('modal_bug')
      .setTitle('Relato de Anomalia Divina');

    const fenomeno = new TextInputBuilder()
      .setCustomId('bug_titulo')
      .setLabel('O Fenomeno - Descreva o bug em uma frase')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: A torre de Zeus não ataca inimigos voadores')
      .setRequired(true)
      .setMaxLength(100);

    const detalhes = new TextInputBuilder()
      .setCustomId('bug_descricao')
      .setLabel('Os Detalhes - Como reproduzir o bug?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Passo a passo do que aconteceu...')
      .setRequired(true)
      .setMaxLength(500);

    const versao = new TextInputBuilder()
      .setCustomId('bug_versao')
      .setLabel('A Versao - Qual versao do jogo?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: v0.3.0 (ou "não sei")')
      .setRequired(false)
      .setMaxLength(20);

    modal.addComponents(
      new ActionRowBuilder().addComponents(fenomeno),
      new ActionRowBuilder().addComponents(detalhes),
      new ActionRowBuilder().addComponents(versao),
    );
    return await interaction.showModal(modal);
  }

  // ── /sugestao — modal imediato (sem await antes!) ───────
  if (interaction.isChatInputCommand() && interaction.commandName === 'sugestao') {
    try {
      const modal = new ModalBuilder().setCustomId('modal_sugestao').setTitle('Visao para o Olimpo');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_titulo').setLabel('O Titulo - Resuma sua sugestao').setStyle(TextInputStyle.Short).setPlaceholder('Ex: Torre de Artemis com flechas de gelo').setRequired(true).setMaxLength(100)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_descricao').setLabel('Os Detalhes - Como funcionaria?').setStyle(TextInputStyle.Paragraph).setPlaceholder('Descreva a ideia com mais detalhes...').setRequired(true).setMaxLength(400)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_categoria').setLabel('Categoria: torre, mapa, mecanica, evento, outro').setStyle(TextInputStyle.Short).setPlaceholder('torre').setRequired(false).setMaxLength(20)),
      );
      return await interaction.showModal(modal);
    } catch(err) { console.error('Erro ao abrir modal sugestao:', err.message); return; }
  }

  // ── Submit do modal de bug ────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === 'modal_bug') {
    const bugTitulo = interaction.fields.getTextInputValue('bug_titulo');
    const bugDesc   = interaction.fields.getTextInputValue('bug_descricao');
    const bugVersao = interaction.fields.getTextInputValue('bug_versao') || 'não informado';

    // Responde de forma efêmera (só o usuário vê)
    await interaction.reply({
      content: '🔱 *Os oráculos registraram tua anomalia nos pergaminhos sagrados. Os deuses-desenvolvedores serão notificados. Que Atena guie a correção, mortal.*',
      ephemeral: true,
    });

    // Posta no canal #bugs
    if (CONFIG.CANAL_BUGS_ID) {
      try {
        const canal = await client.channels.fetch(CONFIG.CANAL_BUGS_ID);
        await canal.send(
          '🐛 **NOVA ANOMALIA RELATADA**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          `👤 **Mortal:** ${interaction.user.tag}\n` +
          `📋 **Fenômeno:** ${bugTitulo}\n` +
          `📝 **Detalhes:** ${bugDesc}\n` +
          `🎮 **Versão:** ${bugVersao}\n` +
          `⏰ **Quando:** <t:${Math.floor(Date.now()/1000)}:R>\n` +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        );
      } catch (err) { console.error('Erro ao postar bug:', err.message); }
    }
    return;
  }

  // ── Submit do modal de sugestão — salva no Gist + site ───
  if (interaction.isModalSubmit() && interaction.customId === 'modal_sugestao') {
    const sugTitulo = interaction.fields.getTextInputValue('sug_titulo');
    const sugDesc   = interaction.fields.getTextInputValue('sug_descricao');
    const rawCat    = (interaction.fields.getTextInputValue('sug_categoria') || '').toLowerCase().trim();
    const sugCat    = ['torre','mapa','mecanica','evento'].includes(rawCat) ? rawCat : 'outro';
    // deferReply para evitar timeout do Discord enquanto salva no Gist
    await interaction.deferReply({ ephemeral: true });
    try {
      const lista = await lerEnquetes();
      lista.push({ id: `s${Date.now()}`, titulo: sugTitulo, desc: sugDesc, cat: sugCat, votos: 0, origem: 'sugestao', autor: interaction.user.tag, criadoEm: new Date().toISOString() });
      await salvarEnquetes(lista);
      const msg = await interaction.channel.send(
        `💡 **VISÃO DE ${interaction.user.username.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️ **Categoria:** ${sugCat}\n📋 **Ideia:** ${sugTitulo}\n📝 **Detalhes:** ${sugDesc}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⬆️ — Apoio esta visão!\n` +
        `*Vote também em: https://italozkv.github.io/tower-deep/votos.html*`
      );
      await msg.react('⬆️');
      await interaction.editReply({ content: '🔱 *Tua visão foi gravada nos pergaminhos e já aparece no site!*' });
    } catch (err) {
      console.error('Erro submit sugestao:', err.message, err.stack);
      try { await interaction.editReply({ content: `⚠️ Erro: ${err.message}` }); } catch(_) {}
    }
    return;
  }

  // ── /enquete — cria enquete no Gist + Discord + site ─────
  if (interaction.isChatInputCommand() && interaction.commandName === 'enquete') {
    if (!interaction.member.permissions.has('ManageMessages')) {
      return await interaction.reply({ content: '⚠️ *Apenas guardiões do Olimpo podem proclamar enquetes.*', ephemeral: true });
    }
    const titulo    = interaction.options.getString('titulo');
    const descricao = interaction.options.getString('descricao');
    const categoria = interaction.options.getString('categoria');
    // deferReply garante que o Discord não timeout enquanto salvamos no Gist
    await interaction.deferReply({ ephemeral: true });
    try {
      const lista = await lerEnquetes();
      const novaEnquete = { id: `e${Date.now()}`, titulo, desc: descricao, cat: categoria, votos: 0, origem: 'discord', criadoEm: new Date().toISOString() };
      lista.push(novaEnquete);
      await salvarEnquetes(lista);
      const msg = await interaction.channel.send(
        `🗳️ **NOVA ENQUETE — ${titulo.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️ **Categoria:** ${categoria}\n📝 ${descricao}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⬆️ — Quero esta feature!\n` +
        `*Resultados: https://italozkv.github.io/tower-deep/votos.html*`
      );
      await msg.react('⬆️');
      await interaction.editReply({ content: `✅ *Enquete proclamada e salva no site!*` });
    } catch (err) {
      console.error('Erro /enquete:', err.message, err.stack);
      try { await interaction.editReply({ content: `⚠️ Erro: ${err.message}` }); } catch(_) {}
    }
    return;
  }

  // ── /limpar ───────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'limpar') {
    // Verificar permissão de gerenciar mensagens
    if (!interaction.member.permissions.has('ManageMessages')) {
      return await interaction.reply({
        content: '⚠️ *Os deuses negam tua solicitação, mortal. Apenas guardiões com permissão de moderar podem invocar este poder.*',
        ephemeral: true,
      });
    }
    const quantidade = interaction.options.getInteger('quantidade');
    await interaction.deferReply({ ephemeral: true });
    try {
      let apagadas = 0;
      // Discord só permite deletar msgs em lotes de 100 e de até 14 dias
      const msgs = await interaction.channel.messages.fetch({ limit: quantidade });
      const recentes = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
      if (recentes.size === 0) {
        return await interaction.editReply({ content: '⚠️ *Nenhuma mensagem recente encontrada para apagar (máx. 14 dias).*' });
      }
      await interaction.channel.bulkDelete(recentes, true);
      apagadas = recentes.size;
      await interaction.editReply({ content: `🧹 *${apagadas} mensagem(ns) foram varridas pelos ventos do Olimpo.*` });
    } catch (err) {
      console.error('Erro ao limpar:', err.message);
      await interaction.editReply({ content: '⚠️ *Os deuses não conseguiram varrer o canal. Verifique as permissões do bot.*' });
    }
    return;
  }

  // ── /anunciar ─────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'anunciar') {
    if (!interaction.member.permissions.has('ManageMessages')) {
      return await interaction.reply({
        content: '⚠️ *Os deuses negam tua solicitação, mortal. Apenas guardiões podem proclamar decretos.*',
        ephemeral: true,
      });
    }
    const mensagem = interaction.options.getString('mensagem');
    const titulo = interaction.options.getString('titulo') || 'DECRETO DO OLIMPO';

    // Confirma só para quem usou (efêmero)
    await interaction.reply({
      content: `✅ *Teu anúncio foi proclamado no canal, guardião.*`,
      ephemeral: true,
    });

    // Posta o anúncio publicamente
    try {
      await interaction.channel.send(
        `📢 **${titulo.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${mensagem}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*— Proclamado por ${interaction.user.username}*`
      );
    } catch (err) {
      console.error('Erro ao anunciar:', err.message);
    }
    return;
  }

  // ── /roadmap ──────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'roadmap') {
    if (!interaction.member.permissions.has('ManageMessages')) {
      return await interaction.reply({ content: '⚠️ *Apenas guardiões do Olimpo podem editar os pergaminhos do roadmap.*', ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });
    try {
      const versoes = await lerRoadmap();

      if (sub === 'adicionar') {
        const versao = interaction.options.getString('versao');
        const titulo = interaction.options.getString('titulo');
        const status = interaction.options.getString('status');
        const data   = interaction.options.getString('data') || '';
        const lore   = interaction.options.getString('lore') || '';
        if (versoes.find(v => v.versao === versao)) {
          return await interaction.editReply({ content: `⚠️ *A versão ${versao} já existe nos pergaminhos.*` });
        }
        versoes.push({ versao, titulo, status, data, lore, itens: [] });
        await salvarRoadmap(versoes);
        await interaction.editReply({ content: `🗺️ **${versao} — ${titulo}** adicionada ao roadmap!\n*Visível em: https://italozkv.github.io/tower-deep/roadmap.html*` });
      }

      else if (sub === 'item') {
        const versao = interaction.options.getString('versao');
        const texto  = interaction.options.getString('texto');
        const badge  = interaction.options.getString('badge') || 'Novo';
        const v = versoes.find(v => v.versao === versao);
        if (!v) return await interaction.editReply({ content: `⚠️ *Versão ${versao} não encontrada. Use /roadmap adicionar primeiro.*` });
        v.itens = v.itens || [];
        v.itens.push({ texto, badge, concluido: false });
        await salvarRoadmap(versoes);
        await interaction.editReply({ content: `✅ *Item adicionado em ${versao}:* ${texto}` });
      }

      else if (sub === 'concluir') {
        const versao = interaction.options.getString('versao');
        const itemBusca = interaction.options.getString('item').toLowerCase();
        const v = versoes.find(v => v.versao === versao);
        if (!v) return await interaction.editReply({ content: `⚠️ *Versão ${versao} não encontrada.*` });
        const item = v.itens?.find(i => i.texto.toLowerCase().includes(itemBusca));
        if (!item) return await interaction.editReply({ content: `⚠️ *Item não encontrado. Verifica o texto.*` });
        item.concluido = true;
        await salvarRoadmap(versoes);
        await interaction.editReply({ content: `✓ *Item marcado como concluído em ${versao}:* ${item.texto}` });
      }

      else if (sub === 'status') {
        const versao = interaction.options.getString('versao');
        const status = interaction.options.getString('status');
        const v = versoes.find(v => v.versao === versao);
        if (!v) return await interaction.editReply({ content: `⚠️ *Versão ${versao} não encontrada.*` });
        v.status = status;
        await salvarRoadmap(versoes);
        await interaction.editReply({ content: `⚡ *Status de ${versao} atualizado para: ${status}*` });
      }
    } catch (err) {
      console.error('Erro no roadmap:', err.message);
      await interaction.editReply({ content: '⚠️ *Os ventos do Érebo interferiram. Tente novamente.*' });
    }
    return;
  }

  // ── /rank ─────────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'rank') {
    const userId = interaction.user.id;
    if (!xpData.has(userId)) xpData.set(userId, { xp: 0, nivel: 1, lastMsg: 0 });
    const dados = xpData.get(userId);
    const nivel = getNivel(dados.xp);
    const proximo = getProximoNivel(dados.xp);
    const faltam = proximo ? proximo.xpMin - dados.xp : 0;

    // Top 5 do servidor
    const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const top5 = [...xpData.entries()]
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 5);

    let topTexto = '';
    for (let i = 0; i < top5.length; i++) {
      const [uid, d] = top5[i];
      const n = getNivel(d.xp);
      const destaque = uid === userId ? ' ← você' : '';
      topTexto += `${medalhas[i]} <@${uid}> — **${n.nome}** *(${d.xp} XP)*${destaque}\n`;
    }

    await interaction.reply({
      content:
        `✨ **PERGAMINHO DE ${interaction.user.username.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏛️ **Título:** ${nivel.nome}\n` +
        `⚡ **XP Total:** ${dados.xp}\n` +
        `📊 **Nível:** ${nivel.nivel}/10\n` +
        (proximo ? `🔮 **Próximo:** ${proximo.nome} *(faltam ${faltam} XP)*` : `🌟 *Atingiste a divindade máxima, imortal!*`) +
        `\n\n🏆 **OLIMPO — Top Mortais**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        (topTexto || '*Nenhum mortal registrado ainda.*') +
        `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ephemeral: true,
    });
    return;
  }
});

// ─────────────────────────────────────────────────────────────
//  EVENTOS
// ─────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`\n🔱 Tower Deep Bot online — ${client.user.tag}`);
  await registrarSlashCommands(client.user.id);
  await carregarXP();
  console.log(`🤖 IA (Oráculo): ${CONFIG.GROK_KEY ? '✅ Ativada (Grok)' : '❌ DESATIVADA — adicione GROK_KEY no Railway'}`);
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
    if (!CONFIG.GROK_KEY) {
      return message.reply('🌑 *O Oráculo mergulhou em sono profundo... Sua sabedoria aguarda ser despertada. Configure a variável `GROK_KEY` no Railway para invocar sua presença.*');
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

  // ── Formulário de update em andamento ────────────────────────
  if (sessoes.has(message.author.id)) return await processarEtapa(message);

  // ── Respostas automáticas por palavras-chave ──────────────────
  const t = texto.toLowerCase();
  const ehComando = texto.startsWith('!');
  if (!ehComando && !mencionouBot) {
    if (t.includes('bug') || t.includes('erro') || t.includes('bugado')) {
      await message.reply('🐛 *Encontraste uma anomalia, mortal? Os oráculos estão prontos para registrá-la!*\nUse **`/bug`** para relatar com detalhes — abre um formulário privado!');
    } else if ((t.includes('quando sai') || t.includes('quando lança') || t.includes('quando vai sair') || t.includes('proxima update') || t.includes('próxima update'))) {
      try {
        const dados = await lerGist();
        const previa = dados.proximaUpdate;
        if (previa) await message.reply(`🔮 *Os oráculos revelam...*\n\n**Próximo Decreto:** ${previa}\n\n*Acompanhe os anais: https://italozkv.github.io/tower-deep/changelog.html*`);
        else await message.reply('🔮 *Os oráculos permanecem em silêncio sobre o próximo decreto... Aguarda, mortal.*');
      } catch { await message.reply('🔮 *As visões dos oráculos estão turvas no momento...*'); }
    } else if (t.includes('sugestão') || t.includes('sugestao') || t.includes('ideia')) {
      await message.reply('💡 *Tens uma visão para o Olimpo, mortal?*\nUse **`/sugestao`** para submeter tua ideia — abre um formulário privado!');
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
