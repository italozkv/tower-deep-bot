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
const http  = require('http');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  DISCORD_TOKEN:    process.env.DISCORD_TOKEN,
  GITHUB_TOKEN:     process.env.GITHUB_TOKEN,
  GIST_ID:          process.env.GIST_ID,
  GIST_ROADMAP_ID:  process.env.GIST_ROADMAP_ID || process.env.GIST_ID,
  CANAL_UPDATE_ID:  process.env.CANAL_ID,
  CANAL_ANUNCIO_ID: process.env.CANAL_ANUNCIO_ID,
  CANAL_BUGS_ID:    process.env.CANAL_BUGS_ID,
  GROK_KEY:         process.env.GROK_KEY,
  CARGO_DONO:        process.env.CARGO_DONO,
  CARGO_ADMIN:       process.env.CARGO_ADMIN,
  CARGO_MOD:         process.env.CARGO_MOD,
  CARGO_EQUIPE:      process.env.CARGO_EQUIPE,
  CARGO_MEMBRO:      process.env.CARGO_MEMBRO || '1479896423679131688',
  CARGO_VERIFICADO:  process.env.CARGO_VERIFICADO,
  CANAL_CRIAR_TEMPLO: process.env.CANAL_CRIAR_TEMPLO,
  CATEGORIA_TEMPLOS:  process.env.CATEGORIA_TEMPLOS,
  CATEGORIA_TICKETS: process.env.CATEGORIA_TICKETS,
  CANAL_LOG_TICKETS: process.env.CANAL_LOG_TICKETS,
  ROBLOX_API_SECRET: process.env.ROBLOX_API_SECRET || 'tower-deep-secret-2024',
  CANAL_CODIGOS:     process.env.CANAL_CODIGOS,
  CORES: {
    PRIMARIA: 0xc9a84c,
    ERRO:     0xff5a5a,
    SUCESSO:  0x3dd68c,
    AVISO:    0xf0c060,
    INFO:     0x4a9eff,
    NEUTRO:   0x555555,
  },
};

const missingVars = [];
if (!CONFIG.DISCORD_TOKEN) missingVars.push('DISCORD_TOKEN');
if (!CONFIG.GITHUB_TOKEN)  missingVars.push('GITHUB_TOKEN');
if (!CONFIG.GIST_ID)       missingVars.push('GIST_ID');

if (missingVars.length) {
  console.error(`❌ Variáveis ausentes: ${missingVars.join(', ')}`);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

// ─────────────────────────────────────────────────────────────
// CONHECIMENTO DO JOGO
// ─────────────────────────────────────────────────────────────
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
- "Não consigo comprar upgrade": precisa de mais moedas (dropadas pelos inimigos)
- "Crash na cutscene de vitória": corrigido na v0.2.5

REGRAS DO SERVIDOR:
- Respeito entre todos os membros
- Bugs no canal #bugs, sugestões no #sugestões
- Sem spam ou conteúdo impróprio
`;

// ─────────────────────────────────────────────────────────────
// MEMÓRIAS / SESSÕES
// ─────────────────────────────────────────────────────────────
const historicos    = new Map();
const MAX_HISTORICO = 10;
const sessoes       = new Map();

// ─────────────────────────────────────────────────────────────
// TAGS DE UPDATE
// ─────────────────────────────────────────────────────────────
const TAGS = {
  '1': { key: 'novo',    label: '🟢 Novo'    },
  '2': { key: 'fix',     label: '🔵 Fix'     },
  '3': { key: 'balance', label: '🟠 Balance' },
  '4': { key: 'evento',  label: '🩷 Evento'  },
  '5': { key: 'divino',  label: '✨ Divino'  },
};

// ─────────────────────────────────────────────────────────────
// XP
// ─────────────────────────────────────────────────────────────
const xpData = new Map();

const NIVEIS_XP = [
  { nivel: 1,  nome: 'Mortal Comum',            xpMin: 0,    imagem: null },
  { nivel: 2,  nome: 'Mensageiro de Hermes',     xpMin: 50,   imagem: null },
  { nivel: 3,  nome: 'Guardião de Atena',        xpMin: 150,  imagem: null },
  { nivel: 4,  nome: 'Guerreiro de Ares',        xpMin: 300,  imagem: null },
  { nivel: 5,  nome: 'Navegante de Poseidon',    xpMin: 500,  imagem: null },
  { nivel: 6,  nome: 'Arauto de Zeus',           xpMin: 750,  imagem: null },
  { nivel: 7,  nome: 'Campeão de Apolo',         xpMin: 1050, imagem: null },
  { nivel: 8,  nome: 'Semideus do Olimpo',       xpMin: 1400, imagem: null },
  { nivel: 9,  nome: 'Herói Imortal',            xpMin: 1800, imagem: null },
  { nivel: 10, nome: 'Divindade do Olimpo',      xpMin: 2300, imagem: null },
];

function gerarBarraProgresso(atual, max, tamanho = 12) {
  if (max <= 0) max = 1;
  const pct = Math.min(atual / max, 1);
  const cheio = Math.round(tamanho * pct);
  const vazio = tamanho - cheio;
  return '█'.repeat(cheio) + '░'.repeat(vazio) + ` ${Math.round(pct * 100)}%`;
}

function getNivel(xp)       { let a = NIVEIS_XP[0]; for (const n of NIVEIS_XP) { if (xp >= n.xpMin) a = n; } return a; }
function getProximoNivel(xp){ for (const n of NIVEIS_XP) { if (xp < n.xpMin) return n; } return null; }

function ganharXP(userId) {
  const agora = Date.now();
  if (!xpData.has(userId)) xpData.set(userId, { xp: 0, nivel: 1, msgs: 0, username: '', lastMsg: 0 });
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

// ─────────────────────────────────────────────────────────────
// HELPERS HTTP / GIST
// ─────────────────────────────────────────────────────────────
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

async function obterGist(gistId) {
  const id = gistId || CONFIG.GIST_ID;
  try { return await githubRequest('GET', `/gists/${id}`); }
  catch (err) { console.error('Erro ao obter Gist:', err.message); return { files: {} }; }
}

async function lerArquivoJsonDoGist(nomeArquivo, fallback, gistId) {
  try {
    const gist    = await obterGist(gistId);
    const arquivo = gist.files?.[nomeArquivo];
    if (!arquivo?.content) return fallback;
    return JSON.parse(arquivo.content);
  } catch (err) { console.error(`Erro ao ler ${nomeArquivo}:`, err.message); return fallback; }
}

async function salvarArquivoJsonNoGist(nomeArquivo, conteudo, gistId) {
  const id = gistId || CONFIG.GIST_ID;
  try {
    await githubRequest('PATCH', `/gists/${id}`, {
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
  console.log(`✅ XP carregado — ${xpData.size} jogador(es)`);
}

async function salvarXP() {
  const xpJson = {};
  for (const [userId, dados] of xpData.entries()) xpJson[userId] = {
    xp: dados.xp,
    nivel: dados.nivel,
    msgs: dados.msgs || 0,
    username: dados.username || '',
  };
  return salvarArquivoJsonNoGist('xp-data.json', xpJson);
}

async function lerGist()             { return lerArquivoJsonDoGist('tower-deep-updates.json', { updates: [] }); }
async function salvarGist(dados)     { return salvarArquivoJsonNoGist('tower-deep-updates.json', dados); }
async function lerEnquetes()         { return lerArquivoJsonDoGist('enquetes.json', []); }
async function salvarEnquetes(lista) { return salvarArquivoJsonNoGist('enquetes.json', lista); }
async function lerRoadmap() {
  const dados = await lerArquivoJsonDoGist('tower-deep-roadmap.json', null, CONFIG.GIST_ROADMAP_ID);
  if (!dados) { console.error('[ROADMAP] Arquivo não encontrado no gist', CONFIG.GIST_ROADMAP_ID); return []; }
  if (Array.isArray(dados)) return dados;
  for (const key of Object.keys(dados)) {
    if (Array.isArray(dados[key])) return dados[key];
  }
  return [];
}
async function salvarRoadmap(versoes) {
  // O JSON do roadmap é um array direto — salva como está
  return salvarArquivoJsonNoGist('tower-deep-roadmap.json', versoes, CONFIG.GIST_ROADMAP_ID);
}

// ─────────────────────────────────────────────────────────────
// SISTEMA DE CÓDIGOS DE RESGATE
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// TIPOS DE RECOMPENSA
// CORREÇÃO: emojis removidos do campo "emoji" para evitar
// erro "emoji must be a valid emoji" no discord.js v14.
// Agora o emoji aparece apenas no label, que é texto livre.
// ─────────────────────────────────────────────────────────────
const TIPOS_RECOMPENSA = {
  moedas:         { label: '🪙 GodCoins',       unidade: 'Moedas',   temLista: false },
  gemas:          { label: '💎 Gems',            unidade: 'Gemas',    temLista: false },
  presents:       { label: '🎁 Presents',        unidade: 'Presents', temLista: false },
  favor_greek:    { label: '🏛️ Favor Grego',     unidade: 'Favor',    temLista: false },
  favor_norse:    { label: '🛡️ Favor Nórdico',   unidade: 'Favor',    temLista: false },
  favor_egyptian: { label: '✨ Favor Egípcio',   unidade: 'Favor',    temLista: false },
  xp:             { label: '⚡ XP Bônus',        unidade: 'XP',       temLista: false },
  item:           { label: '🎀 Item do Jogo',    unidade: '',         temLista: true  },
};

function normalizarCategoriaItem(categoriaRaw) {
  const categoria = String(categoriaRaw || '').trim();
  if (!categoria) return 'Outros';
  const baseCats = new Set(['Material', 'Crystal', 'Essence', 'Core', 'Shard', 'Consumable', 'Currency', 'Special']);
  if (baseCats.has(categoria)) return `Base > ${categoria}`;
  if (categoria.startsWith('Essência')) return 'Semideus > Essências Divinas';
  if (categoria === 'DNA' || categoria.startsWith('DNA')) return 'Semideus > DNA de Criaturas';
  if (categoria === 'Cristal Alma' || categoria.startsWith('Cristal')) return 'Semideus > Cristais de Alma';
  if (categoria === 'Catalisador' || categoria.startsWith('Catalisador')) return 'Semideus > Catalisadores';
  if (categoria === 'Auxiliar' || categoria.startsWith('Auxiliar')) return 'Semideus > Itens Auxiliares';
  return categoria;
}

const CATALOGO_FIXO = [
  { id:'gold_coin',          nome:'Moeda de Ouro',              raridade:'Common',    categoria:'Material'    },
  { id:'tower_shard',        nome:'Fragmento de Torre',         raridade:'Uncommon',  categoria:'Shard'       },
  { id:'food_crate',         nome:'Caixa de Comida',            raridade:'Common',    categoria:'Material'    },
  { id:'bone_fragment',      nome:'Fragmento de Osso',          raridade:'Common',    categoria:'Material'    },
  { id:'iron_ingot',         nome:'Lingote de Ferro',           raridade:'Uncommon',  categoria:'Material'    },
  { id:'farm_seed',          nome:'Semente Sagrada',            raridade:'Uncommon',  categoria:'Material'    },
  { id:'snow_crystal',       nome:'Cristal de Gelo',            raridade:'Rare',      categoria:'Crystal'     },
  { id:'thunder_stone',      nome:'Pedra do Trovão',            raridade:'Rare',      categoria:'Crystal'     },
  { id:'death_crystal',      nome:'Cristal da Morte',           raridade:'Rare',      categoria:'Crystal'     },
  { id:'rune_crystal',       nome:'Cristal de Runa',            raridade:'Rare',      categoria:'Crystal'     },
  { id:'sky_essence',        nome:'Essência do Céu',            raridade:'Rare',      categoria:'Crystal'     },
  { id:'shadow_essence',     nome:'Essência Sombria',           raridade:'Epic',      categoria:'Essence'     },
  { id:'void_fragment',      nome:'Fragmento do Vazio',         raridade:'Epic',      categoria:'Essence'     },
  { id:'rare_core',          nome:'Núcleo Raro',                raridade:'Rare',      categoria:'Core'        },
  { id:'legendary_core',     nome:'Núcleo Lendário',            raridade:'Legendary', categoria:'Core'        },
  { id:'mythic_shard',       nome:'Fragmento Mítico',           raridade:'Mythic',    categoria:'Shard'       },
  { id:'void_bag',           nome:'Saco do Vazio',              raridade:'Epic',      categoria:'Special'     },
  { id:'training_manual',    nome:'Manual dos Deuses',          raridade:'Uncommon',  categoria:'Consumable'  },
  { id:'premium_token',      nome:'Token Divino',               raridade:'Epic',      categoria:'Currency'    },
  { id:'portal_mistico',     nome:'Portal Místico',             raridade:'Legendary', categoria:'Special'     },
  { id:'essencia_zeus',      nome:'Essência de Zeus',           raridade:'Raro',      categoria:'Essência Grego'   },
  { id:'essencia_poseidon',  nome:'Essência de Poseidon',       raridade:'Raro',      categoria:'Essência Grego'   },
  { id:'essencia_ares',      nome:'Essência de Ares',           raridade:'Incomum',   categoria:'Essência Grego'   },
  { id:'essencia_apolo',     nome:'Essência de Apolo',          raridade:'Incomum',   categoria:'Essência Grego'   },
  { id:'essencia_hefesto',   nome:'Essência de Hefesto',        raridade:'Raro',      categoria:'Essência Grego'   },
  { id:'essencia_hecate',    nome:'Essência de Hécate',         raridade:'Epico',     categoria:'Essência Grego'   },
  { id:'essencia_odin',      nome:'Essência de Odin',           raridade:'Epico',     categoria:'Essência Nórdico' },
  { id:'essencia_thor',      nome:'Essência de Thor',           raridade:'Raro',      categoria:'Essência Nórdico' },
  { id:'essencia_freya',     nome:'Essência de Freya',          raridade:'Incomum',   categoria:'Essência Nórdico' },
  { id:'essencia_loki',      nome:'Essência de Loki',           raridade:'Epico',     categoria:'Essência Nórdico' },
  { id:'essencia_tyr',       nome:'Essência de Tyr',            raridade:'Raro',      categoria:'Essência Nórdico' },
  { id:'essencia_heimdall',  nome:'Essência de Heimdall',       raridade:'Incomum',   categoria:'Essência Nórdico' },
  { id:'essencia_ra',        nome:'Essência de Rá',             raridade:'Epico',     categoria:'Essência Egípcio' },
  { id:'essencia_anubis',    nome:'Essência de Anubis',         raridade:'Raro',      categoria:'Essência Egípcio' },
  { id:'essencia_thoth',     nome:'Essência de Thoth',          raridade:'Incomum',   categoria:'Essência Egípcio' },
  { id:'essencia_bastet',    nome:'Essência de Bastet',         raridade:'Raro',      categoria:'Essência Egípcio' },
  { id:'essencia_set',       nome:'Essência de Set',            raridade:'Epico',     categoria:'Essência Egípcio' },
  { id:'essencia_isis',      nome:'Essência de Ísis',           raridade:'Lendario',  categoria:'Essência Egípcio' },
  { id:'essencia_cronos',    nome:'Essência de Cronos',         raridade:'Lendario',  categoria:'Essência Secreta' },
  { id:'essencia_caos',      nome:'Essência de Caos',           raridade:'Primordial',categoria:'Essência Secreta' },
  { id:'essencia_gaia',      nome:'Essência de Gaia',           raridade:'Lendario',  categoria:'Essência Secreta' },
  { id:'essencia_nyx',       nome:'Essência de Nyx',            raridade:'Primordial',categoria:'Essência Secreta' },
  { id:'essencia_erebo',     nome:'Essência do Érebo',          raridade:'Lendario',  categoria:'Essência Secreta' },
  { id:'essencia_tartaro',   nome:'Essência do Tártaro',        raridade:'Lendario',  categoria:'Essência Secreta' },
  { id:'dna_goblin',         nome:'DNA de Goblin',              raridade:'Comum',     categoria:'DNA'         },
  { id:'dna_esqueleto',      nome:'DNA de Esqueleto',           raridade:'Comum',     categoria:'DNA'         },
  { id:'dna_lobo',           nome:'DNA de Lobo',                raridade:'Comum',     categoria:'DNA'         },
  { id:'dna_aranha',         nome:'DNA de Aranha',              raridade:'Comum',     categoria:'DNA'         },
  { id:'dna_harpia',         nome:'DNA de Harpia',              raridade:'Comum',     categoria:'DNA'         },
  { id:'dna_satiro',         nome:'DNA de Sátiro',              raridade:'Comum',     categoria:'DNA'         },
  { id:'dna_minotauro',      nome:'DNA de Minotauro',           raridade:'Incomum',   categoria:'DNA'         },
  { id:'dna_ciclope',        nome:'DNA de Ciclope',             raridade:'Incomum',   categoria:'DNA'         },
  { id:'dna_gorgona',        nome:'DNA de Górgona',             raridade:'Incomum',   categoria:'DNA'         },
  { id:'dna_centauro',       nome:'DNA de Centauro',            raridade:'Incomum',   categoria:'DNA'         },
  { id:'dna_quimera',        nome:'DNA de Quimera',             raridade:'Incomum',   categoria:'DNA'         },
  { id:'dna_grifo',          nome:'DNA de Grifo',               raridade:'Incomum',   categoria:'DNA'         },
  { id:'dna_medusa',         nome:'DNA de Medusa',              raridade:'Raro',      categoria:'DNA'         },
  { id:'dna_hidra',          nome:'DNA de Hidra',               raridade:'Raro',      categoria:'DNA'         },
  { id:'dna_basilisco',      nome:'DNA de Basilisco',           raridade:'Raro',      categoria:'DNA'         },
  { id:'dna_escila',         nome:'DNA de Escila',              raridade:'Raro',      categoria:'DNA'         },
  { id:'dna_esfinge',        nome:'DNA de Esfinge',             raridade:'Raro',      categoria:'DNA'         },
  { id:'dna_cerbero',        nome:'DNA de Cerbero',             raridade:'Raro',      categoria:'DNA'         },
  { id:'dna_fenrir',         nome:'DNA de Fenrir',              raridade:'Lendario',  categoria:'DNA Boss'    },
  { id:'dna_tifao',          nome:'DNA de Tifão',               raridade:'Lendario',  categoria:'DNA Boss'    },
  { id:'dna_cronos_corrompido',nome:'DNA de Cronos Corrompido', raridade:'Lendario',  categoria:'DNA Boss'    },
  { id:'dna_leviata',        nome:'DNA de Leviatã',             raridade:'Lendario',  categoria:'DNA Boss'    },
  { id:'dna_caos_encarnado', nome:'DNA de Caos Encarnado',      raridade:'Primordial',categoria:'DNA Final'   },
  { id:'dna_nyx_sombria',    nome:'DNA de Nyx Sombria',         raridade:'Primordial',categoria:'DNA Final'   },
  { id:'cristal_guerreiro',  nome:'Cristal Guerreiro',          raridade:'Comum',     categoria:'Cristal Alma'},
  { id:'cristal_protetor',   nome:'Cristal Protetor',           raridade:'Comum',     categoria:'Cristal Alma'},
  { id:'cristal_cacador',    nome:'Cristal Caçador',            raridade:'Incomum',   categoria:'Cristal Alma'},
  { id:'cristal_altruista',  nome:'Cristal Altruísta',          raridade:'Incomum',   categoria:'Cristal Alma'},
  { id:'cristal_estrategista',nome:'Cristal Estrategista',      raridade:'Raro',      categoria:'Cristal Alma'},
  { id:'cristal_vingativo',  nome:'Cristal Vingativo',          raridade:'Raro',      categoria:'Cristal Alma'},
  { id:'cristal_caotico',    nome:'Cristal Caótico',            raridade:'Raro',      categoria:'Cristal Alma'},
  { id:'cristal_predador',   nome:'Cristal Predador',           raridade:'Epico',     categoria:'Cristal Alma'},
  { id:'cristal_fantasma',   nome:'Cristal Fantasma',           raridade:'Epico',     categoria:'Cristal Alma'},
  { id:'cristal_berserker',  nome:'Cristal Berserker',          raridade:'Epico',     categoria:'Cristal Alma'},
  { id:'cristal_divino',     nome:'Cristal Divino',             raridade:'Lendario',  categoria:'Cristal Alma'},
  { id:'cristal_vazio',      nome:'Cristal do Vazio',           raridade:'Primordial',categoria:'Cristal Alma'},
  { id:'cat_chama_primordial',nome:'Chama Primordial',          raridade:'Incomum',   categoria:'Catalisador' },
  { id:'cat_gelo_eterno',    nome:'Gelo Eterno',                raridade:'Incomum',   categoria:'Catalisador' },
  { id:'cat_raio_puro',      nome:'Raio Puro',                  raridade:'Raro',      categoria:'Catalisador' },
  { id:'cat_veneno_equidna', nome:'Veneno de Equidna',          raridade:'Raro',      categoria:'Catalisador' },
  { id:'cat_vento_ciclonico',nome:'Vento Ciclônico',            raridade:'Incomum',   categoria:'Catalisador' },
  { id:'cat_trevas_erebo',   nome:'Trevas do Érebo',            raridade:'Epico',     categoria:'Catalisador' },
  { id:'cat_lagrima_tetis',  nome:'Lágrima de Tétis',           raridade:'Raro',      categoria:'Catalisador' },
  { id:'cat_mel_ambrosia',   nome:'Mel de Ambrosia',            raridade:'Raro',      categoria:'Catalisador' },
  { id:'cat_agua_estige',    nome:'Água do Estige',             raridade:'Epico',     categoria:'Catalisador' },
  { id:'cat_areia_cronos',   nome:'Areia de Cronos',            raridade:'Epico',     categoria:'Catalisador' },
  { id:'cat_sangue_tita',    nome:'Sangue de Titã',             raridade:'Lendario',  categoria:'Catalisador' },
  { id:'cat_fragmento_caos', nome:'Fragmento do Caos',          raridade:'Lendario',  categoria:'Catalisador' },
  { id:'cat_ovo_legado',     nome:'Ovo de Legado',              raridade:'Variavel',  categoria:'Catalisador' },
  { id:'cat_runa_yggdrasil', nome:'Runa de Yggdrasil',          raridade:'Epico',     categoria:'Catalisador' },
  { id:'cat_olho_horus',     nome:'Olho de Hórus',              raridade:'Lendario',  categoria:'Catalisador' },
  { id:'cat_chave_tartaro',  nome:'Chave do Tártaro',           raridade:'Primordial',categoria:'Catalisador' },
  { id:'aux_purificador_divino',nome:'Purificador Divino',      raridade:'Raro',      categoria:'Auxiliar'    },
  { id:'aux_amplificador_dna',  nome:'Amplificador de DNA',     raridade:'Raro',      categoria:'Auxiliar'    },
  { id:'aux_estabilizador_alma',nome:'Estabilizador de Alma',   raridade:'Raro',      categoria:'Auxiliar'    },
  { id:'aux_catalisador_duplo', nome:'Catalisador Duplo',       raridade:'Epico',     categoria:'Auxiliar'    },
  { id:'aux_extrator_dna',      nome:'Extrator de DNA',         raridade:'Raro',      categoria:'Auxiliar'    },
  { id:'aux_copiador_essencia', nome:'Copiador de Essência',    raridade:'Epico',     categoria:'Auxiliar'    },
  { id:'aux_preservador_legado',nome:'Preservador de Legado',   raridade:'Raro',      categoria:'Auxiliar'    },
  { id:'aux_tomo_combinacoes',  nome:'Tomo de Combinações',     raridade:'Lendario',  categoria:'Auxiliar'    },
];

const RARIDADE_EMOJI = {
  Common:'⚪', Uncommon:'🟢', Rare:'🔵', Epic:'🟣', Legendary:'🟡', Mythic:'🔴',
  Comum:'⚪',  Incomum:'🟢',  Raro:'🔵', Epico:'🟣', Lendario:'🟡', Primordial:'💀', Variavel:'⬜',
};

let catalogoAutoCache = null;
let catalogoAutoCacheAt = 0;

function getPathsCatalogoLua() {
  const baseSrc = path.resolve(__dirname, '..');
  return {
    itemConfig: path.resolve(baseSrc, 'ReplicatedStorage', 'Modules', 'Config', 'ItemConfig.lua'),
    semideusConfig: path.resolve(baseSrc, 'ReplicatedStorage', 'Modules', 'Config', 'SemideusItemConfig.lua'),
  };
}

function parseCatalogoItemConfigLua(luaText) {
  const out = [];
  const blockMatch = luaText.match(/ItemConfig\.Items\s*=\s*\{([\s\S]*?)\}\s*\n\s*--\s*═|ItemConfig\.Items\s*=\s*\{([\s\S]*?)\}\s*\n\s*--\s*═/);
  const block = blockMatch?.[1] || blockMatch?.[2] || luaText;
  const itemRe = /\{[\s\S]*?\bId\s*=\s*"([^"]+)"[\s\S]*?\bName\s*=\s*"([^"]+)"[\s\S]*?\bRarity\s*=\s*"([^"]+)"[\s\S]*?\bCategory\s*=\s*"([^"]+)"[\s\S]*?\}/g;
  let m;
  while ((m = itemRe.exec(block))) {
    const id = m[1]; const nome = m[2]; const raridade = m[3]; const categoria = m[4];
    if (!id) continue;
    out.push({ id, nome, raridade, categoria });
  }
  return out;
}

function parseCatalogoSemideusLua(luaText) {
  const out = [];
  const grupos = [
    { key: 'EssenciasDivinas', categoria: 'Essência' },
    { key: 'DNACriaturas', categoria: 'DNA' },
    { key: 'CristaisAlma', categoria: 'Cristal Alma' },
    { key: 'Catalisadores', categoria: 'Catalisador' },
    { key: 'ItensAuxiliares', categoria: 'Auxiliar' },
  ];
  for (const g of grupos) {
    const listRe = new RegExp(`SemideusItemConfig\\.${g.key}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
    const listMatch = luaText.match(listRe);
    const block = listMatch?.[1] || '';
    if (!block) continue;
    const itemRe = /\{[\s\S]*?\bId\s*=\s*"([^"]+)"[\s\S]*?\bNome\s*=\s*"([^"]+)"[\s\S]*?\bRaridade\s*=\s*"([^"]+)"[\s\S]*?\}/g;
    let m;
    while ((m = itemRe.exec(block))) {
      const id = m[1]; const nome = m[2]; const raridade = m[3];
      if (!id) continue;
      out.push({ id, nome, raridade, categoria: g.categoria });
    }
  }
  return out;
}

async function getCatalogoAuto() {
  const now = Date.now();
  if (catalogoAutoCache && (now - catalogoAutoCacheAt) < (5 * 60 * 1000)) return catalogoAutoCache;
  try {
    const { itemConfig, semideusConfig } = getPathsCatalogoLua();
    const [itemLua, semiLua] = await Promise.all([
      fs.promises.readFile(itemConfig, 'utf8'),
      fs.promises.readFile(semideusConfig, 'utf8'),
    ]);
    const baseItems = parseCatalogoItemConfigLua(itemLua);
    const semiItems = parseCatalogoSemideusLua(semiLua);
    const merged = [...baseItems, ...semiItems].filter(i => i?.id);
    catalogoAutoCache = merged;
    catalogoAutoCacheAt = now;
    return merged;
  } catch (err) {
    console.error('[CatalogoAuto] Falha ao carregar catálogo Lua:', err?.message || err);
    catalogoAutoCache = [];
    catalogoAutoCacheAt = now;
    return [];
  }
}

async function getCatalogoCompleto() {
  const db = await lerCodigos();
  const extras = db.itensExtras || [];
  const auto = await getCatalogoAuto();
  const merged = [...CATALOGO_FIXO, ...auto, ...extras];
  const dedup = new Map();
  for (const it of merged) {
    if (!it?.id) continue;
    const normalized = { ...it, categoria: normalizarCategoriaItem(it.categoria) };
    dedup.set(it.id, normalized);
  }
  return [...dedup.values()];
}

function formatarItem(item, qtd = 1) {
  const emoji = RARIDADE_EMOJI[item.raridade] || '🎁';
  const qtdStr = qtd > 1 ? ` x${qtd}` : '';
  return `${emoji} **${item.nome}**${qtdStr} *(${item.raridade} — ${item.categoria})*`;
}

const sessoescodigo = new Map();

// ─────────────────────────────────────────────────────────────
// HELPERS DE PERMISSÃO
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// SISTEMA DE TOKENS
// ─────────────────────────────────────────────────────────────
const NIVEIS_TOKEN = [
  { nivel: 'dono',      label: 'Dono',      emoji: '👑', corHex: 0xf0c060, cargoId: () => CONFIG.CARGO_DONO   },
  { nivel: 'admin',     label: 'Admin',     emoji: '🔱', corHex: 0x3dd68c, cargoId: () => CONFIG.CARGO_ADMIN  },
  { nivel: 'moderador', label: 'Moderador', emoji: '⚔️', corHex: 0x4a9eff, cargoId: () => CONFIG.CARGO_MOD    },
  { nivel: 'equipe',    label: 'Equipe',    emoji: '🛡️', corHex: 0xa78bfa, cargoId: () => CONFIG.CARGO_EQUIPE },
];

const PERMISSOES = {
  dono:      ['wiki.edit', 'wiki.delete', 'wiki.publish', 'painel.full', 'token.revogar'],
  admin:     ['wiki.edit', 'wiki.publish', 'painel.full'],
  moderador: ['wiki.view_exclusivo', 'bugs.report', 'bugs.view'],
  equipe:    ['wiki.view_exclusivo'],
};

const tokensAtivos    = new Map();
const TOKEN_DURACAO_MS = 60 * 60 * 1000;

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

setInterval(() => {
  const agora = Date.now();
  for (const [tk, dados] of tokensAtivos) {
    if (dados.expira < agora) tokensAtivos.delete(tk);
  }
}, 5 * 60 * 1000);

async function handleToken(message) {
  if (!message.guild) return message.reply('⚠️ Este comando só funciona dentro do servidor.');
  let member;
  try { member = await message.guild.members.fetch(message.author.id); }
  catch { return message.reply('❌ Não consegui verificar seus cargos. Tente novamente.'); }
  const nivelDef = detectarNivelToken(member);
  if (!nivelDef) {
    return message.reply('🚫 **Acesso negado.**\nVocê não possui um cargo que permita gerar token de acesso.\n*Fale com um administrador caso acredite que isto seja um erro.*');
  }
  for (const [tk, dados] of tokensAtivos) {
    if (dados.userId === message.author.id) tokensAtivos.delete(tk);
  }
  const token  = gerarToken();
  const expira = Date.now() + TOKEN_DURACAO_MS;
  tokensAtivos.set(token, {
    nivel: nivelDef.nivel, userId: message.author.id, username: message.author.username,
    expira, criadoEm: Date.now(),
  });
  const expiraStr = new Date(expira).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const perms     = PERMISSOES[nivelDef.nivel] || [];
  try {
    await message.author.send({
      embeds: [{
        color: nivelDef.corHex,
        title: `${nivelDef.emoji} Token de Acesso — Tower Deep`,
        description: `Seu token foi gerado com sucesso.\nUse-o na página de acesso do site.\n\n\`\`\`\n${token}\n\`\`\``,
        fields: [
          { name: '🎖️ Nível',      value: `${nivelDef.emoji} ${nivelDef.label}`, inline: true },
          { name: '⏱️ Válido até', value: expiraStr,                              inline: true },
          { name: '🔑 Permissões', value: perms.map(p => `• \`${p}\``).join('\n') || '—' },
        ],
        footer:    { text: '⚠️ Não compartilhe este token com ninguém. Expira em 1 hora.' },
        timestamp: new Date().toISOString(),
      }]
    });
    await message.reply({
      embeds: [{
        color: nivelDef.corHex,
        title: `${nivelDef.emoji} Token gerado!`,
        description: `Verifique sua **DM** — o token foi enviado de forma privada.\nVálido por **1 hora** · Nível: **${nivelDef.label}**`,
        footer: { text: 'Token anterior revogado automaticamente.' },
      }]
    });
  } catch {
    const msg = await message.reply({
      embeds: [{
        color: 0xff5a5a,
        title: '⚠️ DM bloqueada',
        description: `Não consegui te enviar DM. Abra temporariamente suas DMs.\n\n**Token (apaga em 30s):**\n\`\`\`\n${token}\n\`\`\`\nNível: **${nivelDef.label}** · Expira às **${expiraStr}**`,
        footer: { text: '⚠️ Esta mensagem será apagada em 30 segundos.' },
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
    return message.reply('🚫 Você não tem permissão para revogar tokens.');
  }
  const userId = args[0]?.replace(/[<@!>]/g, '');
  if (!userId) {
    const lista = [...tokensAtivos.entries()]
      .filter(([, d]) => d.expira > Date.now())
      .map(([tk, d]) => {
        const mins = Math.ceil((d.expira - Date.now()) / 60000);
        return `• **${d.username}** (${d.nivel}) — expira em ${mins}min — \`${tk.slice(0, 12)}...\``;
      });
    return message.reply(lista.length ? `🔑 **Tokens ativos (${lista.length}):**\n${lista.join('\n')}` : '✅ Nenhum token ativo no momento.');
  }
  let revogados = 0;
  for (const [tk, dados] of tokensAtivos) {
    if (dados.userId === userId) { tokensAtivos.delete(tk); revogados++; }
  }
  return message.reply(revogados > 0 ? `✅ Token revogado para <@${userId}>.` : `⚠️ Nenhum token ativo encontrado para <@${userId}>.`);
}

// ─────────────────────────────────────────────────────────────
// SERVIDOR HTTP
// ─────────────────────────────────────────────────────────────
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
          return res.end(JSON.stringify({ ok: false, erro: 'Token inválido ou expirado.' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true, nivel: dados.nivel, username: dados.username,
          permissoes: PERMISSOES[dados.nivel] || [], expira: dados.expira,
          minutosRestantes: Math.ceil((dados.expira - Date.now()) / 60000),
        }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, erro: 'JSON inválido.' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'online', tokens: tokensAtivos.size, uptime: Math.floor(process.uptime()) }));
  }

  if (req.method === 'GET' && req.url === '/tokens') {
    const lista = [];
    for (const [token, dados] of tokensAtivos.entries()) {
      lista.push({ token, nivel: dados.nivel, username: dados.username, expira: dados.expira });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, tokens: lista }));
  }

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
        res.end(JSON.stringify({ ok: false, erro: 'JSON inválido.' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/revogar-todos') {
    const total = tokensAtivos.size;
    tokensAtivos.clear();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, total }));
  }

  if (req.method === 'POST' && req.url === '/limpar-expirados') {
    let removidos = 0;
    const agora = Date.now();
    for (const [token, dados] of tokensAtivos.entries()) {
      if (dados.expira < agora) { tokensAtivos.delete(token); removidos++; }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, removidos }));
  }

  if (req.method === 'POST' && req.url === '/roblox/resgatar') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { codigo, robloxId, robloxName, secret } = JSON.parse(body);
        if (secret !== CONFIG.ROBLOX_API_SECRET) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'Chave secreta inválida.' }));
        }
        if (!codigo || !robloxId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'codigo e robloxId são obrigatórios.' }));
        }
        const codigoNorm  = String(codigo).toUpperCase().trim();
        const robloxIdStr = String(robloxId);
        const dbCodigos  = await lerCodigos();
        const dbVinculos = await lerVinculos();
        const vinculo = dbVinculos.vinculos.find(v => v.robloxId === robloxIdStr);
        if (!vinculo) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, erro: 'SEM_VINCULO', msg: 'Vincule sua conta no Discord antes de resgatar códigos! Use /vincular no servidor.' }));
        }
        const c = dbCodigos.codigos.find(x => x.id === codigoNorm);
        if (!c) { res.writeHead(200); return res.end(JSON.stringify({ ok: false, erro: 'INVALIDO', msg: 'Código inválido ou não existe.' })); }
        if (!c.ativo) { res.writeHead(200); return res.end(JSON.stringify({ ok: false, erro: 'INATIVO', msg: 'Este código foi desativado.' })); }
        if (c.expira && new Date(c.expira) < new Date()) { res.writeHead(200); return res.end(JSON.stringify({ ok: false, erro: 'EXPIRADO', msg: 'Este código já expirou.' })); }
        if (c.usadoPor?.some(u => u.robloxId === robloxIdStr)) { res.writeHead(200); return res.end(JSON.stringify({ ok: false, erro: 'JA_USADO', msg: 'Você já resgatou este código nesta conta.' })); }
        if (c.maxUsos > 0 && (c.usadoPor?.length || 0) >= c.maxUsos) { res.writeHead(200); return res.end(JSON.stringify({ ok: false, erro: 'ESGOTADO', msg: 'Este código atingiu o limite de resgates.' })); }
        if (!c.usadoPor) c.usadoPor = [];
        c.usadoPor.push({ robloxId: robloxIdStr, robloxName: robloxName || '?', discordId: vinculo.discordId, usadoEm: new Date().toISOString() });
        await salvarCodigos(dbCodigos);
        invalidarCache();
        try {
          for (const g of client.guilds.cache.values()) {
            const canalLog = CONFIG.CANAL_LOG_TICKETS ? g.channels.cache.get(CONFIG.CANAL_LOG_TICKETS) : null;
            if (canalLog) {
              await canalLog.send({ embeds: [new EmbedBuilder().setColor(0x3dd68c).setTitle('🎁 Código Resgatado')
                .addFields(
                  { name: '🔑 Código',  value: codigoNorm,                                 inline: true },
                  { name: '🎮 Roblox',  value: robloxName || robloxIdStr,                  inline: true },
                  { name: '💬 Discord', value: `<@${vinculo.discordId}>`,                  inline: true },
                  { name: '🎀 Itens',   value: c.recompensas.map(r => r.label).join('\n'), inline: false },
                ).setTimestamp()] });
            }
          }
        } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, msg: `Código resgatado com sucesso! ${c.descricao}`, recompensas: c.recompensas }));
      } catch (err) {
        console.error('Erro /roblox/resgatar:', err.message);
        res.writeHead(500); res.end(JSON.stringify({ ok: false, erro: 'Erro interno do servidor.' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/roblox/vinculo/')) {
    const robloxId = req.url.split('/').pop();
    const secret   = req.headers['x-secret'];
    if (secret !== CONFIG.ROBLOX_API_SECRET) { res.writeHead(403); return res.end(JSON.stringify({ ok: false })); }
    lerVinculos().then(db => {
      const vinculo = db.vinculos.find(v => v.robloxId === String(robloxId));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, vinculado: !!vinculo, discordId: vinculo?.discordId || null }));
    }).catch(() => { res.writeHead(500); res.end(JSON.stringify({ ok: false })); });
    return;
  }

  res.writeHead(404); res.end();
});

const PORTA = process.env.PORT || 3000;
servidor.listen(PORTA, () => console.log(`🌐 Servidor de tokens ativo — porta ${PORTA}`));

// ─────────────────────────────────────────────────────────────
// GROK API
// ─────────────────────────────────────────────────────────────
function chamarClaude(mensagens, promptExtra = '') {
  return new Promise((resolve, reject) => {
    const sistema = CONHECIMENTO_DO_JOGO + (promptExtra ? '\n\n' + promptExtra : '');
    const body    = JSON.stringify({
      model: 'grok-3-mini-fast', max_tokens: 500,
      messages: [{ role: 'system', content: sistema }, ...mensagens],
    });
    const req = https.request({
      hostname: 'api.x.ai', path: '/v1/chat/completions', method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.GROK_KEY}`,
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
          else reject(new Error('Resposta inválida da API xAI.'));
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
  const ehSugestao = ['sugest','ideia','deveria ter','podia ter','seria legal','que tal','por que não','adicionem','coloquem'].some(p => t.includes(p));
  const ehSuporte  = ['bug','erro','não funciona','nao funciona','travou','crash','problema','não consigo','nao consigo','como faço','como faz','como funciona','não abre','nao abre'].some(p => t.includes(p));
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
    sugestao: `O jogador está fazendo uma SUGESTÃO.\nAnalise com sabedoria:\n1. Diga se é viável para um Tower Defense\n2. Aponte pontos positivos\n3. Mencione possíveis desafios\n4. Dê uma nota de viabilidade: ★☆☆☆☆ a ★★★★★\n5. Sugira como melhorar a ideia\nSeja construtivo e entusiasmado.`,
    suporte:  `O jogador está com um PROBLEMA ou DÚVIDA TÉCNICA.\nResponda de forma direta:\n1. Identifique o problema\n2. Ofereça a solução mais provável\n3. Se não souber, peça mais detalhes ou oriente a aguardar um moderador\nSeja eficiente — jogadores com problema querem solução rápida.`,
    pergunta: `O jogador está fazendo uma PERGUNTA GERAL sobre o jogo.\nResponda de forma completa mas concisa.\nSe a resposta não estiver no seu conhecimento, diga honestamente que não sabe.`,
  };
  historico.push({ role: 'user', content: pergunta });
  if (historico.length > MAX_HISTORICO) historico.splice(0, historico.length - MAX_HISTORICO);
  await message.channel.sendTyping();
  try {
    const resposta = await chamarClaude([...historico], promptsExtras[intencao]);
    historico.push({ role: 'assistant', content: resposta });
    const prefixos = {
      sugestao: '🔮 **Análise do Oráculo:**\n\n',
      suporte:  '⚡ **O Oráculo responde:**\n\n',
      pergunta: '✨ **O Oráculo fala:**\n\n',
    };
    await responderTextoLongo(message, prefixos[intencao] + resposta, true);
  } catch (err) {
    console.error('Erro na IA:', err.message);
    await message.reply('⚠️ Os ventos do Olimpo perturbaram a visão do Oráculo. Tente novamente em instantes.');
  }
}

// ─────────────────────────────────────────────────────────────
// FORMULÁRIO DE UPDATE
// ─────────────────────────────────────────────────────────────
async function iniciarFormulario(message) {
  const userId = message.author.id;
  if (sessoes.has(userId)) return message.reply('⚠️ *Mortal, um decreto já está sendo redigido! Proclama `cancelar` para encerrar o ritual atual antes de iniciar outro.*');
  sessoes.set(userId, { etapa: 'versao', dados: {} });
  await message.reply('⚡ **OS DEUSES CONVOCAM UM NOVO DECRETO**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Os pergaminhos do Olimpo aguardam suas palavras...*\n\nDigite `cancelar` a qualquer momento para silenciar os deuses.\n\n**— Pergaminho I de VII — A Versão —**\nQual selo carregará este decreto? *(ex: v0.4.0)*');
}

async function processarEtapa(message) {
  const userId = message.author.id;
  const sessao = sessoes.get(userId);
  if (!sessao) return;
  const texto = message.content.trim();
  if (texto.toLowerCase() === 'cancelar') { sessoes.delete(userId); return message.reply('🌑 *Os pergaminhos foram lançados às chamas... O decreto foi esquecido pelos deuses.*'); }
  const { etapa, dados } = sessao;

  if (etapa === 'versao') { dados.versao = texto.startsWith('v') ? texto : `v${texto}`; sessao.etapa = 'titulo'; return message.reply('⚡ *O selo foi gravado nos pergaminhos.*\n\n**— Pergaminho II de VII — O Título —**\nCom que nome os mortais conhecerão este decreto?'); }
  if (etapa === 'titulo') { dados.titulo = texto; sessao.etapa = 'subtitulo'; return message.reply('⚡ *O título ecoa pelos salões do Olimpo.*\n\n**— Pergaminho III de VII — A Profecia —**\nUma frase sábia para acompanhar o decreto... *(ou `pular`)*'); }
  if (etapa === 'subtitulo') {
    dados.subtitulo = texto.toLowerCase() === 'pular' ? '' : texto;
    sessao.etapa = 'tags';
    const lista = Object.entries(TAGS).map(([n, t]) => `**${n}** — ${t.label}`).join('\n');
    return message.reply('⚡ *As palavras foram inscritas.*\n\n**— Pergaminho IV de VII — Os Estandartes —**\nQuais símbolos divinos carregarão este decreto? *(ex: 1,3)*\n\n' + lista);
  }
  if (etapa === 'tags') {
    dados.tags = texto.split(',').map(s => s.trim()).filter(n => TAGS[n]).map(n => TAGS[n].key);
    if (!dados.tags.length) dados.tags = ['novo'];
    sessao.etapa = 'mudancas'; dados.mudancas = [];
    return message.reply('⚡ *Os estandartes foram hasteados.*\n\n**— Pergaminho V de VII — As Obras dos Deuses —**\nRelate cada mudança, uma por mensagem.\nQuando terminar, proclame: `pronto`');
  }
  if (etapa === 'mudancas') {
    if (texto.toLowerCase() === 'pronto') {
      if (!dados.mudancas.length) return message.reply('⚠️ *Os deuses exigem ao menos uma obra registrada, mortal.*');
      sessao.etapa = 'imagem';
      return message.reply(`⚡ *${dados.mudancas.length} obra(s) registrada(s) nos pergaminhos eternos.*\n\n**— Pergaminho VI de VII — A Visão —**\n📸 Anexa uma **imagem** para ilustrar este decreto *(ou digita \`pular\`)*\n*A imagem aparecerá no site do changelog!*`);
    }
    dados.mudancas.push(texto);
    return message.react('✅').catch(() => {});
  }
  if (etapa === 'imagem') {
    const anexo = message.attachments.first();
    if (texto.toLowerCase() === 'pular' || !anexo) {
      dados.imagem = null;
    } else {
      const url = anexo.url;
      const ehImagem = /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(url);
      if (!ehImagem) return message.reply('⚠️ *Apenas imagens são aceitas (png, jpg, gif, webp). Tenta novamente ou digita `pular`.*');
      dados.imagem = url;
      await message.react('🖼️').catch(() => {});
    }
    sessao.etapa = 'proximo';
    return message.reply(`⚡ *${dados.imagem ? 'Imagem registrada nos pergaminhos.' : 'Sem imagem — os deuses preferem o texto puro.'}*\n\n**— Pergaminho VII de VII — O Horizonte —**\nHá visões do próximo decreto? *(ou \`pular\`)*`);
  }
  if (etapa === 'proximo') {
    dados.proximo = texto.toLowerCase() === 'pular' ? null : texto;
    sessao.etapa  = 'confirmacao';
    const tagLabels = dados.tags.map(t => Object.values(TAGS).find(x => x.key === t)?.label || t).join(', ');
    return message.reply(
      `🔱 **O DECRETO ESTÁ PRONTO PARA SER PROCLAMADO**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚔️ **Versão:** ${dados.versao}\n📖 **Título:** ${dados.titulo}\n🌟 **Profecia:** ${dados.subtitulo || '*(silêncio dos deuses)*'}\n` +
      `🏛️ **Estandartes:** ${tagLabels}\n📜 **Obras:** ${dados.mudancas.length} registrada(s)\n` +
      `🖼️ **Imagem:** ${dados.imagem ? '✅ Anexada' : '❌ Nenhuma'}\n` +
      `🔮 **Horizonte:** ${dados.proximo || '*(os oráculos silenciam)*'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Proclame* **\`confirmar\`** *para gravar nos anais eternos, ou* **\`cancelar\`** *para retornar ao silêncio.*`
    );
  }
  if (etapa === 'confirmacao') {
    if (texto.toLowerCase() !== 'confirmar') { sessoes.delete(userId); return message.reply('🌑 *Que assim seja... O decreto retorna ao silêncio eterno.*'); }
    await message.reply('⚡ *Os trovões de Zeus ressoam... O decreto está sendo gravado nos anais eternos do Olimpo...*');
    try {
      const dadosAtuais = await lerGist();
      const mes         = new Date().toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      dadosAtuais.updates = dadosAtuais.updates || [];
      // Salvar tags como array de objetos {key, label} para o site exibir corretamente
      const tagsComLabel = dados.tags.map(key => {
        const tagInfo = Object.values(TAGS).find(t => t.key === key);
        return { key, label: tagInfo?.label || key };
      });
      dadosAtuais.updates.unshift({ id: Date.now(), versao: dados.versao, titulo: dados.titulo, subtitulo: dados.subtitulo, tags: dados.tags, tagsInfo: tagsComLabel, mudancas: dados.mudancas, imagem: dados.imagem || null, data: mes });
      if (dados.proximo) dadosAtuais.proximaUpdate = dados.proximo;
      const ok = await salvarGist(dadosAtuais);
      if (!ok) throw new Error('Falha ao salvar update no Gist.');
      sessoes.delete(userId);
      await message.reply(`🔱 **DECRETO PROCLAMADO!**\n*Os deuses selaram* **${dados.versao} — ${dados.titulo}** *nos pergaminhos eternos.*`);
      if (CONFIG.CANAL_ANUNCIO_ID) {
        try {
          const canalAnuncio = await client.channels.fetch(CONFIG.CANAL_ANUNCIO_ID);
          if (canalAnuncio?.isTextBased()) {
            const tagLabels     = dados.tags.map(t => Object.values(TAGS).find(x => x.key === t)?.label || t).join('  ');
            const mudancasTexto = dados.mudancas.map(m => `> ⚡ ${m}`).join('\n');
            const embedUpdate = new EmbedBuilder()
              .setColor(0xc9a84c)
              .setTitle(`⚡ ${dados.versao} — ${dados.titulo}`)
              .setDescription(
                (dados.subtitulo ? `*"${dados.subtitulo}"*\n\n` : '') +
                `${tagLabels}\n\n**📜 Obras dos Deuses**\n${mudancasTexto}` +
                (dados.proximo ? `\n\n**🔮 Próxima Atualização**\n> ${dados.proximo}` : '')
              )
              .setFooter({ text: 'Tower Deep · Alpha' })
              .setTimestamp();
            if (dados.imagem) embedUpdate.setImage(dados.imagem);
            const botoesUpdate = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel('🌐 Site Oficial').setURL('https://italozkv.github.io/tower-deep/').setStyle(ButtonStyle.Link),
              new ButtonBuilder().setLabel('📜 Changelog Completo').setURL('https://italozkv.github.io/tower-deep/changelog.html').setStyle(ButtonStyle.Link),
              new ButtonBuilder().setLabel('🗳️ Votar em Features').setURL('https://italozkv.github.io/tower-deep/votos.html').setStyle(ButtonStyle.Link),
            );
            await canalAnuncio.send({ content: '@everyone', embeds: [embedUpdate], components: [botoesUpdate] });
          }
        } catch (err) { console.error('Erro ao anunciar update:', err.message); }
      }
    } catch (err) {
      console.error(err); sessoes.delete(userId);
      await message.reply('⚠️ *Os ventos do Érebo interferiram na proclamação. Tente novamente.*');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SISTEMA DE TICKETS
// ─────────────────────────────────────────────────────────────
const ticketsAtivos = new Map();
let ticketContador = 1;

async function carregarTickets() {
  const dados = await lerArquivoJsonDoGist('tickets.json', { contador: 1, tickets: [] });
  ticketContador = dados.contador || 1;
  for (const t of (dados.tickets || [])) {
    if (t.status !== 'fechado') ticketsAtivos.set(t.channelId, t);
  }
  console.log(`🎫 Tickets carregados — ${ticketsAtivos.size} aberto(s), contador: ${ticketContador}`);
}

async function salvarTickets() {
  const lista = [...ticketsAtivos.values()];
  return salvarArquivoJsonNoGist('tickets.json', { contador: ticketContador, tickets: lista });
}

const CATEGORIAS_TICKET = {
  suporte:  { label: '🛠️ Suporte',   emoji: '🛠️', cor: 0x4a9eff, descricao: 'Dúvidas e ajuda geral com o jogo' },
  bug:      { label: '🐛 Bug',        emoji: '🐛', cor: 0xff5a5a, descricao: 'Reportar um bug ou problema técnico' },
  apelacao: { label: '⚖️ Apelação',  emoji: '⚖️', cor: 0xf0c060, descricao: 'Recorrer de uma punição recebida' },
  parceria: { label: '🤝 Parceria',  emoji: '🤝', cor: 0x3dd68c, descricao: 'Proposta de parceria ou colaboração' },
  outro:    { label: '📜 Outro',      emoji: '📜', cor: 0xa78bfa, descricao: 'Outros assuntos não listados acima' },
};

async function enviarPainelTicket(channel) {
  const embed = new EmbedBuilder()
    .setColor(0xc9a84c)
    .setTitle('⚡ TRIBUNAL DO OLIMPO — Suporte')
    .setDescription(
      '*Os deuses do Olimpo estão prontos para te ouvir, mortal.*\n\n' +
      '**Selecione o assunto do teu chamado** no menu abaixo.\n' +
      'Uma câmara privada será aberta somente para ti e nossa equipe.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '🛠️ **Suporte** — Dúvidas e ajuda geral\n' +
      '🐛 **Bug** — Problemas e erros no jogo\n' +
      '⚖️ **Apelação** — Recorrer de punições\n' +
      '🤝 **Parceria** — Propostas e colaborações\n' +
      '📜 **Outro** — Demais assuntos\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    .setFooter({ text: 'Tower Deep · Não abra tickets desnecessários.' })
    .setTimestamp();

  // CORREÇÃO: usando StringSelectMenuOptionBuilder em vez de objetos planos
  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_criar')
      .setPlaceholder('⚡ Selecione o assunto do teu chamado...')
      .addOptions(
        Object.entries(CATEGORIAS_TICKET).map(([value, cat]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(cat.label)
            .setDescription(cat.descricao)
            .setValue(value)
        )
      )
  );
  await channel.send({ embeds: [embed], components: [menu] });
}

async function abrirTicket(interaction, categoria) {
  const guild   = interaction.guild;
  const user    = interaction.user;
  const catInfo = CATEGORIAS_TICKET[categoria];
  const ticketExistente = [...ticketsAtivos.values()].find(t => t.userId === user.id && t.status === 'aberto');
  if (ticketExistente) {
    const canalExistente = guild.channels.cache.get(ticketExistente.channelId);
    return interaction.reply({
      content: `⚠️ *Mortal, tu já tens uma câmara aberta!* ${canalExistente ? `→ ${canalExistente}` : ''}\n*Resolve o chamado atual antes de abrir outro.*`,
      ephemeral: true,
    });
  }
  await interaction.deferReply({ ephemeral: true });
  const permissoes = [
    { id: guild.id,  deny:  [PermissionFlagsBits.ViewChannel] },
    { id: user.id,   allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  for (const id of [CONFIG.CARGO_DONO, CONFIG.CARGO_ADMIN, CONFIG.CARGO_MOD, CONFIG.CARGO_EQUIPE]) {
    if (id) permissoes.push({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
  }
  const numero = ticketContador++;
  const nomeCanal = `ticket-${numero.toString().padStart(4, '0')}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`;
  let canal;
  try {
    const options = { name: nomeCanal, type: ChannelType.GuildText, permissionOverwrites: permissoes, topic: `${catInfo.emoji} ${catInfo.label} | ${user.tag} | Ticket #${numero}` };
    if (CONFIG.CATEGORIA_TICKETS) options.parent = CONFIG.CATEGORIA_TICKETS;
    canal = await guild.channels.create(options);
  } catch (err) {
    console.error('Erro ao criar canal de ticket:', err.message);
    return interaction.editReply({ content: '⚠️ *Os deuses não conseguiram abrir a câmara. Verifique as permissões do bot.*' });
  }
  const ticket = { id: numero, channelId: canal.id, userId: user.id, username: user.tag, categoria, status: 'aberto', abertoPor: user.id, criadoEm: Date.now(), fechadoEm: null, resolvidoPor: null, avaliacao: null, mensagens: [] };
  ticketsAtivos.set(canal.id, ticket);
  salvarTickets().catch(err => console.error('Erro ao salvar tickets:', err.message));
  const embedAbertura = new EmbedBuilder()
    .setColor(catInfo.cor)
    .setTitle(`${catInfo.emoji} Ticket #${numero} — ${catInfo.label}`)
    .setDescription(`Bem-vindo, ${user}!\n\n*Os deuses do Olimpo te ouvem, mortal.*\n\n**Descreve teu problema com o máximo de detalhes possível.**\nNossa equipe responderá o mais breve possível.`)
    .addFields(
      { name: '📋 Categoria',  value: catInfo.label,                                inline: true },
      { name: '👤 Aberto por', value: user.tag,                                     inline: true },
      { name: '🕐 Aberto em',  value: `<t:${Math.floor(Date.now() / 1000)}:F>`,     inline: false },
    )
    .setFooter({ text: 'Tower Deep · Use os botões abaixo para gerenciar este ticket.' })
    .setTimestamp();
  const botoesLink = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('🌐 Site Oficial').setURL('https://italozkv.github.io/tower-deep/').setStyle(ButtonStyle.Link),
    new ButtonBuilder().setLabel('📖 Wiki').setURL('https://italozkv.github.io/tower-deep/wiki.html').setStyle(ButtonStyle.Link),
  );
  const botoesControle = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_fechar').setLabel('🔒 Fechar Ticket').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_resolver').setLabel('✅ Marcar Resolvido').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_assumir').setLabel('⚔️ Assumir').setStyle(ButtonStyle.Secondary),
  );
  await canal.send({ content: `${user} | <@&${CONFIG.CARGO_SUPORTE || CONFIG.CARGO_MOD || ''}>`, embeds: [embedAbertura], components: [botoesControle, botoesLink] });
  await interaction.editReply({ content: `${catInfo.emoji} *A câmara foi aberta, mortal!* → ${canal}\n*Dirija-se até lá para falar com nossa equipe.*` });
  await logTicket(guild, `🎫 **Ticket Aberto** — #${numero}\n👤 **Usuário:** ${user.tag}\n📋 **Categoria:** ${catInfo.label}\n📌 **Canal:** ${canal}`);
}

async function fecharTicket(interaction, ticket) {
  const guild = interaction.guild;
  const canal = interaction.channel;
  if (ticket.status === 'fechado') return interaction.reply({ content: '⚠️ *Este ticket já está fechado.*', ephemeral: true });
  await interaction.deferReply();
  let transcricao = `📜 TRANSCRIÇÃO — Ticket #${ticket.id}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  transcricao += `👤 Aberto por: ${ticket.username}\n📋 Categoria: ${CATEGORIAS_TICKET[ticket.categoria]?.label || ticket.categoria}\n`;
  transcricao += `🕐 Aberto em: ${new Date(ticket.criadoEm).toLocaleString('pt-BR')}\n🔒 Fechado em: ${new Date().toLocaleString('pt-BR')}\n🔒 Fechado por: ${interaction.user.tag}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  try {
    const msgs = await canal.messages.fetch({ limit: 100 });
    const msgsOrdenadas = [...msgs.values()].reverse();
    for (const m of msgsOrdenadas) {
      if (m.author.bot && m.embeds.length > 0) continue;
      transcricao += `[${new Date(m.createdTimestamp).toLocaleTimeString('pt-BR')}] ${m.author.tag}: ${m.content || '[embed/arquivo]'}\n`;
    }
  } catch { transcricao += '*(Não foi possível coletar mensagens)*\n'; }
  ticket.status    = 'fechado';
  ticket.fechadoEm = Date.now();
  ticketsAtivos.delete(canal.id);
  await salvarTickets().catch(() => {});
  const embedFechado = new EmbedBuilder()
    .setColor(0x555555)
    .setTitle(`🔒 Ticket #${ticket.id} Fechado`)
    .setDescription(`*A câmara foi selada pelos deuses do Olimpo.*\n\n**Fechado por:** ${interaction.user.tag}\n**Fechado em:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n*O canal será deletado em 10 segundos.*`);
  await interaction.editReply({ embeds: [embedFechado] });
  try {
    const userObj = await guild.members.fetch(ticket.userId);
    if (userObj) {
      await userObj.send({ content: `🔒 **Teu ticket #${ticket.id} foi fechado.**\n\nSegue a transcrição da conversa:\n\`\`\`\n${transcricao.slice(0, 1800)}\n\`\`\`` });
      await enviarAvaliacaoDM(userObj.user, ticket);
    }
  } catch {}
  await logTicket(guild, `🔒 **Ticket Fechado** — #${ticket.id}\n👤 **Usuário:** ${ticket.username}\n🔒 **Fechado por:** ${interaction.user.tag}`, transcricao);
  setTimeout(() => canal.delete(`Ticket #${ticket.id} fechado`).catch(() => {}), 10000);
}

async function enviarAvaliacaoDM(user, ticket) {
  try {
    const embed = new EmbedBuilder()
      .setColor(0xc9a84c)
      .setTitle('⭐ Avalie o Atendimento — Tower Deep')
      .setDescription(`*Teu ticket #${ticket.id} foi encerrado.*\n\nComo foi o atendimento da nossa equipe?\nSeleciona uma nota abaixo — tua opinião é divina para nós! 🙏`)
      .setFooter({ text: 'Tower Deep · Avaliação expira em 24h' });
    const botoesAvaliacao = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`avaliar_1_${ticket.id}`).setLabel('⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_2_${ticket.id}`).setLabel('⭐⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_3_${ticket.id}`).setLabel('⭐⭐⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_4_${ticket.id}`).setLabel('⭐⭐⭐⭐').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`avaliar_5_${ticket.id}`).setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Primary),
    );
    await user.send({ embeds: [embed], components: [botoesAvaliacao] });
  } catch {}
}

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

// ─────────────────────────────────────────────────────────────
// SLASH COMMANDS
// ─────────────────────────────────────────────────────────────
const slashCommands = [
  new SlashCommandBuilder().setName('bug').setDescription('🐛 Reportar uma anomalia divina ao Olimpo'),
  new SlashCommandBuilder().setName('sugestao').setDescription('💡 Enviar uma visão para os deuses do Olimpo'),
  new SlashCommandBuilder().setName('rank').setDescription('🏆 Consultar teu título divino no Olimpo'),
  new SlashCommandBuilder()
    .setName('limpar').setDescription('🧹 Apagar mensagens do canal (apenas moderadores)')
    .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantas mensagens apagar').setRequired(true)
      .addChoices({ name: 'Últimas 10 mensagens', value: 10 }, { name: 'Últimas 100 mensagens', value: 100 })),
  new SlashCommandBuilder()
    .setName('anunciar').setDescription('📢 Fazer um anúncio no canal atual')
    .addStringOption(opt => opt.setName('mensagem').setDescription('O conteúdo do anúncio').setRequired(true))
    .addStringOption(opt => opt.setName('titulo').setDescription('Título do anúncio (opcional)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('enquete').setDescription('🗳️ Criar enquete vinculada ao site (votos.html)')
    .addStringOption(opt => opt.setName('titulo').setDescription('Título da feature/enquete').setRequired(true))
    .addStringOption(opt => opt.setName('descricao').setDescription('Descrição da feature').setRequired(true))
    .addStringOption(opt => opt.setName('categoria').setDescription('Categoria').setRequired(true)
      .addChoices(
        { name: '⚔️ Torre', value: 'torre' },{ name: '🗺️ Mapa', value: 'mapa' },
        { name: '⚙️ Mecânica', value: 'mecanica' },{ name: '🎉 Evento', value: 'evento' },{ name: '🔧 Outro', value: 'outro' }
      )),
  new SlashCommandBuilder()
    .setName('roadmap').setDescription('🗺️ Gerenciar o roadmap do jogo')
    .addSubcommand(sub => sub.setName('adicionar').setDescription('Adicionar nova versão ao roadmap')
      .addStringOption(opt => opt.setName('versao').setDescription('Ex: v0.6').setRequired(true))
      .addStringOption(opt => opt.setName('titulo').setDescription('Ex: A Chegada de Apolo').setRequired(true))
      .addStringOption(opt => opt.setName('status').setDescription('Status da versão').setRequired(true)
        .addChoices({ name: '✓ Concluído', value: 'done' },{ name: '⚡ Em Desenvolvimento', value: 'active' },{ name: '◇ Planejado', value: 'planned' },{ name: '◇ Futuro', value: 'future' }))
      .addStringOption(opt => opt.setName('data').setDescription('Ex: Abr 2026').setRequired(false))
      .addStringOption(opt => opt.setName('lore').setDescription('Frase épica da versão').setRequired(false)))
    .addSubcommand(sub => sub.setName('item').setDescription('Adicionar item a uma versão do roadmap')
      .addStringOption(opt => opt.setName('versao').setDescription('Versão alvo (ex: v0.6)').setRequired(true))
      .addStringOption(opt => opt.setName('texto').setDescription('Descrição do item').setRequired(true))
      .addStringOption(opt => opt.setName('badge').setDescription('Badge do item').setRequired(false)
        .addChoices({ name: 'Novo', value: 'Novo' },{ name: 'Divino', value: 'Divino' },{ name: 'Fix', value: 'Fix' },{ name: 'Evento', value: 'Evento' })))
    .addSubcommand(sub => sub.setName('concluir').setDescription('Marcar item como concluído')
      .addStringOption(opt => opt.setName('versao').setDescription('Versão (ex: v0.4)').setRequired(true))
      .addStringOption(opt => opt.setName('item').setDescription('Parte do texto do item a marcar').setRequired(true)))
    .addSubcommand(sub => sub.setName('status').setDescription('Mudar status de uma versão')
      .addStringOption(opt => opt.setName('versao').setDescription('Versão (ex: v0.4)').setRequired(true))
      .addStringOption(opt => opt.setName('status').setDescription('Novo status').setRequired(true)
        .addChoices({ name: '✓ Concluído', value: 'done' },{ name: '⚡ Em Desenvolvimento', value: 'active' },{ name: '◇ Planejado', value: 'planned' },{ name: '◇ Futuro', value: 'future' }))),
  new SlashCommandBuilder()
    .setName('changelog').setDescription('📜 Gerenciar os changelogs do site')
    .addSubcommand(sub => sub.setName('listar').setDescription('📋 Listar todos os changelogs publicados'))
    .addSubcommand(sub => sub.setName('apagar').setDescription('🗑️ Apagar um changelog pelo número')
      .addIntegerOption(opt => opt.setName('numero').setDescription('Número do changelog na lista').setRequired(true)))
    .addSubcommand(sub => sub.setName('editar').setDescription('✏️ Editar título ou subtítulo de um changelog')
      .addIntegerOption(opt => opt.setName('numero').setDescription('Número do changelog na lista').setRequired(true))
      .addStringOption(opt => opt.setName('campo').setDescription('Campo a editar').setRequired(true)
        .addChoices(
          { name: '📖 Título', value: 'titulo' }, { name: '🌟 Subtítulo', value: 'subtitulo' },
          { name: '🖼️ Imagem (URL)', value: 'imagem' }, { name: '🔮 Próxima update', value: 'proximo' },
        ))
      .addStringOption(opt => opt.setName('valor').setDescription('Novo valor para o campo').setRequired(true)))
    .addSubcommand(sub => sub.setName('imagem').setDescription('🖼️ Adicionar/trocar imagem de um changelog')
      .addIntegerOption(opt => opt.setName('numero').setDescription('Número do changelog na lista').setRequired(true))
      .addAttachmentOption(opt => opt.setName('imagem').setDescription('Nova imagem para o changelog').setRequired(true))),
  new SlashCommandBuilder()
    .setName('ticket').setDescription('🎫 Sistema de tickets de suporte')
    .addSubcommand(sub => sub.setName('painel').setDescription('📋 Enviar painel de abertura de tickets para este canal (staff)'))
    .addSubcommand(sub => sub.setName('fechar').setDescription('🔒 Fechar o ticket atual'))
    .addSubcommand(sub => sub.setName('resolver').setDescription('✅ Marcar ticket como resolvido'))
    .addSubcommand(sub => sub.setName('assumir').setDescription('⚔️ Assumir o atendimento deste ticket'))
    .addSubcommand(sub => sub.setName('add').setDescription('➕ Adicionar usuário ao ticket')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a adicionar').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('➖ Remover usuário do ticket')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuário a remover').setRequired(true)))
    .addSubcommand(sub => sub.setName('listar').setDescription('📜 Listar todos os tickets abertos (staff)')),
  new SlashCommandBuilder()
    .setName('verificar').setDescription('✅ Vincule sua conta do Roblox ao Discord')
    .addStringOption(opt => opt.setName('usuario').setDescription('Seu nome de usuário no Roblox').setRequired(true)),
  new SlashCommandBuilder()
    .setName('gencodigo').setDescription('🎁 Gerar um código de resgate com recompensas (Admin)')
    .addStringOption(opt => opt.setName('descricao').setDescription('Descrição do código (ex: Evento de Natal)').setRequired(true))
    .addIntegerOption(opt => opt.setName('maxusos').setDescription('Quantas contas podem usar (padrão: ilimitado)').setRequired(false))
    .addIntegerOption(opt => opt.setName('expira_horas').setDescription('Expira em X horas (padrão: nunca)').setRequired(false)),
  new SlashCommandBuilder()
    .setName('codigo').setDescription('📋 Gerenciar códigos de resgate (Admin)')
    .addSubcommand(sub => sub.setName('listar').setDescription('📜 Listar todos os códigos'))
    .addSubcommand(sub => sub.setName('desativar').setDescription('🚫 Desativar um código')
      .addStringOption(opt => opt.setName('codigo').setDescription('Código a desativar').setRequired(true)))
    .addSubcommand(sub => sub.setName('info').setDescription('🔍 Ver detalhes de um código')
      .addStringOption(opt => opt.setName('codigo').setDescription('Código a consultar').setRequired(true))),
  new SlashCommandBuilder()
    .setName('vincular').setDescription('🔗 Vincule sua conta do Roblox para usar códigos de resgate')
    .addStringOption(opt => opt.setName('usuario').setDescription('Seu nome de usuário exato no Roblox').setRequired(true)),
  new SlashCommandBuilder().setName('minhaconta').setDescription('👤 Ver sua conta Roblox vinculada e códigos resgatados'),
  new SlashCommandBuilder().setName('itemcadastrar').setDescription('➕ Cadastrar novo item no catálogo de recompensas (Admin)'),
  new SlashCommandBuilder().setName('itemlistar').setDescription('📦 Ver todos os itens do catálogo por categoria (Admin)'),
].map(cmd => cmd.toJSON());

async function registrarSlashCommands(clientId) {
  const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);
  try { await rest.put(Routes.applicationCommands(clientId), { body: slashCommands }); console.log('✅ Slash commands registrados!'); }
  catch (err) { console.error('Erro ao registrar slash commands:', err.message); }
}

// ─────────────────────────────────────────────────────────────
// HELPER /gencodigo — avança para o próximo tipo ou finaliza
// CORREÇÃO PRINCIPAL: StringSelectMenuOptionBuilder em todos
// os menus, sem campo "emoji" (causa erro no discord.js v14)
// ─────────────────────────────────────────────────────────────
async function avancarRecompensa(interaction, sessao, adminId) {
  const proxIdx = sessao.tiposIdx;

  // Helper: responde ou atualiza a mensagem dependendo do tipo de interaction
  async function responder(payload) {
    if (interaction.isStringSelectMenu() || interaction.isButton()) {
      return interaction.update({ ...payload, fetchReply: false });
    } else if (interaction.isModalSubmit()) {
      // ModalSubmit: deferUpdate já foi chamado antes de chegar aqui, usar editReply
      return interaction.editReply(payload);
    } else {
      return interaction.editReply(payload);
    }
  }

  if (proxIdx < sessao.tiposSelecionados.length) {
    const proxTipo = sessao.tiposSelecionados[proxIdx];

    if (proxTipo === 'item') {
      // Item: mostrar menu de categorias
      const catalogo   = await getCatalogoCompleto();
      const categorias = [...new Set(catalogo.map(i => i.categoria))].sort();

      const opsCat = categorias.slice(0, 25).map(c =>
        new StringSelectMenuOptionBuilder()
          .setLabel(c.slice(0, 100))
          .setValue(`cat:${c}`)
          .setDescription(`${catalogo.filter(i => i.categoria === c).length} itens`)
      );

      const menuCat = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gc_cat_${adminId}`)
          .setPlaceholder('📂 Escolha a categoria do próximo item...')
          .addOptions(opsCat)
      );

      const recompListadas = sessao.recompensas.length
        ? sessao.recompensas.map((r, i) => `**${i+1}.** ${r.label}`).join('\n')
        : '*Nenhuma ainda*';

      return responder({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA)
          .setTitle(`🎁 Recompensa ${proxIdx + 1}/${sessao.tiposSelecionados.length}`)
          .setDescription(`*Já adicionadas:*\n${recompListadas}\n\n*Selecione a categoria do próximo item:*`)],
        components: [menuCat],
      });

    } else {
      // Moedas/Gemas/XP etc.
      const info = TIPOS_RECOMPENSA[proxTipo];
      if (!info) {
        console.error('[avancarRecompensa] tipo desconhecido:', proxTipo, 'idx:', proxIdx, 'tipos:', sessao.tiposSelecionados);
        return responder({ content: '⚠️ Tipo de recompensa inválido. Use /gencodigo novamente.', embeds: [], components: [] });
      }

      const recompListadas = sessao.recompensas.length
        ? sessao.recompensas.map((r, i) => `${i+1}. ${r.label}`).join(' | ')
        : '';

      if (interaction.isModalSubmit()) {
        // Após qualquer ModalSubmit não podemos abrir outro modal diretamente.
        // Mostramos botão intermediário — o admin clica e abre o modal.
        const recompAtuais = sessao.recompensas.length
          ? sessao.recompensas.map((r, i) => `**${i+1}.** ${r.label}`).join('\n')
          : '*Nenhuma ainda*';
        const btnNext = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`gc_next_${adminId}_${proxIdx}`)
            .setLabel(`▶ Inserir Recompensa ${proxIdx + 1}: ${info.label}`)
            .setStyle(ButtonStyle.Primary)
        );
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA)
            .setTitle(`🎁 Código em Progresso — ${sessao.recompensas.length}/${sessao.tiposSelecionados.length} recompensas`)
            .setDescription(`*Recompensas adicionadas:*\n${recompAtuais}\n\n*Clique no botão para inserir a próxima recompensa.*`)],
          components: [btnNext],
        });
      }

      // StringSelectMenu ou Button: podemos abrir modal diretamente
      const modal = new ModalBuilder()
        .setCustomId(`gc_qtd_${adminId}_${proxIdx}`)
        .setTitle(`Recompensa ${proxIdx + 1}/${sessao.tiposSelecionados.length}: ${info.label}`.slice(0, 45))
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('valor')
              .setLabel((`Quantidade de ${info.unidade}` + (recompListadas ? ` (já: ${recompListadas.slice(0,30)})` : '')).slice(0, 45))
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('Ex: 500')
          )
        );
      return interaction.showModal(modal);
    }
  }

  // Todas recompensas coletadas — gerar o código
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

    const listaRecomp = sessao.recompensas.map((r, i) => `**${i+1}.** ${r.label}`).join('\n');

    const embedConf = new EmbedBuilder()
      .setColor(CONFIG.CORES.SUCESSO)
      .setTitle('✅ Código Gerado!')
      .addFields(
        { name: '🎁 Código',      value: '`' + codigo + '`',                                               inline: false },
        { name: '📝 Descrição',   value: sessao.descricao,                                                 inline: true  },
        { name: '👥 Max Usos',    value: sessao.maxUsos ? String(sessao.maxUsos) : 'Ilimitado',            inline: true  },
        { name: '⏰ Expira',       value: expira ? new Date(expira).toLocaleDateString('pt-BR') : 'Nunca', inline: true  },
        { name: '🎀 Recompensas', value: listaRecomp || '—',                                               inline: false },
      )
      .setFooter({ text: 'Anunciado no canal de códigos' });

    if (interaction.isModalSubmit()) {
      await interaction.editReply({ embeds: [embedConf], components: [] });
    } else if (interaction.isButton()) {
      await interaction.update({ embeds: [embedConf], components: [] });
    } else {
      await interaction.editReply({ embeds: [embedConf], components: [] });
    }

    const guild = interaction.guild;
    const canalCodigos = CONFIG.CANAL_CODIGOS
      ? guild?.channels?.cache?.get(CONFIG.CANAL_CODIGOS)
      : interaction.channel;

    if (canalCodigos) {
      const embedAnuncio = new EmbedBuilder()
        .setColor(CONFIG.CORES.PRIMARIA)
        .setTitle('🎁 NOVO CÓDIGO DE RESGATE!')
        .setDescription(`*Os deuses do Olimpo presenteiam os mortais dedicados!*\n\n📜 **${sessao.descricao}**`)
        .addFields(
          { name: '🔑 Código',      value: '## `' + codigo + '`',                                              inline: false },
          { name: '🎀 Recompensas', value: sessao.recompensas.map(r => r.label).join('\n'),                    inline: false },
          { name: '👥 Usos',        value: sessao.maxUsos ? `${sessao.maxUsos} usos` : 'Ilimitado',            inline: true  },
          { name: '⏰ Válido até',  value: expira ? new Date(expira).toLocaleDateString('pt-BR') : 'Sem prazo',inline: true  },
        )
        .addFields({ name: '📖 Como resgatar?', value: 'Abra o jogo → Configurações → Código de Resgate!' })
        .setFooter({ text: 'Tower Deep · Código válido 1x por conta Roblox' })
        .setTimestamp();

      const btns = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('🎮 Jogar Agora').setStyle(ButtonStyle.Link).setURL('https://www.roblox.com/games/'),
        new ButtonBuilder().setLabel('🔗 Vincular Conta').setStyle(ButtonStyle.Primary).setCustomId('btn_vincular_info'),
      );
      await canalCodigos.send({ content: '@everyone', embeds: [embedAnuncio], components: [btns] });
    }
  } catch (err) {
    console.error('Erro ao gerar código:', err.message);
    await interaction.editReply({ content: '⚠️ Erro ao salvar código. Tente novamente.', components: [] });
  }
}

// ─────────────────────────────────────────────────────────────
// INTERACTIONS
// ─────────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  try {

    if (interaction.isChatInputCommand() && interaction.commandName === 'bug') {
      const modal = new ModalBuilder().setCustomId('modal_bug').setTitle('Relato de Anomalia Divina');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bug_titulo').setLabel('O Fenômeno - Descreva o bug em uma frase').setStyle(TextInputStyle.Short).setPlaceholder('Ex: A torre de Zeus não ataca inimigos voadores').setRequired(true).setMaxLength(100)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bug_descricao').setLabel('Os Detalhes - Como reproduzir o bug?').setStyle(TextInputStyle.Paragraph).setPlaceholder('Passo a passo do que aconteceu...').setRequired(true).setMaxLength(500)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bug_versao').setLabel('A Versão - Qual versão do jogo?').setStyle(TextInputStyle.Short).setPlaceholder('Ex: v0.3.0 (ou "não sei")').setRequired(false).setMaxLength(20)),
      );
      return interaction.showModal(modal);
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'sugestao') {
      const modal = new ModalBuilder().setCustomId('modal_sugestao').setTitle('Visão para o Olimpo');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_titulo').setLabel('O Título - Resuma sua sugestão').setStyle(TextInputStyle.Short).setPlaceholder('Ex: Torre de Artemis com flechas de gelo').setRequired(true).setMaxLength(100)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_descricao').setLabel('Os Detalhes - Como funcionaria?').setStyle(TextInputStyle.Paragraph).setPlaceholder('Descreva a ideia com mais detalhes...').setRequired(true).setMaxLength(400)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sug_categoria').setLabel('Categoria da sugestão').setStyle(TextInputStyle.Short).setPlaceholder('torre, mapa, mecanica, evento ou outro').setRequired(false).setMaxLength(20)),
      );
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_bug') {
      const bugTitulo = interaction.fields.getTextInputValue('bug_titulo');
      const bugDesc   = interaction.fields.getTextInputValue('bug_descricao');
      const bugVersao = interaction.fields.getTextInputValue('bug_versao') || 'não informado';
      await interaction.reply({ content: '🔱 *Os oráculos registraram tua anomalia nos pergaminhos sagrados. Os deuses-desenvolvedores serão notificados.*', ephemeral: true });
      if (CONFIG.CANAL_BUGS_ID) {
        try {
          const canal = await client.channels.fetch(CONFIG.CANAL_BUGS_ID);
          if (canal?.isTextBased()) {
            await canal.send('🐛 **NOVA ANOMALIA RELATADA**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
              `👤 **Mortal:** ${interaction.user.tag}\n📋 **Fenômeno:** ${bugTitulo}\n📝 **Detalhes:** ${bugDesc}\n` +
              `🎮 **Versão:** ${bugVersao}\n⏰ **Quando:** <t:${Math.floor(Date.now() / 1000)}:R>\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          }
        } catch (err) { console.error('Erro ao postar bug:', err.message); }
      }
      return;
    }

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
          `💡 **VISÃO DE ${interaction.user.username.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ **Categoria:** ${sugCat}\n📋 **Ideia:** ${sugTitulo}\n📝 **Detalhes:** ${sugDesc}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⬆️ — Apoio esta visão!\n*Vote também em: https://italozkv.github.io/tower-deep/votos.html*`
        );
        await msg.react('⬆️');
        await interaction.editReply({ content: '🔱 *Tua visão foi gravada nos pergaminhos e já aparece no site!*' });
      } catch (err) { console.error('Erro submit sugestao:', err.message); await interaction.editReply({ content: `⚠️ Erro: ${err.message}` }).catch(() => {}); }
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'enquete') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas guardiões do Olimpo podem proclamar enquetes.*', ephemeral: true });
      const titulo    = interaction.options.getString('titulo');
      const descricao = interaction.options.getString('descricao');
      const categoria = interaction.options.getString('categoria');
      await interaction.deferReply({ ephemeral: true });
      try {
        const lista = await lerEnquetes();
        lista.push({ id: `e${Date.now()}`, titulo, desc: descricao, cat: categoria, votos: 0, origem: 'discord', criadoEm: new Date().toISOString() });
        await salvarEnquetes(lista);
        const msg = await interaction.channel.send(
          `🗳️ **NOVA ENQUETE — ${titulo.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🏷️ **Categoria:** ${categoria}\n📝 ${descricao}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⬆️ — Quero esta feature!\n*Resultados: https://italozkv.github.io/tower-deep/votos.html*`
        );
        await msg.react('⬆️');
        await interaction.editReply({ content: '✅ *Enquete proclamada e salva no site!*' });
      } catch (err) { console.error('Erro /enquete:', err.message); await interaction.editReply({ content: `⚠️ Erro: ${err.message}` }).catch(() => {}); }
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'limpar') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Os deuses negam tua solicitação, mortal.*', ephemeral: true });
      const quantidade = interaction.options.getInteger('quantidade');
      await interaction.deferReply({ ephemeral: true });
      try {
        const msgs    = await interaction.channel.messages.fetch({ limit: quantidade });
        const recentes = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
        if (recentes.size === 0) return interaction.editReply({ content: '⚠️ *Nenhuma mensagem recente encontrada (máx. 14 dias).*' });
        await interaction.channel.bulkDelete(recentes, true);
        await interaction.editReply({ content: `🧹 *${recentes.size} mensagem(ns) foram varridas pelos ventos do Olimpo.*` });
      } catch (err) { console.error('Erro ao limpar:', err.message); await interaction.editReply({ content: '⚠️ *Os deuses não conseguiram varrer o canal. Verifique as permissões do bot.*' }); }
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'anunciar') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Os deuses negam tua solicitação, mortal.*', ephemeral: true });
      const mensagem = interaction.options.getString('mensagem');
      const titulo   = interaction.options.getString('titulo') || 'Decreto do Olimpo';
      await interaction.reply({ content: '✅ *Teu anúncio foi proclamado no canal, guardião.*', ephemeral: true });
      try {
        const embedAnuncio = new EmbedBuilder()
          .setColor(0xc9a84c).setTitle(`📢 ${titulo}`).setDescription(mensagem)
          .setFooter({ text: `Proclamado por ${interaction.user.username} · Tower Deep` }).setTimestamp();
        const botoesAnuncio = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel('🌐 Site Oficial').setURL('https://italozkv.github.io/tower-deep/').setStyle(ButtonStyle.Link),
          new ButtonBuilder().setLabel('📜 Changelog').setURL('https://italozkv.github.io/tower-deep/changelog.html').setStyle(ButtonStyle.Link),
        );
        await interaction.channel.send({ embeds: [embedAnuncio], components: [botoesAnuncio] });
      } catch (err) { console.error('Erro ao anunciar:', err.message); }
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'roadmap') {
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas guardiões do Olimpo podem editar os pergaminhos do roadmap.*', ephemeral: true });
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
          if (versoes.find(v => (v.versao || v.nome) === versao)) return interaction.editReply({ content: `⚠️ *A versão ${versao} já existe nos pergaminhos.*` });
          versoes.push({ versao, nome: versao, titulo, status, data, lore, itens: [], objetivo: titulo, cor: '#c9a84c', emoji: '📜' });
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `🗺️ **${versao} — ${titulo}** adicionada ao roadmap!` });
        }
        if (sub === 'item') {
          const versao = interaction.options.getString('versao');
          const texto  = interaction.options.getString('texto');
          const badge  = interaction.options.getString('badge') || 'Novo';
          const v = versoes.find(v => (v.versao || v.nome) === versao);
          if (!v) return interaction.editReply({ content: `⚠️ *Versão ${versao} não encontrada. Versões disponíveis: ${versoes.map(x => x.versao || x.nome).join(', ')}*` });
          v.itens = v.itens || [];
          v.itens.push({ texto, badge, concluido: false });
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `✅ *Item adicionado em ${versao}:* ${texto}` });
        }
        if (sub === 'concluir') {
          const versao    = interaction.options.getString('versao');
          const itemBusca = interaction.options.getString('item').toLowerCase();
          const v = versoes.find(v => (v.versao || v.nome) === versao);
          if (!v) return interaction.editReply({ content: `⚠️ *Versão ${versao} não encontrada. Versões disponíveis: ${versoes.map(x => x.versao || x.nome).join(', ')}*` });
          const item = v.itens?.find(i => i.texto.toLowerCase().includes(itemBusca));
          if (!item) return interaction.editReply({ content: `⚠️ *Item não encontrado.*` });
          item.concluido = true;
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `✓ *Item marcado como concluído em ${versao}:* ${item.texto}` });
        }
        if (sub === 'status') {
          const versao = interaction.options.getString('versao');
          const status = interaction.options.getString('status');
          const v = versoes.find(v => (v.versao || v.nome) === versao);
          if (!v) return interaction.editReply({ content: `⚠️ *Versão ${versao} não encontrada. Versões disponíveis: ${versoes.map(x => x.versao || x.nome).join(', ')}*` });
          v.status = status;
          await salvarRoadmap(versoes);
          return interaction.editReply({ content: `⚡ *Status de ${versao} atualizado para: ${status}*` });
        }
      } catch (err) { console.error('Erro no roadmap:', err.message); await interaction.editReply({ content: '⚠️ *Os ventos do Érebo interferiram. Tente novamente.*' }); }
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'rank') {
      const userId = interaction.user.id;
      if (!xpData.has(userId)) xpData.set(userId, { xp: 0, nivel: 1, msgs: 0, username: interaction.user.username, lastMsg: 0 });
      const dados   = xpData.get(userId);
      const nivel   = getNivel(dados.xp);
      const proximo = getProximoNivel(dados.xp);
      const faltam  = proximo ? proximo.xpMin - dados.xp : 0;
      const xpAtualNivel  = dados.xp - nivel.xpMin;
      const xpNecessario  = proximo ? proximo.xpMin - nivel.xpMin : 1;
      const barra = proximo ? gerarBarraProgresso(xpAtualNivel, xpNecessario, 12) : '████████████ 100%';
      const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      const top5     = [...xpData.entries()].sort((a, b) => b[1].xp - a[1].xp).slice(0, 5);
      let topTexto   = '';
      for (let i = 0; i < top5.length; i++) {
        const [uid, d] = top5[i];
        const n = getNivel(d.xp);
        topTexto += `${medalhas[i]} <@${uid}> — **${n.nome}** *(${d.xp} XP)*${uid === userId ? ' ← você' : ''}\n`;
      }
      await interaction.reply({
        content:
          `✨ **PERGAMINHO DE ${interaction.user.username.toUpperCase()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏛️ **Título:** ${nivel.nome}\n⚡ **XP Total:** ${dados.xp}\n📊 **Nível:** ${nivel.nivel}/10\n` +
          `📈 **Progresso:** \`[${barra}]\`\n` +
          (proximo ? `🔮 **Próximo:** ${proximo.nome} *(faltam ${faltam} XP)*` : '🌟 *Atingiste a divindade máxima, imortal!*') +
          `\n\n🏆 **OLIMPO — Top Mortais**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          (topTexto || '*Nenhum mortal registrado ainda.*') + `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'changelog') {
      const member = interaction.member;
      if (!ehAdmin(member)) return interaction.reply({ content: '⚠️ *Apenas o Dono ou Admin do Olimpo pode editar os anais eternos.*', ephemeral: true });
      const sub = interaction.options.getSubcommand();
      await interaction.deferReply({ ephemeral: true });
      try {
        const dadosGist = await lerGist();
        const updates   = dadosGist.updates || [];
        if (sub === 'listar') {
          if (!updates.length) return interaction.editReply({ content: '📜 *Nenhum decreto nos anais eternos ainda.*' });
          const lista = updates.map((u, i) => `**#${i + 1}** — \`${u.versao}\` — **${u.titulo}** *(${u.data})* ${u.imagem ? '🖼️' : ''}`).join('\n');
          return interaction.editReply({ content: `📜 **ANAIS DO OLIMPO — ${updates.length} decreto(s)**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${lista}` });
        }
        if (sub === 'apagar') {
          const num = interaction.options.getInteger('numero');
          if (num < 1 || num > updates.length) return interaction.editReply({ content: `⚠️ *Número inválido. Use entre 1 e ${updates.length}.*` });
          const removido = updates.splice(num - 1, 1)[0];
          dadosGist.updates = updates;
          await salvarGist(dadosGist);
          return interaction.editReply({ content: `🗑️ **Decreto apagado:** \`${removido.versao}\` — ${removido.titulo}` });
        }
        if (sub === 'editar') {
          const num   = interaction.options.getInteger('numero');
          const campo = interaction.options.getString('campo');
          const valor = interaction.options.getString('valor');
          if (num < 1 || num > updates.length) return interaction.editReply({ content: `⚠️ *Número inválido.*` });
          const alvo = updates[num - 1];
          if (campo === 'proximo') dadosGist.proximaUpdate = valor;
          else alvo[campo] = valor;
          dadosGist.updates = updates;
          await salvarGist(dadosGist);
          return interaction.editReply({ content: `✏️ **Decreto atualizado!** \`${alvo.versao}\` — campo \`${campo}\`: ${valor}` });
        }
        if (sub === 'imagem') {
          const num   = interaction.options.getInteger('numero');
          const anexo = interaction.options.getAttachment('imagem');
          if (num < 1 || num > updates.length) return interaction.editReply({ content: `⚠️ *Número inválido.*` });
          const ehImagem = /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(anexo.url);
          if (!ehImagem) return interaction.editReply({ content: '⚠️ *Apenas imagens são aceitas (png, jpg, gif, webp).*' });
          updates[num - 1].imagem = anexo.url;
          dadosGist.updates = updates;
          await salvarGist(dadosGist);
          return interaction.editReply({ content: `🖼️ **Imagem atualizada no decreto #${num}!**` });
        }
      } catch (err) { console.error('Erro /changelog:', err.message); return interaction.editReply({ content: `⚠️ *Os ventos do Érebo interferiram. Tente novamente.*` }); }
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'vincular') {
      const robloxUser = interaction.options.getString('usuario');
      await interaction.deferReply({ ephemeral: true });
      try {
        const res  = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(robloxUser)}&limit=10`);
        const data = await res.json();
        if (!data.data || !data.data.length) return interaction.editReply({ content: '⚠️ *Usuário não encontrado no Roblox. Verifique o nome exato.*' });
        const rbUser = data.data[0];
        const db     = await lerVinculos();
        const jaVinculado = db.vinculos.find(v => v.robloxId === String(rbUser.id));
        if (jaVinculado && jaVinculado.discordId !== interaction.user.id) return interaction.editReply({ content: `⚠️ *A conta **${rbUser.name}** já está vinculada a outro usuário Discord.*` });
        db.vinculos = db.vinculos.filter(v => v.discordId !== interaction.user.id);
        db.vinculos.push({ discordId: interaction.user.id, robloxId: String(rbUser.id), robloxName: rbUser.name, vinculadoEm: new Date().toISOString() });
        await salvarVinculos(db);
        invalidarCache();
        if (CONFIG.CARGO_VERIFICADO) {
          const cargo = interaction.guild?.roles?.cache?.get(CONFIG.CARGO_VERIFICADO);
          if (cargo) await interaction.member.roles.add(cargo).catch(() => {});
        }
        const embed = new EmbedBuilder()
          .setColor(CONFIG.CORES.SUCESSO).setTitle('🔗 Conta Vinculada!')
          .setDescription(`Tua conta Discord foi vinculada ao jogador **${rbUser.name}** no Roblox!\n\nAgora podes resgatar códigos no jogo usando tua conta.`)
          .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${rbUser.id}&width=420&height=420&format=png`)
          .addFields({ name: '👤 Roblox', value: rbUser.name, inline: true }, { name: '🆔 ID', value: String(rbUser.id), inline: true })
          .setFooter({ text: 'Tower Deep · Vínculo registrado' }).setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch (err) { console.error('Erro /vincular:', err.message); return interaction.editReply({ content: '⚠️ *Erro ao vincular. Tente novamente.*' }); }
    }

    // ── /gencodigo ─────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'gencodigo') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: '🚫 *Apenas Admins podem gerar códigos.*', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      try {
        const descricao   = interaction.options.getString('descricao');
        const maxUsos     = interaction.options.getInteger('maxusos') || 0;
        const expiraHoras = interaction.options.getInteger('expira_horas') || 0;

        const sessao = {
          descricao, maxUsos, expiraHoras,
          recompensas: [], tiposIdx: 0,
          tiposSelecionados: [],
        };
        sessoescodigo.set(interaction.user.id, sessao);
        setTimeout(() => sessoescodigo.delete(interaction.user.id), 10 * 60 * 1000);

        // CORREÇÃO: StringSelectMenuOptionBuilder sem emoji (evita erro "emoji inválido")
        const tipos = Object.entries(TIPOS_RECOMPENSA).map(([value, info]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(info.label.slice(0, 100))
            .setValue(value)
            .setDescription(info.temLista ? 'Seleciona item do catálogo' : `Define quantidade de ${info.unidade}`)
        );

        const menuTipo = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`gc_tipo_${interaction.user.id}`)
            .setPlaceholder('🎁 Que tipos de recompensa este código vai dar?')
            .setMinValues(1)
            .setMaxValues(Math.min(Object.keys(TIPOS_RECOMPENSA).length, 8))
            .addOptions(tipos)
        );

        const embed = new EmbedBuilder()
          .setColor(CONFIG.CORES.PRIMARIA)
          .setTitle('🎁 Novo Código — Passo 1/3')
          .setDescription(`**Descrição:** ${descricao}\n**Max Usos:** ${maxUsos || 'Ilimitado'} · **Expira:** ${expiraHoras ? `em ${expiraHoras}h` : 'Nunca'}\n\n*Selecione os tipos de recompensa:*`)
          .setFooter({ text: 'Passo 1 — Tipo de Recompensa' });

        return interaction.editReply({ embeds: [embed], components: [menuTipo] });
      } catch (err) {
        console.error('Erro /gencodigo:', err);
        return interaction.editReply({ content: `⚠️ Erro ao iniciar /gencodigo: ${err.message}` });
      }
    }

    // Passo 1 → Tipos selecionados
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gc_tipo_')) {
      const adminId = interaction.customId.slice('gc_tipo_'.length);
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada. Use /gencodigo novamente.', ephemeral: true });

      const tiposBrutos = interaction.values;
      const temItem = tiposBrutos.includes('item');

      if (temItem) {
        // Salva os tipos brutos e abre modal para perguntar quantos itens
        sessao._tiposBrutos = tiposBrutos;
        const modal = new ModalBuilder()
          .setCustomId(`gc_qtditens_${adminId}`)
          .setTitle('Quantos Itens do Jogo?')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('qtd_itens')
              .setLabel('Quantos itens diferentes deseja adicionar?')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('Ex: 2')
              .setMinLength(1)
              .setMaxLength(2)
          ));
        return interaction.showModal(modal);
      }

      // Sem item: fluxo normal
      sessao.tiposSelecionados = tiposBrutos;
      sessao.tiposIdx = 0;
      // NÃO dar deferUpdate aqui — avancarRecompensa pode precisar abrir modal
      return await avancarRecompensa(interaction, sessao, adminId);
    }

    // Modal → quantos itens do jogo
    if (interaction.isModalSubmit() && interaction.customId.startsWith('gc_qtditens_')) {
      const adminId = interaction.customId.slice('gc_qtditens_'.length);
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada. Use /gencodigo novamente.', ephemeral: true });
      await interaction.deferUpdate();

      const qtdItens = Math.max(1, Math.min(10, parseInt(interaction.fields.getTextInputValue('qtd_itens')) || 1));
      const tiposBrutos = sessao._tiposBrutos || [];

      // Expande 'item' para qtdItens slots e mantém os outros tipos na ordem
      const tiposExpandidos = [];
      for (const t of tiposBrutos) {
        if (t === 'item') {
          for (let i = 0; i < qtdItens; i++) tiposExpandidos.push('item');
        } else {
          tiposExpandidos.push(t);
        }
      }
      sessao.tiposSelecionados = tiposExpandidos;
      sessao.tiposIdx = 0;
      delete sessao._tiposBrutos;

      return await avancarRecompensa(interaction, sessao, adminId);
    }

    // Passo 2 → Categoria selecionada → listar itens
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gc_cat_')) {
      const adminId = interaction.customId.slice('gc_cat_'.length);
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada.', ephemeral: true });
      const categoria = interaction.values[0].replace('cat:', '');
      const catalogo  = await getCatalogoCompleto();
      const itensCat  = catalogo.filter(i => i.categoria === categoria).slice(0, 25);
      if (!itensCat.length) return interaction.reply({ content: '⚠️ Nenhum item encontrado nesta categoria.', ephemeral: true });

      // CORREÇÃO: StringSelectMenuOptionBuilder sem emoji
      const opsItens = itensCat.map(i =>
        new StringSelectMenuOptionBuilder()
          .setLabel(i.nome.slice(0, 100))
          .setValue(i.id)
          .setDescription(`${i.raridade} · ${i.id}`.slice(0, 100))
      );

      const menuItem = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`gc_item_${adminId}`)
          .setPlaceholder(`🎁 Selecione um item de "${categoria}"...`)
          .addOptions(opsItens)
      );
      const btnVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`gc_voltarcat_${adminId}`).setLabel('← Voltar às Categorias').setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA)
          .setTitle(`📂 ${categoria}`)
          .setDescription(`*${itensCat.length} itens — selecione um:*`)
          .setFooter({ text: 'Passo 2b — Item' })],
        components: [menuItem, btnVoltar],
      });
    }

    // Passo 2b → Item selecionado → pedir quantidade
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gc_item_')) {
      const adminId = interaction.customId.slice('gc_item_'.length);
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada.', ephemeral: true });
      const catalogo = await getCatalogoCompleto();
      const item = catalogo.find(i => i.id === interaction.values[0]);
      if (!item) return interaction.reply({ content: '❌ Item não encontrado.', ephemeral: true });
      sessao.itemAtual = item;
      const modal = new ModalBuilder()
        .setCustomId(`gc_qtditem_${adminId}`)
        .setTitle(`Quantidade: ${item.nome.slice(0, 40)}`)
        .addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('valor').setLabel('Quantidade (1 se for único)')
            .setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 1')
        ));
      return interaction.showModal(modal);
    }

    // Modal → quantidade de item do catálogo
    if (interaction.isModalSubmit() && interaction.customId.startsWith('gc_qtditem_')) {
      const adminId = interaction.customId.slice('gc_qtditem_'.length);
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada.', ephemeral: true });
      await interaction.deferUpdate();
      const qtd  = parseInt(interaction.fields.getTextInputValue('valor')) || 1;
      const item = sessao.itemAtual;
      const emoji = RARIDADE_EMOJI[item.raridade] || '🎁';
      sessao.recompensas.push({ tipo: 'item', valor: item.id, quantidade: qtd, label: `${emoji} ${item.nome}${qtd > 1 ? ` x${qtd}` : ''} *(${item.raridade})*` });
      sessao.tiposIdx++;
      return await avancarRecompensa(interaction, sessao, adminId);
    }

    // Modal → quantidade de moedas/gemas/xp
    // customId = 'gc_qtd_ADMINID_IDX' onde ADMINID pode conter dígitos; IDX é sempre o ÚLTIMO segmento
    if (interaction.isModalSubmit() && interaction.customId.startsWith('gc_qtd_')) {
      const semPrefixo    = interaction.customId.slice('gc_qtd_'.length);
      const lastUnder     = semPrefixo.lastIndexOf('_');
      const adminId       = semPrefixo.slice(0, lastUnder);
      const idxNoCustomId = parseInt(semPrefixo.slice(lastUnder + 1));
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada.', ephemeral: true });
      await interaction.deferUpdate();
      // Usa o idx gravado no customId como fonte da verdade — evita dessincronização
      sessao.tiposIdx = idxNoCustomId;
      const tipo  = sessao.tiposSelecionados[sessao.tiposIdx];
      const info  = TIPOS_RECOMPENSA[tipo];
      if (!tipo || !info) {
        console.error('[gc_qtd] tipo inválido idx=' + sessao.tiposIdx + ' tipos=' + JSON.stringify(sessao.tiposSelecionados));
        return interaction.editReply({ content: '⚠️ Erro interno: tipo inválido. Use /gencodigo novamente.', components: [] });
      }
      const valor = parseInt(interaction.fields.getTextInputValue('valor')) || 0;
      sessao.recompensas.push({ tipo, valor, quantidade: valor, label: `${info.label}: ${valor} ${info.unidade}` });
      sessao.tiposIdx++;
      return await avancarRecompensa(interaction, sessao, adminId);
    }

    // Botão "Próxima Recompensa" — abre modal após um ModalSubmit encadeado
    // customId = 'gc_next_ADMINID_IDX' onde IDX é o último segmento
    if (interaction.isButton() && interaction.customId.startsWith('gc_next_')) {
      const semPrefixo    = interaction.customId.slice('gc_next_'.length);
      const lastUnder     = semPrefixo.lastIndexOf('_');
      const adminId       = semPrefixo.slice(0, lastUnder);
      const idxNoCustomId = parseInt(semPrefixo.slice(lastUnder + 1));
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada. Use /gencodigo novamente.', ephemeral: true });
      // Sincroniza tiposIdx com o idx do botão antes de tudo
      sessao.tiposIdx = idxNoCustomId;
      const proxTipo = sessao.tiposSelecionados[sessao.tiposIdx];
      const info = TIPOS_RECOMPENSA[proxTipo];
      if (!proxTipo || !info) {
        console.error('[gc_next] tipo inválido idx=' + sessao.tiposIdx + ' tipos=' + JSON.stringify(sessao.tiposSelecionados));
        return interaction.reply({ content: '⚠️ Tipo inválido. Use /gencodigo novamente.', ephemeral: true });
      }
      const recompListadas = sessao.recompensas.length
        ? sessao.recompensas.map((r, i) => `${i+1}. ${r.label}`).join(' | ')
        : '';
      const modal = new ModalBuilder()
        .setCustomId(`gc_qtd_${adminId}_${sessao.tiposIdx}`)
        .setTitle(`Recompensa ${sessao.tiposIdx + 1}/${sessao.tiposSelecionados.length}: ${info.label}`.slice(0, 45))
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('valor')
              .setLabel((`Quantidade de ${info.unidade}` + (recompListadas ? ` (já: ${recompListadas.slice(0,30)})` : '')).slice(0, 45))
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('Ex: 500')
          )
        );
      return interaction.showModal(modal);
    }

    // Botão voltar às categorias
    if (interaction.isButton() && interaction.customId.startsWith('gc_voltarcat_')) {
      const adminId = interaction.customId.slice('gc_voltarcat_'.length);
      if (interaction.user.id !== adminId) return interaction.reply({ content: '🚫', ephemeral: true });
      const sessao = sessoescodigo.get(interaction.user.id);
      if (!sessao) return interaction.reply({ content: '⚠️ Sessão expirada.', ephemeral: true });
      const catalogo   = await getCatalogoCompleto();
      const categorias = [...new Set(catalogo.map(i => i.categoria))].sort();

      // CORREÇÃO: StringSelectMenuOptionBuilder sem emoji
      const opsCat = categorias.slice(0, 25).map(c =>
        new StringSelectMenuOptionBuilder()
          .setLabel(c.slice(0, 100))
          .setValue(`cat:${c}`)
          .setDescription(`${catalogo.filter(i => i.categoria === c).length} itens`)
      );

      return interaction.update({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA).setTitle('📂 Categorias').setDescription('*Selecione a categoria:*')],
        components: [new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId(`gc_cat_${adminId}`).setPlaceholder('📂 Categoria...').addOptions(opsCat)
        )],
      });
    }

    // /itemcadastrar
    if (interaction.isChatInputCommand() && interaction.commandName === 'itemcadastrar') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: '🚫 Apenas Admins.', ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId('itemcadastrar_modal').setTitle('Cadastrar Novo Item')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('id').setLabel('ID do item (sem espaços, ex: espada_zeus)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('espada_zeus')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Nome de exibição').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Espada de Zeus')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('raridade').setLabel('Raridade').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Comum / Incomum / Raro / Epico / Lendario / Primordial')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('categoria').setLabel('Categoria (ex: Arma, Especial, Skin...)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Arma'))
        );
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'itemcadastrar_modal') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: '🚫', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const id        = interaction.fields.getTextInputValue('id').trim().toLowerCase().replace(/\s+/g, '_');
      const nome      = interaction.fields.getTextInputValue('nome').trim();
      const raridade  = interaction.fields.getTextInputValue('raridade').trim();
      const categoria = interaction.fields.getTextInputValue('categoria').trim();
      const catalogo = await getCatalogoCompleto();
      if (catalogo.find(i => i.id === id)) return interaction.editReply({ content: `❌ Já existe um item com o ID \`${id}\`. Use outro ID.` });
      const novoItem = { id, nome, raridade, categoria, adicionadoPor: interaction.user.tag, adicionadoEm: new Date().toISOString() };
      const db = await lerCodigos();
      if (!db.itensExtras) db.itensExtras = [];
      db.itensExtras.push(novoItem);
      await salvarCodigos(db);
      invalidarCache();
      const emoji = RARIDADE_EMOJI[raridade] || '🎁';
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.SUCESSO).setTitle('✅ Item Cadastrado!')
          .setDescription(`${emoji} **${nome}** foi adicionado ao catálogo e já aparece no /gencodigo.`)
          .addFields({ name: 'ID', value: `\`${id}\``, inline: true }, { name: 'Raridade', value: raridade, inline: true }, { name: 'Categoria', value: categoria, inline: true })],
      });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'itemlistar') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: '🚫 Apenas Admins.', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const catalogo = await getCatalogoCompleto();
      const db = await lerCodigos();
      const extras = db.itensExtras || [];
      const categorias = [...new Set(catalogo.map(i => i.categoria))].sort();
      const resumo = categorias.map(c => {
        const count = catalogo.filter(i => i.categoria === c).length;
        return `**${c}** — ${count} iten${count !== 1 ? 's' : ''}`;
      }).join('\n');
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(CONFIG.CORES.INFO)
          .setTitle(`📦 Catálogo de Itens — ${catalogo.length} itens`)
          .setDescription(resumo)
          .addFields({ name: '➕ Itens extras cadastrados', value: extras.length ? `${extras.length} iten${extras.length !== 1 ? 's' : ''} adicionados por admins` : 'Nenhum ainda. Use /itemcadastrar.' })
          .setFooter({ text: 'Use /itemcadastrar para adicionar novos itens' })],
      });
    }

    if (interaction.isButton() && interaction.customId === 'btn_vincular_info') {
      return interaction.reply({ content: '🔗 *Para vincular tua conta Roblox, usa o comando `/vincular` e coloca o teu nome de usuário no Roblox!*', ephemeral: true });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'codigo') {
      if (!ehAdmin(interaction.member)) return interaction.reply({ content: '🚫 *Apenas Admins.*', ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const sub = interaction.options.getSubcommand();
      const db  = await lerCodigos();
      if (sub === 'listar') {
        if (!db.codigos.length) return interaction.editReply({ content: '📜 *Nenhum código criado ainda.*' });
        const lista = db.codigos.slice(-20).reverse().map(c => {
          const status = !c.ativo ? '🔴' : c.expira && new Date(c.expira) < new Date() ? '🟡' : '🟢';
          const usos   = `${c.usadoPor?.length || 0}${c.maxUsos ? '/'+c.maxUsos : ''}`;
          return `${status} \`${c.id}\` — ${c.descricao} *(${usos} usos)*`;
        }).join('\n');
        return interaction.editReply({ content: `📋 **Códigos (últimos 20):**\n${lista}` });
      }
      if (sub === 'desativar') {
        const id = interaction.options.getString('codigo').toUpperCase();
        const c  = db.codigos.find(x => x.id === id);
        if (!c) return interaction.editReply({ content: `❌ Código \`${id}\` não encontrado.` });
        c.ativo = false;
        await salvarCodigos(db);
        invalidarCache();
        return interaction.editReply({ content: `🚫 Código \`${id}\` desativado com sucesso.` });
      }
      if (sub === 'info') {
        const id = interaction.options.getString('codigo').toUpperCase();
        const c  = db.codigos.find(x => x.id === id);
        if (!c) return interaction.editReply({ content: `❌ Código \`${id}\` não encontrado.` });
        const embed = new EmbedBuilder()
          .setColor(c.ativo ? CONFIG.CORES.SUCESSO : CONFIG.CORES.ERRO)
          .setTitle(`🔍 Código: \`${c.id}\``)
          .addFields(
            { name: '📝 Descrição',   value: c.descricao,                                                          inline: true  },
            { name: '🟢 Ativo',       value: c.ativo ? 'Sim' : 'Não',                                              inline: true  },
            { name: '👥 Usos',        value: `${c.usadoPor?.length||0}${c.maxUsos?'/'+c.maxUsos:''}`,              inline: true  },
            { name: '📅 Criado em',   value: new Date(c.criadoEm).toLocaleDateString('pt-BR'),                     inline: true  },
            { name: '⏰ Expira',       value: c.expira ? new Date(c.expira).toLocaleDateString('pt-BR') : 'Nunca', inline: true  },
            { name: '🎀 Recompensas', value: c.recompensas.map(r => r.label).join('\n') || 'Nenhuma',              inline: false },
          );
        if (c.usadoPor?.length) {
          embed.addFields({ name: `👤 Usado por (${c.usadoPor.length})`, value: c.usadoPor.slice(-10).map(u => `• ${u.robloxName} (${new Date(u.usadoEm).toLocaleDateString('pt-BR')})`).join('\n') });
        }
        return interaction.editReply({ embeds: [embed] });
      }
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'verificar') {
      const robloxUser = interaction.options.getString('usuario');
      await interaction.deferReply({ ephemeral: true });
      try {
        const res  = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(robloxUser)}&limit=10`);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const rbUser = data.data[0];
          if (CONFIG.CARGO_VERIFICADO) {
            const cargo = interaction.guild.roles.cache.get(CONFIG.CARGO_VERIFICADO);
            if (cargo) await interaction.member.roles.add(cargo);
          }
          const embed = new EmbedBuilder()
            .setColor(CONFIG.CORES.SUCESSO).setTitle('✅ Conta Vinculada com Sucesso!')
            .setDescription(`Tua alma no Discord foi atrelada ao mortal **${rbUser.name}** no Roblox.\nVocê recebeu as bênçãos de verificado.`)
            .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${rbUser.id}&width=420&height=420&format=png`);
          return interaction.editReply({ embeds: [embed] });
        } else {
          return interaction.editReply({ content: '⚠️ *Os oráculos não encontraram esse mortal no Roblox. Verifique o nome e tente novamente.*' });
        }
      } catch (err) { console.error('Erro /verificar:', err.message); return interaction.editReply({ content: '⚠️ *Houve uma perturbação no portal para o Roblox. Tente novamente mais tarde.*' }); }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ajuda') {
      const escolha = interaction.values[0];
      const embed   = new EmbedBuilder().setColor(CONFIG.CORES.PRIMARIA);
      if (escolha === 'mortais') {
        embed.setTitle('👥 Poderes dos Mortais').setDescription('🐛 `/bug` — Relatar uma anomalia\n💡 `/sugestao` — Enviar visão ao Olimpo\n🏆 `/rank` — Ver teu título divino\n✅ `/verificar` — Vincular conta do Roblox\n🎫 Menu de tickets — Abrir chamado de suporte');
      } else if (escolha === 'oraculo') {
        embed.setTitle('✨ O Oráculo').setDescription('Mencione o bot em qualquer canal:\n`@Bot qual torre é melhor?` — Consulta geral\n`@Bot tenho um bug` — Auxílio técnico\n`@Bot sugestão: torre X` — Análise de ideia');
      } else if (escolha === 'equipe') {
        if (!ehEquipe(interaction.member)) return interaction.reply({ content: '🚫 *Os deuses proíbem teu acesso a esta sabedoria.*', ephemeral: true });
        embed.setTitle('🛡️ Armamento da Equipe & Mods').setDescription('🔑 `!token` — Gerar token do site\n📜 `!update` — Ritual de novo decreto\n📋 `!listar` — Consultar os anais\n🗳️ `/enquete` — Criar enquete no site\n🧹 `/limpar` — Apagar mensagens\n📢 `/anunciar` — Fazer anúncio\n🎫 Comandos `/ticket`...');
      } else if (escolha === 'admin') {
        if (!ehAdmin(interaction.member)) return interaction.reply({ content: '🚫 *Os deuses proíbem teu acesso a esta sabedoria.*', ephemeral: true });
        embed.setTitle('🔱 Grimório dos Admins').setDescription('✏️ `!editar / !apagar` — Gerenciar decretos\n📜 `/changelog` — Gerenciar decretos via slash\n🗺️ `/roadmap` — Gerenciar roadmap do site\n🚫 `!revogar` — Gerenciar tokens ativos');
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_criar') {
      const categoria = interaction.values[0];
      return abrirTicket(interaction, categoria);
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
      const sub = interaction.options.getSubcommand();
      if (sub === 'painel') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas guardiões do Olimpo podem invocar o painel de tickets.*', ephemeral: true });
        await enviarPainelTicket(interaction.channel);
        return interaction.reply({ content: '✅ *Painel de tickets proclamado no canal!*', ephemeral: true });
      }
      if (sub === 'listar') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas guardiões do Olimpo podem ver esta lista.*', ephemeral: true });
        const lista = [...ticketsAtivos.values()].filter(t => t.status === 'aberto');
        if (!lista.length) return interaction.reply({ content: '✅ *Nenhum ticket aberto no momento.*', ephemeral: true });
        const texto = lista.map(t => {
          const canalRef = interaction.guild.channels.cache.get(t.channelId);
          const cat = CATEGORIAS_TICKET[t.categoria]?.emoji || '📜';
          const mins = Math.floor((Date.now() - t.criadoEm) / 60000);
          const tempo = mins < 60 ? `${mins}min` : `${Math.floor(mins/60)}h${mins%60}min`;
          return `${cat} **#${t.id}** — ${t.username} — ${t.categoria} — aberto há ${tempo} ${canalRef ? `→ ${canalRef}` : ''}`;
        }).join('\n');
        return interaction.reply({ content: `📜 **TICKETS ABERTOS — ${lista.length} chamado(s)**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${texto}`, ephemeral: true });
      }
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) return interaction.reply({ content: '⚠️ *Este comando só funciona dentro de um canal de ticket.*', ephemeral: true });
      if (sub === 'fechar') {
        const ehDono  = ticket.userId === interaction.user.id;
        const ehStaff = temPermissaoModeracao(interaction);
        if (!ehDono && !ehStaff) return interaction.reply({ content: '⚠️ *Apenas o criador do ticket ou staff pode fechá-lo.*', ephemeral: true });
        return fecharTicket(interaction, ticket);
      }
      if (sub === 'resolver') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas staff pode marcar como resolvido.*', ephemeral: true });
        ticket.status = 'resolvido'; ticket.resolvidoPor = interaction.user.tag;
        await salvarTickets().catch(() => {});
        const embedResolvido = new EmbedBuilder().setColor(0x3dd68c).setTitle(`✅ Ticket #${ticket.id} Resolvido`)
          .setDescription(`*Os deuses declararam este chamado solucionado.*\n\n**Resolvido por:** ${interaction.user.tag}\n\nO ticket será fechado em breve.`);
        await interaction.reply({ embeds: [embedResolvido] });
        await logTicket(interaction.guild, `✅ **Ticket Resolvido** — #${ticket.id}\n👤 **Usuário:** ${ticket.username}\n✅ **Resolvido por:** ${interaction.user.tag}`);
        return;
      }
      if (sub === 'assumir') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas staff pode assumir um ticket.*', ephemeral: true });
        ticket.assumidoPor = interaction.user.tag;
        await salvarTickets().catch(() => {});
        await interaction.reply({ content: `⚔️ **${interaction.user} assumiu o atendimento deste ticket.**` });
        return;
      }
      if (sub === 'add') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas staff pode adicionar usuários ao ticket.*', ephemeral: true });
        const usuario = interaction.options.getUser('usuario');
        await interaction.channel.permissionOverwrites.edit(usuario.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        return interaction.reply({ content: `✅ *${usuario} foi adicionado à câmara.*` });
      }
      if (sub === 'remove') {
        if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas staff pode remover usuários do ticket.*', ephemeral: true });
        const usuario = interaction.options.getUser('usuario');
        if (usuario.id === ticket.userId) return interaction.reply({ content: '⚠️ *Não podes remover o criador do ticket.*', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(usuario.id, { ViewChannel: false });
        return interaction.reply({ content: `✅ *${usuario} foi removido da câmara.*` });
      }
    }

    if (interaction.isButton() && interaction.customId === 'ticket_fechar') {
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) return interaction.reply({ content: '⚠️ *Ticket não encontrado.*', ephemeral: true });
      const ehDono  = ticket.userId === interaction.user.id;
      const ehStaff = temPermissaoModeracao(interaction);
      if (!ehDono && !ehStaff) return interaction.reply({ content: '⚠️ *Apenas o criador do ticket ou staff pode fechá-lo.*', ephemeral: true });
      return fecharTicket(interaction, ticket);
    }

    if (interaction.isButton() && interaction.customId === 'ticket_resolver') {
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) return interaction.reply({ content: '⚠️ *Ticket não encontrado.*', ephemeral: true });
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas staff pode marcar como resolvido.*', ephemeral: true });
      ticket.status = 'resolvido'; ticket.resolvidoPor = interaction.user.tag;
      await salvarTickets().catch(() => {});
      const embedResolvido = new EmbedBuilder().setColor(0x3dd68c).setTitle(`✅ Ticket #${ticket.id} Resolvido`)
        .setDescription(`*Os deuses declararam este chamado solucionado.*\n\n**Resolvido por:** ${interaction.user.tag}`);
      await interaction.reply({ embeds: [embedResolvido] });
      await logTicket(interaction.guild, `✅ **Ticket Resolvido** — #${ticket.id}\n👤 **Usuário:** ${ticket.username}\n✅ **Resolvido por:** ${interaction.user.tag}`);
      return;
    }

    if (interaction.isButton() && interaction.customId === 'ticket_assumir') {
      const ticket = ticketsAtivos.get(interaction.channelId);
      if (!ticket) return interaction.reply({ content: '⚠️ *Ticket não encontrado.*', ephemeral: true });
      if (!temPermissaoModeracao(interaction)) return interaction.reply({ content: '⚠️ *Apenas staff pode assumir um ticket.*', ephemeral: true });
      ticket.assumidoPor = interaction.user.tag;
      await salvarTickets().catch(() => {});
      await interaction.reply({ content: `⚔️ **${interaction.user} assumiu o atendimento deste ticket.**` });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('avaliar_')) {
      const partes   = interaction.customId.split('_');
      const nota     = parseInt(partes[1]);
      const ticketId = parseInt(partes[2]);
      const estrelas = '⭐'.repeat(nota);
      const msgs     = ['', '😔 Lamentamos não ter ajudado bem...', '😐 Obrigado pelo retorno, melhoraremos!', '🙂 Que bom que ajudamos!', '😊 Fico feliz que tenha gostado!', '🌟 Os deuses do Olimpo agradecem, mortal!'];
      await interaction.reply({ content: `${estrelas} *Avaliação registrada! ${msgs[nota]}*\n*Obrigado por jogar Tower Deep!* 🔱`, ephemeral: false });
      const rowDesativada = new ActionRowBuilder().addComponents(
        [1,2,3,4,5].map(n => new ButtonBuilder().setCustomId(`avaliar_${n}_${ticketId}_done`).setLabel('⭐'.repeat(n)).setStyle(n === nota ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(true))
      );
      await interaction.message.edit({ components: [rowDesativada] }).catch(() => {});
      if (CONFIG.CANAL_LOG_TICKETS) {
        try {
          for (const g of client.guilds.cache.values()) {
            const canalLog = g.channels.cache.get(CONFIG.CANAL_LOG_TICKETS);
            if (canalLog) {
              await canalLog.send(`⭐ **Avaliação Recebida** — Ticket #${ticketId}\n👤 **Usuário:** ${interaction.user.tag}\n${estrelas} **Nota:** ${nota}/5\n${msgs[nota]}`);
              break;
            }
          }
        } catch {}
      }
      return;
    }

  } catch (err) {
    console.error('Erro em interactionCreate:', err);
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '⚠️ Ocorreu um erro inesperado nos salões do Olimpo.' }).catch(() => {});
      else await interaction.reply({ content: '⚠️ Ocorreu um erro inesperado nos salões do Olimpo.', ephemeral: true }).catch(() => {});
    }
  }
});

// ─────────────────────────────────────────────────────────────
// READY
// ─────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`\n🔱 Tower Deep Bot online — ${client.user.tag}`);
  await registrarSlashCommands(client.user.id);
  await carregarXP();
  await carregarTickets();
  console.log(`🤖 IA (Oráculo):    ${CONFIG.GROK_KEY ? '✅ Ativada (Grok)' : '❌ DESATIVADA — adicione GROK_KEY'}`);
  console.log(`📜 Canal updates:   ${CONFIG.CANAL_UPDATE_ID  || '❌ não configurado'}`);
  console.log(`📢 Canal anúncios:  ${CONFIG.CANAL_ANUNCIO_ID || '❌ não configurado'}`);
  console.log(`🐛 Canal bugs:      ${CONFIG.CANAL_BUGS_ID    || '❌ não configurado'}`);
  console.log(`🎫 Categoria tickets: ${CONFIG.CATEGORIA_TICKETS || '❌ não configurado'}`);
  console.log(`📋 Log de tickets:  ${CONFIG.CANAL_LOG_TICKETS || '❌ não configurado'}`);
  console.log(`🔑 Token cargos:    Dono=${CONFIG.CARGO_DONO ? '✅' : '❌'} Admin=${CONFIG.CARGO_ADMIN ? '✅' : '❌'} Mod=${CONFIG.CARGO_MOD ? '✅' : '❌'} Equipe=${CONFIG.CARGO_EQUIPE ? '✅' : '❌'}\n`);
});

// ─────────────────────────────────────────────────────────────
// BOAS-VINDAS
// ─────────────────────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  try {
    const cargo = member.guild.roles.cache.get(CONFIG.CARGO_MEMBRO);
    if (cargo) {
      await member.roles.add(cargo);
      console.log(`✅ Cargo "${cargo.name}" atribuído a ${member.user.tag}`);
    } else {
      console.warn(`⚠️ Cargo CARGO_MEMBRO (${CONFIG.CARGO_MEMBRO}) não encontrado no servidor.`);
    }
  } catch (err) { console.error(`❌ Erro ao atribuir cargo a ${member.user.tag}:`, err.message); }

  try {
    const dm      = await member.createDM();
    const botName = member.guild.members.me?.user.username || 'Bot';
    await dm.send([
      `⚡ **OS DEUSES DO OLIMPO NOTARAM SUA CHEGADA, ${member.user.username}!** ⚡`,
      '','━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━','*Um novo mortal adentra os salões sagrados...*','',
      `Você foi convocado para o servidor oficial do **Tower Deep** — o Tower Defense de deuses gregos no Roblox.`,
      '','🏛️ **O que os deuses te permitem aqui:**',
      '> ⚔️ Enfrentar as hostes do Tártaro e deixar sua marca',
      '> 🗳️ Votar nos decretos futuros do Olimpo',
      '> 📜 Acompanhar os decretos divinos',
      `> 🔮 Consultar o Oráculo (@${botName}) para sabedoria sobre o jogo`,
      '','🌐 **Site oficial:** https://italozkv.github.io/tower-deep/',
      '📖 **Wiki:** https://italozkv.github.io/tower-deep/wiki.html',
      '📜 **Changelog:** https://italozkv.github.io/tower-deep/changelog.html',
      '🗳️ **Votar em features:** https://italozkv.github.io/tower-deep/votos.html',
      '','━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '*Que Zeus ilumine teu caminho e Ares fortaleça teu braço, mortal.* 🔱',
    ].join('\n'));
  } catch (err) { console.error(`Não foi possível enviar DM para ${member.user.tag}:`, err.message); }
});

// ─────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const texto       = message.content.trim();
  const mencionouBot = message.mentions.has(client.user);
  const ehComando   = texto.startsWith('!');
  const t           = texto.toLowerCase();

  if (mencionouBot) {
    if (!CONFIG.GROK_KEY) return message.reply('🌑 *O Oráculo mergulhou em sono profundo... Configure a variável `GROK_KEY` no Railway para invocá-lo.*');
    const pergunta = texto.replace(/<@!?\d+>/g, '').trim();
    if (!pergunta) return message.reply('✨ *O Oráculo te observa, mortal... Qual é o teu questionamento?*');
    return responderComIA(message, pergunta);
  }

  if (texto === '!token') return handleToken(message);
  if (texto.startsWith('!revogar')) return handleRevogar(message, texto.split(' ').slice(1));

  if (message.channelId === CONFIG.CANAL_UPDATE_ID) {
    const member = await getMember(message);

    if (texto === '!update') {
      if (!ehMod(member)) return message.reply('🚫 *Apenas Moderadores, Admins ou Dono podem proclamar decretos.*');
      return iniciarFormulario(message);
    }

    if (texto === '!listar') {
      if (!ehEquipe(member)) return message.reply('🚫 *Apenas membros da Equipe ou superior podem consultar os anais.*');
      try {
        const dados = await lerGist();
        if (!dados.updates?.length) return message.reply('📜 *Os pergaminhos estão em branco, mortal.*');
        return responderTextoLongo(message, '📜 **ANAIS DO OLIMPO — Decretos Proclamados**\n━━━━━━━━━━━━━━━━━━━━━━━━━\n' + dados.updates.map((u, i) => `**#${i+1}** ⚔️ \`${u.versao}\` — ${u.titulo} *(${u.data})* ${u.imagem ? '🖼️' : ''}`).join('\n'), true);
      } catch { return message.reply('⚠️ *As brumas do Érebo ocultam os pergaminhos... Tente novamente.*'); }
    }

    if (texto.startsWith('!apagar')) {
      if (!ehAdmin(member)) return message.reply('🚫 *Apenas Admin ou Dono pode apagar decretos.*');
      const num = parseInt(texto.split(' ')[1]);
      if (isNaN(num)) return message.reply('⚠️ *Uso: `!apagar 2` — informe o número do decreto.*');
      try {
        const dados = await lerGist();
        const updates = dados.updates || [];
        if (num < 1 || num > updates.length) return message.reply(`⚠️ *Número inválido. Há ${updates.length} decreto(s).*`);
        const removido = updates.splice(num - 1, 1)[0];
        dados.updates = updates;
        await salvarGist(dados);
        return message.reply(`🗑️ **Decreto apagado:** \`${removido.versao}\` — ${removido.titulo}`);
      } catch { return message.reply('⚠️ *Erro ao apagar. Tente novamente.*'); }
    }

    if (texto.startsWith('!editar')) {
      if (!ehAdmin(member)) return message.reply('🚫 *Apenas Admin ou Dono pode editar decretos.*');
      const partes = texto.split(' ');
      const num    = parseInt(partes[1]);
      const campo  = partes[2]?.toLowerCase();
      const valor  = partes.slice(3).join(' ');
      const camposValidos = ['titulo', 'subtitulo', 'imagem', 'proximo'];
      if (isNaN(num) || !campo || !valor) return message.reply('⚠️ *Uso: `!editar 1 titulo Novo Título`*');
      if (!camposValidos.includes(campo)) return message.reply(`⚠️ *Campo inválido. Use: ${camposValidos.join(', ')}*`);
      try {
        const dados = await lerGist();
        const updates = dados.updates || [];
        if (num < 1 || num > updates.length) return message.reply(`⚠️ *Número inválido. Há ${updates.length} decreto(s).*`);
        if (campo === 'proximo') dados.proximaUpdate = valor;
        else updates[num - 1][campo] = valor;
        dados.updates = updates;
        await salvarGist(dados);
        return message.reply(`✏️ **Decreto #${num} atualizado!** Campo \`${campo}\` → ${valor}`);
      } catch { return message.reply('⚠️ *Erro ao editar. Tente novamente.*'); }
    }

    if (texto === '!ajuda') {
      const member = await getMember(message);
      const isDono   = ehDono(member);
      const isAdmin  = ehAdmin(member);
      const isMod    = ehMod(member);
      const isEquipe = ehEquipe(member);

      let msg = '🔱 **GRIMÓRIO DO OLIMPO — Poderes Disponíveis**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      msg += '👥 **Para todos os mortais**\n🐛 `/bug` · 💡 `/sugestao` · 🏆 `/rank` · 🎫 Tickets\n\n';
      if (isEquipe) msg += '🛡️ **Equipe+**\n🔑 `!token` · 📋 `!listar` · 🎫 `/ticket listar/assumir`\n\n';
      if (isMod) msg += '⚔️ **Moderadores+**\n📜 `!update` · 🗳️ `/enquete` · 🧹 `/limpar` · 📢 `/anunciar` · 🎫 `/ticket painel/fechar/resolver`\n\n';
      if (isAdmin) msg += '🔱 **Admins+**\n✏️ `!editar/!apagar` · 📜 `/changelog` · 🗺️ `/roadmap` · 🎁 `/gencodigo` · 🚫 `!revogar`\n\n';
      if (isDono) msg += '👑 **Dono**\nAcesso total ao painel do site\n\n';
      msg += '✨ **O Oráculo** — mencione o bot para consultar!\n';
      msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Logado como: ${isDono ? '👑 Dono' : isAdmin ? '🔱 Admin' : isMod ? '⚔️ Moderador' : isEquipe ? '🛡️ Equipe' : '👥 Mortal'}*`;
      return message.reply(msg);
    }
  }

  if (sessoes.has(message.author.id)) return processarEtapa(message);

  if (!ehComando && !mencionouBot) {
    if (t.includes('bug') || t.includes('erro') || t.includes('bugado')) {
      await message.reply('🐛 *Encontraste uma anomalia, mortal?*\nUse **`/bug`** para relatar com detalhes!');
    } else if (t.includes('quando sai') || t.includes('quando lança') || t.includes('proxima update') || t.includes('próxima update')) {
      try {
        const dados  = await lerGist();
        const previa = dados.proximaUpdate;
        if (previa) await message.reply(`🔮 *Os oráculos revelam...*\n\n**Próximo Decreto:** ${previa}`);
        else        await message.reply('🔮 *Os oráculos permanecem em silêncio sobre o próximo decreto...*');
      } catch { await message.reply('🔮 *As visões dos oráculos estão turvas no momento...*'); }
    } else if (t.includes('sugestão') || t.includes('sugestao') || t.includes('ideia')) {
      await message.reply('💡 *Tens uma visão para o Olimpo?*\nUse **`/sugestao`** para submeter tua ideia!');
    } else if (t.includes('wiki') || t.includes('guia')) {
      await message.reply('📖 *Buscas o conhecimento dos deuses?*\nConsulte a Wiki em: https://italozkv.github.io/tower-deep/wiki.html');
    } else if (t.includes('update') || t.includes('atualização') || t.includes('atualizacao')) {
      await message.reply('📜 *Buscas os decretos divinos?*\nVeja em: https://italozkv.github.io/tower-deep/changelog.html');
    } else if (t.includes('ajuda') || t.includes('como funciona') || t.includes('o que o bot faz')) {
      await message.reply('📖 *O Grimório do Olimpo está à tua disposição!*\n\n⚔️ `/bug` · 💡 `/sugestao` · 🏆 `/rank` · 🔑 `!token`\n\n*Ou me mencione diretamente para falar com o Oráculo!*');
    }
  }

  if (message.guild && !ehComando) {
    if (xpData.has(message.author.id)) xpData.get(message.author.id).username = message.author.username;
    const resultado = ganharXP(message.author.id);
    if (resultado?.subiu) {
      const embedUp = new EmbedBuilder()
        .setColor(CONFIG.CORES.AVISO).setTitle('⚡ ASCENSÃO DIVINA! ⚡')
        .setDescription(`${message.author} ascendeu para o título de **${resultado.nivel.nome}** (Nível ${resultado.nivel.nivel})!\n\n*Os deuses do Olimpo reconhecem tua dedicação, mortal.* 🔱`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true })).setTimestamp();
      if (resultado.nivel.imagem) embedUp.setImage(resultado.nivel.imagem);
      await message.channel.send({ content: `${message.author}`, embeds: [embedUp] });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// CANAIS DE VOZ TEMPORÁRIOS (TEMPLOS)
// ─────────────────────────────────────────────────────────────
client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.channelId === CONFIG.CANAL_CRIAR_TEMPLO) {
    const member = newState.member;
    try {
      const guild     = newState.guild;
      const novoCanal = await guild.channels.create({
        name: `🏛️ Templo de ${member.user.username}`,
        type: ChannelType.GuildVoice,
        parent: CONFIG.CATEGORIA_TEMPLOS || newState.channel.parentId,
        permissionOverwrites: [
          { id: guild.id,  allow: [PermissionFlagsBits.ViewChannel] },
          { id: member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers] },
        ],
      });
      await member.voice.setChannel(novoCanal);
      console.log(`🏛️ Templo criado para ${member.user.tag}: ${novoCanal.name}`);
    } catch (err) { console.error('Erro ao criar templo:', err.message); }
  }

  if (oldState.channelId && oldState.channelId !== CONFIG.CANAL_CRIAR_TEMPLO) {
    const canal = oldState.channel;
    if (canal && canal.name.startsWith('🏛️ Templo de') && canal.members.size === 0 && (canal.parentId === CONFIG.CATEGORIA_TEMPLOS || !CONFIG.CATEGORIA_TEMPLOS)) {
      try {
        await canal.delete('Olimpo apagou o templo vazio');
        console.log(`🗑️ Templo vazio removido: ${canal.name}`);
      } catch (err) { console.error('Erro ao apagar templo:', err.message); }
    }
  }
});

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
client.login(CONFIG.DISCORD_TOKEN);
