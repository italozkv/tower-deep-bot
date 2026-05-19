# Tower Deep Bot

Bot do Discord oficial do projeto **Tower Deep**, focado em comunidade, suporte, onboarding, anuncios e integracao com o ecossistema do jogo/site.

<p align="center">
  <a href="https://github.com/italozkv">
    <img src="https://img.shields.io/badge/GitHub-italozkv-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <a href="mailto:ithalovinicius019@gmail.com">
    <img src="https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
  </a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js">
  <img src="https://img.shields.io/badge/Platform-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
</p>

O projeto foi feito em **Node.js** com **discord.js v14** e centraliza recursos como:

- changelog e roadmap sincronizados com **GitHub Gist**
- sistema de **XP, rank e perfil**
- **tickets** de suporte com painel, fechamento e avaliacao
- **onboarding** de novos membros com vinculo Roblox
- **sorteios**, **enquetes**, **lembretes** e **anuncios**
- **codigos de resgate** e API HTTP para integracao com o jogo/site
- resposta com IA do "**Oraculo**" via mencao ao bot

## Visao geral

Este repositorio concentra o bot da comunidade do Tower Deep com foco em automacao real para servidor, suporte aos jogadores, ligacao com Roblox e apoio ao site do projeto.

Se voce cair aqui pelo perfil do autor, este projeto representa bem o tipo de coisa que ele costuma construir:

- bots do Discord com sistemas personalizados
- sites e ferramentas conectadas ao mesmo ecossistema
- projetos de jogo no Roblox com integracoes externas
- automacoes pensadas para uso real no dia a dia

## Funcionalidades

### Comunidade

- `/bug` e `/sugestao` para feedback dos jogadores
- `/rank`, `/perfil` e `/stats` para progresso e atividade
- sistema de XP por mensagens e bonus por acoes especificas
- `/lembrete` com envio por DM

### Staff e moderacao

- `!update`, `!listar`, `!editar`, `!apagar` para changelog legado
- `/changelog` e `/roadmap` para gerenciar conteudo do site
- `/anuncio` para publicar ou agendar anuncios
- `/enquete` para votacao com encerramento automatico
- `/sorteio` para criar, encerrar, cancelar e ressortear
- `/ticket` para painel, atendimento e controle de chamados
- `/limpar` para moderacao de mensagens

### Roblox e site

- `/vincular`, `/verificar` e `/minhaconta`
- geracao e controle de **tokens temporarios** para acesso ao site
- geracao e gestao de **codigos de resgate**
- endpoints HTTP para validar token, revogar token e resgatar codigo no jogo

## Stack

- Node.js `>= 18`
- `discord.js` `^14.14.1`
- API do Discord
- API do GitHub Gist
- API publica do Roblox
- API da xAI/Grok para o Oraculo

### Tecnologias

<p>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js">
  <img src="https://img.shields.io/badge/GitHub%20Gist-121013?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Gist">
  <img src="https://img.shields.io/badge/Roblox-000000?style=for-the-badge&logo=roblox&logoColor=white" alt="Roblox">
  <img src="https://img.shields.io/badge/HTTP%20API-4A90E2?style=for-the-badge" alt="HTTP API">
</p>

## Estrutura

```text
BotDiscord/
|- bot.js
|- package.json
`- README.md
```

Observacao: o bot tambem tenta ler arquivos Lua do projeto principal em `../ReplicatedStorage/Modules/Config/` para montar automaticamente parte do catalogo de recompensas.

## Requisitos

Antes de rodar, voce precisa ter:

- um bot criado no Discord Developer Portal
- token do bot com permissoes adequadas no servidor
- um `GITHUB_TOKEN` com acesso para editar o Gist usado pelo site
- pelo menos um `GIST_ID` configurado
- Node.js 18 ou superior

## Instalacao

```bash
npm install
npm start
```

O `package.json` ja expoe o script:

```bash
npm start
```

## Variaveis de ambiente

### Obrigatorias

```env
DISCORD_TOKEN=seu_token_do_discord
GITHUB_TOKEN=seu_token_do_github
GIST_ID=id_do_gist_principal
```

### Recomendadas

```env
GIST_ROADMAP_ID=id_do_gist_do_roadmap
CANAL_ID=id_do_canal_de_updates
CANAL_ANUNCIO_ID=id_do_canal_de_anuncios
CANAL_BUGS_ID=id_do_canal_de_bugs

GROK_KEY=sua_chave_da_ia

CARGO_DONO=id_cargo_dono
CARGO_ADMIN=id_cargo_admin
CARGO_MOD=id_cargo_mod
CARGO_EQUIPE=id_cargo_equipe
CARGO_MEMBRO=id_cargo_membro
CARGO_VERIFICADO=id_cargo_verificado
CARGO_PENDENTE=id_cargo_pendente

CANAL_CRIAR_TEMPLO=id_canal_criar_templo_voz
CATEGORIA_TEMPLOS=id_categoria_dos_canais_voz
CATEGORIA_TICKETS=id_categoria_dos_tickets
CANAL_LOG_TICKETS=id_canal_log_tickets

CANAL_CODIGOS=id_canal_de_codigos
CANAL_CADASTRO=id_canal_de_cadastro
CANAL_LOG_CADASTRO=id_canal_log_cadastro

ROBLOX_API_SECRET=segredo_compartilhado_com_o_jogo
PORT=3000
```

### Observacoes importantes

- `GIST_ROADMAP_ID` usa `GIST_ID` como fallback se nao for definido.
- `CARGO_MEMBRO` possui valor padrao no codigo, mas o ideal e configurar explicitamente.
- `GROK_KEY` e opcional. Sem ela, o Oraculo por IA fica desativado.
- `PORT` e usado pelo servidor HTTP embutido.

## Persistencia de dados

Grande parte dos dados e salva em arquivos JSON dentro do **GitHub Gist** configurado, incluindo:

- `tower-deep-updates.json`
- `tower-deep-roadmap.json`
- `xp-data.json`
- `enquetes.json`
- `codigos.json`
- `vinculos.json`
- `cadastros.json`
- `tickets.json`
- `anuncios-agendados.json`

Isso facilita deploy em ambientes stateless, como Railway.

## Principais comandos

### Publico geral

- `/bug`
- `/sugestao`
- `/rank`
- `/perfil`
- `/stats jogador`
- `/lembrete`
- `/vincular`
- `/verificar`
- `/minhaconta`
- `/ajuda`

### Staff

- `/ticket painel|listar|assumir|resolver|fechar`
- `/sorteio criar|encerrar|cancelar|listar|resorteio`
- `/anuncio agora|agendar|listar|cancelar`
- `/enquete criar|encerrar|listar`
- `/xpbonus`
- `!token`
- `!revogar`

### Admin

- `/changelog listar|apagar|editar|imagem`
- `/roadmap adicionar|item|concluir|status`
- `/gencodigo`
- `/codigo listar|desativar|info`
- `/itemcadastrar`
- `/itemlistar`
- `!editar`
- `!apagar`

## Endpoints HTTP

O processo tambem sobe um servidor HTTP na porta definida por `PORT`.

### Saude e diagnostico

- `GET /` retorna status basico
- `GET /diagnostico` valida canais configurados e anuncios pendentes

### Tokens

- `POST /validar-token`
- `GET /tokens`
- `POST /revogar-token`
- `POST /revogar-todos`
- `POST /limpar-expirados`

### Roblox

- `POST /roblox/resgatar`
- `GET /roblox/vinculo/:robloxId`

## Deploy

O bot parece ter sido pensado para ambientes como **Railway**, mas funciona em qualquer host Node.js com:

- processo persistente
- variaveis de ambiente configuradas
- acesso de rede as APIs externas

Fluxo recomendado:

1. configurar as variaveis de ambiente
2. rodar `npm install`
3. iniciar com `npm start`
4. conferir os logs do `ready` para validar canais, cargos e integracoes

## Highlights do projeto

- bot multifuncional para Discord com comandos slash e comandos prefixados
- integracao com **GitHub Gist** para armazenar changelog, roadmap, XP e outros dados
- onboarding com formulario, cargos e vinculacao com conta Roblox
- API HTTP embutida para tokens e resgate de codigos no jogo
- suporte a anuncios, tickets, sorteios, enquetes e sistema de perfil/rank

## Permissoes do bot

Alem dos intents ja usados no codigo, o bot precisa de permissoes compativeis com os recursos que oferece, como:

- ver canais
- enviar mensagens
- gerenciar mensagens
- gerenciar cargos
- criar e apagar canais
- usar comandos slash
- adicionar reacoes
- gerenciar permissoes de canais

## Observacoes

- Os slash commands sao registrados automaticamente no `ready`.
- O sistema mistura comandos slash e comandos prefixados com `!`.
- Sem as variaveis corretas de cargos e canais, varias funcoes continuam subindo, mas ficam incompletas.
- O canal de codigos (`CANAL_CODIGOS`) e usado para publicar codigos gerados.
- O catalogo de recompensas pode ser enriquecido automaticamente se os arquivos Lua do projeto principal existirem nos caminhos esperados.

## Autor

Desenvolvido por **Ithalo**.

- GitHub: `https://github.com/italozkv`
- Email: `ithalovinicius019@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/ithalo-zk/`

## Licenca

Se quiser publicar este projeto, vale adicionar uma licenca (`MIT`, por exemplo) conforme a forma como voce pretende distribuir o codigo.
