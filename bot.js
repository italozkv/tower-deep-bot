const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const https = require('https');
const http  = require('http');  // â† servidor de tokens
const fs = require('fs');
const path = require('path');

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONFIG
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CONFIG = {
  DISCORD_TOKEN:    process.env.DISCORD_TOKEN,
  GITHUB_TOKEN:     process.env.GITHUB_TOKEN,
  GIST_ID:          process.env.GIST_ID,
  CANAL_UPDATE_ID:  process.env.CANAL_ID,
  CANAL_ANUNCIO_ID: process.env.CANAL_ANUNCIO_ID,
  CANAL_BUGS_ID:    process.env.CANAL_BUGS_ID,
  GROK_KEY:         process.env.GROK_KEY,
  // Cargos
  CARGO_DONO:        process.env.CARGO_DONO,
  CARGO_ADMIN:       process.env.CARGO_ADMIN,
  CARGO_MOD:         process.env.CARGO_MOD,
  CARGO_EQUIPE:      process.env.CARGO_EQUIPE,
  // Cargo automÃ¡tico ao entrar no servidor
  CARGO_MEMBRO:      process.env.CARGO_MEMBRO || '1479896423679131688', // Gamerule
  // âš¡ Novas funcionalidades
  CARGO_VERIFICADO:  process.env.CARGO_VERIFICADO,   // Cargo dado apÃ³s /verificar
  CANAL_CRIAR_TEMPLO: process.env.CANAL_CRIAR_TEMPLO, // ID do canal de voz "âž• Criar Templo"
  CATEGORIA_TEMPLOS:  process.env.CATEGORIA_TEMPLOS,  // Categoria onde os templos sÃ£o criados
  // Sistema de tickets
  CATEGORIA_TICKETS: process.env.CATEGORIA_TICKETS,
  CANAL_LOG_TICKETS: process.env.CANAL_LOG_TICKETS,
  // ðŸŽ Sistema de cÃ³digos de resgate
  ROBLOX_API_SECRET: process.env.ROBLOX_API_SECRET || 'tower-deep-secret-2024',
  CANAL_CODIGOS:     process.env.CANAL_CODIGOS,
  // ðŸŽ¨ Cores centralizadas
  CORES: {
    PRIMARIA: 0xc9a84c, // Dourado Olimpo
    ERRO:     0xff5a5a, // Vermelho
    SUCESSO:  0x3dd68c, // Verde
    AVISO:    0xf0c060, // Amarelo
    INFO:     0x4a9eff, // Azul
    NEUTRO:   0x555555, // Cinza
  },
};

const missingVars = [];
if (!CONFIG.DISCORD_TOKEN) missingVars.push('DISCORD_TOKEN');
if (!CONFIG.GITHUB_TOKEN)  missingVars.push('GITHUB_TOKEN');
if (!CONFIG.GIST_ID)       missingVars.push('GIST_ID');

if (missingVars.length) {
  console.error(`âŒ VariÃ¡veis ausentes: ${missingVars.join(', ')}`);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates, // necessÃ¡rio para o sistema de Templos
  ]
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONHECIMENTO DO JOGO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CONHECIMENTO_DO_JOGO = `
VocÃª Ã© o ORÃCULO, a IA oficial do Tower Deep â€” um jogo Tower Defense no Roblox com tema de deuses gregos.
Seu papel: responder dÃºvidas dos jogadores, analisar sugestÃµes e ajudar no suporte tÃ©cnico.

PERSONALIDADE:
- Tom Ã©pico, sÃ¡bio e levemente misterioso, como um orÃ¡culo grego
- Seja sempre claro e Ãºtil, mesmo usando linguagem temÃ¡tica
- Respostas curtas e diretas â€” mÃ¡ximo 4 parÃ¡grafos
- Nunca invente informaÃ§Ãµes sobre o jogo

SOBRE O JOGO:
- GÃªnero: Tower Defense no Roblox
- Tema: Deuses gregos (Zeus, Poseidon, Ares, Hades, Artemis...)
- VersÃ£o atual: Alpha v0.3.0

TORRES DISPONÃVEIS:
- Torre de Zeus: Raios em inimigos aleatÃ³rios. Habilidade: Tempestade do Olimpo
- Torre de Poseidon: Congela e causa dano em Ã¡rea. Habilidade: Tsunami Eterno
- Torre de Ares: Chamas sagradas em Ã¡rea. Habilidade: FÃºria do Olimpo (destrÃ³i tudo na tela, cooldown 3 ondas)
- Torre de Hades: Em desenvolvimento (v0.4.0)
- Torre de Artemis: Em desenvolvimento (v0.5.0)

INIMIGOS:
- GuardiÃµes de TÃ¡rtaro: imunes a fogo, vulnerÃ¡veis a gelo
- Sereias Corrompidas: desativam torres temporariamente
- Almas Errantes: rÃ¡pidos e numerosos
- Cerontes: tanques com muita vida

MAPAS:
- Portal dos Deuses: 20 ondas, mapa inicial
- RuÃ­nas do Olimpo: 25 ondas, com obstÃ¡culos
- PortÃµes do Ã‰rebo: em desenvolvimento (v0.4.0)

MECÃ‚NICAS:
- BÃªnÃ§Ã£os Divinas: buffs escolhidos entre as ondas
- Sistema de moedas e upgrades de torres
- Habilidades divinas com cooldown por ondas

PRÃ“XIMAS ATUALIZAÃ‡Ã•ES:
- v0.4.0 (Abr 2026): Torre de Hades, Mapa PortÃµes do Ã‰rebo, sistema de recordes
- v0.5.0 (Mai-Jun 2026): Torre de Artemis, missÃµes diÃ¡rias, modo caÃ§ada

BUGS CONHECIDOS E SOLUÃ‡Ã•ES:
- "Torre de Poseidon nÃ£o ataca voadores": corrigido na v0.2.5, atualize o jogo
- "Lag no mapa": reduza qualidade grÃ¡fica nas configuraÃ§Ãµes do Roblox
- "NÃ£o consigo comprar upgrade": precisa de mais moedas (dropadas pelos inimigos)
- "Crash na cutscene de vitÃ³ria": corrigido na v0.2.5

REGRAS DO SERVIDOR:
- Respeito entre todos os membros
- Bugs no canal #bugs, sugestÃµes no #sugestÃµes
- Sem spam ou conteÃºdo imprÃ³prio
`;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MEMÃ“RIAS / SESSÃ•ES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const historicos    = new Map();
const MAX_HISTORICO = 10;
const sessoes       = new Map();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TAGS DE UPDATE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TAGS = {
  '1': { key: 'novo',    label: 'ðŸŸ¢ Novo'    },
  '2': { key: 'fix',     label: 'ðŸ”µ Fix'     },
  '3': { key: 'balance', label: 'ðŸŸ  Balance' },
  '4': { key: 'evento',  label: 'ðŸ©· Evento'  },
  '5': { key: 'divino',  label: 'âœ¨ Divino'  },
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// XP
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const xpData = new Map();

const NIVEIS_XP = [
  { nivel: 1,  nome: 'Mortal Comum',            xpMin: 0,    imagem: null },
  { nivel: 2,  nome: 'Mensageiro de Hermes',     xpMin: 50,   imagem: null },
  { nivel: 3,  nome: 'GuardiÃ£o de Atena',        xpMin: 150,  imagem: null },
  { nivel: 4,  nome: 'Guerreiro de Ares',        xpMin: 300,  imagem: null },
  { nivel: 5,  nome: 'Navegante de Poseidon',    xpMin: 500,  imagem: null },
  { nivel: 6,  nome: 'Arauto de Zeus',           xpMin: 750,  imagem: null },
  { nivel: 7,  nome: 'CampeÃ£o de Apolo',         xpMin: 1050, imagem: null },
  { nivel: 8,  nome: 'Semideus do Olimpo',       xpMin: 1400, imagem: null },
  { nivel: 9,  nome: 'HerÃ³i Imortal',            xpMin: 1800, imagem: null },
  { nivel: 10, nome: 'Divindade do Olimpo',      xpMin: 2300, imagem: null }, // Troque null por URLs de imagens/GIFs
];
// ðŸ’¡ Para adicionar imagens, substitua null pelo link direto:
// imagem: 'https://i.imgur.com/SEU_GIF.gif'

// ðŸ“Š Barra de progresso visual
function gerarBarraProgresso(atual, max, tamanho = 12) {
  if (max <= 0) max = 1;
  const pct = Math.min(atual / max, 1);
  const cheio = Math.round(tamanho * pct);
  const vazio = tamanho - cheio;
  return 'â–ˆ'.repeat(cheio) + 'â–‘'.repeat(vazio) + ` ${Math.round(pct * 100)}%`;
}

function getNivel(xp)       { let a = NIVEIS_XP[0]; for (const n of NIVEIS_XP) { if (xp >= n.xpMin) a = n; } return a; }
function getProximoNivel(xp){ for (const n of NIVEIS_XP) { if (xp < n.xpMin) return n; } return null; }

function ganharXP(userId) {
  const agora = Date.now();
  if (!xpData.has(userId)) xpData.set(userId, { xp: 0, nivel: 1, lastMsg: 0 });
  const dados = xpData.get(userId);
  if (agora - dados.lastMsg < 30000) return null;
  const ganho       = Math.floor(Math.random() * 6) + 5;
  const nivelAntes  = getNivel(dados.xp);
  dados.xp         += ganho;
  dados.msgs         = (dados.msgs || 0) + 1;
  dados.lastMsg     = agora;
  const nivelDepois = getNivel(dados.xp);
  dados.nivel       = nivelDepois.nivel;
  salvarXPDebounced();
  if (nivelDepois.nivel > nivelAntes.nivel) return { subiu: true, nivel: nivelDepois };
  return { subiu: false };
}

let _xpSaveTimeout = null;
function salvarXPDebounced() {
  if (_xpSaveTimeout) clearTimeout(_xpSaveTimeout);
  _xpSaveTimeout = setTimeout(() => {
    salvarXP().catch(err => console.error('Erro ao salvar XP:', err.message));
  }, 10000);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPERS HTTP / GIST
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function githubRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyString = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'User-Agent':    'TowerDeepBot',
        'Accept':        'application/vnd.github.v3+json',
      },
    };
    if (bodyString) {
      options.headers['Content-Type']   = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyString) req.write(bodyString);
    req.end();
  });
}

async function obterGist() {
  try { return await githubRequest('GET', `/gists/${CONFIG.GIST_ID}`); }
  catch (err) { console.error('Erro ao obter Gist:', err.message); return { files: {} }; }
}

async function lerArquivoJsonDoGist(nomeArquivo, fallback) {
  try {
    const gist    = await obterGist();
    const arquivo = gist.files?.[nomeArquivo];
    if (!arquivo?.content) return fallback;
    return JSON.parse(arquivo.content);
  } catch (err) { console.error(`Erro ao ler ${nomeArquivo}:`, err.message); return fallback; }
}

async function salvarArquivoJsonNoGist(nomeArquivo, conteudo) {
  try {
    await githubRequest('PATCH', `/gists/${CONFIG.GIST_ID}`, {
      files: { [nomeArquivo]: { content: JSON.stringify(conteudo, null, 2) } },
    });
    return true;
  } catch (err) { console.error(`Erro ao salvar ${nomeArquivo}:`, err.message); return false; }
}

async function carregarXP() {
  const xpJson = await lerArquivoJsonDoGist('xp-data.json', {});
  for (const [userId, dados] of Object.entries(xpJson)) {
    xpData.set(userId, { xp: Number(dados.xp) || 0, nivel: Number(dados.nivel) || 1, msgs: Number(dados.msgs) || 0, username: dados.username || '', lastMsg: 0 });
  }
  console.log(`âœ… XP carregado â€” ${xpData.size} jogador(es)`);
}

async function salvarXP() {
  const xpJson = {};
  for (const [userId, dados] of xpData.entries()) xpJson[userId] = { xp: dados.xp, nivel: dados.nivel };
  return salvarArquivoJsonNoGist('xp-data.json', xpJson);
}

async function lerGist()             { return lerArquivoJsonDoGist('tower-deep-updates.json', { updates: [] }); }
async function salvarGist(dados)     { return salvarArquivoJsonNoGist('tower-deep-updates.json', dados); }
async function lerEnquetes()         { return lerArquivoJsonDoGist('enquetes.json', []); }
async function salvarEnquetes(lista) { return salvarArquivoJsonNoGist('enquetes.json', lista); }
async function lerRoadmap()          { return lerArquivoJsonDoGist('roadmap.json', []); }
async function salvarRoadmap(v)      { return salvarArquivoJsonNoGist('roadmap.json', v); }

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SISTEMA DE CÃ“DIGOS DE RESGATE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function lerCodigos()      { return lerArquivoJsonDoGist('codigos.json',  { codigos: [] }); }
async function salvarCodigos(d)  { return salvarArquivoJsonNoGist('codigos.json', d); }
async function lerVinculos()     { return lerArquivoJsonDoGist('vinculos.json', { vinculos: [] }); }
async function salvarVinculos(d) { return salvarArquivoJsonNoGist('vinculos.json', d); }

let _codigosCache = null;
let _vinculosCache = null;
let _cacheTTL = 0;
async function getCache() {
  if (!_codigosCache || Date.now() > _cacheTTL) {
    _codigosCache  = await lerCodigos();
    _vinculosCache = await lerVinculos();
    _cacheTTL      = Date.now() + 30000;
  }
  return { codigos: _codigosCache, vinculos: _vinculosCache };
}
function invalidarCache() { _codigosCache = null; _vinculosCache = null; _cacheTTL = 0; }

function gerarCodigo() {
  const prefixos = ['ZEUS','ARES','HADES','APOLO','ATENA','HERMES','POSEIDON','ARTEMIS'];
  const pref = prefixos[Math.floor(Math.random() * prefixos.length)];
  const rand = () => Math.random().toString(36).toUpperCase().slice(2,6).replace(/[^A-Z0-9]/g,'').padEnd(4,'X');
  return `${pref}-${rand()}-${rand()}`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CATÃLOGO DE ITENS DO JOGO (extraÃ­do de ItemConfig + SemideusItemConfig)
// Usado pelo /gencodigo para mostrar lista de itens reais
// Admin pode adicionar mais com /itemcadastrar
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TIPOS_RECOMPENSA = {
  moedas:        { emoji: 'ðŸª™', label: 'GodCoins',      unidade: 'GodCoins',    temLista: false },
  gemas:         { emoji: 'ðŸ’Ž', label: 'Gems',          unidade: 'Gems',        temLista: false },
  xp:            { emoji: 'âš¡', label: 'XP BÃ´nus',      unidade: 'XP',          temLista: false },
  presents:      { emoji: 'ðŸŽ', label: 'Presents',      unidade: 'Presents',    temLista: false },
  favor_greek:   { emoji: 'ðŸ›ï¸', label: 'Favor Grego',   unidade: 'Favor',       temLista: false },
  favor_norse:   { emoji: 'ðŸ›¡ï¸', label: 'Favor NÃ³rdico', unidade: 'Favor',       temLista: false },
  favor_egyptian:{ emoji: 'ðŸº', label: 'Favor EgÃ­pcio', unidade: 'Favor',       temLista: false },
  item:          { emoji: 'ðŸŽ', label: 'Item do Jogo', unidade: '',            temLista: true  },
};

const CATALOGO_GAME_PATHS = {
  itemConfig: path.resolve(__dirname, '../ReplicatedStorage/Modules/Config/ItemConfig.lua'),
  semideusConfig: path.resolve(__dirname, '../ReplicatedStorage/Modules/Config/SemideusItemConfig.lua'),
};

const SEMIDEUS_SECTION_CATEGORY = {
  EssenciasDivinas: 'Semideus > Essencias Divinas',
  DNACriaturas: 'Semideus > DNA de Criaturas',
  CristaisAlma: 'Semideus > Cristais de Alma',
  Catalisadores: 'Semideus > Catalisadores',
  ItensAuxiliares: 'Semideus > Itens Auxiliares',
};

function safeReadFileText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseItemConfigLua(filePath) {
  const raw = safeReadFileText(filePath);
  if (!raw) return [];

  const out = [];
  let current = null;

  const flush = () => {
    if (!current || !current.id) return;
    out.push({
      id: current.id,
      nome: current.nome || current.id,
      raridade: current.raridade || 'Common',
      categoria: `Base > ${current.categoria || 'Geral'}`,
    });
    current = null;
  };

  for (const lineRaw of raw.split(/\r?\n/)) {
    const line = lineRaw.trim();
    const id = line.match(/\bId\s*=\s*"([^"]+)"/);
    if (id) {
      flush();
      current = { id: id[1] };
    }
    if (!current) continue;

    const nome = line.match(/\bName\s*=\s*"([^"]+)"/);
    if (nome) current.nome = nome[1];
    const raridade = line.match(/\bRarity\s*=\s*"([^"]+)"/);
    if (raridade) current.raridade = raridade[1];
    const categoria = line.match(/\bCategory\s*=\s*"([^"]+)"/);
    if (categoria) current.categoria = categoria[1];
  }
  flush();
  return out;
}

function parseSemideusConfigLua(filePath) {
  const raw = safeReadFileText(filePath);
  if (!raw) return [];

  const out = [];
  let currentSection = null;
  let current = null;

  const flush = () => {
    if (!current || !current.id) return;
    out.push({
      id: current.id,
      nome: current.nome || current.id,
      raridade: current.raridade || 'Comum',
      categoria: SEMIDEUS_SECTION_CATEGORY[currentSection] || 'Semideus > Geral',
    });
    current = null;
  };

  for (const lineRaw of raw.split(/\r?\n/)) {
    const line = lineRaw.trim();

    const section = line.match(/^SemideusItemConfig\.(\w+)\s*=\s*{/);
    if (section) {
      flush();
      currentSection = section[1];
      continue;
    }

    if (!currentSection || !SEMIDEUS_SECTION_CATEGORY[currentSection]) continue;

    const id = line.match(/\bId\s*=\s*"([^"]+)"/);
    if (id) {
      flush();
      current = { id: id[1] };
    }
    if (!current) continue;

    const nome = line.match(/\bNome\s*=\s*"([^"]+)"/);
    if (nome) current.nome = nome[1];
    const raridade = line.match(/\bRaridade\s*=\s*"([^"]+)"/);
    if (raridade) current.raridade = raridade[1];
  }
  flush();
  return out;
}

function loadGameCatalog() {
  const baseItems = parseItemConfigLua(CATALOGO_GAME_PATHS.itemConfig);
  const semideusItems = parseSemideusConfigLua(CATALOGO_GAME_PATHS.semideusConfig);
  const merged = [...baseItems, ...semideusItems];
  const dedup = new Map();
  for (const item of merged) {
    if (!item?.id) continue;
    dedup.set(item.id, item);
  }
  return [...dedup.values()].sort((a, b) => {
    const ca = String(a.categoria || '');
    const cb = String(b.categoria || '');
    if (ca !== cb) return ca.localeCompare(cb, 'pt-BR');
    return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
  });
}

const CATALOGO_FIXO = loadGameCatalog();

const RARIDADE_EMOJI = {
  Common:'âšª', Uncommon:'ðŸŸ¢', Rare:'ðŸ”µ', Epic:'ðŸŸ£', Legendary:'ðŸŸ¡', Mythic:'ðŸ”´',
  Comum:'âšª',  Incomum:'ðŸŸ¢',  Raro:'ðŸ”µ', Epico:'ðŸŸ£', Lendario:'ðŸŸ¡', Primordial:'ðŸ’€', Variavel:'â¬œ',
};

// Helper â€” retorna lista de itens do catÃ¡logo (fixos + cadastrados) filtrados por categoria
async function getCatalogoCompleto() {
  const db = await lerCodigos();
  const extras = db.itensExtras || [];
  const merged = [...CATALOGO_FIXO, ...extras];
  const dedup = new Map();
  for (const it of merged) {
    if (!it?.id) continue;
    dedup.set(it.id, it);
  }
  return [...dedup.values()];
}

// Helper â€” formata item para exibiÃ§Ã£o no Discord
function formatarItem(item, qtd = 1) {
  const emoji = RARIDADE_EMOJI[item.raridade] || 'ðŸŽ';
  const qtdStr = qtd > 1 ? ` x${qtd}` : '';
  return `${emoji} **${item.nome}**${qtdStr} *(${item.raridade} â€” ${item.categoria})*`;
}

// SessÃµes de criaÃ§Ã£o de cÃ³digo por admin
const sessoescodigo = new Map();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPERS DE PERMISSÃƒO POR CARGO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function temCargo(member, ...cargos) {
  return cargos.some(id => id && member?.roles?.cache?.has(id));
}
function ehDono(member)   { return temCargo(member, CONFIG.CARGO_DONO); }
function ehAdmin(member)  { return temCargo(member, CONFIG.CARGO_DONO, CONFIG.CARGO_ADMIN); }
function ehMod(member)    { return temCargo(member, CONFIG.CARGO_DONO, CONFIG.CARGO_ADMIN, CONFIG.CARGO_MOD); }
function ehEquipe(member) { return temCargo(member, CONFIG.CARGO_DONO, CONFIG.CARGO_ADMIN, CONFIG.CARGO_MOD, CONFIG.CARGO_EQUIPE); }

async function getMember(message) {
  if (!message.guild) return null;
  return message.guild.members.fetch(message.author.id).catch(() => null);
}


function temPermissaoModeracao(interaction) {
  return interaction.member?.permissions?.has(PermissionFlagsBits.ManageMessages);
}

async function responderTextoLongo(messageOrInteraction, texto, isReply = true) {
  if (texto.length <= 2000) {
    if ('reply' in messageOrInteraction && isReply) return messageOrInteraction.reply(texto);
    if ('send'  in messageOrInteraction.channel)    return messageOrInteraction.channel.send(texto);
  }
  const partes = [];
  for (let i = 0; i < texto.length; i += 1900) partes.push(texto.slice(i, i + 1900));
  if ('reply' in messageOrInteraction && isReply) {
    await messageOrInteraction.reply(partes[0]);
    for (let i = 1; i < partes.length; i++) await messageOrInteraction.channel.send(partes[i]);
    return;
  }
  for (const parte of partes) await messageOrInteraction.channel.send(parte);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE TOKENS â€” ACESSO AO SITE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Mapa de cargos do Discord â†’ nÃ­vel no site
// Configure no Railway: CARGO_DONO, CARGO_ADMIN, CARGO_MOD, CARGO_EQUIPE
const NIVEIS_TOKEN = [
  { nivel: 'dono',      label: 'Dono',      emoji: 'ðŸ‘‘', corHex: 0xf0c060, cargoId: () => CONFIG.CARGO_DONO   },
  { nivel: 'admin',     label: 'Admin',     emoji: 'ðŸ”±', corHex: 0x3dd68c, cargoId: () => CONFIG.CARGO_ADMIN  },
  { nivel: 'moderador', label: 'Moderador', emoji: 'âš”ï¸', corHex: 0x4a9eff, cargoId: () => CONFIG.CARGO_MOD    },
  { nivel: 'equipe',    label: 'Equipe',    emoji: 'ðŸ›¡ï¸', corHex: 0xa78bfa, cargoId: () => CONFIG.CARGO_EQUIPE },
];

const PERMISSOES = {
  dono:      ['wiki.edit', 'wiki.delete', 'wiki.publish', 'painel.full', 'token.revogar'],
  admin:     ['wiki.edit', 'wiki.publish', 'painel.full'],
  moderador: ['wiki.view_exclusivo', 'bugs.report', 'bugs.view'],
  equipe:    ['wiki.view_exclusivo'],
};

const tokensAtivos    = new Map();
const TOKEN_DURACAO_MS = 60 * 60 * 1000; // 1 hora

function gerarToken() {
  const chars = 'abcdef0123456789';
  let token = 'TD-';
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

function detectarNivelToken(member) {
  for (const def of NIVEIS_TOKEN) {
    const cargoId = def.cargoId();
    if (cargoId && member.roles.cache.has(cargoId)) return def;
  }
  return null;
}

// Limpa tokens expirados a cada 5 min
setInterval(() => {
  const agora = Date.now();
  for (const [tk, dados] of tokensAtivos) {
    if (dados.expira < agora) tokensAtivos.delete(tk);
  }
}, 5 * 60 * 1000);

async function handleToken(message) {
  if (!message.guild) return message.reply('âš ï¸ Este comando sÃ³ funciona dentro do servidor.');

  let member;
  try { member = await message.guild.members.fetch(message.author.id); }
  catch { return message.reply('âŒ NÃ£o consegui verificar seus cargos. Tente novamente.'); }

  const nivelDef = detectarNivelToken(member);

  if (!nivelDef) {
    return message.reply(
      'ðŸš« **Acesso negado.**\n' +
      'VocÃª nÃ£o possui um cargo que permita gerar token de acesso.\n' +
      '*Fale com um administrador caso acredite que isto seja um erro.*'
    );
  }

  // Revoga token anterior do mesmo usuÃ¡rio
  for (const [tk, dados] of tokensAtivos) {
    if (dados.userId === message.author.id) tokensAtivos.delete(tk);
  }

  const token  = gerarToken();
  const expira = Date.now() + TOKEN_DURACAO_MS;
  tokensAtivos.set(token, {
    nivel:    nivelDef.nivel,
    userId:   message.author.id,
    username: message.author.username,
    expira,
    criadoEm: Date.now(),
  });

  const expiraStr = new Date(expira).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const perms     = PERMISSOES[nivelDef.nivel] || [];

  try {
    await message.author.send({
      embeds: [{
        color: nivelDef.corHex,
        title: `${nivelDef.emoji} Token de Acesso â€” Tower Deep`,
        description: `Seu token foi gerado com sucesso.\nUse-o na pÃ¡gina de acesso do site.\n\n\`\`\`\n${token}\n\`\`\``,
        fields: [
          { name: 'ðŸŽ–ï¸ NÃ­vel',      value: `${nivelDef.emoji} ${nivelDef.label}`, inline: true },
          { name: 'â±ï¸ VÃ¡lido atÃ©', value: expiraStr,                              inline: true },
          { name: 'ðŸ”‘ PermissÃµes', value: perms.map(p => `â€¢ \`${p}\``).join('\n') || 'â€”' },
        ],
        footer:    { text: 'âš ï¸ NÃ£o compartilhe este token com ninguÃ©m. Expira em 1 hora.' },
        timestamp: new Date().toISOString(),
      }]
    });

    await message.reply({
      embeds: [{
        color: nivelDef.corHex,
        title: `${nivelDef.emoji} Token gerado!`,
        description: `Verifique sua **DM** â€” o token foi enviado de forma privada.\nVÃ¡lido por **1 hora** Â· NÃ­vel: **${nivelDef.label}**`,
        footer: { text: 'Token anterior revogado automaticamente.' },
      }]
    });
  } catch {
    // DM bloqueada â€” exibe por 30s no canal
    const msg = await message.reply({
      embeds: [{
        color: 0xff5a5a,
        title: 'âš ï¸ DM bloqueada',
        description:
          `NÃ£o consegui te enviar DM. Abra temporariamente suas DMs.\n\n` +
          `**Token (apaga em 30s):**\n\`\`\`\n${token}\n\`\`\`\n` +
          `NÃ­vel: **${nivelDef.label}** Â· Expira Ã s **${expiraStr}**`,
        footer: { text: 'âš ï¸ Esta mensagem serÃ¡ apagada em 30 segundos.' },
      }]
    });
    setTimeout(() => msg.delete().catch(() => {}), 30000);
  }
}

async function handleRevogar(message, args) {
  if (!message.guild) return;
  let member;
  try { member = await message.guild.members.fetch(message.author.id); } catch { return; }
  const nivelDef = detectarNivelToken(member);
  if (!nivelDef || !PERMISSOES[nivelDef.nivel].includes('token.revogar')) {
    return message.reply('ðŸš« VocÃª nÃ£o tem permissÃ£o para revogar tokens.');
  }

  const userId = args[0]?.replace(/[<@!>]/g, '');
  if (!userId) {
    const lista = [...tokensAtivos.entries()]
      .filter(([, d]) => d.expira > Date.now())
      .map(([tk, d]) => {
        const mins = Math.ceil((d.expira - Date.now()) / 60000);
        return `â€¢ **${d.username}** (${d.nivel}) â€” expira em ${mins}min â€” \`${tk.slice(0, 12)}...\``;
      });
    return message.reply(
      lista.length
        ? `ðŸ”‘ **Tokens ativos (${lista.length}):**\n${lista.join('\n')}`
        : 'âœ… Nenhum token ativo no momento.'
    );
  }

  let revogados = 0;
  for (const [tk, dados] of tokensAtivos) {
    if (dados.userId === userId) { tokensAtivos.delete(tk); revogados++; }
  }
  return message.reply(revogados > 0
    ? `âœ… Token revogado para <@${userId}>.`
    : `âš ï¸ Nenhum token ativo encontrado para <@${userId}>.`
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SERVIDOR HTTP â€” validaÃ§Ã£o de tokens pelo site
//  O site envia: POST /validar-token  { token: "TD-..." }
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const servidor = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.method === 'POST' && req.url === '/validar-token') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { token } = JSON.parse(body);
        const dados     = tokensAtivos.get(token);

        if (!dados || dados.expira < Date.now()) {
          if (dados) tokensAtivos.delete(token);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'Token invÃ¡lido ou expirado.' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok:               true,
          nivel:            dados.nivel,
          username:         dados.username,
          permissoes:       PERMISSOES[dados.nivel] || [],
          expira:           dados.expira,
          minutosRestantes: Math.ceil((dados.expira - Date.now()) / 60000),
        }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, erro: 'JSON invÃ¡lido.' }));
      }
    });
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'online', tokens: tokensAtivos.size, uptime: Math.floor(process.uptime()) }));
  }

  // â”€â”€ Listar tokens ativos (apenas nÃ­vel admin/dono)
  if (req.method === 'GET' && req.url === '/tokens') {
    const lista = [];
    for (const [token, dados] of tokensAtivos.entries()) {
      lista.push({ token, nivel: dados.nivel, username: dados.username, expira: dados.expira });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, tokens: lista }));
  }

  // â”€â”€ Revogar token especÃ­fico
  if (req.method === 'POST' && req.url === '/revogar-token') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { token } = JSON.parse(body);
        const existed = tokensAtivos.has(token);
        tokensAtivos.delete(token);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, revogado: existed }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, erro: 'JSON invÃ¡lido.' }));
      }
    });
    return;
  }

  // â”€â”€ Revogar todos os tokens
  if (req.method === 'POST' && req.url === '/revogar-todos') {
    const total = tokensAtivos.size;
    tokensAtivos.clear();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, total }));
  }

  // â”€â”€ Limpar tokens expirados
  if (req.method === 'POST' && req.url === '/limpar-expirados') {
    let removidos = 0;
    const agora = Date.now();
    for (const [token, dados] of tokensAtivos.entries()) {
      if (dados.expira < agora) { tokensAtivos.delete(token); removidos++; }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, removidos }));
  }

  // â”€â”€ /roblox/resgatar â€” chamado pelo jogo Roblox
  if (req.method === 'POST' && req.url === '/roblox/resgatar') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { codigo, robloxId, robloxName, secret } = JSON.parse(body);

        // Valida chave secreta
        if (secret !== CONFIG.ROBLOX_API_SECRET) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'Chave secreta invÃ¡lida.' }));
        }

        if (!codigo || !robloxId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'codigo e robloxId sÃ£o obrigatÃ³rios.' }));
        }

        const codigoNorm = String(codigo).toUpperCase().trim();
        const robloxIdStr = String(robloxId);

        // Carrega dados
        const dbCodigos  = await lerCodigos();
        const dbVinculos = await lerVinculos();

        // Verifica vÃ­nculo Discord â†” Roblox
        const vinculo = dbVinculos.vinculos.find(v => v.robloxId === robloxIdStr);
        if (!vinculo) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'SEM_VINCULO', msg: 'Vincule sua conta no Discord antes de resgatar cÃ³digos! Use /vincular no servidor.' }));
        }

        // Busca o cÃ³digo
        const c = dbCodigos.codigos.find(x => x.id === codigoNorm);
        if (!c) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'INVALIDO', msg: 'CÃ³digo invÃ¡lido ou nÃ£o existe.' }));
        }
        if (!c.ativo) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'INATIVO', msg: 'Este cÃ³digo foi desativado.' }));
        }
        if (c.expira && new Date(c.expira) < new Date()) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'EXPIRADO', msg: 'Este cÃ³digo jÃ¡ expirou.' }));
        }
        // Verifica se jÃ¡ usou
        if (c.usadoPor?.some(u => u.robloxId === robloxIdStr)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'JA_USADO', msg: 'VocÃª jÃ¡ resgatou este cÃ³digo nesta conta.' }));
        }
        // Verifica max usos
        if (c.maxUsos > 0 && (c.usadoPor?.length || 0) >= c.maxUsos) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'ESGOTADO', msg: 'Este cÃ³digo atingiu o limite de resgates.' }));
        }

        // TUDO OK â€” registra o uso
        if (!c.usadoPor) c.usadoPor = [];
        c.usadoPor.push({ robloxId: robloxIdStr, robloxName: robloxName || '?', discordId: vinculo.discordId, usadoEm: new Date().toISOString() });
        await salvarCodigos(dbCodigos);
        invalidarCache();

        // Log no canal de tickets / log
        try {
          const guilds = client.guilds.cache.values();
          for (const g of guilds) {
            const canalLog = CONFIG.CANAL_LOG_TICKETS ? g.channels.cache.get(CONFIG.CANAL_LOG_TICKETS) : null;
            if (canalLog) {
              const embedLog = new EmbedBuilder()
                .setColor(0x3dd68c)
                .setTitle('ðŸŽ CÃ³digo Resgatado')
                .addFields(
                  { name: 'ðŸ”‘ CÃ³digo',    value: codigoNorm,                                  inline: true },
                  { name: 'ðŸŽ® Roblox',    value: robloxName || robloxIdStr,                   inline: true },
                  { name: 'ðŸ’¬ Discord',   value: `<@${vinculo.discordId}>`,                   inline: true },
                  { name: 'ðŸŽ€ Itens',     value: c.recompensas.map(r => r.label).join('\n'),  inline: false },
                )
                .setTimestamp();
              await canalLog.send({ embeds: [embedLog] });
            }
          }
        } catch {}

        // Responde com as recompensas para o jogo aplicar
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok:          true,
          msg:         `CÃ³digo resgatado com sucesso! ${c.descricao}`,
          recompensas: c.recompensas, // O jogo usa isso para conceder os itens
        }));

      } catch (err) {
        console.error('Erro /roblox/resgatar:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, erro: 'Erro interno do servidor.' }));
      }
    });
    return;
  }

  // â”€â”€ /roblox/vinculo/:robloxId â€” verifica se robloxId tem vÃ­nculo (usado pelo jogo)
  if (req.method === 'GET' && req.url.startsWith('/roblox/vinculo/')) {
    const robloxId = req.url.split('/').pop();
    const secret   = req.headers['x-secret'];
    if (secret !== CONFIG.ROBLOX_API_SECRET) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false }));
    }
    lerVinculos().then(db => {
      const vinculo = db.vinculos.find(v => v.robloxId === String(robloxId));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, vinculado: !!vinculo, discordId: vinculo?.discordId || null }));
    }).catch(() => {
      res.writeHead(500); res.end(JSON.stringify({ ok: false }));
    });
    return;
  }

  res.writeHead(404); res.end();
});

const PORTA = process.env.PORT || 3000;
servidor.listen(PORTA, () => console.log(`ðŸŒ Servidor de tokens ativo â€” porta ${PORTA}`));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GROK API
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function chamarClaude(mensagens, promptExtra = '') {
  return new Promise((resolve, reject) => {
    const sistema = CONHECIMENTO_DO_JOGO + (promptExtra ? '\n\n' + promptExtra : '');
    const body    = JSON.stringify({
      model:      'grok-3-mini-fast',
      max_tokens: 500,
      messages:   [{ role: 'system', content: sistema }, ...mensagens],
    });
    const req = https.request({
      hostname: 'api.x.ai',
      path:     '/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${CONFIG.GROK_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json  = JSON.parse(data);
          const texto = json.choices?.[0]?.message?.content;
          if (texto) resolve(texto);
          else reject(new Error('Resposta invÃ¡lida da API xAI.'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function detectarIntencao(texto) {
  const t = texto.toLowerCase();
  const ehSugestao = ['sugest','ideia','deveria ter','podia ter','seria legal','que tal','por que nÃ£o','adicionem','coloquem'].some(p => t.includes(p));
  const ehSuporte  = ['bug','erro','nÃ£o funciona','nao funciona','travou','crash','problema','nÃ£o consigo','nao consigo','como faÃ§o','como faz','como funciona','nÃ£o abre','nao abre'].some(p => t.includes(p));
  if (ehSugestao) return 'sugestao';
  if (ehSuporte)  return 'suporte';
  return 'pergunta';
}

async function responderComIA(message, pergunta) {
  const userId   = message.author.id;
  const intencao = detectarIntencao(pergunta);

  if (!historicos.has(userId)) historicos.set(userId, []);
  const historico = historicos.get(userId);

  const promptsExtras = {
    sugestao: `O jogador estÃ¡ fazendo uma SUGESTÃƒO.\nAnalise com sabedoria:\n1. Diga se Ã© viÃ¡vel para um Tower Defense\n2. Aponte pontos positivos\n3. Mencione possÃ­veis desafios\n4. DÃª uma nota de viabilidade: â˜…â˜†â˜†â˜†â˜† a â˜…â˜…â˜…â˜…â˜…\n5. Sugira como melhorar a ideia\nSeja construtivo e entusiasmado.`,
    suporte:  `O jogador estÃ¡ com um PROBLEMA ou DÃšVIDA TÃ‰CNICA.\nResponda de forma direta:\n1. Identifique o problema\n2. OfereÃ§a a soluÃ§Ã£o mais provÃ¡vel\n3. Se nÃ£o souber, peÃ§a mais detalhes ou oriente a aguardar um moderador\nSeja eficiente â€” jogadores com problema querem soluÃ§Ã£o rÃ¡pida.`,
    pergunta: `O jogador estÃ¡ fazendo uma PERGUNTA GERAL sobre o jogo.\nResponda de forma completa mas concisa.\nSe a resposta nÃ£o estiver no seu conhecimento, diga honestamente que nÃ£o sabe.`,
  };

  historico.push({ role: 'user', content: pergunta });
  if (historico.length > MAX_HISTORICO) historico.splice(0, historico.length - MAX_HISTORICO);

  await message.channel.sendTyping();

  try {
    const resposta = await chamarClaude([...historico], promptsExtras[intencao]);
    historico.push({ role: 'assistant', content: resposta });
    const prefixos = {
      sugestao: 'ðŸ”® **AnÃ¡lise do OrÃ¡culo:**\n\n',
      suporte:  'âš¡ **O OrÃ¡culo responde:**\n\n',
      pergunta: 'âœ¨ **O OrÃ¡culo fala:**\n\n',
    };
    await responderTextoLongo(message, prefixos[intencao] + resposta, true);
  } catch (err) {
    console.error('Erro na IA:', err.message);
    await message.reply('âš ï¸ Os ventos do Olimpo perturbaram a visÃ£o do OrÃ¡culo. Tente novamente em instantes.');
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FORMULÃRIO DE UPDATE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function iniciarFormulario(message) {
  const userId = message.author.id;
  if (sessoes.has(userId)) return message.reply('âš ï¸ *Mortal, um decreto jÃ¡ estÃ¡ sendo redigido! Proclama `cancelar` para encerrar o ritual atual antes de iniciar outro.*');
  sessoes.set(userId, { etapa: 'versao', dados: {} });
  await message.reply('âš¡ **OS DEUSES CONVOCAM UM NOVO DECRETO**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n*Os pergaminhos do Olimpo aguardam suas palavras...*\n\nDigite `cancelar` a qualquer momento para silenciar os deuses.\n\n**â€” Pergaminho I de VII â€” A VersÃ£o â€”**\nQual selo carregarÃ¡ este decreto? *(ex: v0.4.0)*');
}

async function processarEtapa(message) {
  const userId = message.author.id;
  const sessao = sessoes.get(userId);
  if (!sessao) return;
  const texto = message.content.trim();
  if (texto.toLowerCase() === 'cancelar') { sessoes.delete(userId); return message.reply('ðŸŒ‘ *Os pergaminhos foram lanÃ§ados Ã s chamas... O decreto foi esquecido pelos deuses.*'); }
  const { etapa, dados } = sessao;

  if (etapa === 'versao') { dados.versao = texto.startsWith('v') ? texto : `v${texto}`; sessao.etapa = 'titulo'; return message.reply('âš¡ *O selo foi gravado nos pergaminhos.*\n\n**â€” Pergaminho II de VII â€” O TÃ­tulo â€”**\nCom que nome os mortais conhecerÃ£o este decreto?'); }
  if (etapa === 'titulo') { dados.titulo = texto; sessao.etapa = 'subtitulo'; return message.reply('âš¡ *O tÃ­tulo ecoa pelos salÃµes do Olimpo.*\n\n**â€” Pergaminho III de VII â€” A Profecia â€”**\nUma frase sÃ¡bia para acompanhar o decreto... *(ou `pular`)*'); }
  if (etapa === 'subtitulo') {
    dados.subtitulo = texto.toLowerCase() === 'pular' ? '' : texto;
    sessao.etapa = 'tags';
    const lista = Object.entries(TAGS).map(([n, t]) => `**${n}** â€” ${t.label}`).join('\n');
    return message.reply('âš¡ *As palavras foram inscritas.*\n\n**â€” Pergaminho IV de VII â€” Os Estandartes â€”**\nQuais sÃ­mbolos divinos carregarÃ£o este decreto? *(ex: 1,3)*\n\n' + lista);
  }
  if (etapa === 'tags') {
    dados.tags = texto.split(',').map(s => s.trim()).filter(n => TAGS[n]).map(n => TAGS[n].key);
    if (!dados.tags.length) dados.tags = ['novo'];
    sessao.etapa = 'mudancas'; dados.mudancas = [];
    return message.reply('âš¡ *Os estandartes foram hasteados.*\n\n**â€” Pergaminho V de VII â€” As Obras dos Deuses â€”**\nRelate cada mudanÃ§a, uma por mensagem.\nQuando terminar, proclame: `pronto`');
  }
  if (etapa === 'mudancas') {
    if (texto.toLowerCase() === 'pronto') {
      if (!dados.mudancas.length) return message.reply('âš ï¸ *Os deuses exigem ao menos uma obra registrada, mortal.*');
      sessao.etapa = 'imagem';
      return message.reply(`âš¡ *${dados.mudancas.length} obra(s) registrada(s) nos pergaminhos eternos.*\n\n**â€” Pergaminho VI de VII â€” A VisÃ£o â€”**\nðŸ“¸ Anexa uma **imagem** para ilustrar este decreto *(ou digita \`pular\`)*\n*A imagem aparecerÃ¡ no site do changelog!*`);
    }
    dados.mudancas.push(texto);
    return message.react('âœ…').catch(() => {});
  }
  if (etapa === 'imagem') {
    // Verifica se hÃ¡ imagem anexada
    const anexo = message.attachments.first();
    if (texto.toLowerCase() === 'pular' || !anexo) {
      dados.imagem = null;
    } else {
      const url = anexo.url;
      const ehImagem = /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
      if (!ehImagem) {
        return message.reply('âš ï¸ *Apenas imagens sÃ£o aceitas (png, jpg, gif, webp). Tenta novamente ou digita `pular`.*');
      }
      dados.imagem = url;
      await message.react('ðŸ–¼ï¸').catch(() => {});
    }
    sessao.etapa = 'proximo';
    return message.reply(`âš¡ *${dados.imagem ? 'Imagem registrada nos pergaminhos.' : 'Sem imagem â€” os deuses preferem o texto puro.'}*\n\n**â€” Pergaminho VII de VII â€” O Horizonte â€”**\nHÃ¡ visÃµes do prÃ³ximo decreto? *(ou \`pular\`)*`);
  }
  if (etapa === 'proximo') {
    dados.proximo = texto.toLowerCase() === 'pular' ? null : texto;
    sessao.etapa  = 'confirmacao';
    const tagLabels = dados.tags.map(t => Object.values(TAGS).find(x => x.key === t)?.label || t).join(', ');
    return message.reply(
      `ðŸ”± **O DECRETO ESTÃ PRONTO PARA SER PROCLAMADO**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
      `âš”ï¸ **VersÃ£o:** ${dados.versao}\nðŸ“– **TÃ­tulo:** ${dados.titulo}\nðŸŒŸ **Profecia:** ${dados.subtitulo || '*(silÃªncio dos deuses)*'}\n` +
      `ðŸ›ï¸ **Estandartes:** ${tagLabels}\nðŸ“œ **Obras:** ${dados.mudancas.length} registrada(s)\n` +
      `ðŸ–¼ï¸ **Imagem:** ${dados.imagem ? 'âœ… Anexada' : 'âŒ Nenhuma'}\n` +
      `ðŸ”® **Horizonte:** ${dados.proximo || '*(os orÃ¡culos silenciam)*'}\n` +
      `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n*Proclame* **\`confirmar\`** *para gravar nos anais eternos, ou* **\`cancelar\`** *para retornar ao silÃªncio.*`
    );
  }
  if (etapa === 'confirmacao') {
    if (texto.toLowerCase() !== 'confirmar') { sessoes.delete(userId); return message.reply('ðŸŒ‘ *Que assim seja... O decreto retorna ao silÃªncio eterno.*'); }
    await message.reply('âš¡ *Os trovÃµes de Zeus ressoam... O decreto estÃ¡ sendo gravado nos anais eternos do Olimpo...*');
    try {
      const dadosAtuais = await lerGist();
      const mes         = new Date().toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      dadosAtuais.updates = dadosAtuais.updates || [];
      dadosAtuais.updates.unshift({ id: Date.now(), versao: dados.versao, titulo: dados.titulo, subtitulo: dados.subtitulo, tags: dados.tags, mudancas: dados.mudancas, imagem: dados.imagem || null, data: mes });
      if (dados.proximo) dadosAtuais.proximaUpdate = dados.proximo;
      const ok = await salvarGist(dadosAtuais);
      if (!ok) throw new Error('Falha ao salvar update no Gist.');
      sessoes.delete(userId);
      await message.reply(`ðŸ”± **DECRETO PROCLAMADO!**\n*Os deuses selaram* **${dados.versao} â€” ${dados.titulo}** *nos pergaminhos eternos.*`);
      if (CONFIG.CANAL_ANUNCIO_ID) {
        try {
          const canalAnuncio = await client.channels.fetch(CONFIG.CANAL_ANUNCIO_ID);
          if (canalAnuncio?.isTextBased()) {
            const tagLabels     = dados.tags.map(t => Object.values(TAGS).find(x => x.key === t)?.label || t).join('  ');
            const mudancasTexto = dados.mudancas.map(m => `> âš¡ ${m}`).join('\n');

            const embedUpdate = new EmbedBuilder()
              .setColor(0xc9a84c)
              .setTitle(`âš¡ ${dados.versao} â€” ${dados.titulo}`)
              .setDescription(
                (dados.subtitulo ? `*"${dados.subtitulo}"*\n\n` : '') +
                `${tagLabels}\n\n` +
                `**ðŸ“œ Obras dos Deuses**\n${mudancasTexto}` +
                (dados.proximo ? `\n\n**ðŸ”® PrÃ³xima AtualizaÃ§Ã£o**\n> ${dados.proximo}` : '')
              )
              .setFooter({ text: 'Tower Deep Â· Alpha' })
              .setTimestamp();

            // Adiciona imagem ao embed se houver
            if (dados.imagem) embedUpdate.setImage(dados.imagem);

            const botoesUpdate = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel('ðŸŒ Site Oficial').setURL('https://italozkv.github.io/tower-deep/').setStyle(ButtonStyle.Link),
              new ButtonBuilder().setLabel('ðŸ“œ Changelog Completo').setURL('https://italozkv.github.io/tower-deep/changelog.html').setStyle(ButtonStyle.Link),
              new ButtonBuilder().setLabel('ðŸ—³ï¸ Votar em Features').setURL('https://italozkv.github.io/tower-deep/votos.html').setStyle(ButtonStyle.Link),
            );

            await canalAnuncio.send({ content: '@everyone', embeds: [embedUpdate], components: [botoesUpdate] });
          }
        } catch (err) { console.error('Erro ao anunciar update:', err.message); }
      }
    } catch (err) {
      console.error(err); sessoes.delete(userId);
      await message.reply('âš ï¸ *Os ventos do Ã‰rebo interferiram na proclamaÃ§Ã£o. Tente novamente.*');
    }
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SISTEMA DE TICKETS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Mapa em memÃ³ria: channelId â†’ dados do ticket
const ticketsAtivos = new Map();

// Contador persistente de tickets
let ticketContador = 1;

async function carregarTickets() {
  const dados = await lerArquivoJsonDoGist('tickets.json', { contador: 1, tickets: [] });
  ticketContador = dados.contador || 1;
  for (const t of (dados.tickets || [])) {
    if (t.status !== 'fechado') ticketsAtivos.set(t.channelId, t);
  }
  console.log(`ðŸŽ« Tickets carregados â€” ${ticketsAtivos.size} aberto(s), contador: ${ticketContador}`);
}

async function salvarTickets() {
  const lista = [...ticketsAtivos.values()];
  return salvarArquivoJsonNoGist('tickets.json', { contador: ticketContador, tickets: lista });
}

// Categorias de ticket
const CATEGORIAS_TICKET = {
  suporte:   { label: 'ðŸ› ï¸ Suporte',    emoji: 'ðŸ› ï¸', cor: 0x4a9eff, descricao: 'DÃºvidas e ajuda geral com o jogo' },
  bug:       { label: 'ðŸ› Bug',         emoji: 'ðŸ›', cor: 0xff5a5a, descricao: 'Reportar um bug ou problema tÃ©cnico' },
  apelacao:  { label: 'âš–ï¸ ApelaÃ§Ã£o',   emoji: 'âš–ï¸', cor: 0xf0c060, descricao: 'Recorrer de uma puniÃ§Ã£o recebida' },
  parceria:  { label: 'ðŸ¤ Parceria',   emoji: 'ðŸ¤', cor: 0x3dd68c, descricao: 'Proposta de parceria ou colaboraÃ§Ã£o' },
  outro:     { label: 'ðŸ“œ Outro',       emoji: 'ðŸ“œ', cor: 0xa78bfa, descricao: 'Outros assuntos nÃ£o listados acima' },
};

// Notas de avaliaÃ§Ã£o
const AVALIACOES = {
  'â­': 1, 'â­â­': 2, 'â­â­â­': 3, 'â­â­â­â­': 4, 'â­â­â­â­â­': 5,
};

// Envia o painel de abertura de tickets para um canal
async function enviarPainelTicket(channel) {
  const embed = new EmbedBuilder()
    .setColor(0xc9a84c)
    .setTitle('âš¡ TRIBUNAL DO OLIMPO â€” Suporte')
    .setDescription(
      '*Os deuses do Olimpo estÃ£o prontos para te ouvir, mortal.*\n\n' +
      '**Selecione o assunto do teu chamado** no menu abaixo.\n' +
      'Uma cÃ¢mara privada serÃ¡ aberta somente para ti e nossa equipe.\n\n' +
      'â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n' +
      'ðŸ› ï¸ **Suporte** â€” DÃºvidas e ajuda geral\n' +
      'ðŸ› **Bug** â€” Problemas e erros no jogo\n' +
      'âš–ï¸ **ApelaÃ§Ã£o** â€” Recorrer de puniÃ§Ãµes\n' +
      'ðŸ¤ **Parceria** â€” Propostas e colaboraÃ§Ãµes\n' +
      'ðŸ“œ **Outro** â€” Demais assuntos\n' +
      'â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”'
    )
    .setFooter({ text: 'Tower Deep Â· NÃ£o abra tickets desnecessÃ¡rios.' })
    .setTimestamp();

  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_criar')
      .setPlaceholder('âš¡ Selecione o assunto do teu chamado...')
      .addOptions(
        Object.entries(CATEGORIAS_TICKET).map(([value, cat]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(cat.label)
            .setDescription(cat.descricao)
            .setValue(value)
            .setEmoji(cat.emoji)
        )
      )
  );

  await channel.send({ embeds: [embed], components: [menu] });
}

// Abre o canal do ticket
async function abrirTicket(interaction, categoria) {
  const guild   = interaction.guild;
  const user    = interaction.user;
  const catInfo = CATEGORIAS_TICKET[categoria];

  // Verifica se o usuÃ¡rio jÃ¡ tem um ticket aberto
  const ticketExistente = [...ticketsAtivos.values()].find(
    t => t.userId === user.id && t.status === 'aberto'
  );
  if (ticketExistente) {
    const canalExistente = guild.channels.cache.get(ticketExistente.channelId);
    return interaction.reply({
      content: `âš ï¸ *Mortal, tu jÃ¡ tens uma cÃ¢mara aberta!* ${canalExistente ? `â†’ ${canalExistente}` : ''}\n*Resolve o chamado atual antes de abrir outro.*`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  // Monta permissÃµes do canal
  const permissoes = [
    { id: guild.id,  deny:  [PermissionFlagsBits.ViewChannel] }, // @everyone nÃ£o vÃª
    { id: user.id,   allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  // Dono, Admin, Mod, Equipe veem o canal
  for (const [chave, id] of Object.entries({ CARGO_DONO: CONFIG.CARGO_DONO, CARGO_ADMIN: CONFIG.CARGO_ADMIN, CARGO_MOD: CONFIG.CARGO_MOD, CARGO_EQUIPE: CONFIG.CARGO_EQUIPE })) {
    if (id) permissoes.push({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
  }

  const numero = ticketContador++;
  const nomeCanal = `ticket-${numero.toString().padStart(4, '0')}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`;

  let canal;
  try {
    const options = {
      name: nomeCanal,
      type: ChannelType.GuildText,
      permissionOverwrites: permissoes,
      topic: `${catInfo.emoji} ${catInfo.label} | ${user.tag} | Ticket #${numero}`,
    };
    if (CONFIG.CATEGORIA_TICKETS) options.parent = CONFIG.CATEGORIA_TICKETS;
    canal = await guild.channels.create(options);
  } catch (err) {
    console.error('Erro ao criar canal de ticket:', err.message);
    return interaction.editReply({ content: 'âš ï¸ *Os deuses nÃ£o conseguiram abrir a cÃ¢mara. Verifique as permissÃµes do bot.*' });
  }

  // Registra o ticket
  const ticket = {
    id:          numero,
    channelId:   canal.id,
    userId:      user.id,
    username:    user.tag,
    categoria,
    status:      'aberto',
    abertoPor:   user.id,
    criadoEm:    Date.now(),
    fechadoEm:   null,
    resolvidoPor: null,
    avaliacao:   null,
    mensagens:   [],
  };
  ticketsAtivos.set(canal.id, ticket);
  salvarTickets().catch(err => console.error('Erro ao salvar tickets:', err.message));

  // Embed de abertura no canal do ticket
  const embedAbertura = new EmbedBuilder()
    .setColor(catInfo.cor)
    .setTitle(`${catInfo.emoji} Ticket #${numero} â€” ${catInfo.label}`)
    .setDescription(
      `Bem-vindo, ${user}!\n\n` +
      `*Os deuses do Olimpo te ouvem, mortal.*\n\n` +
      `**Descreve teu problema com o mÃ¡ximo de detalhes possÃ­vel.**\n` +
      `Nossa equipe responderÃ¡ o mais breve possÃ­vel.`
    )
    .addFields(
      { name: 'ðŸ“‹ Categoria',  value: catInfo.label,                                      inline: true },
      { name: 'ðŸ‘¤ Aberto por', value: user.tag,                                           inline: true },
      { name: 'ðŸ• Aberto em',  value: `<t:${Math.floor(Date.now() / 1000)}:F>`,           inline: false },
    )
    .setFooter({ text: 'Tower Deep Â· Use os botÃµes abaixo para gerenciar este ticket.' })
    .setTimestamp();

  const botoesLink = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('ðŸŒ Site Oficial')
      .setURL('https://italozkv.github.io/tower-deep/')
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel('ðŸ“– Wiki')
      .setURL('https://italozkv.github.io/tower-deep/wiki.html')
      .setStyle(ButtonStyle.Link),
  );

  // BotÃµes de controle
  const botoesControle = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_fechar').setLabel('ðŸ”’ Fechar Ticket').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_resolver').setLabel('âœ… Marcar Resolvido').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_assumir').setLabel('âš”ï¸ Assumir').setStyle(ButtonStyle.Secondary),
  );

  await canal.send({ content: `${user} | <@&${CONFIG.CARGO_SUPORTE || CONFIG.CARGO_MOD || ''}>`, embeds: [embedAbertura], components: [botoesControle, botoesLink] });

  await interaction.editReply({
    content: `${catInfo.emoji} *A cÃ¢mara foi aberta, mortal!* â†’ ${canal}\n*Dirija-se atÃ© lÃ¡ para falar com nossa equipe.*`,
  });

  // Log no canal de logs
  await logTicket(guild, `ðŸŽ« **Ticket Aberto** â€” #${numero}\nðŸ‘¤ **UsuÃ¡rio:** ${user.tag}\nðŸ“‹ **Categoria:** ${catInfo.label}\nðŸ“Œ **Canal:** ${canal}`);
}

// Fecha o ticket (com transcriÃ§Ã£o)
async function fecharTicket(interaction, ticket) {
  const guild = interaction.guild;
  const canal = interaction.channel;

  if (ticket.status === 'fechado') {
    return interaction.reply({ content: 'âš ï¸ *Este ticket jÃ¡ estÃ¡ fechado.*', ephemeral: true });
  }

  await interaction.deferReply();

  // Coleta transcriÃ§Ã£o
  let transcricao = `ðŸ“œ TRANSCRIÃ‡ÃƒO â€” Ticket #${ticket.id}\n`;
  transcricao    += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n`;
  transcricao    += `ðŸ‘¤ Aberto por: ${ticket.username}\n`;
  transcricao    += `ðŸ“‹ Categoria: ${CATEGORIAS_TICKET[ticket.categoria]?.label || ticket.categoria}\n`;
  transcricao    += `ðŸ• Aberto em: ${new Date(ticket.criadoEm).toLocaleString('pt-BR')}\n`;
  transcricao    += `ðŸ”’ Fechado em: ${new Date().toLocaleString('pt-BR')}\n`;
  transcricao    += `ðŸ”’ Fechado por: ${interaction.user.tag}\n`;
  transcricao    += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n`;

  try {
    const msgs = await canal.messages.fetch({ limit: 100 });
    const msgsOrdenadas = [...msgs.values()].reverse();
    for (const m of msgsOrdenadas) {
      if (m.author.bot && m.embeds.length > 0) continue;
      transcricao += `[${new Date(m.createdTimestamp).toLocaleTimeString('pt-BR')}] ${m.author.tag}: ${m.content || '[embed/arquivo]'}\n`;
    }
  } catch { transcricao += '*(NÃ£o foi possÃ­vel coletar mensagens)*\n'; }

  // Atualiza status
  ticket.status    = 'fechado';
  ticket.fechadoEm = Date.now();
  ticketsAtivos.delete(canal.id);
  await salvarTickets().catch(() => {});

  // Embed de fechamento
  const embedFechado = new EmbedBuilder()
    .setColor(0x555555)
    .setTitle(`ðŸ”’ Ticket #${ticket.id} Fechado`)
    .setDescription(
      `*A cÃ¢mara foi selada pelos deuses do Olimpo.*\n\n` +
      `**Fechado por:** ${interaction.user.tag}\n` +
      `**Fechado em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
      `*O canal serÃ¡ deletado em 10 segundos.*`
    )
    .setColor(0x555555);

  await interaction.editReply({ embeds: [embedFechado] });

  // Envia transcriÃ§Ã£o para o usuÃ¡rio (DM)
  try {
    const userObj = await guild.members.fetch(ticket.userId);
    if (userObj) {
      await userObj.send({
        content: `ðŸ”’ **Teu ticket #${ticket.id} foi fechado.**\n\nSegue a transcriÃ§Ã£o da conversa:\n\`\`\`\n${transcricao.slice(0, 1800)}\n\`\`\``,
      });

      // Envia avaliaÃ§Ã£o por DM
      await enviarAvaliacaoDM(userObj.user, ticket);
    }
  } catch { /* DM bloqueada */ }

  // Log + transcriÃ§Ã£o completa
  await logTicket(guild,
    `ðŸ”’ **Ticket Fechado** â€” #${ticket.id}\nðŸ‘¤ **UsuÃ¡rio:** ${ticket.username}\nðŸ”’ **Fechado por:** ${interaction.user.tag}`,
    transcricao
  );

  // Deleta o canal apÃ³s 10 segundos
  setTimeout(() => canal.delete(`Ticket #${ticket.id} fechado`).catch(() => {}), 10000);
}

// Envia DM de avaliaÃ§Ã£o ao usuÃ¡rio
async function enviarAvaliacaoDM(user, ticket) {
  try {
    const embed = new EmbedBuilder()
      .setColor(0xc9a84c)
      .setTitle('â­ Avalie o Atendimento â€” Tower Deep')
      .setDescription(
        `*Teu ticket #${ticket.id} foi encerrado.*\n\n` +
        `Como foi o atendimento da nossa equipe?\n` +
        `Seleciona uma nota abaixo â€” tua opiniÃ£o Ã© divina para nÃ³s! ðŸ™`
      )
      .setFooter({ text: 'Tower Deep Â· AvaliaÃ§Ã£o expira em 24h' });

    const botoesAvaliacao = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`avaliar_1_${ticket.id}`).setLabel('â­').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_2_${ticket.id}`).setLabel('â­â­').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_3_${ticket.id}`).setLabel('â­â­â­').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_4_${ticket.id}`).setLabel('â­â­â­â­').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_5_${ticket.id}`).setLabel('â­â­â­â­â­').setStyle(ButtonStyle.Primary),
    );

    await user.send({ embeds: [embed], components: [botoesAvaliacao] });
  } catch { /* DM bloqueada */ }
}

// Registra log no canal de logs
async function logTicket(guild, mensagem, transcricao = null) {
  if (!CONFIG.CANAL_LOG_TICKETS) return;
  try {
    const canalLog = await guild.channels.fetch(CONFIG.CANAL_LOG_TICKETS);
    if (!canalLog?.isTextBased()) return;
    await canalLog.send(mensagem);
    if (transcricao && transcricao.length > 0) {
      const partes = [];
      for (let i = 0; i < transcricao.length; i += 1900) partes.push(transcricao.slice(i, i + 1900));
      for (const parte of partes) await canalLog.send(`\`\`\`\n${parte}\n\`\`\``).catch(() => {});
    }
  } catch (err) { console.error('Erro ao logar ticket:', err.message); }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SLASH COMMANDS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const slashCommands = [
  new SlashCommandBuilder().setName('bug').setDescription('ðŸ› Reportar uma anomalia divina ao Olimpo'),
  new SlashCommandBuilder().setName('sugestao').setDescription('ðŸ’¡ Enviar uma visÃ£o para os deuses do Olimpo'),
  new SlashCommandBuilder().setName('rank').setDescription('ðŸ† Consultar teu tÃ­tulo divino no Olimpo'),
  new SlashCommandBuilder()
    .setName('limpar').setDescription('ðŸ§¹ Apagar mensagens do canal (apenas moderadores)')
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantas mensagens apagar').setRequired(true)
      .addChoices({ name: 'Ãšltimas 10 mensagens', value: 10 }, { name: 'Ãšltimas 100 mensagens', value: 100 })),
  new SlashCommandBuilder()
    .setName('anunciar').setDescription('ðŸ“¢ Fazer um anÃºncio no canal atual')
    .addStringOption(opt => opt.setName('mensagem').setDescription('O conteÃºdo do anÃºncio').setRequired(true))
    .addStringOption(opt => opt.setName('titulo').setDescription('TÃ­tulo do anÃºncio (opcional)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('enquete').setDescription('ðŸ—³ï¸ Criar enquete vinculada ao site (votos.html)')
    .addStringOption(opt => opt.setName('titulo').setDescription('TÃ­tulo da feature/enquete').setRequired(true))
    .addStringOption(opt => opt.setName('descricao').setDescription('DescriÃ§Ã£o da feature').setRequired(true))
    .addStringOption(opt => opt.setName('categoria').setDescription('Categoria').setRequired(true)
      .addChoices(
        { name: 'âš”ï¸ Torre', value: 'torre' },{ name: 'ðŸ—ºï¸ Mapa', value: 'mapa' },
        { name: 'âš™ï¸ MecÃ¢nica', value: 'mecanica' },{ name: 'ðŸŽ‰ Evento', value: 'evento' },{ name: 'ðŸ”§ Outro', value: 'outro' }
      )),
  new SlashCommandBuilder()
    .setName('roadmap').setDescription('ðŸ—ºï¸ Gerenciar o roadmap do jogo')
    .addSubcommand(sub => sub.setName('adicionar').setDescription('Adicionar nova versÃ£o ao roadmap')
      .addStringOption(opt => opt.setName('versao').setDescription('Ex: v0.6').setRequired(true))
      .addStringOption(opt => opt.setName('titulo').setDescription('Ex: A Chegada de Apolo').setRequired(true))
      .addStringOption(opt => opt.setName('status').setDescription('Status da versÃ£o').setRequired(true)
        .addChoices({ name: 'âœ“ ConcluÃ­do', value: 'done' },{ name: 'âš¡ Em Desenvolvimento', value: 'active' },{ name: 'â—‡ Planejado', value: 'planned' },{ name: 'â—‡ Futuro', value: 'future' }))
      .addStringOption(opt => opt.setName('data').setDescription('Ex: Abr 2026').setRequired(false))
      .addStringOption(opt => opt.setName('lore').setDescription('Frase Ã©pica da versÃ£o').setRequired(false)))
    .addSubcommand(sub => sub.setName('item').setDescription('Adicionar item a uma versÃ£o do roadmap')
      .addStringOption(opt => opt.setName('versao').setDescription('VersÃ£o alvo (ex: v0.6)').setRequired(true))
      .addStringOption(opt => opt.setName('texto').setDescription('DescriÃ§Ã£o do item').setRequired(true))
      .addStringOption(opt => opt.setName('badge').setDescription('Badge do item').setRequired(false)
        .addChoices({ name: 'Novo', value: 'Novo' },{ name: 'Divino', value: 'Divino' },{ name: 'Fix', value: 'Fix' },{ name: 'Evento', value: 'Evento' })))
    .addSubcommand(sub => sub.setName('concluir').setDescription('Marcar item como concluÃ­do')
      .addStringOption(opt => opt.setName('versao').setDescription('VersÃ£o (ex: v0.4)').setRequired(true))
      .addStringOption(opt => opt.setName('item').setDescription('Parte do texto do item a marcar').setRequired(true)))
    .addSubcommand(sub => sub.setName('status').setDescription('Mudar status de uma versÃ£o')
      .addStringOption(opt => opt.setName('versao').setDescription('VersÃ£o (ex: v0.4)').setRequired(true))
      .addStringOption(opt => opt.setName('status').setDescription('Novo status').setRequired(true)
        .addChoices({ name: 'âœ“ ConcluÃ­do', value: 'done' },{ name: 'âš¡ Em Desenvolvimento', value: 'active' },{ name: 'â—‡ Planejado', value: 'planned' },{ name: 'â—‡ Futuro', value: 'future' }))),
  new SlashCommandBuilder()
    .setName('changelog').setDescription('ðŸ“œ Gerenciar os changelogs do site')
    .addSubcommand(sub => sub.setName('listar').setDescription('ðŸ“‹ Listar todos os changelogs publicados'))
    .addSubcommand(sub => sub.setName('apagar').setDescription('ðŸ—‘ï¸ Apagar um changelog pelo nÃºmero')
      .addIntegerOption(opt => opt.setName('numero').setDescription('NÃºmero do changelog na lista (use /changelog listar para ver)').setRequired(true)))
    .addSubcommand(sub => sub.setName('editar').setDescription('âœï¸ Editar tÃ­tulo ou subtÃ­tulo de um changelog')
      .addIntegerOption(opt => opt.setName('numero').setDescription('NÃºmero do changelog na lista').setRequired(true))
      .addStringOption(opt => opt.setName('campo').setDescription('Campo a editar').setRequired(true)
        .addChoices(
          { name: 'ðŸ“– TÃ­tulo',    value: 'titulo'    },
          { name: 'ðŸŒŸ SubtÃ­tulo', value: 'subtitulo' },
          { name: 'ðŸ–¼ï¸ Imagem (URL)', value: 'imagem' },
          { name: 'ðŸ”® PrÃ³xima update', value: 'proximo' },
        ))
      .addStringOption(opt => opt.setName('valor').setDescription('Novo valor para o campo').setRequired(true)))
    .addSubcommand(sub => sub.setName('imagem').setDescription('ðŸ–¼ï¸ Adicionar/trocar imagem de um changelog')
      .addIntegerOption(opt => opt.setName('numero').setDescription('NÃºmero do changelog na lista').setRequired(true))
      .addAttachmentOption(opt => opt.setName('imagem').setDescription('Nova imagem para o changelog').setRequired(true))),
  new SlashCommandBuilder()
    .setName('ticket').setDescription('ðŸŽ« Sistema de tickets de suporte')
    .addSubcommand(sub => sub.setName('painel').setDescription('ðŸ“‹ Enviar painel de abertura de tickets para este canal (staff)'))
    .addSubcommand(sub => sub.setName('fechar').setDescription('ðŸ”’ Fechar o ticket atual'))
    .addSubcommand(sub => sub.setName('resolver').setDescription('âœ… Marcar ticket como resolvido'))
    .addSubcommand(sub => sub.setName('assumir').setDescription('âš”ï¸ Assumir o atendimento deste ticket'))
    .addSubcommand(sub => sub.setName('add').setDescription('âž• Adicionar usuÃ¡rio ao ticket')
      .addUserOption(opt => opt.setName('usuario').setDescription('UsuÃ¡rio a adicionar').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('âž– Remover usuÃ¡rio do ticket')
      .addUserOption(opt => opt.setName('usuario').setDescription('UsuÃ¡rio a remover').setRequired(true)))
    .addSubcommand(sub => sub.setName('listar').setDescription('ðŸ“œ Listar todos os tickets abertos (staff)')),
  new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('âœ… Vincule sua conta do Roblox ao Discord')
    .addStringOption(opt => opt.setName('usuario').setDescription('Seu nome de usuÃ¡rio no Roblox').setRequired(true)),

  // ðŸŽ Sistema de cÃ³digos
  new SlashCommandBuilder()
    .setName('gencodigo')
    .setDescription('ðŸŽ Gerar um cÃ³digo de resgate com recompensas (Admin)')
    .addStringOption(opt => opt.setName('descricao').setDescription('DescriÃ§Ã£o do cÃ³digo (ex: Evento de Natal)').setRequired(true))
    .addIntegerOption(opt => opt.setName('maxusos').setDescription('Quantas contas podem usar (padrÃ£o: ilimitado)').setRequired(false))
    .addIntegerOption(opt => opt.setName('expira_horas').setDescription('Expira em X horas (padrÃ£o: nunca)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('codigo')
    .setDescription('ðŸ“‹ Gerenciar cÃ³digos de resgate (Admin)')
    .addSubcommand(sub => sub.setName('listar').setDescription('ðŸ“œ Listar todos os cÃ³digos'))
    .addSubcommand(sub => sub.setName('desativar').setDescription('ðŸš« Desativar um cÃ³digo')
      .addStringOption(opt => opt.setName('codigo').setDescription('CÃ³digo a desativar').setRequired(true)))
    .addSubcommand(sub => sub.setName('info').setDescription('ðŸ” Ver detalhes de um cÃ³digo')
      .addStringOption(opt => opt.setName('codigo').setDescription('CÃ³digo a consultar').setRequired(true))),

  new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('ðŸ”— Vincule sua conta do Roblox para usar cÃ³digos de resgate')
    .addStringOption(opt => opt.setName('usuario').setDescription('Seu nome de usuÃ¡rio exato no Roblox').setRequired(true)),

  new SlashCommandBuilder()
    .setName('minhaconta')
    .setDescription('ðŸ‘¤ Ver sua conta Roblox vinculada e cÃ³digos resgatados'),

  new SlashCommandBuilder()
    .setName('itemcadastrar')
    .setDescription('âž• Cadastrar novo item no catÃ¡logo de recompensas (Admin)'),

  new SlashCommandBuilder()
    .setName('itemlistar')
    .setDescription('ðŸ“¦ Ver todos os itens do catÃ¡logo por categoria (Admin)'),

].map(cmd => cmd.toJSON());

async function registrarSlashCommands(clientId) {
  const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);
  try { await rest.put(Routes.applicationCommands(clientId), { body: slashCommands }); console.log('âœ… Slash commands registrados!'); }
  catch (err) { console.error('Erro ao registrar slash commands:', err.message); }
}


// Helper do /gencodigo â€” avanÃ§a para o prÃ³ximo tipo ou finaliza e gera cÃ³digo
async function avancarRecompensa(interaction, sessao, adminId) {
  const proxIdx = sessao.tiposIdx;

  if (proxIdx < sessao.tiposSelecionados.length) {
    const proxTipo = sessao.tiposSelecionados[proxIdx];

    if (proxTipo === 'item') {
      // Mostrar seletor de categoria
      const catalogo   = await getCatalogoCompleto();
      const categorias = [...new Set(catalogo.map(i => i.categoria))].sort();
      if (!categorias.length) {
        return interaction.editReply({
          content: 'âš ï¸ CatÃ¡logo de itens vazio. Verifique os arquivos de configuraÃ§Ã£o do jogo.',
          components: [],
        });
      }
      const opsCat = categorias.slice(0, 25).map(c => ({
        label: c, value: `cat:${c}`,
        description: `${catalogo.filter(i => i.categoria === c).length} itens`,
      }));
      const menuCat = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gc_cat_${adminId}`)
          .setPlaceholder('ðŸ“‚ Escolha a categoria do prÃ³ximo item...')
          .addOptions(opsCat)
      );
      const recompListadas = sessao.recompensas.map(r => r.label).join('\n');
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA)
          .setTitle(`ðŸŽ Recompensa ${proxIdx + 1}/${sessao.tiposSelecionados.length}`)
          .setDescription(`*JÃ¡ adicionadas:*\n${recompListadas}\n\n*Selecione a categoria do prÃ³ximo item:*`)],
        components: [menuCat],
      });
    } else {
      // Pedir quantidade via modal
      const info = TIPOS_RECOMPENSA[proxTipo];
      const modal = new ModalBuilder()
        .setCustomId(`gc_qtd_${adminId}_${proxIdx}`)
        .setTitle(`Recompensa ${proxIdx + 1}: ${info.label}`)
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('valor').setLabel(`Quantidade de ${info.unidade}`)
              .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 500')
          )
        );
      return interaction.showModal(modal);
    }
  }

  // TODAS as recompensas coletadas â€” gerar o cÃ³digo!
  try {
    const codigo = gerarCodigo();
    const db     = await lerCodigos();
    const expira = sessao.expiraHoras ? new Date(Date.now() + sessao.expiraHoras * 3600000).toISOString() : null;
    db.codigos.push({
      id: codigo, descricao: sessao.descricao, recompensas: sessao.recompensas,
      criadoPor: interaction.user.tag, criadoEm: new Date().toISOString(),
      expira, maxUsos: sessao.maxUsos, usadoPor: [], ativo: true,
    });
    await salvarCodigos(db);
    invalidarCache();
    sessoescodigo.delete(interaction.user.id);

    const embedConf = new EmbedBuilder()
      .setColor(CONFIG.CORES.SUCESSO)
      .setTitle('âœ… CÃ³digo Gerado!')
      .addFields(
        { name: 'ðŸŽ CÃ³digo',      value: '`' + codigo + '`',                                                 inline: false },
        { name: 'ðŸ“ DescriÃ§Ã£o',   value: sessao.descricao,                                                   inline: true  },
        { name: 'ðŸ‘¥ Max Usos',    value: sessao.maxUsos ? String(sessao.maxUsos) : 'Ilimitado',              inline: true  },
        { name: 'â° Expira',       value: expira ? new Date(expira).toLocaleDateString('pt-BR') : 'Nunca',   inline: true  },
        { name: 'ðŸŽ€ Recompensas', value: sessao.recompensas.map(r => r.label).join('\n'),                  inline: false },
      )
      .setFooter({ text: 'Anunciado no canal de cÃ³digos' });
    await interaction.editReply({ embeds: [embedConf], components: [] });

    // AnÃºncio pÃºblico
    const guild = interaction.guild;
    const canalCodigos = CONFIG.CANAL_CODIGOS
      ? guild?.channels?.cache?.get(CONFIG.CANAL_CODIGOS)
      : interaction.channel;

    if (canalCodigos) {
      const embedAnuncio = new EmbedBuilder()
        .setColor(CONFIG.CORES.PRIMARIA)
        .setTitle('ðŸŽ NOVO CÃ“DIGO DE RESGATE!')
        .setDescription(`*Os deuses do Olimpo presenteiam os mortais dedicados!*\n\nðŸ“œ **${sessao.descricao}**`)
        .addFields(
          { name: 'ðŸ”‘ CÃ³digo',      value: '## `' + codigo + '`',                                            inline: false },
          { name: 'ðŸŽ€ Recompensas', value: sessao.recompensas.map(r => r.label).join('\n'),                 inline: false },
          { name: 'ðŸ‘¥ Usos',        value: sessao.maxUsos ? `${sessao.maxUsos} usos` : 'Ilimitado',          inline: true  },
          { name: 'â° VÃ¡lido atÃ©',  value: expira ? new Date(expira).toLocaleDateString('pt-BR') : 'Sem prazo', inline: true },
        )
        .addFields({ name: 'ðŸ“– Como resgatar?', value: 'Abra o jogo â†’ ConfiguraÃ§Ãµes â†’ CÃ³digo de Resgate!' })
        .setFooter({ text: 'Tower Deep Â· CÃ³digo vÃ¡lido 1x por conta Roblox' })
        .setTimestamp();

      const btns = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('ðŸŽ® Jogar Agora').setStyle(ButtonStyle.Link).setURL('https://www.roblox.com/games/'),
        new ButtonBuilder().setLabel('ðŸ”— Vincular Conta').setStyle(ButtonStyle.Primary).setCustomId('btn_vincular_info'),
      );
      await canalCodigos.send({ content: '@everyone', embeds: [embedAnuncio], components: [btns] });
    }
  } catch (err) {
    console.error('Erro ao gerar cÃ³digo:', err.message);
    await interaction.editReply({ content: 'âš ï¸ Erro ao salvar cÃ³digo. Tente novamente.', components: [] });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INTERACTIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
client.on('interactionCreate', async (interaction) => {
  try {
    // /bug
    if (interaction.isChatInputCommand() && interaction.commandName === 'bug') {
      const modal = new ModalBuilder().setCustomId('modal_bug').setTitle('Relato de Anomalia Divina');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bug_titulo').setLabel('O FenÃ´meno - Descreva o bug em uma frase').setStyle(TextInputStyle.Short).setPlaceholder('Ex: A torre de Zeus nÃ£o ataca inimigos voadores').setRequired(true).setMaxLength(100)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bug_descricao').setLabel('Os Detalhes - Como reproduzir o bug?').setStyle(TextInputStyle.Paragraph).setPlaceholder('Passo a passo do que aconteceu...').setRequired(true).setMaxLength(500)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bug_versao').setLabel('A VersÃ£o - Qual versÃ£o do jogo?').setStyle(TextInputStyle.Short).setPlaceholder('Ex: v0.3.0 (ou "nÃ£o sei")').setRequired(false).setMaxLength(20)),
      );
      return interaction.showModal(modal);
    }

    // /sugestao
    if (interaction.isChatInputCommand() && interaction.commandName === 'sugestao') {
      const modal = new ModalBuilder().setCustomId('modal_sugestao').setTitle('VisÃ£o para o Olimpo');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_titulo').setLabel('O TÃ­tulo - Resuma sua sugestÃ£o').setStyle(TextInputStyle.Short).setPlaceholder('Ex: Torre de Artemis com flechas de gelo').setRequired(true).setMaxLength(100)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_descricao').setLabel('Os Detalhes - Como funcionaria?').setStyle(TextInputStyle.Paragraph).setPlaceholder('Descreva a ideia com mais detalhes...').setRequired(true).setMaxLength(400)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_categoria').setLabel('Categoria da sugestÃ£o').setStyle(TextInputStyle.Short).setPlaceholder('torre, mapa, mecanica, evento ou outro').setRequired(false).setMaxLength(20)),
      );
      return interaction.showModal(modal);
    }

    // submit bug
    if (interaction.isModalSubmit() && interaction.customId === 'modal_bug') {
      const bugTitulo = interaction.fields.getTextInputValue('bug_titulo');
      const bugDesc   = interaction.fields.getTextInputValue('bug_descricao');
      const bugVersao = interaction.fields.getTextInputValue('bug_versao') || 'nÃ£o informado';
      await interaction.reply({ content: 'ðŸ”± *Os orÃ¡culos registraram tua anomalia nos pergaminhos sagrados. Os deuses-desenvolvedores serÃ£o notificados.*', ephemeral: true });
      if (CONFIG.CANAL_BUGS_ID) {
        try {
          const canal = await client.channels.fetch(CONFIG.CANAL_BUGS_ID);
          if (canal?.isTextBased()) {
            await canal.send('ðŸ› **NOVA ANOMALIA RELATADA**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n' +
              `ðŸ‘¤ **Mortal:** ${interaction.user.tag}\nðŸ“‹ **FenÃ´meno:** ${bugTitulo}\nðŸ“ **Detalhes:** ${bugDesc}\n` +
              `ðŸŽ® **VersÃ£o:** ${bugVersao}\nâ° **Quando:** <t:${Math.floor(Date.now() / 1000)}:R>\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`);
          }
        } catch (err) { console.error('Erro ao postar bug:', err.message); }
      }
      return;
    }

    // submit sugestao
    if (interaction.isModalSubmit() && interaction.customId === 'modal_sugestao') {
      const sugTitulo = interaction.fields.getTextInputValue('sug_titulo');
      const sugDesc   = interaction.fields.getTextInputValue('sug_descricao');
      const rawCat    = (interaction.fields.getTextInputValue('sug_categoria') || '').toLowerCase().trim();
      const sugCat    = ['torre', 'mapa', 'mecanica', 'evento'].includes(rawCat) ? rawCat : 'outro';
      await interaction.deferReply({ ephemeral: true });
      try {
        const lista = await lerEnquetes();
        lista.push({ id: `s${Date.now()}`, titulo: sugTitulo, desc: sugDesc, cat: sugCat, votos: 0, origem: 'sugestao', autor: interaction.user.tag, criadoEm: new Date().toISOString() });
        await salvarEnquetes(lista);
        const msg = await interaction.channel.send(
          `ðŸ’¡ **VISÃƒO DE ${interaction.user.username.toUpperCase()}**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
          `ðŸ·ï¸ **Categoria:** ${sugCat}\nðŸ“‹ **Ideia:** ${sugTitulo}\nðŸ“ **Detalhes:** ${sugDesc}\n` +
          `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\nâ¬†ï¸ â€” Apoio esta visÃ£o!\n*Vote tambÃ©m em: https://italozkv.github.io/tower-deep/votos.html*`
        );
        await msg.react('â¬†ï¸');
        await interaction.editReply({ content: 'ðŸ”± *Tua visÃ£o foi gravada nos pergaminhos e jÃ¡ aparece no site!*' });
      } catch (err) { console.error('Erro submit sugestao:', err.message); await interaction.editReply({ content: `âš ï¸ Erro: ${err.message}` }).catch(() => {}); }
      return;
    }

    // /enquete
    if (interaction.isChatInputCommand() && interaction.commandName === 'enquete') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas guardiÃµes do Olimpo podem proclamar enquetes.*', ephemeral: true });
      const titulo    = interaction.options.getString('titulo');
      const descricao = interaction.options.getString('descricao');
      const categoria = interaction.options.getString('categoria');
      await interaction.deferReply({ ephemeral: true });
      try {
        const lista = await lerEnquetes();
        lista.push({ id: `e${Date.now()}`, titulo, desc: descricao, cat: categoria, votos: 0, origem: 'discord', criadoEm: new Date().toISOString() });
        await salvarEnquetes(lista);
        const msg = await interaction.channel.send(
          `ðŸ—³ï¸ **NOVA ENQUETE â€” ${titulo.toUpperCase()}**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\nðŸ·ï¸ **Categoria:** ${categoria}\nðŸ“ ${descricao}\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\nâ¬†ï¸ â€” Quero esta feature!\n*Resultados: https://italozkv.github.io/tower-deep/votos.html*`
        );
        await msg.react('â¬†ï¸');
        await interaction.editReply({ content: 'âœ… *Enquete proclamada e salva no site!*' });
      } catch (err) { console.error('Erro /enquete:', err.message); await interaction.editReply({ content: `âš ï¸ Erro: ${err.message}` }).catch(() => {}); }
      return;
    }

    // /limpar
    if (interaction.isChatInputCommand() && interaction.commandName === 'limpar') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Os deuses negam tua solicitaÃ§Ã£o, mortal.*', ephemeral: true });
      const quantidade = interaction.options.getInteger('quantidade');
      await interaction.deferReply({ ephemeral: true });
      try {
        const msgs    = await interaction.channel.messages.fetch({ limit: quantidade });
        const recentes = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
        if (recentes.size === 0) return interaction.editReply({ content: 'âš ï¸ *Nenhuma mensagem recente encontrada (mÃ¡x. 14 dias).*' });
        await interaction.channel.bulkDelete(recentes, true);
        await interaction.editReply({ content: `ðŸ§¹ *${recentes.size} mensagem(ns) foram varridas pelos ventos do Olimpo.*` });
      } catch (err) { console.error('Erro ao limpar:', err.message); await interaction.editReply({ content: 'âš ï¸ *Os deuses nÃ£o conseguiram varrer o canal. Verifique as permissÃµes do bot.*' }); }
      return;
    }

    // /anunciar
    if (interaction.isChatInputCommand() && interaction.commandName === 'anunciar') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Os deuses negam tua solicitaÃ§Ã£o, mortal.*', ephemeral: true });
      const mensagem = interaction.options.getString('mensagem');
      const titulo   = interaction.options.getString('titulo') || 'Decreto do Olimpo';
      await interaction.reply({ content: 'âœ… *Teu anÃºncio foi proclamado no canal, guardiÃ£o.*', ephemeral: true });
      try {
        const embedAnuncio = new EmbedBuilder()
          .setColor(0xc9a84c)
          .setTitle(`ðŸ“¢ ${titulo}`)
          .setDescription(mensagem)
          .setFooter({ text: `Proclamado por ${interaction.user.username} Â· Tower Deep` })
          .setTimestamp();

        const botoesAnuncio = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('ðŸŒ Site Oficial')
            .setURL('https://italozkv.github.io/tower-deep/')
            .setStyle(ButtonStyle.Link),
          new ButtonBuilder()
            .setLabel('ðŸ“œ Changelog')
            .setURL('https://italozkv.github.io/tower-deep/changelog.html')
            .setStyle(ButtonStyle.Link),
        );

        await interaction.channel.send({ embeds: [embedAnuncio], components: [botoesAnuncio] });
      } catch (err) { console.error('Erro ao anunciar:', err.message); }
      return;
    }

    // /roadmap
    if (interaction.isChatInputCommand() && interaction.commandName === 'roadmap') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas guardiÃµes do Olimpo podem editar os pergaminhos do roadmap.*', ephemeral: true });
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
          if (versoes.find(v => v.versao === versao)) return interaction.editReply({ content: `âš ï¸ *A versÃ£o ${versao} jÃ¡ existe nos pergaminhos.*` });
          versoes.push({ versao, titulo, status, data, lore, itens: [] });
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `ðŸ—ºï¸ **${versao} â€” ${titulo}** adicionada ao roadmap!\n*VisÃ­vel em: https://italozkv.github.io/tower-deep/roadmap.html*` });
        }
        if (sub === 'item') {
          const versao = interaction.options.getString('versao');
          const texto  = interaction.options.getString('texto');
          const badge  = interaction.options.getString('badge') || 'Novo';
          const v = versoes.find(v => v.versao === versao);
          if (!v) return interaction.editReply({ content: `âš ï¸ *VersÃ£o ${versao} nÃ£o encontrada. Use /roadmap adicionar primeiro.*` });
          v.itens = v.itens || [];
          v.itens.push({ texto, badge, concluido: false });
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `âœ… *Item adicionado em ${versao}:* ${texto}` });
        }
        if (sub === 'concluir') {
          const versao     = interaction.options.getString('versao');
          const itemBusca  = interaction.options.getString('item').toLowerCase();
          const v = versoes.find(v => v.versao === versao);
          if (!v) return interaction.editReply({ content: `âš ï¸ *VersÃ£o ${versao} nÃ£o encontrada.*` });
          const item = v.itens?.find(i => i.texto.toLowerCase().includes(itemBusca));
          if (!item) return interaction.editReply({ content: `âš ï¸ *Item nÃ£o encontrado. Verifica o texto.*` });
          item.concluido = true;
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `âœ“ *Item marcado como concluÃ­do em ${versao}:* ${item.texto}` });
        }
        if (sub === 'status') {
          const versao = interaction.options.getString('versao');
          const status = interaction.options.getString('status');
          const v = versoes.find(v => v.versao === versao);
          if (!v) return interaction.editReply({ content: `âš ï¸ *VersÃ£o ${versao} nÃ£o encontrada.*` });
          v.status = status;
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `âš¡ *Status de ${versao} atualizado para: ${status}*` });
        }
      } catch (err) { console.error('Erro no roadmap:', err.message); await interaction.editReply({ content: 'âš ï¸ *Os ventos do Ã‰rebo interferiram. Tente novamente.*' }); }
      return;
    }

    // /rank
    if (interaction.isChatInputCommand() && interaction.commandName === 'rank') {
      const userId = interaction.user.id;
      if (!xpData.has(userId)) xpData.set(userId, { xp: 0, nivel: 1, lastMsg: 0 });
      const dados   = xpData.get(userId);
      const nivel   = getNivel(dados.xp);
      const proximo = getProximoNivel(dados.xp);
      const faltam  = proximo ? proximo.xpMin - dados.xp : 0;

      // Barra de progresso
      const xpAtualNivel  = dados.xp - nivel.xpMin;
      const xpNecessario  = proximo ? proximo.xpMin - nivel.xpMin : 1;
      const barra = proximo ? gerarBarraProgresso(xpAtualNivel, xpNecessario, 12) : 'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ 100%';

      const medalhas = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰', '4ï¸âƒ£', '5ï¸âƒ£'];
      const top5     = [...xpData.entries()].sort((a, b) => b[1].xp - a[1].xp).slice(0, 5);
      let topTexto   = '';
      for (let i = 0; i < top5.length; i++) {
        const [uid, d] = top5[i];
        const n = getNivel(d.xp);
        topTexto += `${medalhas[i]} <@${uid}> â€” **${n.nome}** *(${d.xp} XP)*${uid === userId ? ' â† vocÃª' : ''}\n`;
      }
      await interaction.reply({
        content:
          `âœ¨ **PERGAMINHO DE ${interaction.user.username.toUpperCase()}**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
          `ðŸ›ï¸ **TÃ­tulo:** ${nivel.nome}\nâš¡ **XP Total:** ${dados.xp}\nðŸ“Š **NÃ­vel:** ${nivel.nivel}/10\n` +
          `ðŸ“ˆ **Progresso:** \`[${barra}]\`\n` +
          (proximo ? `ðŸ”® **PrÃ³ximo:** ${proximo.nome} *(faltam ${faltam} XP)*` : 'ðŸŒŸ *Atingiste a divindade mÃ¡xima, imortal!*') +
          `\n\nðŸ† **OLIMPO â€” Top Mortais**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n` +
          (topTexto || '*Nenhum mortal registrado ainda.*') + `\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
        ephemeral: true,
      });
      return;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // /changelog â€” gerenciar changelogs
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (interaction.isChatInputCommand() && interaction.commandName === 'changelog') {
      // Apenas Dono e Admin (verifica cargos)
      const member = interaction.member;
      const temAcesso = ehAdmin(member);
      if (!temAcesso) return interaction.reply({ content: 'âš ï¸ *Apenas o Dono ou Admin do Olimpo pode editar os anais eternos.*', ephemeral: true });

      const sub = interaction.options.getSubcommand();
      await interaction.deferReply({ ephemeral: true });

      try {
        const dadosGist = await lerGist();
        const updates   = dadosGist.updates || [];

        // /changelog listar
        if (sub === 'listar') {
          if (!updates.length) return interaction.editReply({ content: 'ðŸ“œ *Nenhum decreto nos anais eternos ainda.*' });
          const lista = updates.map((u, i) =>
            `**#${i + 1}** â€” \`${u.versao}\` â€” **${u.titulo}** *(${u.data})* ${u.imagem ? 'ðŸ–¼ï¸' : ''}`
          ).join('\n');
          return interaction.editReply({
            content: `ðŸ“œ **ANAIS DO OLIMPO â€” ${updates.length} decreto(s)**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n${lista}\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n*Use o nÃºmero para editar ou apagar.*`,
          });
        }

        // /changelog apagar
        if (sub === 'apagar') {
          const num = interaction.options.getInteger('numero');
          if (num < 1 || num > updates.length) return interaction.editReply({ content: `âš ï¸ *NÃºmero invÃ¡lido. Use entre 1 e ${updates.length}.*` });
          const removido = updates.splice(num - 1, 1)[0];
          dadosGist.updates = updates;
          await salvarGist(dadosGist);
          return interaction.editReply({ content: `ðŸ—‘ï¸ **Decreto apagado dos anais eternos:**\n\`${removido.versao}\` â€” ${removido.titulo}\n\n*O site serÃ¡ atualizado automaticamente.*` });
        }

        // /changelog editar
        if (sub === 'editar') {
          const num   = interaction.options.getInteger('numero');
          const campo = interaction.options.getString('campo');
          const valor = interaction.options.getString('valor');
          if (num < 1 || num > updates.length) return interaction.editReply({ content: `âš ï¸ *NÃºmero invÃ¡lido. Use entre 1 e ${updates.length}.*` });
          const alvo = updates[num - 1];
          const campoNomes = { titulo: 'ðŸ“– TÃ­tulo', subtitulo: 'ðŸŒŸ SubtÃ­tulo', imagem: 'ðŸ–¼ï¸ Imagem', proximo: 'ðŸ”® PrÃ³xima update' };
          if (campo === 'proximo') {
            dadosGist.proximaUpdate = valor;
          } else {
            alvo[campo] = valor;
          }
          dadosGist.updates = updates;
          await salvarGist(dadosGist);
          return interaction.editReply({
            content: `âœï¸ **Decreto atualizado!**\n\`${alvo.versao}\` â€” ${alvo.titulo}\n\n${campoNomes[campo]}: ${valor}\n\n*O site serÃ¡ atualizado automaticamente.*`,
          });
        }

        // /changelog imagem
        if (sub === 'imagem') {
          const num    = interaction.options.getInteger('numero');
          const anexo  = interaction.options.getAttachment('imagem');
          if (num < 1 || num > updates.length) return interaction.editReply({ content: `âš ï¸ *NÃºmero invÃ¡lido. Use entre 1 e ${updates.length}.*` });
          const ehImagem = /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(anexo.url);
          if (!ehImagem) return interaction.editReply({ content: 'âš ï¸ *Apenas imagens sÃ£o aceitas (png, jpg, gif, webp).*' });
          updates[num - 1].imagem = anexo.url;
          dadosGist.updates = updates;
          await salvarGist(dadosGist);
          return interaction.editReply({
            content: `ðŸ–¼ï¸ **Imagem atualizada no decreto #${num}!**\n\`${updates[num-1].versao}\` â€” ${updates[num-1].titulo}\n\n*A imagem jÃ¡ aparece no site.*`,
          });
        }

      } catch (err) {
        console.error('Erro /changelog:', err.message);
        return interaction.editReply({ content: `âš ï¸ *Os ventos do Ã‰rebo interferiram. Tente novamente.*` });
      }
      return;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // SISTEMA DE CÃ“DIGOS DE RESGATE
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // /vincular â€” vÃ­nculo Discord â†” Roblox para uso de cÃ³digos
    if (interaction.isChatInputCommand() && interaction.commandName === 'vincular') {
      const robloxUser = interaction.options.getString('usuario');
      await interaction.deferReply({ ephemeral: true });
      try {
        const res  = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(robloxUser)}&limit=10`);
        const data = await res.json();
        if (!data.data || !data.data.length)
          return interaction.editReply({ content: 'âš ï¸ *UsuÃ¡rio nÃ£o encontrado no Roblox. Verifique o nome exato.*' });

        const rbUser = data.data[0];
        const db     = await lerVinculos();
        // Verifica se jÃ¡ existe vÃ­nculo com essa conta Roblox
        const jaVinculado = db.vinculos.find(v => v.robloxId === String(rbUser.id));
        if (jaVinculado && jaVinculado.discordId !== interaction.user.id)
          return interaction.editReply({ content: `âš ï¸ *A conta **${rbUser.name}** jÃ¡ estÃ¡ vinculada a outro usuÃ¡rio Discord.*` });

        // Remove vÃ­nculo anterior do mesmo Discord
        db.vinculos = db.vinculos.filter(v => v.discordId !== interaction.user.id);
        db.vinculos.push({ discordId: interaction.user.id, robloxId: String(rbUser.id), robloxName: rbUser.name, vinculadoEm: new Date().toISOString() });
        await salvarVinculos(db);
        invalidarCache();

        // Cargo verificado
        if (CONFIG.CARGO_VERIFICADO) {
          const cargo = interaction.guild?.roles?.cache?.get(CONFIG.CARGO_VERIFICADO);
          if (cargo) await interaction.member.roles.add(cargo).catch(() => {});
        }

        const embed = new EmbedBuilder()
          .setColor(CONFIG.CORES.SUCESSO)
          .setTitle('ðŸ”— Conta Vinculada!')
          .setDescription(`Tua conta Discord foi vinculada ao jogador **${rbUser.name}** no Roblox!

Agora podes resgatar cÃ³digos no jogo usando tua conta.`)
          .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${rbUser.id}&width=420&height=420&format=png`)
          .addFields(
            { name: 'ðŸ‘¤ Roblox', value: rbUser.name, inline: true },
            { name: 'ðŸ†” ID',     value: String(rbUser.id), inline: true },
          )
          .setFooter({ text: 'Tower Deep Â· VÃ­nculo registrado' })
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('Erro /vincular:', err.message);
        return interaction.editReply({ content: 'âš ï¸ *Erro ao vincular. Tente novamente.*' });
      }
    }

    // /minhaconta â€” ver conta vinculada e cÃ³digos resgatados
    if (interaction.isChatInputCommand() && interaction.commandName === 'minhaconta') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const db      = await lerVinculos();
        const vinculo = db.vinculos.find(v => v.discordId === interaction.user.id);
        if (!vinculo) {
          return interaction.editReply({ content: 'âŒ *VocÃª nÃ£o possui uma conta Roblox vinculada. Use `/vincular` primeiro.*' });
        }
        const codigosDb   = await lerCodigos();
        const resgatados  = codigosDb.codigos.filter(c => c.usadoPor?.some(u => u.robloxId === vinculo.robloxId));
        const embed = new EmbedBuilder()
          .setColor(CONFIG.CORES.INFO)
          .setTitle('ðŸ‘¤ Tua Conta Vinculada')
          .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${vinculo.robloxId}&width=420&height=420&format=png`)
          .addFields(
            { name: 'ðŸŽ® Roblox',         value: vinculo.robloxName,                                             inline: true  },
            { name: 'ðŸ†” Roblox ID',       value: vinculo.robloxId,                                               inline: true  },
            { name: 'ðŸ“… Vinculado em',    value: new Date(vinculo.vinculadoEm).toLocaleDateString('pt-BR'),      inline: true  },
            { name: 'ðŸŽ CÃ³digos Usados',  value: String(resgatados.length),                                      inline: true  },
          )
          .setFooter({ text: 'Tower Deep Â· Use /vincular para atualizar' });

        if (resgatados.length) {
          const lista = resgatados.slice(-5).map(c => `â€¢ \`${c.id}\` â€” ${c.descricao}`).join('\n');

          embed.addFields({ name: 'ðŸ“œ Ãšltimos resgates', value: lista });
        }
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: 'âš ï¸ Erro ao buscar conta. Tente novamente.' });
      }
    }

    // /gencodigo â€” gerar cÃ³digo de resgate (Admin)
    if (interaction.isChatInputCommand() && interaction.commandName === 'gencodigo') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: 'ðŸš« *Apenas Admins podem gerar cÃ³digos.*', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const descricao   = interaction.options.getString('descricao');
      const maxUsos     = interaction.options.getInteger('maxusos') || 0;
      const expiraHoras = interaction.options.getInteger('expira_horas') || 0;
      sessoescodigo.set(interaction.user.id, { descricao, maxUsos, expiraHoras, recompensas: [], tiposIdx: 0, step: 'tipo' });
      setTimeout(() => sessoescodigo.delete(interaction.user.id), 10 * 60 * 1000);
      const menuTipo = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gc_tipo_${interaction.user.id}`)
          .setPlaceholder('ðŸŽ Que tipos de recompensa este cÃ³digo vai dar?')
          .setMinValues(1).setMaxValues(6)
          .addOptions([
            { label: 'GodCoins',      value: 'moedas',         description: 'Moeda principal do jogo' },
            { label: 'Gems',          value: 'gemas',          description: 'Moeda premium' },
            { label: 'Presents',      value: 'presents',       description: 'Moeda de eventos e recompensas' },
            { label: 'Favor Grego',   value: 'favor_greek',    description: 'Atributo de progresso por panteão' },
            { label: 'Favor Nórdico', value: 'favor_norse',    description: 'Atributo de progresso por panteão' },
            { label: 'Favor Egípcio', value: 'favor_egyptian', description: 'Atributo de progresso por panteão' },
            { label: 'XP Bônus',      value: 'xp',             description: 'Experiência extra' },
            { label: 'Item do Jogo',  value: 'item',           description: 'Itens reais do inventário (base + semideus)' },
          ])
      );
      const embed = new EmbedBuilder()
        .setColor(CONFIG.CORES.PRIMARIA)
        .setTitle('ðŸŽ Novo CÃ³digo â€” Passo 1/3')
        .setDescription(`**DescriÃ§Ã£o:** ${descricao}\n**Max Usos:** ${maxUsos || 'Ilimitado'} Â· **Expira:** ${expiraHoras ? `em ${expiraHoras}h` : 'Nunca'}\n\n*Selecione os tipos de recompensa:*`)
        .setFooter({ text: 'Passo 1 â€” Tipo de Recompensa' });
      return interaction.editReply({ embeds: [embed], components: [menuTipo] });
    }

    // Passo 1 â†’ Tipos selecionados
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gc_tipo_')) {
      const adminId = interaction.customId.split('gc_tipo_')[1];
      if (interaction.user.id !== adminId) return interaction.reply({ content: 'ðŸš«', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: 'âš ï¸ SessÃ£o expirada. Use /gencodigo novamente.', ephemeral: true });
      sessao.tiposSelecionados = interaction.values;
      sessao.tiposIdx = 0;
      await interaction.deferUpdate();
      return await avancarRecompensa(interaction, sessao, adminId);
    }

    // Passo 2 â†’ Categoria selecionada â†’ listar itens
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gc_cat_')) {
      const adminId = interaction.customId.split('gc_cat_')[1];
      if (interaction.user.id !== adminId) return interaction.reply({ content: 'ðŸš«', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: 'âš ï¸ SessÃ£o expirada.', ephemeral: true });
      const categoria = interaction.values[0].replace('cat:', '');
      const catalogo  = await getCatalogoCompleto();
      const itensCat  = catalogo.filter(i => i.categoria === categoria).slice(0, 25);
      if (!itensCat.length) {
        return interaction.reply({ content: 'âš ï¸ Nenhum item encontrado nesta categoria.', ephemeral: true });
      }
      const opsItens  = itensCat.map(i => ({
        label: i.nome.slice(0, 100), value: i.id,
        description: `${i.raridade} Â· ${i.id}`,
      }));
      const menuItem = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gc_item_${adminId}`)
          .setPlaceholder(`ðŸŽ Selecione um item de "${categoria}"...`)
          .addOptions(opsItens)
      );
      const btnVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gc_voltarcat_${adminId}`).setLabel('â† Voltar Ã s Categorias').setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA)
          .setTitle(`ðŸ“‚ ${categoria}`)
          .setDescription(`*${itensCat.length} itens â€” selecione um:*`)
          .setFooter({ text: 'Passo 2b â€” Item' })],
        components: [menuItem, btnVoltar],
      });
    }

    // Passo 2b â†’ Item selecionado â†’ pedir quantidade
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gc_item_')) {
      const adminId = interaction.customId.split('gc_item_')[1];
      if (interaction.user.id !== adminId) return interaction.reply({ content: 'ðŸš«', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: 'âš ï¸ SessÃ£o expirada.', ephemeral: true });
      const catalogo = await getCatalogoCompleto();
      const item = catalogo.find(i => i.id === interaction.values[0]);
      if (!item) return interaction.reply({ content: 'âŒ Item nÃ£o encontrado.', ephemeral: true });
      sessao.itemAtual = item;
      const modal = new ModalBuilder()
        .setCustomId(`gc_qtditem_${adminId}`)
        .setTitle(`Quantidade: ${item.nome.slice(0, 40)}`)
        .addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('valor').setLabel('Quantidade (1 se for Ãºnico)')
            .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 1')
        ));
      return interaction.showModal(modal);
    }

    // Modal â†’ quantidade de item do catÃ¡logo
    if (interaction.isModalSubmit() && interaction.customId.startsWith('gc_qtditem_')) {
      const adminId = interaction.customId.split('gc_qtditem_')[1];
      if (interaction.user.id !== adminId) return interaction.reply({ content: 'ðŸš«', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: 'âš ï¸ SessÃ£o expirada.', ephemeral: true });
      await interaction.deferUpdate();
      const qtdInput = parseInt(interaction.fields.getTextInputValue('valor'), 10);
      const qtd = Number.isFinite(qtdInput) && qtdInput > 0 ? qtdInput : 1;
      const item = sessao.itemAtual;
      const emoji = RARIDADE_EMOJI[item.raridade] || 'ðŸŽ';
      sessao.recompensas.push({ tipo: 'item', valor: item.id, quantidade: qtd, label: `${emoji} ${item.nome}${qtd > 1 ? ` x${qtd}` : ''} *(${item.raridade})*` });
      sessao.tiposIdx++;
      return await avancarRecompensa(interaction, sessao, adminId);
    }

    // Modal â†’ quantidade de moedas/gemas/xp
    if (interaction.isModalSubmit() && interaction.customId.startsWith('gc_qtd_')) {
      const parts   = interaction.customId.split('_');
      const adminId = parts[2];
      if (interaction.user.id !== adminId) return interaction.reply({ content: 'ðŸš«', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: 'âš ï¸ SessÃ£o expirada.', ephemeral: true });
      await interaction.deferUpdate();
      const tipo  = sessao.tiposSelecionados[sessao.tiposIdx];
      const info  = TIPOS_RECOMPENSA[tipo];
      const valorInput = parseInt(interaction.fields.getTextInputValue('valor'), 10);
      const valor = Number.isFinite(valorInput) && valorInput > 0 ? valorInput : 1;
      sessao.recompensas.push({ tipo, valor, quantidade: valor, label: `${info.emoji} ${info.label}: ${valor} ${info.unidade}` });
      sessao.tiposIdx++;
      return await avancarRecompensa(interaction, sessao, adminId);
    }

    // BotÃ£o voltar Ã s categorias
    if (interaction.isButton() && interaction.customId.startsWith('gc_voltarcat_')) {
      const adminId = interaction.customId.split('gc_voltarcat_')[1];
      if (interaction.user.id !== adminId) return interaction.reply({ content: 'ðŸš«', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: 'âš ï¸ SessÃ£o expirada.', ephemeral: true });
      const catalogo   = await getCatalogoCompleto();
      const categorias = [...new Set(catalogo.map(i => i.categoria))].sort();
      if (!categorias.length) {
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(CONFIG.CORES.ERRO).setTitle('âš ï¸ CatÃ¡logo vazio').setDescription('Nenhuma categoria disponÃ­vel no momento.')],
          components: [],
        });
      }
      const opsCat = categorias.slice(0, 25).map(c => ({
        label: c, value: `cat:${c}`, description: `${catalogo.filter(i => i.categoria === c).length} itens`,
      }));
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA).setTitle('ðŸ“‚ Categorias').setDescription('*Selecione a categoria:*')],
        components: [new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId(`gc_cat_${adminId}`).setPlaceholder('ðŸ“‚ Categoria...').addOptions(opsCat)
        )],
      });
    }

    // /itemcadastrar â€” Admin cadastra item novo no catÃ¡logo
    if (interaction.isChatInputCommand() && interaction.commandName === 'itemcadastrar') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: 'ðŸš« Apenas Admins.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('itemcadastrar_modal')
        .setTitle('Cadastrar Novo Item')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('id').setLabel('ID do item (sem espaÃ§os, ex: espada_zeus)')
              .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('espada_zeus')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('nome').setLabel('Nome de exibiÃ§Ã£o')
              .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Espada de Zeus')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('raridade').setLabel('Raridade')
              .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Comum / Incomum / Raro / Epico / Lendario / Primordial')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('categoria').setLabel('Categoria (ex: Arma, Especial, Skin...)')
              .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Arma'  )
          )
        );
      return interaction.showModal(modal);
    }

    // Modal â€” confirmar cadastro de item
    if (interaction.isModalSubmit() && interaction.customId === 'itemcadastrar_modal') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: 'ðŸš«', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const id        = interaction.fields.getTextInputValue('id').trim().toLowerCase().replace(/\s+/g, '_');
      const nome      = interaction.fields.getTextInputValue('nome').trim();
      const raridade  = interaction.fields.getTextInputValue('raridade').trim();
      const categoria = interaction.fields.getTextInputValue('categoria').trim();

      // Validar id Ãºnico
      const catalogo = await getCatalogoCompleto();
      if (catalogo.find(i => i.id === id)) {
        return interaction.editReply({ content: `âŒ JÃ¡ existe um item com o ID \`${id}\`. Use outro ID.` });
      }

      const novoItem = { id, nome, raridade, categoria, adicionadoPor: interaction.user.tag, adicionadoEm: new Date().toISOString() };
      const db = await lerCodigos();
      if (!db.itensExtras) db.itensExtras = [];
      db.itensExtras.push(novoItem);
      await salvarCodigos(db);
      invalidarCache();

      const emoji = RARIDADE_EMOJI[raridade] || 'ðŸŽ';
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(CONFIG.CORES.SUCESSO)
          .setTitle('âœ… Item Cadastrado!')
          .setDescription(`${emoji} **${nome}** foi adicionado ao catÃ¡logo e jÃ¡ aparece no /gencodigo.`)
          .addFields(
            { name: 'ID',        value: `\`${id}\``, inline: true },
            { name: 'Raridade',  value: raridade,    inline: true },
            { name: 'Categoria', value: categoria,   inline: true },
          )],
      });
    }

    // /itemlistar â€” listar itens do catÃ¡logo (Admin)
    if (interaction.isChatInputCommand() && interaction.commandName === 'itemlistar') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: 'ðŸš« Apenas Admins.', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const catalogo = await getCatalogoCompleto();
      const db = await lerCodigos();
      const extras = db.itensExtras || [];
      const categorias = [...new Set(catalogo.map(i => i.categoria))].sort();
      const resumo = categorias.map(c => {
        const count = catalogo.filter(i => i.categoria === c).length;
        return `**${c}** â€” ${count} iten${count !== 1 ? 's' : ''}`;
      }).join('\n');
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(CONFIG.CORES.INFO)
          .setTitle(`ðŸ“¦ CatÃ¡logo de Itens â€” ${catalogo.length} itens`)
          .setDescription(resumo)
          .addFields({ name: 'âž• Itens extras cadastrados', value: extras.length ? `${extras.length} iten${extras.length !== 1 ? 's' : ''} adicionados por admins` : 'Nenhum ainda. Use /itemcadastrar.' })
          .setFooter({ text: 'Use /itemcadastrar para adicionar novos itens' })],
      });
    }

    // BotÃ£o â€” info de vincular
    if (interaction.isButton() && interaction.customId === 'btn_vincular_info') {
      return interaction.reply({
        content: 'ðŸ”— *Para vincular tua conta Roblox, usa o comando `/vincular` e coloca o teu nome de usuÃ¡rio no Roblox!*',
        ephemeral: true,
      });
    }

    // /codigo listar / desativar / info (Admin)
    if (interaction.isChatInputCommand() && interaction.commandName === 'codigo') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: 'ðŸš« *Apenas Admins.*', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const sub = interaction.options.getSubcommand();
      const db  = await lerCodigos();

      if (sub === 'listar') {
        if (!db.codigos.length) return interaction.editReply({ content: 'ðŸ“œ *Nenhum cÃ³digo criado ainda.*' });
        const lista = db.codigos.slice(-20).reverse().map(c => {
          const status = !c.ativo ? 'ðŸ”´' : c.expira && new Date(c.expira) < new Date() ? 'ðŸŸ¡' : 'ðŸŸ¢';
          const usos   = `${c.usadoPor?.length || 0}${c.maxUsos ? '/'+c.maxUsos : ''}`;
          return `${status} \`${c.id}\` â€” ${c.descricao} *(${usos} usos)*`;
        }).join('\n');

        return interaction.editReply({ content: `ðŸ“‹ **CÃ³digos (Ãºltimos 20):**
${lista}` });
      }

      if (sub === 'desativar') {
        const id = interaction.options.getString('codigo').toUpperCase();
        const c  = db.codigos.find(x => x.id === id);
        if (!c) return interaction.editReply({ content: `âŒ CÃ³digo \`${id}\` nÃ£o encontrado.` });
        c.ativo = false;
        await salvarCodigos(db);
        invalidarCache();
        return interaction.editReply({ content: `ðŸš« CÃ³digo \`${id}\` desativado com sucesso.` });
      }

      if (sub === 'info') {
        const id = interaction.options.getString('codigo').toUpperCase();
        const c  = db.codigos.find(x => x.id === id);
        if (!c) return interaction.editReply({ content: `âŒ CÃ³digo \`${id}\` nÃ£o encontrado.` });
        const embed = new EmbedBuilder()
          .setColor(c.ativo ? CONFIG.CORES.SUCESSO : CONFIG.CORES.ERRO)
          .setTitle(`ðŸ” CÃ³digo: \`${c.id}\``)
          .addFields(
            { name: 'ðŸ“ DescriÃ§Ã£o',   value: c.descricao,                                                          inline: true  },
            { name: 'ðŸŸ¢ Ativo',       value: c.ativo ? 'Sim' : 'NÃ£o',                                              inline: true  },
            { name: 'ðŸ‘¥ Usos',        value: `${c.usadoPor?.length||0}${c.maxUsos?'/'+c.maxUsos:''}`,               inline: true  },
            { name: 'ðŸ“… Criado em',   value: new Date(c.criadoEm).toLocaleDateString('pt-BR'),                     inline: true  },
            { name: 'â° Expira',       value: c.expira ? new Date(c.expira).toLocaleDateString('pt-BR') : 'Nunca', inline: true  },
            { name: 'ðŸŽ€ Recompensas', value: c.recompensas.map(r => r.label).join('\n') || 'Nenhuma',              inline: false },

          );
        if (c.usadoPor?.length) {
          embed.addFields({ name: `ðŸ‘¤ Usadopor (${c.usadoPor.length})`, value: c.usadoPor.slice(-10).map(u => `â€¢ ${u.robloxName} (${new Date(u.usadoEm).toLocaleDateString('pt-BR')})`).join('\n') });

        }
        return interaction.editReply({ embeds: [embed] });
      }
    }

    // /verificar â€” vincular conta do Roblox (legado)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (interaction.isChatInputCommand() && interaction.commandName === 'verificar') {
      const robloxUser = interaction.options.getString('usuario');
      await interaction.deferReply({ ephemeral: true });
      try {
        const res  = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(robloxUser)}&limit=10`);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const rbUser = data.data[0];
          // DÃ¡ o cargo de verificado se configurado
          if (CONFIG.CARGO_VERIFICADO) {
            const cargo = interaction.guild.roles.cache.get(CONFIG.CARGO_VERIFICADO);
            if (cargo) await interaction.member.roles.add(cargo);
          }
          const embed = new EmbedBuilder()
            .setColor(CONFIG.CORES.SUCESSO)
            .setTitle('âœ… Conta Vinculada com Sucesso!')
            .setDescription(`Tua alma no Discord foi atrelada ao mortal **${rbUser.name}** no Roblox.\nVocÃª recebeu as bÃªnÃ§Ã£os de verificado.`)
            .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${rbUser.id}&width=420&height=420&format=png`);
          return interaction.editReply({ embeds: [embed] });
        } else {
          return interaction.editReply({ content: 'âš ï¸ *Os orÃ¡culos nÃ£o encontraram esse mortal no Roblox. Verifique o nome e tente novamente.*' });
        }
      } catch (err) {
        console.error('Erro /verificar:', err.message);
        return interaction.editReply({ content: 'âš ï¸ *Houve uma perturbaÃ§Ã£o no portal para o Roblox. Tente novamente mais tarde.*' });
      }
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Menu suspenso de ajuda
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ajuda') {
      const escolha = interaction.values[0];
      const embed   = new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA);

      if (escolha === 'mortais') {
        embed.setTitle('ðŸ‘¥ Poderes dos Mortais')
          .setDescription('ðŸ› `/bug` â€” Relatar uma anomalia\nðŸ’¡ `/sugestao` â€” Enviar visÃ£o ao Olimpo\nðŸ† `/rank` â€” Ver teu tÃ­tulo divino\nâœ… `/verificar` â€” Vincular conta do Roblox\nðŸŽ« Menu de tickets â€” Abrir chamado de suporte');
      } else if (escolha === 'oraculo') {
        embed.setTitle('âœ¨ O OrÃ¡culo')
          .setDescription('Mencione o bot em qualquer canal:\n`@Bot qual torre Ã© melhor?` â€” Consulta geral\n`@Bot tenho um bug` â€” AuxÃ­lio tÃ©cnico\n`@Bot sugestÃ£o: torre X` â€” AnÃ¡lise de ideia');
      } else if (escolha === 'equipe') {
        if (!ehEquipe(interaction.member)) return interaction.reply({ content: 'ðŸš« *Os deuses proÃ­bem teu acesso a esta sabedoria.*', ephemeral: true });
        embed.setTitle('ðŸ›¡ï¸ Armamento da Equipe & Mods')
          .setDescription('ðŸ”‘ `!token` â€” Gerar token do site\nðŸ“œ `!update` â€” Ritual de novo decreto\nðŸ“‹ `!listar` â€” Consultar os anais\nðŸ—³ï¸ `/enquete` â€” Criar enquete no site\nðŸ§¹ `/limpar` â€” Apagar mensagens\nðŸ“¢ `/anunciar` â€” Fazer anÃºncio\nðŸŽ« Comandos `/ticket`...');
      } else if (escolha === 'admin') {
        if (!ehAdmin(interaction.member)) return interaction.reply({ content: 'ðŸš« *Os deuses proÃ­bem teu acesso a esta sabedoria.*', ephemeral: true });
        embed.setTitle('ðŸ”± GrimÃ³rio dos Admins')
          .setDescription('âœï¸ `!editar / !apagar` â€” Gerenciar decretos\nðŸ“œ `/changelog` â€” Gerenciar decretos via slash\nðŸ—ºï¸ `/roadmap` â€” Gerenciar roadmap do site\nðŸš« `!revogar` â€” Gerenciar tokens ativos');
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // SISTEMA DE TICKETS
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Select menu â€” abrir ticket
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_criar') {
      const categoria = interaction.values[0];
      return abrirTicket(interaction, categoria);
    }

    // /ticket
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
      const sub = interaction.options.getSubcommand();

      // /ticket painel â€” envia painel no canal (apenas staff)
      if (sub === 'painel') {
        if (!temPermissaoModeracao(interaction)) {
          return interaction.reply({ content: 'âš ï¸ *Apenas guardiÃµes do Olimpo podem invocar o painel de tickets.*', ephemeral: true });
        }
        await enviarPainelTicket(interaction.channel);
        return interaction.reply({ content: 'âœ… *Painel de tickets proclamado no canal!*', ephemeral: true });
      }

      // /ticket listar â€” lista tickets abertos
      if (sub === 'listar') {
        if (!temPermissaoModeracao(interaction)) {
          return interaction.reply({ content: 'âš ï¸ *Apenas guardiÃµes do Olimpo podem ver esta lista.*', ephemeral: true });
        }
        const lista = [...ticketsAtivos.values()].filter(t => t.status === 'aberto');
        if (!lista.length) return interaction.reply({ content: 'âœ… *Nenhum ticket aberto no momento. Os salÃµes do Olimpo estÃ£o em paz.*', ephemeral: true });
        const texto = lista.map(t => {
          const canalRef = interaction.guild.channels.cache.get(t.channelId);
          const cat = CATEGORIAS_TICKET[t.categoria]?.emoji || 'ðŸ“œ';
          const mins = Math.floor((Date.now() - t.criadoEm) / 60000);
          const tempo = mins < 60 ? `${mins}min` : `${Math.floor(mins/60)}h${mins%60}min`;
          return `${cat} **#${t.id}** â€” ${t.username} â€” ${t.categoria} â€” aberto hÃ¡ ${tempo} ${canalRef ? `â†’ ${canalRef}` : ''}`;
        }).join('\n');
        return interaction.reply({
          content: `ðŸ“œ **TICKETS ABERTOS â€” ${lista.length} chamado(s)**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n${texto}\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`,
          ephemeral: true,
        });
      }

      // Comandos que exigem estar dentro de um canal de ticket
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) {
        return interaction.reply({ content: 'âš ï¸ *Este comando sÃ³ funciona dentro de um canal de ticket.*', ephemeral: true });
      }

      // /ticket fechar
      if (sub === 'fechar') {
        const ehDono    = ticket.userId === interaction.user.id;
        const ehStaff   = temPermissaoModeracao(interaction);
        if (!ehDono && !ehStaff) return interaction.reply({ content: 'âš ï¸ *Apenas o criador do ticket ou staff pode fechÃ¡-lo.*', ephemeral: true });
        return fecharTicket(interaction, ticket);
      }

      // /ticket resolver
      if (sub === 'resolver') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas staff pode marcar como resolvido.*', ephemeral: true });
        ticket.status      = 'resolvido';
        ticket.resolvidoPor = interaction.user.tag;
        await salvarTickets().catch(() => {});
        const embedResolvido = new EmbedBuilder()
          .setColor(0x3dd68c)
          .setTitle(`âœ… Ticket #${ticket.id} Resolvido`)
          .setDescription(`*Os deuses declararam este chamado solucionado.*\n\n**Resolvido por:** ${interaction.user.tag}\n\nO ticket serÃ¡ fechado em breve.\n*Usa \`/ticket fechar\` para encerrar ou aguarda o criador confirmar.*`);
        await interaction.reply({ embeds: [embedResolvido] });
        await logTicket(interaction.guild, `âœ… **Ticket Resolvido** â€” #${ticket.id}\nðŸ‘¤ **UsuÃ¡rio:** ${ticket.username}\nâœ… **Resolvido por:** ${interaction.user.tag}`);
        return;
      }

      // /ticket assumir
      if (sub === 'assumir') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas staff pode assumir um ticket.*', ephemeral: true });
        ticket.assumidoPor = interaction.user.tag;
        await salvarTickets().catch(() => {});
        await interaction.reply({
          content: `âš”ï¸ **${interaction.user} assumiu o atendimento deste ticket.**\n*${interaction.user.username} Ã© o guardiÃ£o responsÃ¡vel por este chamado.*`,
        });
        return;
      }

      // /ticket add
      if (sub === 'add') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas staff pode adicionar usuÃ¡rios ao ticket.*', ephemeral: true });
        const usuario = interaction.options.getUser('usuario');
        await interaction.channel.permissionOverwrites.edit(usuario.id, {
          ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
        });
        return interaction.reply({ content: `âœ… *${usuario} foi adicionado Ã  cÃ¢mara.*` });
      }

      // /ticket remove
      if (sub === 'remove') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas staff pode remover usuÃ¡rios do ticket.*', ephemeral: true });
        const usuario = interaction.options.getUser('usuario');
        if (usuario.id === ticket.userId) return interaction.reply({ content: 'âš ï¸ *NÃ£o podes remover o criador do ticket.*', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(usuario.id, { ViewChannel: false });
        return interaction.reply({ content: `âœ… *${usuario} foi removido da cÃ¢mara.*` });
      }
    }

    // BotÃ£o â€” fechar ticket
    if (interaction.isButton() && interaction.customId === 'ticket_fechar') {
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) return interaction.reply({ content: 'âš ï¸ *Ticket nÃ£o encontrado.*', ephemeral: true });
      const ehDono  = ticket.userId === interaction.user.id;
      const ehStaff = temPermissaoModeracao(interaction);
      if (!ehDono && !ehStaff) return interaction.reply({ content: 'âš ï¸ *Apenas o criador do ticket ou staff pode fechÃ¡-lo.*', ephemeral: true });
      return fecharTicket(interaction, ticket);
    }

    // BotÃ£o â€” resolver ticket
    if (interaction.isButton() && interaction.customId === 'ticket_resolver') {
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) return interaction.reply({ content: 'âš ï¸ *Ticket nÃ£o encontrado.*', ephemeral: true });
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas staff pode marcar como resolvido.*', ephemeral: true });
      ticket.status       = 'resolvido';
      ticket.resolvidoPor = interaction.user.tag;
      await salvarTickets().catch(() => {});
      const embedResolvido = new EmbedBuilder()
        .setColor(0x3dd68c)
        .setTitle(`âœ… Ticket #${ticket.id} Resolvido`)
        .setDescription(`*Os deuses declararam este chamado solucionado.*\n\n**Resolvido por:** ${interaction.user.tag}\n\n*Usa \`/ticket fechar\` ou o botÃ£o ðŸ”’ para encerrar o ticket.*`);
      await interaction.reply({ embeds: [embedResolvido] });
      await logTicket(interaction.guild, `âœ… **Ticket Resolvido** â€” #${ticket.id}\nðŸ‘¤ **UsuÃ¡rio:** ${ticket.username}\nâœ… **Resolvido por:** ${interaction.user.tag}`);
      return;
    }

    // BotÃ£o â€” assumir ticket
    if (interaction.isButton() && interaction.customId === 'ticket_assumir') {
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) return interaction.reply({ content: 'âš ï¸ *Ticket nÃ£o encontrado.*', ephemeral: true });
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: 'âš ï¸ *Apenas staff pode assumir um ticket.*', ephemeral: true });
      ticket.assumidoPor = interaction.user.tag;
      await salvarTickets().catch(() => {});
      await interaction.reply({
        content: `âš”ï¸ **${interaction.user} assumiu o atendimento deste ticket.**\n*${interaction.user.username} Ã© o guardiÃ£o responsÃ¡vel por este chamado.*`,
      });
      return;
    }

    // BotÃ£o â€” avaliaÃ§Ã£o (chega via DM)
    if (interaction.isButton() && interaction.customId.startsWith('avaliar_')) {
      const partes  = interaction.customId.split('_'); // avaliar_NOTA_TICKETID
      const nota    = parseInt(partes[1]);
      const ticketId = parseInt(partes[2]);

      const estrelas = 'â­'.repeat(nota);
      const msgs     = ['', 'ðŸ˜” Lamentamos nÃ£o ter ajudado bem...', 'ðŸ˜ Obrigado pelo retorno, melhoraremos!', 'ðŸ™‚ Que bom que ajudamos!', 'ðŸ˜Š Fico feliz que tenha gostado!', 'ðŸŒŸ Os deuses do Olimpo agradecem, mortal!'];

      await interaction.reply({
        content: `${estrelas} *AvaliaÃ§Ã£o registrada! ${msgs[nota]}*\n*Obrigado por jogar Tower Deep!* ðŸ”±`,
        ephemeral: false,
      });

      // Desativa os botÃµes de avaliaÃ§Ã£o
      const rowDesativada = new ActionRowBuilder().addComponents(
        [1,2,3,4,5].map(n =>
          new ButtonBuilder()
            .setCustomId(`avaliar_${n}_${ticketId}_done`)
            .setLabel('â­'.repeat(n))
            .setStyle(n === nota ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(true)
        )
      );
      await interaction.message.edit({ components: [rowDesativada] }).catch(() => {});

      // Log da avaliaÃ§Ã£o
      if (CONFIG.CANAL_LOG_TICKETS) {
        try {
          const guilds = client.guilds.cache.values();
          for (const g of guilds) {
            const canalLog = g.channels.cache.get(CONFIG.CANAL_LOG_TICKETS);
            if (canalLog) {
              await canalLog.send(
                `â­ **AvaliaÃ§Ã£o Recebida** â€” Ticket #${ticketId}\nðŸ‘¤ **UsuÃ¡rio:** ${interaction.user.tag}\n${estrelas} **Nota:** ${nota}/5\n${msgs[nota]}`
              );
              break;
            }
          }
        } catch { /* silencioso */ }
      }
      return;
    }

  } catch (err) {
    console.error('Erro em interactionCreate:', err);
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: 'âš ï¸ Ocorreu um erro inesperado nos salÃµes do Olimpo.' }).catch(() => {});
      else await interaction.reply({ content: 'âš ï¸ Ocorreu um erro inesperado nos salÃµes do Olimpo.', ephemeral: true }).catch(() => {});
    }
  }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// READY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
client.once('ready', async () => {
  console.log(`\nðŸ”± Tower Deep Bot online â€” ${client.user.tag}`);
  await registrarSlashCommands(client.user.id);
  await carregarXP();
  await carregarTickets();
  console.log(`ðŸ¤– IA (OrÃ¡culo):    ${CONFIG.GROK_KEY ? 'âœ… Ativada (Grok)' : 'âŒ DESATIVADA â€” adicione GROK_KEY'}`);
  console.log(`ðŸ“œ Canal updates:   ${CONFIG.CANAL_UPDATE_ID  || 'âŒ nÃ£o configurado'}`);
  console.log(`ðŸ“¢ Canal anÃºncios:  ${CONFIG.CANAL_ANUNCIO_ID || 'âŒ nÃ£o configurado'}`);
  console.log(`ðŸ› Canal bugs:      ${CONFIG.CANAL_BUGS_ID    || 'âŒ nÃ£o configurado'}`);
  console.log(`ðŸŽ« Categoria tickets: ${CONFIG.CATEGORIA_TICKETS || 'âŒ nÃ£o configurado (tickets criados na raiz)'}`);
  console.log(`ðŸ“‹ Log de tickets:  ${CONFIG.CANAL_LOG_TICKETS || 'âŒ nÃ£o configurado'}`);
  console.log(`ðŸ”‘ Token cargos:    Dono=${CONFIG.CARGO_DONO ? 'âœ…' : 'âŒ'} Admin=${CONFIG.CARGO_ADMIN ? 'âœ…' : 'âŒ'} Mod=${CONFIG.CARGO_MOD ? 'âœ…' : 'âŒ'} Equipe=${CONFIG.CARGO_EQUIPE ? 'âœ…' : 'âŒ'}\n`);
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BOAS-VINDAS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
client.on('guildMemberAdd', async (member) => {
  // â”€â”€ Cargo automÃ¡tico (Gamerule) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const cargo = member.guild.roles.cache.get(CONFIG.CARGO_MEMBRO);
    if (cargo) {
      await member.roles.add(cargo);
      console.log(`âœ… Cargo "${cargo.name}" atribuÃ­do a ${member.user.tag}`);
    } else {
      console.warn(`âš ï¸ Cargo CARGO_MEMBRO (${CONFIG.CARGO_MEMBRO}) nÃ£o encontrado no servidor.`);
    }
  } catch (err) {
    console.error(`âŒ Erro ao atribuir cargo a ${member.user.tag}:`, err.message);
  }

  // â”€â”€ DM de boas-vindas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const dm      = await member.createDM();
    const botName = member.guild.members.me?.user.username || 'Bot';
    await dm.send([
      `âš¡ **OS DEUSES DO OLIMPO NOTARAM SUA CHEGADA, ${member.user.username}!** âš¡`,
      '','â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”','*Um novo mortal adentra os salÃµes sagrados...*','',
      `VocÃª foi convocado para o servidor oficial do **Tower Deep** â€” o Tower Defense de deuses gregos no Roblox.`,
      '','ðŸ›ï¸ **O que os deuses te permitem aqui:**',
      '> âš”ï¸ Enfrentar as hostes do TÃ¡rtaro e deixar sua marca',
      '> ðŸ—³ï¸ Votar nos decretos futuros do Olimpo',
      '> ðŸ“œ Acompanhar os decretos divinos',
      `> ðŸ”® Consultar o OrÃ¡culo (@${botName}) para sabedoria sobre o jogo`,
      '','ðŸŒ **Site oficial:** https://italozkv.github.io/tower-deep/',
      'ðŸ“– **Wiki:** https://italozkv.github.io/tower-deep/wiki.html',
      'ðŸ“œ **Changelog:** https://italozkv.github.io/tower-deep/changelog.html',
      'ðŸ—³ï¸ **Votar em features:** https://italozkv.github.io/tower-deep/votos.html',
      '','â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”',
      '*Que Zeus ilumine teu caminho e Ares fortaleÃ§a teu braÃ§o, mortal.* ðŸ”±',
    ].join('\n'));
  } catch (err) { console.error(`NÃ£o foi possÃ­vel enviar DM para ${member.user.tag}:`, err.message); }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MESSAGES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const texto       = message.content.trim();
  const mencionouBot = message.mentions.has(client.user);
  const ehComando   = texto.startsWith('!');
  const t           = texto.toLowerCase();

  // IA por menÃ§Ã£o
  if (mencionouBot) {
    if (!CONFIG.GROK_KEY) return message.reply('ðŸŒ‘ *O OrÃ¡culo mergulhou em sono profundo... Configure a variÃ¡vel `GROK_KEY` no Railway para invocÃ¡-lo.*');
    const pergunta = texto.replace(/<@!?\d+>/g, '').trim();
    if (!pergunta) return message.reply('âœ¨ *O OrÃ¡culo te observa, mortal... Qual Ã© o teu questionamento?*');
    return responderComIA(message, pergunta);
  }

  // !token â€” qualquer canal
  if (texto === '!token') return handleToken(message);

  // !revogar â€” Dono/Admin
  if (texto.startsWith('!revogar')) return handleRevogar(message, texto.split(' ').slice(1));

  // Canal de updates â€” comandos restritos por cargo
  if (message.channelId === CONFIG.CANAL_UPDATE_ID) {
    const member = await getMember(message);

    if (texto === '!update') {
      if (!ehMod(member)) return message.reply('ðŸš« *Apenas Moderadores, Admins ou Dono podem proclamar decretos.*');
      return iniciarFormulario(message);
    }

    if (texto === '!listar') {
      if (!ehEquipe(member)) return message.reply('ðŸš« *Apenas membros da Equipe ou superior podem consultar os anais.*');
      try {
        const dados = await lerGist();
        if (!dados.updates?.length) return message.reply('ðŸ“œ *Os pergaminhos estÃ£o em branco, mortal. Nenhum decreto foi proclamado ainda.*');
        return responderTextoLongo(message, 'ðŸ“œ **ANAIS DO OLIMPO â€” Decretos Proclamados**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n' + dados.updates.map((u, i) => `**#${i+1}** âš”ï¸ \`${u.versao}\` â€” ${u.titulo} *(${u.data})* ${u.imagem ? 'ðŸ–¼ï¸' : ''}`).join('\n'), true);
      } catch { return message.reply('âš ï¸ *As brumas do Ã‰rebo ocultam os pergaminhos... Tente novamente.*'); }
    }

    if (texto.startsWith('!apagar')) {
      if (!ehAdmin(member)) return message.reply('ðŸš« *Apenas Admin ou Dono pode apagar decretos.*');
      const num = parseInt(texto.split(' ')[1]);
      if (isNaN(num)) return message.reply('âš ï¸ *Uso: `!apagar 2` â€” informe o nÃºmero do decreto (veja com `!listar`).*');
      try {
        const dados = await lerGist();
        const updates = dados.updates || [];
        if (num < 1 || num > updates.length) return message.reply(`âš ï¸ *NÃºmero invÃ¡lido. HÃ¡ ${updates.length} decreto(s).*`);
        const removido = updates.splice(num - 1, 1)[0];
        dados.updates = updates;
        await salvarGist(dados);
        return message.reply(`ðŸ—‘ï¸ **Decreto apagado:** \`${removido.versao}\` â€” ${removido.titulo}\n*O site foi atualizado.*`);
      } catch { return message.reply('âš ï¸ *Erro ao apagar. Tente novamente.*'); }
    }

    if (texto.startsWith('!editar')) {
      if (!ehAdmin(member)) return message.reply('ðŸš« *Apenas Admin ou Dono pode editar decretos.*');
      const partes = texto.split(' ');
      const num    = parseInt(partes[1]);
      const campo  = partes[2]?.toLowerCase();
      const valor  = partes.slice(3).join(' ');
      const camposValidos = ['titulo', 'subtitulo', 'imagem', 'proximo'];
      if (isNaN(num) || !campo || !valor)
        return message.reply('âš ï¸ *Uso: `!editar 1 titulo Novo TÃ­tulo`*\n*Campos: `titulo`, `subtitulo`, `imagem` (URL), `proximo`*');
      if (!camposValidos.includes(campo)) return message.reply(`âš ï¸ *Campo invÃ¡lido. Use: ${camposValidos.join(', ')}*`);
      try {
        const dados = await lerGist();
        const updates = dados.updates || [];
        if (num < 1 || num > updates.length) return message.reply(`âš ï¸ *NÃºmero invÃ¡lido. HÃ¡ ${updates.length} decreto(s).*`);
        if (campo === 'proximo') dados.proximaUpdate = valor;
        else updates[num - 1][campo] = valor;
        dados.updates = updates;
        await salvarGist(dados);
        return message.reply(`âœï¸ **Decreto #${num} atualizado!**\nCampo \`${campo}\` â†’ ${valor}\n*O site foi atualizado.*`);
      } catch { return message.reply('âš ï¸ *Erro ao editar. Tente novamente.*'); }
    }

    if (texto === '!ajuda') {
      // Monta ajuda dinÃ¢mica de acordo com o cargo do usuÃ¡rio
      const member = await getMember(message);
      const isDono   = ehDono(member);
      const isAdmin  = ehAdmin(member);
      const isMod    = ehMod(member);
      const isEquipe = ehEquipe(member);
      const isTodos  = true;

      let msg = 'ðŸ”± **GRIMÃ“RIO DO OLIMPO â€” Poderes DisponÃ­veis**\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n';

      // Todos os mortais
      msg += 'ðŸ‘¥ **Para todos os mortais**\n';
      msg += 'ðŸ› `/bug`                  â€” Relatar uma anomalia\n';
      msg += 'ðŸ’¡ `/sugestao`             â€” Enviar uma visÃ£o ao Olimpo\n';
      msg += 'ðŸ† `/rank`                 â€” Ver teu tÃ­tulo divino\n';
      msg += 'ðŸŽ« Menu de tickets         â€” Abrir chamado de suporte\n';
      msg += '\n';

      // Equipe+
      if (isEquipe) {
        msg += 'ðŸ›¡ï¸ **Equipe** *(e superiores)*\n';
        msg += 'ðŸ”‘ `!token`               â€” Gerar token de acesso ao site\n';
        msg += 'ðŸ“‹ `!listar`              â€” Consultar os anais do changelog\n';
        msg += 'ðŸŽ« `/ticket listar`       â€” Ver tickets abertos\n';
        msg += 'ðŸŽ« `/ticket assumir`      â€” Assumir atendimento de ticket\n';
        msg += '\n';
      }

      // Mod+
      if (isMod) {
        msg += 'âš”ï¸ **Moderadores** *(e superiores)*\n';
        msg += 'ðŸ“œ `!update`              â€” Ritual de novo decreto\n';
        msg += 'ðŸ—³ï¸ `/enquete`             â€” Criar enquete no site\n';
        msg += 'ðŸ§¹ `/limpar`              â€” Apagar mensagens do canal\n';
        msg += 'ðŸ“¢ `/anunciar`            â€” Fazer anÃºncio no canal\n';
        msg += 'ðŸŽ« `/ticket painel`       â€” Enviar painel de tickets\n';
        msg += 'ðŸŽ« `/ticket fechar`       â€” Fechar ticket\n';
        msg += 'ðŸŽ« `/ticket resolver`     â€” Marcar ticket como resolvido\n';
        msg += 'ðŸŽ« `/ticket add/remove`   â€” Gerenciar acesso ao ticket\n';
        msg += '\n';
      }

      // Admin+
      if (isAdmin) {
        msg += 'ðŸ”± **Admins** *(e Dono)*\n';
        msg += 'âœï¸ `!editar N campo val`  â€” Editar campo de um decreto\n';
        msg += 'ðŸ—‘ï¸ `!apagar N`            â€” Apagar um decreto\n';
        msg += 'ðŸ“œ `/changelog listar`    â€” Listar todos os decretos\n';
        msg += 'ðŸ“œ `/changelog editar`    â€” Editar decreto pelo slash\n';
        msg += 'ðŸ“œ `/changelog apagar`    â€” Apagar decreto pelo slash\n';
        msg += 'ðŸ“œ `/changelog imagem`    â€” Trocar imagem de decreto\n';
        msg += 'ðŸ—ºï¸ `/roadmap` (todos subs) â€” Gerenciar roadmap do site\n';
        msg += 'ðŸš« `!revogar`             â€” Listar tokens ativos\n';
        msg += 'ðŸš« `!revogar @usuÃ¡rio`    â€” Revogar token de alguÃ©m\n';
        msg += '\n';
      }

      // Dono
      if (isDono) {
        msg += 'ðŸ‘‘ **Dono** *(exclusivo)*\n';
        msg += 'ðŸ”‘ Acesso total ao painel do site\n';
        msg += 'ðŸ—‘ï¸ `token.revogar` â€” permissÃ£o de revogar tokens via site\n';
        msg += '\n';
      }

      msg += 'âœ¨ **O OrÃ¡culo** *(mencione em qualquer canal)*\n';
      msg += '`@Bot qual torre Ã© melhor?`  â€” Consulta geral\n';
      msg += '`@Bot tenho um bug`          â€” AuxÃ­lio tÃ©cnico\n';
      msg += '`@Bot sugestÃ£o: torre X`     â€” AnÃ¡lise de ideia\n';
      msg += '\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n';
      msg += `*Logado como: ${isDono ? 'ðŸ‘‘ Dono' : isAdmin ? 'ðŸ”± Admin' : isMod ? 'âš”ï¸ Moderador' : isEquipe ? 'ðŸ›¡ï¸ Equipe' : 'ðŸ‘¥ Mortal'}*`;

      return message.reply(msg);
    }

    if (texto === '!ajuda') {
      const embedAjuda = new EmbedBuilder()
        .setColor(CONFIG.CORES.PRIMARIA)
        .setTitle('ðŸ”± GRIMÃ“RIO DO OLIMPO')
        .setDescription('*Selecione a seÃ§Ã£o do grimÃ³rio que desejas consultar no menu abaixo.*')
        .setFooter({ text: 'Tower Deep Â· Sabedoria Divina' });

      const menuAjuda = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu_ajuda')
          .setPlaceholder('ðŸ“– Escolha a pÃ¡gina do GrimÃ³rio...')
          .addOptions(
            { label: 'Poderes dos Mortais',    description: 'Comandos acessÃ­veis a todos os jogadores',    value: 'mortais', emoji: 'ðŸ‘¥' },
            { label: 'O OrÃ¡culo (IA)',          description: 'Como conversar com a InteligÃªncia Divina',   value: 'oraculo', emoji: 'âœ¨' },
            { label: 'Armamento da Equipe',     description: 'Comandos para Equipe e Moderadores',         value: 'equipe',  emoji: 'ðŸ›¡ï¸' },
            { label: 'GrimÃ³rio dos Admins',     description: 'Poderes de alto escalÃ£o e configuraÃ§Ã£o',     value: 'admin',   emoji: 'ðŸ”±' },
          )
      );
      return message.reply({ embeds: [embedAjuda], components: [menuAjuda] });
    }
  }

  // SessÃ£o em andamento
  if (sessoes.has(message.author.id)) return processarEtapa(message);

  // Respostas automÃ¡ticas
  if (!ehComando && !mencionouBot) {
    if (t.includes('bug') || t.includes('erro') || t.includes('bugado')) {
      await message.reply('ðŸ› *Encontraste uma anomalia, mortal?*\nUse **`/bug`** para relatar com detalhes â€” abre um formulÃ¡rio privado!');
    } else if (t.includes('quando sai') || t.includes('quando lanÃ§a') || t.includes('proxima update') || t.includes('prÃ³xima update')) {
      try {
        const dados  = await lerGist();
        const previa = dados.proximaUpdate;
        if (previa) await message.reply(`ðŸ”® *Os orÃ¡culos revelam...*\n\n**PrÃ³ximo Decreto:** ${previa}\n\n*Acompanhe: https://italozkv.github.io/tower-deep/changelog.html*`);
        else        await message.reply('ðŸ”® *Os orÃ¡culos permanecem em silÃªncio sobre o prÃ³ximo decreto...*');
      } catch { await message.reply('ðŸ”® *As visÃµes dos orÃ¡culos estÃ£o turvas no momento...*'); }
    } else if (t.includes('sugestÃ£o') || t.includes('sugestao') || t.includes('ideia')) {
      await message.reply('ðŸ’¡ *Tens uma visÃ£o para o Olimpo?*\nUse **`/sugestao`** para submeter tua ideia!');
    } else if (t.includes('wiki') || t.includes('guia')) {
      await message.reply('ðŸ“– *Buscas o conhecimento dos deuses?*\nConsulte a Wiki em: https://italozkv.github.io/tower-deep/wiki.html');
    } else if (t.includes('update') || t.includes('atualizaÃ§Ã£o') || t.includes('atualizacao')) {
      await message.reply('ðŸ“œ *Buscas os decretos divinos?*\nVeja em: https://italozkv.github.io/tower-deep/changelog.html');
    } else if (t.includes('ajuda') || t.includes('como funciona') || t.includes('o que o bot faz')) {
      await message.reply('ðŸ“– *O GrimÃ³rio do Olimpo estÃ¡ Ã  tua disposiÃ§Ã£o!*\n\nâš”ï¸ `/bug` Â· ðŸ’¡ `/sugestao` Â· ðŸ† `/rank` Â· ðŸ”‘ `!token`\n\n*Ou me mencione diretamente para falar com o OrÃ¡culo!*');
    }
  }

  // XP e Level Up
  if (message.guild && !ehComando) {
    if (xpData.has(message.author.id)) {
      xpData.get(message.author.id).username = message.author.username;
    }
    const resultado = ganharXP(message.author.id);
    if (resultado?.subiu) {
      const embedUp = new EmbedBuilder()
        .setColor(CONFIG.CORES.AVISO)
        .setTitle('âš¡ ASCENSÃƒO DIVINA! âš¡')
        .setDescription(`${message.author} ascendeu para o tÃ­tulo de **${resultado.nivel.nome}** (NÃ­vel ${resultado.nivel.nivel})!\n\n*Os deuses do Olimpo reconhecem tua dedicaÃ§Ã£o, mortal.* ðŸ”±`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      if (resultado.nivel.imagem) embedUp.setImage(resultado.nivel.imagem);

      await message.channel.send({ content: `${message.author}`, embeds: [embedUp] });
    }
  }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CANAIS DE VOZ TEMPORÃRIOS (TEMPLOS)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Quando alguÃ©m entra no canal "Criar Templo"
  if (newState.channelId === CONFIG.CANAL_CRIAR_TEMPLO) {
    const member = newState.member;
    try {
      const guild     = newState.guild;
      const novoCanal = await guild.channels.create({
        name:   `ðŸ›ï¸ Templo de ${member.user.username}`,
        type:   ChannelType.GuildVoice,
        parent: CONFIG.CATEGORIA_TEMPLOS || newState.channel.parentId,
        permissionOverwrites: [
          { id: guild.id,   allow: [PermissionFlagsBits.ViewChannel] },
          { id: member.id,  allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers] },
        ],
      });
      await member.voice.setChannel(novoCanal);
      console.log(`ðŸ›ï¸ Templo criado para ${member.user.tag}: ${novoCanal.name}`);
    } catch (err) { console.error('Erro ao criar templo:', err.message); }
  }

  // Quando alguÃ©m sai â€” apaga templo vazio
  if (oldState.channelId && oldState.channelId !== CONFIG.CANAL_CRIAR_TEMPLO) {
    const canal = oldState.channel;
    if (
      canal &&
      canal.name.startsWith('ðŸ›ï¸ Templo de') &&
      canal.members.size === 0 &&
      (canal.parentId === CONFIG.CATEGORIA_TEMPLOS || !CONFIG.CATEGORIA_TEMPLOS)
    ) {
      try {
        await canal.delete('Olimpo apagou o templo vazio');
        console.log(`ðŸ—‘ï¸ Templo vazio removido: ${canal.name}`);
      } catch (err) { console.error('Erro ao apagar templo:', err.message); }
    }
  }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LOGIN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
client.login(CONFIG.DISCORD_TOKEN);

