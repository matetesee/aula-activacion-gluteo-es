/* ===========================================================================
   quiz-dash.js — puente opcional entre este quiz y tu propio panel de
   analítica.

   QUÉ HACE
   Observa el DOM (".quiz-question" y "[data-answer]"/".quiz-option") y llama
   a window.bumTrack / window.bumAnswer, dos funciones que por defecto no
   existen (ver el stub en index.html). Si en algún momento agregás tu propio
   script de tracking que defina esas dos funciones — apuntando a tu propio
   dashboard — este archivo empieza a alimentarlo automáticamente, sin tocar
   el motor del quiz.

   Si nunca agregás ese script, este archivo simplemente no manda nada a
   ningún lado: no rompe nada ni depende de servicios externos.

   CÓMO FUNCIONA
   No llama ninguna función interna del quiz ni la parchea — solo mira:
       .quiz-question    el enunciado visible
       [data-answer]     el botón de respuesta (yes/no)
       #quizCard         el contenedor que se redibuja en cada paso
   Así que sigue funcionando aunque cambies la lógica interna del quiz.

   QUÉ MANDA
     bumTrack(pregunta, orden)              cuando el paso APARECE
     bumAnswer(pregunta, respuesta, orden)  cuando la persona responde

   El paso se marca al aparecer, no al hacer clic — si no, quien abre el
   quiz y lo abandona en la primera pantalla nunca entraría en la cuenta,
   y esa caída es justo lo que un panel de analítica necesita mostrar.

   Todo dentro de try/catch: el tracking nunca debe poder romper el quiz.
   =========================================================================== */
(function () {
  'use strict';

  var LIMITE = 60;          /* una etiqueta muy larga rompe tablas de panel */
  var etapas = {};          /* etiqueta -> orden, para no contar dos veces */
  var respuestas = {};      /* idem, por si hay doble clic */
  var orden = 0;

  function texto(el) {
    return ((el && (el.innerText || el.textContent)) || '').replace(/\s+/g, ' ').trim();
  }

  /* ── normalización de la etapa ────────────────────────────────────────
     Muchos backends de analítica rechazan tildes, comas, signos de
     interrogación y puntos suspensivos en campos usados como clave/label.
     Si tu dashboard es así, esta normalización evita que el evento se
     pierda en silencio (por ejemplo, si se manda con sendBeacon, que no
     reporta ningún error). Ajustá o quitá esta función si tu panel acepta
     texto libre con tildes. */
  var COM = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';
  var SEM = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN';

  function sinTilde(s) {
    if (s.normalize) {
      try { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    }
    var salida = '', c, i, j;
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      j = COM.indexOf(c);
      salida += (j === -1) ? c : SEM.charAt(j);
    }
    return salida;
  }

  /* Etiqueta de la ETAPA: sin tilde y sin puntuación problemática. */
  function etiqueta(s) {
    s = sinTilde(String(s))
      .replace(/[^A-Za-z0-9 .\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[.\s-]+$/, '')
      .trim();
    return s.length > LIMITE ? s.slice(0, LIMITE).trim() : s;
  }

  /* Etiqueta de la RESPUESTA: puede conservar tildes, solo se acorta. */
  function etiquetaRespuesta(s) {
    s = String(s).replace(/\s+/g, ' ').trim();
    return s.length > LIMITE ? s.slice(0, LIMITE).trim() : s;
  }

  function visible(el) {
    if (!el) return false;
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    var e = el;
    while (e && e !== document.body) {
      var c = window.getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden') return false;
      e = e.parentElement;
    }
    return true;
  }

  /* ── clave fija por pregunta ──────────────────────────────────────
     La etapa NO debería ser el enunciado truncado: si cambiás una coma en
     el copy, el enunciado cambia y tu panel abriría una etapa nueva,
     cortando el historial sin avisar.

     Estas claves fijas identifican cada paso por un fragmento estable del
     enunciado (no el texto completo), así sobreviven a reescrituras de
     copy. Ajustá estas expresiones si cambiás las preguntas del quiz.

     Cada clave lleva también su POSICIÓN fija en el embudo — no un
     contador que dependa del camino que hizo cada persona — para que dos
     visitas que saltean pasos distintos no le manden a tu panel el mismo
     paso con números de orden diferentes. */
  var CLAVES = [
    { re: /exclusiva para mujeres|sos mujer/i, clave: 'Es mujer', pos: 1 },
    { re: /gluteo quemar|quemar de verdad|muslo y la zona lumbar|muslo y la lumbar/i, clave: 'Donde quema', pos: 2 },
    { re: /secuencia simple|9 partes|nueve partes/i, clave: 'Quiere ver la secuencia', pos: 3 },
    { re: /te comprometes|comprometes a ver/i, clave: 'Compromiso', pos: 4 }
  ];
  var POS_VSL = 5;          /* la salida del quiz, siempre la última */
  var posiciones = { VSL: POS_VSL };

  function claveDe(texto) {
    var t = sinTilde(String(texto));
    for (var i = 0; i < CLAVES.length; i++) {
      if (CLAVES[i].re.test(t)) {
        posiciones[CLAVES[i].clave] = CLAVES[i].pos;
        return CLAVES[i].clave;
      }
    }
    return null;
  }

  /* Posición fija cuando la etapa es conocida; si no, cae al contador,
     que es el mejor cálculo posible para un paso que el puente no conoce. */
  function posicionDe(nombre, contador) {
    return posiciones[nombre] || contador;
  }

  /* El enunciado que está en pantalla ahora mismo. Algunos motores dejan
     pasos siguientes ocultos en el DOM, por eso se chequea visibilidad. */
  function preguntaActual() {
    var els = document.querySelectorAll('.quiz-question');
    for (var i = 0; i < els.length; i++) {
      if (visible(els[i])) {
        var t = texto(els[i]);
        if (t) return claveDe(t) || etiqueta(t);
      }
    }
    return null;
  }

  /* ── cola de espera del script de tracking ────────────────────────────
     Tu script de analítica (si lo agregás) es quien define bumTrack/
     bumAnswer, y puede no haber cargado todavía cuando aparece el primer
     paso. Sin cola, el evento más importante del embudo — el paso 1 — se
     perdería justo en las conexiones lentas, que son las que más
     abandonan. Por eso se guarda y se manda apenas la función exista. */
  var pendientes = [];
  var intentos = 0;

  function listo() {
    return typeof window.bumTrack === 'function' && typeof window.bumAnswer === 'function';
  }

  function vacia() {
    while (pendientes.length) {
      var f = pendientes.shift();
      try { f(); } catch (e) {}
    }
  }

  function espera() {
    if (listo()) { vacia(); return; }
    if (intentos++ > 40) { pendientes.length = 0; return; }  /* ~20s y desiste */
    setTimeout(espera, 500);
  }

  function envia(fn) {
    /* Solo manda directo si la cola está vacía. Si no, un evento nuevo
       adelantaría a los que esperan y tu panel recibiría el paso 3 antes
       que el 1. */
    if (listo() && !pendientes.length) { try { fn(); } catch (e) {} return; }
    pendientes.push(fn);
    if (listo()) { vacia(); return; }
    if (intentos === 0) espera();
  }

  function marcaEtapa(nombre) {
    if (!nombre || etapas[nombre]) return;
    var n = etapas[nombre] = posicionDe(nombre, ++orden);
    envia(function () { window.bumTrack(nombre, n); });
  }

  function marcaRespuesta(pregunta, respuesta) {
    if (!pregunta || !respuesta) return;
    var clave = pregunta + '|' + respuesta;
    if (respuestas[clave]) return;   /* doble clic antes de cambiar de pantalla */
    respuestas[clave] = true;
    var n = etapas[pregunta] || undefined;
    envia(function () { window.bumAnswer(pregunta, respuesta, n); });
  }

  /* ── respuesta ───────────────────────────────────────────────────────
     Delegado en document y en captura: el botón se recrea en cada paso, y
     el clic suele nacer en un <span> dentro de él. */
  document.addEventListener('click', function (ev) {
    try {
      var objetivo = ev.target;
      if (!objetivo || !objetivo.closest) return;
      var boton = objetivo.closest('[data-answer], .quiz-option');
      if (!boton) return;

      var pregunta = preguntaActual();
      var attr = boton.getAttribute('data-answer');

      /* SALIDA vs. RESPUESTA.
         Quien responde es un <button>; quien lleva a otra página es un
         <a href>. El link de salida suele envolver toda la tarjeta de la
         clase — si se tratara como respuesta, tu panel recibiría el texto
         de esa tarjeta en lugar de la respuesta real, y la salida hacia la
         VSL (la métrica que más importa al final del quiz) no se
         contaría. */
      var esSalida = boton.tagName === 'A' && boton.getAttribute('href');

      if (esSalida) {
        /* La respuesta de la pregunta actual se manda ANTES que la etapa
           VSL, a propósito: si la VSL fuera primero, tu panel recibiría
           el paso 5 antes que el 4 y marcaría el recorrido como
           desordenado. */
        if (attr) marcaRespuesta(pregunta, attr);
        marcaEtapa('VSL');
      } else {
        /* El texto del botón dice más que el yes/no del atributo: en un
           panel, "Siento más el muslo y la lumbar" es útil, "yes" no. */
        marcaRespuesta(pregunta, etiquetaRespuesta(texto(boton)) || attr);
      }
    } catch (e) {}
  }, true);

  /* ── etapa ───────────────────────────────────────────────────────────
     El motor redibuja #quizCard en cada paso; observarlo cubre cualquier
     motor sin depender de su lógica interna. Sin #quizCard, observa body. */
  function observa() {
    marcaEtapa(preguntaActual());
    var raiz = document.getElementById('quizCard') || document.body;
    if (!raiz || !window.MutationObserver) return;
    new MutationObserver(function () {
      marcaEtapa(preguntaActual());
    }).observe(raiz, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observa);
  } else {
    observa();
  }

  /* Para depurar en la consola. */
  window.bumQuizInfo = function () {
    return { etapas: etapas, respuestas: Object.keys(respuestas), actual: preguntaActual() };
  };
})();
