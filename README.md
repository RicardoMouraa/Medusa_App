# MedusaPay Mobile

Aplicativo mobile do ecossistema Medusa Pay, construido com Expo e React Native. Este documento foi escrito para que qualquer dev consiga instalar, configurar, rodar e publicar o app com seguranca.

## Sumario
- Visao geral
- Funcionalidades principais
- Stack e tecnologias
- Requisitos
- Setup rapido
- Como rodar localmente
- Variaveis de ambiente
- Configuracoes do Expo
- Integracoes e servicos
- Seguranca e privacidade
- Estrutura do projeto
- Padroes de codigo
- Scripts disponiveis
- Build e publicacao (EAS)
- Checklist de release
- Solucao de problemas
- Perguntas frequentes
- Suporte e responsaveis

## Visao geral
O app entrega acesso mobile ao painel Medusa Pay, com autenticacao, consulta de vendas/transacoes, solicitacao de saques e notificacoes. O fluxo de passkeys e dados sensiveis foi desenhado para evitar persistencia indevida em banco remoto.

## Funcionalidades principais
- Login, cadastro e recuperacao de senha.
- Onboarding de passkeys com salvamento local seguro.
- Dashboard com indicadores de saldo e vendas.
- Listagem e detalhes de transacoes/pedidos.
- Solicitacao de saques e historico financeiro.
- Perfil, preferencias e configuracoes do usuario.
- Notificacoes para eventos relevantes.

## Stack e tecnologias
- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript (strict)
- Firebase (Auth, Firestore, Analytics opcional)
- Expo Notifications, Secure Store e Screen Capture

## Requisitos
- Node.js 18 ou superior
- NPM 9+ (ou outro gerenciador compativel)
- Expo CLI (opcional, pode usar `npx expo`)
- Android Studio (Android) ou Xcode (iOS)
- Conta Apple Developer e Google Play Console para publicacao

## Setup rapido
```bash
npm install
Copy-Item .env.example .env
npm run start
```

## Como rodar localmente
1. Instale as dependencias:
   ```bash
   npm install
   ```
2. Crie o arquivo de ambiente:
   ```bash
   # macOS/Linux
   cp .env.example .env

   # Windows PowerShell
   Copy-Item .env.example .env
   ```
3. Inicie o servidor Expo:
   ```bash
   npm run start
   ```
4. Para abrir diretamente:
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

Observacoes:
- Para testes rapidos, use o Expo Go no dispositivo.
- Para recursos nativos especificos ou push notifications em producao, utilize build de desenvolvimento (EAS) ou build release.

## Variaveis de ambiente
Este projeto usa `.env` apenas para valores publicos.

Arquivo: `.env`
- `EXPO_PUBLIC_ENABLE_ANALYTICS` (true|false): habilita Firebase Analytics.
- `APP_BUNDLE_IDENTIFIER`: bundle id iOS (ex: `com.medusapay.app`).
- `APP_ANDROID_PACKAGE`: package Android (ex: `com.medusapay.app`).

## Configuracoes do Expo
Arquivo: `app.config.ts`
- `name`, `slug` e `version`.
- `ios.bundleIdentifier` e `android.package`.
- `splash`, `icon` e `adaptiveIcon`.
- Permissoes Android e descricao de notificacoes no iOS.
- `extra.enableFirebaseAnalytics` controlado por `EXPO_PUBLIC_ENABLE_ANALYTICS`.

## Integracoes e servicos
- Firebase: configurado em `src/services/firebase.ts` com Auth e Firestore. Analytics pode ser habilitado via `EXPO_PUBLIC_ENABLE_ANALYTICS=true`.
- Medusa Pay API: base URL definida em `src/services/medusaApi.ts` (constante `BASE_URL`).
- Notificacoes: `expo-notifications` com permissao declarada em `app.config.ts`.

Se for necessario trocar o projeto Firebase (ambiente do cliente, staging, etc.), atualize o objeto de configuracao em `src/services/firebase.ts`.

## Seguranca e privacidade
- Passkeys armazenadas localmente via `expo-secure-store`, nao salvas em Firestore.
- Bloqueio de captura de tela na tela de passkeys.
- Preferencias e notificacoes isoladas por usuario no `AsyncStorage`.
- Logout limpa chaves locais e preferencias do usuario.

## Estrutura do projeto
- `App.tsx`: ponto de entrada do app.
- `app.config.ts`: configuracoes do Expo, bundle ids e plugins.
- `src/screens`: telas do app (auth, home, orders, finance, profile, settings).
- `src/navigation`: navegacao e rotas.
- `src/context`: contextos globais (auth, preferencias, notificacoes).
- `src/services`: integracoes (Firebase, API Medusa Pay).
- `src/hooks`: hooks customizados.
- `src/components`: componentes reutilizaveis.
- `assets`: imagens e icones.

## Padroes de codigo
- TypeScript em modo `strict`.
- Alias de importacao: `@/*` mapeado para `src/*`.
- Nao ha lint/formatter configurado por padrao.

## Scripts disponiveis
- `npm run start`: inicia o Metro Bundler.
- `npm run android`: abre no Android.
- `npm run ios`: abre no iOS (somente macOS).
- `npm run web`: abre no navegador.

## Build e publicacao (EAS)
1. Instale o EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Autentique:
   ```bash
   eas login
   ```
3. Ajuste o `.env` com os identificadores finais.
4. Gere os builds:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```
5. (Opcional) Envie para as lojas:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

Se precisar de perfis de build ou ambientes, crie um `eas.json` conforme a documentacao oficial do Expo.

### Fluxo recomendado para update iOS (Apple Store)
Base atual publicada:
- Tag de baseline: `v1.0.0-ios-live`

Passo a passo para cada nova release:
1. Garanta branch limpa e sincronizada:
   ```bash
   git status
   git pull
   ```
2. Suba a versao de marketing (App Store) com SemVer:
   ```bash
   npm run version:patch
   # ou npm run version:minor
   # ou npm run version:major
   ```
3. Gere o build iOS de producao:
   ```bash
   npm run release:ios:build
   ```
4. Envie o ultimo build para o App Store Connect:
   ```bash
   npm run release:ios:submit
   ```

Notas importantes:
- `app.config.ts` usa a versao do `package.json`, evitando versoes diferentes em arquivos distintos.
- `eas.json` esta com `appVersionSource: "remote"` e `production.autoIncrement: true`, entao o `buildNumber` sobe automaticamente a cada build de producao.
- Sempre rode os testes essenciais antes de buildar e publicar.

## Checklist de release
- Bundle ID e package finais configurados no `.env`.
- Icones e splash atualizados em `assets`.
- Firebase configurado para o ambiente correto.
- Analytics somente com consentimento (LGPD).
- Teste de login, cadastro, passkeys, saques e transacoes.
- Validacao de notificacoes em dispositivo real.
- Versao do app atualizada (via `npm run version:patch|minor|major`).

## Solucao de problemas
- Metro travado: rode `npx expo start --clear`.
- Android nao abre: confirme se o emulador esta ativo no Android Studio.
- iOS: builds so funcionam em macOS com Xcode.
- Push notifications: use dispositivo real para validar.

## Perguntas frequentes
- Posso rodar no Expo Go? Sim, para fluxo basico. Para push em producao, use build nativo.
- Onde troco a URL da API? Em `src/services/medusaApi.ts` (constante `BASE_URL`).
- Como limpo o cache do bundler? `npx expo start --clear`.

## Suporte e responsaveis
Preencha com os contatos oficiais do projeto antes de enviar ao cliente:
- Produto/Cliente: [nome e contato]
- Backend/Infra: [nome e contato]
- Mobile: [nome e contato]
