# Aula Activación Glúteo — versión en español

Clon traducido al español del funnel original en portugués (`bumbum-pessego.com`):
quiz interactivo → página de VSL (video de ventas) → checkout externo (Hotmart).

## Estructura

```
public/
  index.html          Quiz interactivo (página de inicio)
  vsl/index.html       Página de la VSL (video + bio del experto + referencias)
  rescate/index.html   Página de "última oportunidad" (regalo + cupón + oferta completa)
  privacidad.html       Política de privacidad
  terminos.html         Términos de uso
  assets/
    murilo-avatar.png   Foto pequeña usada en el header del quiz y comentarios
    quiz-dash.js         Puente opcional para conectar el quiz a un panel de analítica propio
  assets-global/
    murilo-perfil.png   Foto grande del experto usada en la VSL
server.js               Servidor Express que sirve /public (listo para Railway)
package.json
railway.json            Config explícita de build/deploy para Railway
```

## Qué se tradujo y qué se dejó igual

- **Todo el texto visible** (preguntas del quiz, comentarios, testimonios,
  textos legales, bio del experto) está traducido al español.
- **El video de la VSL sigue en portugués.** Está incrustado desde VTurb
  (`vturb-smartplayer`) y no se puede doblar ni traducir automáticamente.
  Cuando tengas tu propio video en español, subilo a tu cuenta de VTurb (o al
  hosting que prefieras) y reemplazá el id del player en
  `public/vsl/index.html` (buscá `6a11b52478ec206077d302af`).
- **El nombre "Murilo Herbst" y su matrícula (CREF 147533-G/SP)** se dejaron
  igual, a pedido explícito. El CREF es una matrícula profesional específica
  de Brasil — si vas a operar en otro país, puede convenir aclarar o quitar
  ese dato.
- **Los IDs de tracking (Google Tag Manager, Microsoft Clarity, UTMify Pixel)
  se dejaron como placeholders** (`GTM-XXXXXXX`, `XXXXXXXXXX`,
  `TU_PIXEL_ID_UTMIFY`). Buscá `EDITME` en los archivos HTML para encontrar
  cada lugar donde tenés que poner tus propios IDs.
- **El botón "Quiero mi acceso ahora" debajo del video** (`public/vsl/index.html`,
  buscá `TU_LINK_DE_CHECKOUT`) es nuestro, vive en este archivo y está en
  español — reemplazá el href por tu link de checkout real antes de mandar
  tráfico. El propio reproductor de VTurb también trae su encabezado y su
  botón final ("QUERO EMPINAR O BUMBUM") en portugués, apuntando al checkout
  de Hotmart del video ORIGINAL — eso NO se puede editar desde este repo,
  solo desde la cuenta de VTurb/ConverteAI dueña de ese player (ver más
  abajo).
- **El script que mandaba eventos a un dashboard de terceros
  (`dash.scalers-infra.com`) se quitó.** Se mantiene `assets/quiz-dash.js`,
  que observa el quiz y llama a `window.bumTrack`/`window.bumAnswer` — esas
  funciones no hacen nada por defecto. Si más adelante conectás tu propio
  panel de analítica, agregá el script que las defina (ver el comentario
  `EDITME` en `public/index.html`) y el tracking va a empezar a funcionar
  solo.
- **El contacto por email** se dejó como `contacto@tudominio.com` (antes
  usaba la ofuscación de emails de Cloudflare, que solo funciona en sitios
  detrás de Cloudflare). Reemplazalo por tu email real en:
  `public/index.html`, `public/vsl/index.html`, `public/privacidad.html`,
  `public/terminos.html`.
- **Los textos legales de privacidad/términos** están traducidos pero tienen
  referencias específicas a la ley brasileña (LGPD) genéricadas o marcadas
  con `EDITME`. Revisalos con un asesor legal antes de publicar,
  especialmente si vendés a varios países.

## Página de rescate (`/rescate/`)

Cuando alguien intenta salir del quiz o de la VSL antes de tiempo (botón
atrás, cerrar pestaña, mouse hacia el borde superior), el script de
"back-redirect" lo manda a `/rescate/`: una página de última oportunidad con
una caja de regalo animada que revela un cupón de descuento (35% OFF) y el
detalle completo de la oferta (BumbumFlix + 6 bonos), traducida del original.

- **Los dos botones de compra de esta página** (`public/rescate/index.html`,
  buscá `TU_LINK_DE_CHECKOUT_DESCUENTO`) apuntan a un placeholder — confirmá
  primero si la oferta original de Hotmart (con el código de descuento) sigue
  activa a tu nombre antes de poner el link real.
- El código de cupón que se muestra ("BUMBUM50") es solo texto decorativo en
  esta página; no está conectado a ningún sistema de cupones real. Si querés
  que el descuento se aplique de verdad, tenés que configurarlo del lado de
  tu pasarela de pago (Hotmart u otra) y, si querés, actualizar este texto
  para que coincida.
- `public/rescate/script.js` guarda el progreso en `localStorage` del
  navegador (si la persona vuelve a entrar, ve el cupón ya abierto).

## Correr en local

```bash
npm install
npm start
```

Abrí `http://localhost:3000`.

## Desplegar en Railway

1. Subí este repo a GitHub (o conectá el repo local con `railway up`).
2. En Railway: **New Project → Deploy from GitHub repo**, elegí este repo.
3. Railway detecta `package.json` y usa `npm start` automáticamente
   (confirmado también en `railway.json`).
4. No hace falta configurar ninguna variable de entorno para que funcione;
   `PORT` lo define Railway automáticamente.
5. Antes de mandar tráfico real, completá todos los `EDITME` (tracking IDs,
   email de contacto, video de la VSL si ya tenés uno en español).
