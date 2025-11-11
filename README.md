# MedusaPay Mobile

Aplicativo Expo + React Native integrado ao ecossistema Medusa Pay. O fluxo agora protege as passkeys dos dashboards, evita vazamentos em dispositivos compartilhados e habilita configurações exigidas para publicar nas lojas da Apple e Google.

## Requisitos
- Node.js 18 ou superior
- Expo CLI (opcional) – `npm install -g expo-cli`
- Android Studio, Xcode ou dispositivo físico/Expo Go para testes

## Configuração
1. Copie o template e ajuste identificadores/bandeiras conforme o ambiente:
   ```bash
   cp .env.example .env
   ```
2. Instale as dependências: `npm install`
3. Rode em desenvolvimento: `npm run android`, `npm run ios` ou `npm run web`

> O `.env` deve conter somente valores públicos (bundle IDs, flags). As passkeys reais são inseridas pelo usuário dentro do app e ficam criptografadas via SecureStore – nunca commitadas ou salvas no Firestore.

## Segurança implementada
- **Passkeys protegidas localmente:** `AuthContext` removeu `secretKey`/`secondarySecretKey` do Firestore e passou a usar `expo-secure-store`. Logout ou invalidação de sessão apagam imediatamente as chaves do dispositivo.
- **Bloqueio de captura de tela na tela de Passkeys:** `SecretKeyScreen` ativa `usePreventScreenCapture`, reduzindo risco de exfiltração visual.
- **Preferências e notificações isoladas por usuário:** chaves do `AsyncStorage` agora incluem o UID do Firebase (`STORAGE_KEYS.preferences:${uid}` e `@medusa_read_notifications_v1:${uid}`), evitando que múltiplos logins compartilhem tokens, temas ou estado de leitura.
- **Push/Sync condicionados ao login:** registro de push tokens e sincronização remota apenas quando o usuário está autenticado. O modo “guest” mantém preferências locais, mas não envia nada ao backend.
- **Configuração pronta para produção:** `app.config.ts` define `bundleIdentifier`, `android.package`, descrição de uso das notificações e flag pública `EXPO_PUBLIC_ENABLE_ANALYTICS` para habilitar/desabilitar Firebase Analytics conforme o consentimento.

## Fluxo das passkeys
1. Usuário autentica com email/senha (Firebase Auth).
2. O app direciona para **“Informe suas Passkeys”** enquanto não houver chaves válidas no SecureStore.
3. As chaves abastecem `useDashboard`, mas são sempre exibidas mascaradas (prefixo + sufixo). Nenhuma requisição envia valores salvos em Firestore.
4. Ao sair da conta, SecureStore e preferências daquele UID são limpos; outro usuário no mesmo aparelho não acessa dados anteriores.

## Build para produção
1. Ajuste `.env` com os identificadores definitivos (`APP_BUNDLE_IDENTIFIER`, `APP_ANDROID_PACKAGE`) e configure certificados/perfis no EAS (`eas credentials`).
2. Só habilite `EXPO_PUBLIC_ENABLE_ANALYTICS=true` após coletar consentimento (LGPD). O Firebase Analytics permanece desativado por padrão.
3. Execute `eas build --platform android` e/ou `eas build --platform ios` usando os mesmos identificadores.
4. Teste em dispositivos reais:
   - Login, cadastro e edição de passkeys
   - Solicitação de saques e polling de vendas
   - Recebimento de push/local notifications
   - Logout garantindo limpeza das chaves e preferências

Com essas etapas, o app fica pronto para validação interna e envio às lojas – restando apenas rotacionar as passkeys oficiais diretamente com o time de backend e configurar o proxy seguro (quando disponível) antes da publicação.*** End Patch
