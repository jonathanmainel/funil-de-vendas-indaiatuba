# Funil de Vendas · Indaiatuba

Repositório da homologação de Indaiatuba. A URL prevista é https://jonathanmainel.github.io/funil-de-vendas-indaiatuba/.

## Publicação

Em Settings → Pages, selecione GitHub Actions. No environment `indaiatuba-build`, configure o secret `INDAIATUBA_MAKE_WEBHOOK_URL` e as variables `INDAIATUBA_META_PIXEL_ID` e `INDAIATUBA_PRIVACY_URL`. O perfil gera os arquivos em `dist-units/indaiatuba`, com base `/funil-de-vendas-indaiatuba/`. As configurações `VITE_*` são incorporadas ao site público. Mantenha credenciais privadas fora delas.

Na aba Actions, execute **Publicar quiz de Indaiatuba** na branch `main`. O workflow testa os dois perfis e publica o build de Indaiatuba após os testes. A execução registra o SHA da versão. O envio real de homologação é feito manualmente.

## Atualização

Crie uma branch neste repositório, faça as mudanças e rode `npm ci`, `npm test`, `npm test -- --mode indaiatuba` e `npm run build:indaiatuba`. Para o build local, copie `config/env/indaiatuba/.env.example` para `.env.local` na mesma pasta e preencha os valores da unidade. Após revisar e integrar as mudanças em `main`, acione o workflow manualmente e confira a URL e os assets.

## Rollback

Identifique o commit da última execução bem-sucedida em Actions. Reverta o commit ou os commits da atualização problemática em `main`, sem reescrever o histórico. Execute o workflow manualmente e confira o resultado. Se a atualização mudou configurações do environment, restaure também os valores correspondentes à versão validada. Para retirar do ar a primeira publicação, use Settings → Pages → Unpublish site neste repositório.
