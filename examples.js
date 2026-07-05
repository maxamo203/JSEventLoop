// All examples as step-snapshot arrays.
// Each step describes the COMPLETE state of every column at that moment.
// Fields: activeLine (0-based), description,
//         callStack[], webApis[], taskQueue[], microtaskQueue[], renderQueue[], output[]
// Item shape: { label, type, executing?, blocked?, warning? }
//
// Conventions to keep the Call Stack consistent across examples:
//   • Every function call gets a PUSH step (executing:true on top) and a POP step.
//   • console.log is shown as its own frame pushed on top, then popped.
//   • Async registrations (setTimeout/fetch/requestAnimationFrame/addEventListener)
//     first place their pending work in the Web APIs column, NOT directly in a queue.
//   • The browser later MOVES the work from Web APIs into the correct queue.

window.EXAMPLES = [

  // ── Example 1: Synchronous code ──────────────────────────────────────────
  {
    id: 'sync',
    title: 'Ejemplo 1 — Código Sincrónico',
    description: 'El Call Stack es el único actor. Las funciones se apilan al llamarse (LIFO) y se desapilan al retornar. No hay Web APIs ni colas involucradas.',
    showIO: false,
    code: `function saludar(nombre) {
  console.log('Hola, ' + nombre);
}

function main() {
  saludar('Ana');
  saludar('Luis');
}

main();`,
    steps: [
      {
        activeLine: 9, description: 'main() se llama desde el script global. Se apila en el Call Stack.',
        callStack: [{ label: 'main()', type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 5, description: 'Dentro de main(), se llama saludar("Ana"). Se apila ENCIMA de main().',
        callStack: [{ label: 'saludar("Ana")', type: 'callstack', executing: true }, { label: 'main()', type: 'callstack' }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 1, description: 'saludar llama a console.log(...). Otro frame se apila encima.',
        callStack: [{ label: "console.log('Hola, Ana')", type: 'callstack', executing: true }, { label: 'saludar("Ana")', type: 'callstack' }, { label: 'main()', type: 'callstack' }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 1, description: 'console.log imprime "Hola, Ana" y retorna. Su frame se desapila.',
        callStack: [{ label: 'saludar("Ana")', type: 'callstack', executing: true }, { label: 'main()', type: 'callstack' }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['Hola, Ana']
      },
      {
        activeLine: 5, description: 'saludar("Ana") termina y retorna. Su frame se desapila. Volvemos a main().',
        callStack: [{ label: 'main()', type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['Hola, Ana']
      },
      {
        activeLine: 6, description: 'main() llama a saludar("Luis"). Se apila encima de main() (igual que con Ana).',
        callStack: [{ label: 'saludar("Luis")', type: 'callstack', executing: true }, { label: 'main()', type: 'callstack' }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['Hola, Ana']
      },
      {
        activeLine: 1, description: 'saludar llama a console.log(...). Frame apilado encima.',
        callStack: [{ label: "console.log('Hola, Luis')", type: 'callstack', executing: true }, { label: 'saludar("Luis")', type: 'callstack' }, { label: 'main()', type: 'callstack' }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['Hola, Ana']
      },
      {
        activeLine: 1, description: 'console.log imprime "Hola, Luis" y retorna. Frame desapilado.',
        callStack: [{ label: 'saludar("Luis")', type: 'callstack', executing: true }, { label: 'main()', type: 'callstack' }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['Hola, Ana', 'Hola, Luis']
      },
      {
        activeLine: 6, description: 'saludar("Luis") retorna. Frame desapilado. Volvemos a main().',
        callStack: [{ label: 'main()', type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['Hola, Ana', 'Hola, Luis']
      },
      {
        activeLine: 9, description: 'main() retorna. Call Stack vacío. Programa terminado.',
        callStack: [],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['Hola, Ana', 'Hola, Luis']
      }
    ]
  },

  // ── Example 2: Heavy sync (blocks render) ────────────────────────────────
  {
    id: 'heavy-sync',
    title: 'Ejemplo 2 — Trabajo Sincrónico Pesado (Bloqueo)',
    description: 'Un loop largo ocupa el Call Stack. Mientras esté ocupado, el Event Loop no puede procesar renders ni eventos de UI: la página se congela.',
    showIO: false,
    code: `button.addEventListener('click', () => {
  console.log('me clickearon');
});

console.log('Inicio');

// Loop pesado: bloquea ~2 segundos
for (let i = 0; i < 1e9; i++) {
  // trabajo intensivo
}

console.log('Fin');`,
    steps: [
      {
        activeLine: 0, description: 'addEventListener registra el listener "click" en las Web APIs. Queda esperando al usuario.',
        callStack: [{ label: 'button.addEventListener(...)', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        taskQueue: [], uiQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 4, description: 'console.log("Inicio") se apila y ejecuta.',
        callStack: [{ label: "console.log('Inicio')", type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        taskQueue: [], uiQueue: [], microtaskQueue: [], renderQueue: [], output: ['Inicio']
      },
      {
        activeLine: 7, description: 'El for-loop comienza a ejecutarse en el Call Stack. Ocupará ~2 segundos reales.',
        callStack: [{ label: 'for (i = 0 … 1e9)', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        taskQueue: [], uiQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '⛔ Render bloqueado', type: 'render', blocked: true }],
        output: ['Inicio']
      },
      {
        activeLine: 7, description: '🖱 El usuario hace click. El navegador encola el handler en la UI Event Queue… pero NO puede ejecutarse: el Call Stack está ocupado.',
        callStack: [{ label: 'for (i ≈ 500M…)', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [{ label: '🖱 click → handler() (esperando)', type: 'ui', blocked: true }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '⛔ Render bloqueado', type: 'render', blocked: true }],
        output: ['Inicio']
      },
      {
        activeLine: 7, description: 'El loop sigue. La UI está congelada: el click NO responde y la pantalla no se repinta.',
        callStack: [{ label: 'for (i ≈ 900M…)', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [{ label: '🖱 click → handler() (esperando)', type: 'ui', blocked: true }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '⛔ Render bloqueado', type: 'render', blocked: true }],
        output: ['Inicio']
      },
      {
        activeLine: 7, description: 'El loop termina y se desapila. El Call Stack queda libre.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [{ label: '🖱 click → handler()', type: 'ui' }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Frame listo', type: 'render' }],
        output: ['Inicio']
      },
      {
        activeLine: 11, description: 'console.log("Fin") se apila y ejecuta.',
        callStack: [{ label: "console.log('Fin')", type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [{ label: '🖱 click → handler()', type: 'ui' }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Frame listo', type: 'render' }],
        output: ['Inicio', 'Fin']
      },
      {
        activeLine: 11, description: '"Fin" impreso. Script terminado. AHORA el Event Loop puede atender lo acumulado, empezando por el UI event.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [{ label: '🖱 click → handler()', type: 'ui' }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Frame listo', type: 'render' }],
        output: ['Inicio', 'Fin']
      },
      {
        activeLine: 1, description: 'El Event Loop CONSUME el UI event: handler() se apila y ejecuta. El click acumulado por fin responde.',
        callStack: [{ label: "console.log('me clickearon')", type: 'callstack', executing: true }, { label: 'handler()', type: 'callstack' }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Frame listo', type: 'render' }],
        output: ['Inicio', 'Fin', 'me clickearon']
      },
      {
        activeLine: 0, description: 'handler() retorna. UI Event Queue vacía. El navegador CONSUME la fase de render y repinta el frame.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando frame…', type: 'render', executing: true }],
        output: ['Inicio', 'Fin', 'me clickearon']
      },
      {
        activeLine: 0, description: 'Frame pintado. Todo vacío. Moraleja: el trabajo sincrónico pesado retrasó render Y eventos de UI.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [],
        output: ['Inicio', 'Fin', 'me clickearon']
      }
    ]
  },

  // ── Example 3: setTimeout vs Promise (priority) ───────────────────────────
  {
    id: 'priority',
    title: 'Ejemplo 3 — setTimeout vs Promise (Prioridad)',
    description: 'setTimeout registra un timer en las Web APIs (su callback termina en la Task Queue); Promise.then encola directo en la Microtask Queue. Las microtareas SIEMPRE se ejecutan antes que las tareas, sin importar el orden de registro.',
    showIO: false,
    code: `console.log('inicio');

setTimeout(() => console.log('timeout'), 0);

Promise.resolve()
  .then(() => console.log('promise'));

console.log('fin');`,
    steps: [
      {
        activeLine: 0, description: 'console.log("inicio") se ejecuta.',
        callStack: [{ label: "console.log('inicio')", type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 0, description: '"inicio" impreso.',
        callStack: [],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['inicio']
      },
      {
        activeLine: 2, description: 'setTimeout() registra un timer en las Web APIs.',
        callStack: [{ label: 'setTimeout(cb, 0)', type: 'callstack', executing: true }],
        webApis: [{ label: '⏱ Timer 0ms → cb', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['inicio']
      },
      {
        activeLine: 2, description: 'El timer vence y el navegador mueve el callback a la Task Queue.',
        callStack: [],
        webApis: [],
        taskQueue: [{ label: "cb: console.log('timeout')", type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: ['inicio']
      },
      {
        activeLine: 4, description: 'Promise.resolve().then(cb): encola cb directo en la Microtask Queue.',
        callStack: [{ label: 'Promise.resolve().then(cb)', type: 'callstack', executing: true }],
        webApis: [],
        taskQueue: [{ label: "cb: console.log('timeout')", type: 'task' }],
        microtaskQueue: [{ label: "cb: console.log('promise')", type: 'microtask' }],
        renderQueue: [], output: ['inicio']
      },
      {
        activeLine: 7, description: 'console.log("fin") se ejecuta sincrónicamente.',
        callStack: [{ label: "console.log('fin')", type: 'callstack', executing: true }],
        webApis: [],
        taskQueue: [{ label: "cb: console.log('timeout')", type: 'task' }],
        microtaskQueue: [{ label: "cb: console.log('promise')", type: 'microtask' }],
        renderQueue: [], output: ['inicio']
      },
      {
        activeLine: 7, description: '"fin" impreso. Call Stack vacío. Hay una tarea Y una microtarea esperando. ¿Cuál primero?',
        callStack: [],
        webApis: [],
        taskQueue: [{ label: "cb: console.log('timeout')", type: 'task' }],
        microtaskQueue: [{ label: "cb: console.log('promise')", type: 'microtask' }],
        renderQueue: [], output: ['inicio', 'fin']
      },
      {
        activeLine: 5, description: '⚡ La Microtask Queue se drena PRIMERO. El callback de Promise se apila y ejecuta.',
        callStack: [{ label: "cb: console.log('promise')", type: 'callstack', executing: true }],
        webApis: [],
        taskQueue: [{ label: "cb: console.log('timeout')", type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: ['inicio', 'fin']
      },
      {
        activeLine: 5, description: '"promise" impreso. Microtask Queue vacía. Recién ahora el Event Loop mira la Task Queue.',
        callStack: [],
        webApis: [],
        taskQueue: [{ label: "cb: console.log('timeout')", type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: ['inicio', 'fin', 'promise']
      },
      {
        activeLine: 2, description: 'El Event Loop toma la tarea de setTimeout. Se apila y ejecuta.',
        callStack: [{ label: "cb: console.log('timeout')", type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['inicio', 'fin', 'promise']
      },
      {
        activeLine: 2, description: '"timeout" impreso. Fin. Orden final: inicio → fin → promise → timeout.',
        callStack: [],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['inicio', 'fin', 'promise', 'timeout']
      }
    ]
  },

  // ── Example 4: UI Events + setTimeout + Promise (full picture) ────────────
  {
    id: 'combined',
    title: 'Ejemplo 4 — UI Event + setTimeout + Promise (Panorama Completo)',
    description: 'El click es un macrotask que entra a la UI Event Queue. Dentro del handler se generan un setTimeout (Task Queue) y un Promise (Microtask Queue). Observa el orden de consumo: microtasks → resto de macrotasks → render.',
    showIO: false,
    code: `button.addEventListener('click', () => {
  console.log('handler');

  setTimeout(() => {
    console.log('setTimeout');
  }, 0);

  Promise.resolve()
    .then(() => console.log('promise'));

  console.log('fin handler');
});`,
    steps: [
      {
        activeLine: 0, description: 'addEventListener registra el listener "click" en las Web APIs. Queda a la espera del usuario.',
        callStack: [{ label: 'button.addEventListener(...)', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 0, description: 'El script termina. El listener sigue vivo en las Web APIs. Call Stack vacío.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 0, description: '🖱 El usuario hace click. El navegador encola el handler como macrotask en la UI Event Queue.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [{ label: 'click → handler()', type: 'ui' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 0, description: 'Call Stack vacío → el Event Loop CONSUME el UI event. handler() se apila y la cola UI queda vacía.',
        callStack: [{ label: 'handler()', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 1, description: 'console.log("handler") se apila sobre handler() y se ejecuta.',
        callStack: [{ label: "console.log('handler')", type: 'callstack', executing: true }, { label: 'handler()', type: 'callstack' }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['handler']
      },
      {
        activeLine: 3, description: 'setTimeout dentro del handler: registra un timer en Web APIs.',
        callStack: [{ label: 'setTimeout(cb, 0)', type: 'callstack', executing: true }, { label: 'handler()', type: 'callstack' }],
        webApis: [
          { label: '👂 listener "click" → handler', type: 'webapis' },
          { label: '⏱ Timer 0ms → cb', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['handler']
      },
      {
        activeLine: 7, description: 'Promise.resolve().then(cb): encola una microtarea.',
        callStack: [{ label: 'Promise.resolve().then(cb)', type: 'callstack', executing: true }, { label: 'handler()', type: 'callstack' }],
        webApis: [
          { label: '👂 listener "click" → handler', type: 'webapis' },
          { label: '⏱ Timer 0ms → cb', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [],
        microtaskQueue: [{ label: "cb: console.log('promise')", type: 'microtask' }],
        renderQueue: [], output: ['handler']
      },
      {
        activeLine: 10, description: 'console.log("fin handler") se ejecuta. (El timer ya venció → su cb pasó a la Task Queue.)',
        callStack: [{ label: "console.log('fin handler')", type: 'callstack', executing: true }, { label: 'handler()', type: 'callstack' }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [],
        taskQueue: [{ label: "cb: console.log('setTimeout')", type: 'task' }],
        microtaskQueue: [{ label: "cb: console.log('promise')", type: 'microtask' }],
        renderQueue: [], output: ['handler', 'fin handler']
      },
      {
        activeLine: 0, description: 'handler() retorna y se desapila. Termina esta macrotask. Call Stack vacío.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [],
        taskQueue: [{ label: "cb: console.log('setTimeout')", type: 'task' }],
        microtaskQueue: [{ label: "cb: console.log('promise')", type: 'microtask' }],
        renderQueue: [], output: ['handler', 'fin handler']
      },
      {
        activeLine: 8, description: '⚡ Tras cada macrotask se drenan TODAS las microtareas. El callback de Promise se apila y ejecuta.',
        callStack: [{ label: "cb: console.log('promise')", type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [],
        taskQueue: [{ label: "cb: console.log('setTimeout')", type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: ['handler', 'fin handler']
      },
      {
        activeLine: 8, description: '"promise" impreso. Microtask Queue vacía. Recién ahora el Event Loop mira las demás macrotasks.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [],
        taskQueue: [{ label: "cb: console.log('setTimeout')", type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: ['handler', 'fin handler', 'promise']
      },
      {
        activeLine: 4, description: 'El Event Loop CONSUME la tarea de setTimeout: se apila y ejecuta.',
        callStack: [{ label: "cb: console.log('setTimeout')", type: 'callstack', executing: true }],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['handler', 'fin handler', 'promise']
      },
      {
        activeLine: 4, description: '"setTimeout" impreso. Fin. Orden: handler → fin handler → promise → setTimeout. El listener sigue vivo para futuros clicks.',
        callStack: [],
        webApis: [{ label: '👂 listener "click" → handler', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [],
        output: ['handler', 'fin handler', 'promise', 'setTimeout']
      }
    ]
  },

  // ── Example 5: microtasks vs macrotasks frente al render (2 botones) ──────
  {
    id: 'microtask-render',
    title: 'Ejemplo 5 — Microtareas vs Macrotareas frente al Render',
    description: 'Dos botones con su handler. Simulamos un click en cada uno (cada click es un UI event = macrotarea). El botón A actualiza el DOM con microtareas (Promise) → no repinta entre ellas. El botón B lo hace con setTimeout (macrotareas) → repinta entre cada una.',
    showIO: false,
    code: `botonA.addEventListener('click', () => {
  // microtareas: actualizan el DOM
  for (let i = 1; i <= 3; i++) {
    Promise.resolve().then(() => contador.textContent = i);
  }
});

botonB.addEventListener('click', () => {
  // macrotareas: actualizan el DOM
  for (let i = 1; i <= 3; i++) {
    setTimeout(() => contador.textContent = i, 0);
  }
});`,
    steps: [
      {
        activeLine: 0, description: 'Se registran los dos listeners "click" (botón A y botón B) en las Web APIs.',
        callStack: [{ label: 'addEventListener ×2', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['contador = 0']
      },

      // ── Click en botón A (microtareas) ──
      {
        activeLine: 0, description: '🖱 Simulamos CLICK en botón A. El navegador encola handlerA en la UI Event Queue (macrotarea).',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [{ label: '🖱 click botonA → handlerA()', type: 'ui' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['contador = 0']
      },
      {
        activeLine: 0, description: 'El Event Loop consume el UI event: handlerA() se apila y ejecuta.',
        callStack: [{ label: 'handlerA()', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['contador = 0']
      },
      {
        activeLine: 3, description: 'Dentro de handlerA el loop encola 3 microtareas (Promise.then). Aún no corren.',
        callStack: [{ label: 'for → 3× Promise.then', type: 'callstack', executing: true }, { label: 'handlerA()', type: 'callstack' }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [],
        microtaskQueue: [
          { label: 'cb #1: contador = 1', type: 'microtask' },
          { label: 'cb #2: contador = 2', type: 'microtask' },
          { label: 'cb #3: contador = 3', type: 'microtask' }
        ],
        renderQueue: [], output: ['contador = 0']
      },
      {
        activeLine: 0, description: 'handlerA() retorna. Termina la macrotarea. Antes del render, se drenan TODAS las microtareas.',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [],
        microtaskQueue: [
          { label: 'cb #1: contador = 1', type: 'microtask' },
          { label: 'cb #2: contador = 2', type: 'microtask' },
          { label: 'cb #3: contador = 3', type: 'microtask' }
        ],
        renderQueue: [], output: ['contador = 0']
      },
      {
        activeLine: 3, description: 'Microtarea #1: contador = 1 (escribe el DOM). El render NO corre todavía.',
        callStack: [{ label: 'cb #1: contador = 1', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [],
        microtaskQueue: [
          { label: 'cb #2: contador = 2', type: 'microtask' },
          { label: 'cb #3: contador = 3', type: 'microtask' }
        ],
        renderQueue: [{ label: '🖼 repintado pendiente', type: 'render' }],
        output: ['DOM = 1  (en memoria)']
      },
      {
        activeLine: 3, description: 'Microtarea #2: contador = 2. El navegador NO pinta entre microtareas → sigue drenando.',
        callStack: [{ label: 'cb #2: contador = 2', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [],
        microtaskQueue: [{ label: 'cb #3: contador = 3', type: 'microtask' }],
        renderQueue: [{ label: '🖼 repintado pendiente', type: 'render' }],
        output: ['DOM = 2  (en memoria)']
      },
      {
        activeLine: 3, description: 'Microtarea #3: contador = 3. Última de la cola. La pantalla sigue mostrando el valor viejo.',
        callStack: [{ label: 'cb #3: contador = 3', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 repintado pendiente', type: 'render' }],
        output: ['DOM = 3  (en memoria)']
      },
      {
        activeLine: 3, description: 'Cola de microtareas VACÍA. Recién AHORA el navegador PINTA, una sola vez, con el valor final.',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando… contador = 3', type: 'render', executing: true }],
        output: ['🖥 botón A: salto directo a 3']
      },

      // ── Click en botón B (macrotareas) ──
      {
        activeLine: 7, description: '🖱 Simulamos CLICK en botón B. El navegador encola handlerB en la UI Event Queue.',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [{ label: '🖱 click botonB → handlerB()', type: 'ui' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['🖥 botón A: salto directo a 3']
      },
      {
        activeLine: 9, description: 'El Event Loop consume el click. handlerB ejecuta su loop: 3 setTimeout → 3 timers en Web APIs.',
        callStack: [{ label: 'handlerB() → 3× setTimeout', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' },
          { label: '⏱ Timer 0ms → cb #1', type: 'webapis' },
          { label: '⏱ Timer 0ms → cb #2', type: 'webapis' },
          { label: '⏱ Timer 0ms → cb #3', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['contador = 0']
      },
      {
        activeLine: 9, description: 'Los timers vencen: sus callbacks pasan a la Task Queue (3 macrotareas separadas).',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [],
        taskQueue: [
          { label: 'cb #1: contador = 1', type: 'task' },
          { label: 'cb #2: contador = 2', type: 'task' },
          { label: 'cb #3: contador = 3', type: 'task' }
        ],
        microtaskQueue: [], renderQueue: [], output: ['contador = 0']
      },
      {
        activeLine: 10, description: 'VUELTA 1 — paso A: el Event Loop saca cb #1 de la Task Queue y lo APILA en el Call Stack.',
        callStack: [{ label: 'cb #1: contador = 1', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [],
        taskQueue: [
          { label: 'cb #2: contador = 2', type: 'task' },
          { label: 'cb #3: contador = 3', type: 'task' }
        ],
        microtaskQueue: [], renderQueue: [], output: ['contador = 0']
      },
      {
        activeLine: 10, description: 'VUELTA 1 — paso B: cb #1 terminó (contador = 1) y se desapiló. Al cerrar la vuelta, el navegador PINTA. Pantalla muestra 1.',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [],
        taskQueue: [
          { label: 'cb #2: contador = 2', type: 'task' },
          { label: 'cb #3: contador = 3', type: 'task' }
        ],
        microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando… contador = 1', type: 'render', executing: true }],
        output: ['🖥 pantalla muestra: 1']
      },
      {
        activeLine: 10, description: 'VUELTA 2 — paso A: el Event Loop saca cb #2 de la Task Queue y lo APILA en el Call Stack.',
        callStack: [{ label: 'cb #2: contador = 2', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [],
        taskQueue: [{ label: 'cb #3: contador = 3', type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: ['🖥 pantalla muestra: 1']
      },
      {
        activeLine: 10, description: 'VUELTA 2 — paso B: cb #2 terminó (contador = 2) y se desapiló. Se PINTA otra vez. Pantalla muestra 2.',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [],
        taskQueue: [{ label: 'cb #3: contador = 3', type: 'task' }],
        microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando… contador = 2', type: 'render', executing: true }],
        output: ['🖥 pantalla muestra: 2']
      },
      {
        activeLine: 10, description: 'VUELTA 3 — paso A: el Event Loop saca cb #3 (la última) de la Task Queue y lo APILA en el Call Stack.',
        callStack: [{ label: 'cb #3: contador = 3', type: 'callstack', executing: true }],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['🖥 pantalla muestra: 2']
      },
      {
        activeLine: 10, description: 'VUELTA 3 — paso B: cb #3 terminó (contador = 3) y se desapiló. Se PINTA otra vez. Pantalla muestra 3.',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando… contador = 3', type: 'render', executing: true }],
        output: ['🖥 pantalla muestra: 3']
      },
      {
        activeLine: 7, description: 'Resultado: botón A (Promise) saltó directo a 3; botón B (setTimeout) contó 1 → 2 → 3. Misma escritura al DOM, distinto repintado.',
        callStack: [],
        webApis: [
          { label: '👂 click botonA → handlerA', type: 'webapis' },
          { label: '👂 click botonB → handlerB', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [],
        output: ['botón A (Promise): salto directo a 3', 'botón B (setTimeout): contó 1 → 2 → 3']
      }
    ]
  },

  // ── Example 6: fetch + network I/O ───────────────────────────────────────
  {
    id: 'fetch',
    title: 'Ejemplo 6 — fetch() + I/O de Red',
    description: 'fetch() entrega la petición a la capa de red del navegador (Web API en C++, sobre el OS). El hilo JS queda libre de inmediato. OJO: res.json() TAMBIÉN devuelve una promesa, así que su .then encadena OTRA microtarea (no es síncrono).',
    showIO: true,
    code: `console.log('antes');

fetch('/api/datos')
  .then(res => res.json())
  .then(data => {
    console.log('datos:', data.id);
  });

console.log('después');`,
    steps: [
      {
        activeLine: 0, description: 'console.log("antes") se ejecuta.',
        callStack: [{ label: "console.log('antes')", type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 0, description: '"antes" impreso.',
        callStack: [],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['antes']
      },
      {
        activeLine: 2, description: 'fetch() se apila. Entrega la petición HTTP a la Web API de red (que usa el OS: epoll/IOCP). Retorna una promesa al instante.',
        callStack: [{ label: "fetch('/api/datos')", type: 'callstack', executing: true }],
        webApis: [{ label: '🌐 GET /api/datos … (en vuelo)', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['antes']
      },
      {
        activeLine: 3, description: '.then() encadena los handlers a la promesa. El Call Stack se libera. La red trabaja en segundo plano.',
        callStack: [],
        webApis: [{ label: '🌐 GET /api/datos … (en vuelo)', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['antes']
      },
      {
        activeLine: 8, description: 'console.log("después") se ejecuta ANTES de recibir la respuesta. El hilo JS nunca esperó.',
        callStack: [{ label: "console.log('después')", type: 'callstack', executing: true }],
        webApis: [{ label: '🌐 GET /api/datos … (en vuelo)', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['antes']
      },
      {
        activeLine: 8, description: '"después" impreso. Call Stack vacío. El OS sigue esperando la respuesta de red.',
        callStack: [],
        webApis: [{ label: '🌐 GET /api/datos … (en vuelo)', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['antes', 'después']
      },
      {
        activeLine: 3, description: '✅ Llegaron las cabeceras de la respuesta (200 OK). Se encola la microtarea del primer .then (el que recibe res).',
        callStack: [],
        webApis: [{ label: '🌐 GET /api/datos ✅ headers 200', type: 'webapis' }],
        taskQueue: [],
        microtaskQueue: [{ label: 'cb: res => res.json()', type: 'microtask' }],
        renderQueue: [], output: ['antes', 'después']
      },
      {
        activeLine: 3, description: 'La microtarea ejecuta res.json(): parsea el body ya recibido y devuelve OTRA promesa que resuelve de inmediato → encola la microtarea del segundo .then.',
        callStack: [{ label: 'cb: res => res.json()', type: 'callstack', executing: true }],
        webApis: [{ label: '🌐 GET /api/datos ✅ 200 OK', type: 'webapis' }],
        taskQueue: [],
        microtaskQueue: [{ label: 'cb: data => console.log(...)', type: 'microtask' }],
        renderQueue: [], output: ['antes', 'después']
      },
      {
        activeLine: 4, description: 'res.json() retornó. El Event Loop drena la siguiente microtarea: el callback final con los datos.',
        callStack: [{ label: "cb: data => console.log('datos:', ...)", type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['antes', 'después']
      },
      {
        activeLine: 5, description: '"datos: 42" impreso. Fin. La espera real fue la de red; el parseo del body resolvió en una microtarea, sin volver a bloquear el hilo.',
        callStack: [],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [],
        output: ['antes', 'después', 'datos: 42']
      }
    ]
  },

  // ── Example 7: Multiple concurrent fetch + epoll ──────────────────────────
  {
    id: 'concurrent-fetch',
    title: 'Ejemplo 7 — fetch() Concurrente + epoll',
    description: 'Tres fetch() simultáneos. El OS vigila los tres sockets con UN solo hilo usando epoll (Linux) / kqueue (macOS) / IOCP (Windows). No se crean hilos de JS adicionales.',
    showIO: true,
    code: `console.log('lanzando 3 requests');

const p1 = fetch('/api/usuario');
const p2 = fetch('/api/posts');
const p3 = fetch('/api/config');

Promise.all([p1, p2, p3])
  .then(([u, po, c]) => {
    console.log('todos llegaron');
  });

console.log('en vuelo…');`,
    steps: [
      {
        activeLine: 0, description: 'console.log("lanzando 3 requests") se ejecuta.',
        callStack: [{ label: "console.log('lanzando...')", type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 2, description: 'fetch("/api/usuario") entrega la petición a la red. El OS registra el socket #1 en epoll.',
        callStack: [{ label: "fetch('/api/usuario')", type: 'callstack', executing: true }],
        webApis: [{ label: '🌐 GET /api/usuario ⏳', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['lanzando 3 requests']
      },
      {
        activeLine: 3, description: 'fetch("/api/posts"): socket #2 registrado. Las dos peticiones viajan a la vez.',
        callStack: [{ label: "fetch('/api/posts')", type: 'callstack', executing: true }],
        webApis: [
          { label: '🌐 GET /api/usuario ⏳', type: 'webapis' },
          { label: '🌐 GET /api/posts ⏳', type: 'webapis' }
        ],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['lanzando 3 requests']
      },
      {
        activeLine: 4, description: 'fetch("/api/config"): socket #3. Los TRES sockets los vigila un solo hilo del OS con epoll.',
        callStack: [{ label: "fetch('/api/config')", type: 'callstack', executing: true }],
        webApis: [
          { label: '🌐 GET /api/usuario ⏳', type: 'webapis' },
          { label: '🌐 GET /api/posts ⏳', type: 'webapis' },
          { label: '🌐 GET /api/config ⏳', type: 'webapis' }
        ],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['lanzando 3 requests']
      },
      {
        activeLine: 6, description: 'Promise.all([p1,p2,p3]).then(...) registra su handler: quedará pendiente hasta que las 3 promesas se resuelvan.',
        callStack: [{ label: 'Promise.all([...]).then(cb)', type: 'callstack', executing: true }],
        webApis: [
          { label: '🌐 GET /api/usuario ⏳', type: 'webapis' },
          { label: '🌐 GET /api/posts ⏳', type: 'webapis' },
          { label: '🌐 GET /api/config ⏳', type: 'webapis' }
        ],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['lanzando 3 requests']
      },
      {
        activeLine: 11, description: 'console.log("en vuelo…") se ejecuta. El script termina y el hilo JS queda IDLE mientras el OS espera las respuestas.',
        callStack: [{ label: "console.log('en vuelo…')", type: 'callstack', executing: true }],
        webApis: [
          { label: '🌐 GET /api/usuario ⏳', type: 'webapis' },
          { label: '🌐 GET /api/posts ⏳', type: 'webapis' },
          { label: '🌐 GET /api/config ⏳', type: 'webapis' }
        ],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['lanzando 3 requests', 'en vuelo…']
      },
      {
        activeLine: 4, description: '⚡ epoll avisa: /api/config respondió primero (fue la más rápida). p3 se resuelve → se encola la microtarea que avisa a Promise.all.',
        callStack: [],
        webApis: [
          { label: '🌐 GET /api/usuario ⏳', type: 'webapis' },
          { label: '🌐 GET /api/posts ⏳', type: 'webapis' },
          { label: '🌐 GET /api/config ✅', type: 'webapis' }
        ],
        taskQueue: [],
        microtaskQueue: [{ label: 'resolver p3 → Promise.all (1/3)', type: 'microtask' }],
        renderQueue: [], output: ['lanzando 3 requests', 'en vuelo…']
      },
      {
        activeLine: 2, description: '⚡ Llega /api/usuario. p1 se resuelve → otra microtarea avisa a Promise.all (la anterior ya bajó el contador a 2/3).',
        callStack: [],
        webApis: [
          { label: '🌐 GET /api/usuario ✅', type: 'webapis' },
          { label: '🌐 GET /api/posts ⏳', type: 'webapis' }
        ],
        taskQueue: [],
        microtaskQueue: [{ label: 'resolver p1 → Promise.all (2/3)', type: 'microtask' }],
        renderQueue: [], output: ['lanzando 3 requests', 'en vuelo…']
      },
      {
        activeLine: 3, description: '⚡ Llega /api/posts (la última). p2 se resuelve → la microtarea que completa el 3/3 de Promise.all.',
        callStack: [],
        webApis: [{ label: '🌐 GET /api/posts ✅', type: 'webapis' }],
        taskQueue: [],
        microtaskQueue: [{ label: 'resolver p2 → Promise.all (3/3)', type: 'microtask' }],
        renderQueue: [], output: ['lanzando 3 requests', 'en vuelo…']
      },
      {
        activeLine: 6, description: 'Con las 3 promesas resueltas, Promise.all cumple SU promesa y recién AHORA encola el callback de tu .then en la Microtask Queue.',
        callStack: [],
        webApis: [],
        taskQueue: [],
        microtaskQueue: [{ label: 'cb Promise.all: console.log(...)', type: 'microtask' }],
        renderQueue: [], output: ['lanzando 3 requests', 'en vuelo…']
      },
      {
        activeLine: 7, description: 'El Event Loop saca el callback de Promise.all de la Microtask Queue y lo APILA en el Call Stack.',
        callStack: [{ label: 'cb Promise.all: console.log(...)', type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [],
        output: ['lanzando 3 requests', 'en vuelo…']
      },
      {
        activeLine: 8, description: '"todos llegaron" impreso. 3 requests concurrentes, 0 hilos de JS extra. La concurrencia la dio epoll en el OS.',
        callStack: [{ label: 'cb Promise.all: console.log(...)', type: 'callstack', executing: true }],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [],
        output: ['lanzando 3 requests', 'en vuelo…', 'todos llegaron']
      },
      {
        activeLine: 9, description: 'Fin. JS solo procesó resultados; la espera de I/O ocurrió fuera del hilo, en el OS.',
        callStack: [],
        webApis: [], taskQueue: [], microtaskQueue: [], renderQueue: [],
        output: ['lanzando 3 requests', 'en vuelo…', 'todos llegaron']
      }
    ]
  },

  // ── Example 8: async/await disparado por un click (IdentifAI · analyze) ───
  {
    id: 'async-await',
    title: 'Ejemplo 8 — async / await disparado por un click (analyze)',
    description: 'Caso real de IdentifAI. El usuario hace click en "Analizar" → UI event → corre analyze(). showLoading() y showResults() escriben el DOM (síncrono); cada await PAUSA la función y libera el hilo, reanudándose como microtarea cuando la promesa resuelve.',
    showIO: true,
    code: `btnAnalizar.addEventListener('click', analyze);

async function analyze() {
  showLoading();          // pinta el spinner
  const res = await fetch('/analyze', { ... });
  const data = await res.json();
  showResults(data);      // pinta los resultados
}

function showLoading() {
  panel.innerHTML = '<div class="spinner"></div>';
}

function showResults(items) {
  panel.innerHTML = '';
  for (const it of items) {
    panel.innerHTML += \`<li>\${it.name} \${it.prob}%</li>\`;
  }
}`,
    steps: [
      {
        activeLine: 0, description: 'addEventListener registra el listener "click" del botón Analizar en las Web APIs.',
        callStack: [{ label: 'btnAnalizar.addEventListener(...)', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 0, description: '🖱 El usuario hace click en "Analizar". El navegador encola analyze en la UI Event Queue (macrotarea).',
        callStack: [],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [{ label: '🖱 click → analyze()', type: 'ui' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 2, description: 'El Event Loop consume el UI event: analyze() se apila y empieza a ejecutar.',
        callStack: [{ label: 'analyze()', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 10, description: 'showLoading() ejecuta: panel.innerHTML = spinner. Escribe el DOM al instante (síncrono).',
        callStack: [{ label: 'showLoading()', type: 'callstack', executing: true }, { label: 'analyze()', type: 'callstack' }],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 DOM = spinner (sin pintar)', type: 'render' }],
        output: ['DOM: <spinner>']
      },
      {
        activeLine: 4, description: 'Se ejecuta fetch("/analyze"), apilado SOBRE analyze(). Entrega la petición a la red (Web API) y devuelve una promesa.',
        callStack: [{ label: "fetch('/analyze')", type: 'callstack', executing: true }, { label: 'analyze()', type: 'callstack' }],
        webApis: [
          { label: '👂 click btnAnalizar → analyze', type: 'webapis' },
          { label: '🌐 POST /analyze … (en vuelo)', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 DOM = spinner (sin pintar)', type: 'render' }],
        output: ['DOM: <spinner>']
      },
      {
        activeLine: 4, description: 'El await actúa sobre la promesa pendiente: PAUSA analyze() y la saca del Call Stack. El hilo queda libre.',
        callStack: [],
        webApis: [
          { label: '👂 click btnAnalizar → analyze', type: 'webapis' },
          { label: '🌐 POST /analyze … (en vuelo)', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 DOM = spinner (sin pintar)', type: 'render' }],
        output: ['DOM: <spinner>']
      },
      {
        activeLine: 4, description: 'Call Stack vacío. El navegador PINTA el spinner mientras espera la red: la UI responde aunque la petición siga en curso.',
        callStack: [],
        webApis: [
          { label: '👂 click btnAnalizar → analyze', type: 'webapis' },
          { label: '🌐 POST /analyze … (en vuelo)', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando spinner…', type: 'render', executing: true }],
        output: ['🖥 pantalla: spinner girando']
      },
      {
        activeLine: 4, description: '✅ Llega la respuesta. La reanudación de analyze() (lo que sigue al await) se encola como microtarea.',
        callStack: [],
        webApis: [
          { label: '👂 click btnAnalizar → analyze', type: 'webapis' },
          { label: '🌐 POST /analyze ✅ 200', type: 'webapis' }
        ],
        uiQueue: [], taskQueue: [],
        microtaskQueue: [{ label: 'reanudar analyze (tras await fetch)', type: 'microtask' }],
        renderQueue: [], output: ['🖥 pantalla: spinner girando']
      },
      {
        activeLine: 5, description: 'La microtarea reanuda analyze(): ejecuta res.json() apilado encima. OJO: res.json() TAMBIÉN es asíncrono — devuelve una promesa (el body puede llegar en chunks).',
        callStack: [{ label: 'res.json()', type: 'callstack', executing: true }, { label: 'analyze()', type: 'callstack' }],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [], output: ['🖥 pantalla: spinner girando']
      },
      {
        activeLine: 5, description: 'El segundo await actúa sobre la promesa de res.json(): PAUSA analyze() otra vez y libera el Call Stack. La reanudación queda pendiente hasta que el body se parsee.',
        callStack: [],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [],
        microtaskQueue: [{ label: 'reanudar analyze (tras await json)', type: 'microtask' }],
        renderQueue: [], output: ['🖥 pantalla: spinner girando']
      },
      {
        activeLine: 5, description: 'El body ya está parseado: el Event Loop drena la microtarea y reanuda analyze() con los datos listos en "data".',
        callStack: [{ label: 'analyze() ↩ (tras json)', type: 'callstack', executing: true }],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['🖥 pantalla: spinner girando']
      },
      {
        activeLine: 6, description: 'analyze() continúa y llama a showResults(data). Se apila showResults().',
        callStack: [{ label: 'showResults(data)', type: 'callstack', executing: true }, { label: 'analyze()', type: 'callstack' }],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [], renderQueue: [], output: ['🖥 pantalla: spinner girando']
      },
      {
        activeLine: 16, description: 'showResults recorre los items y arma el HTML con un <li> por resultado: escribe el DOM (síncrono).',
        callStack: [{ label: 'for → panel.innerHTML += …', type: 'callstack', executing: true }, { label: 'showResults(data)', type: 'callstack' }],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 DOM = lista (sin pintar)', type: 'render' }],
        output: ['DOM: <li>gato 92%</li><li>perro 5%</li>']
      },
      {
        activeLine: 7, description: 'showResults y analyze() retornan. Call Stack vacío.',
        callStack: [],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 DOM = lista (sin pintar)', type: 'render' }],
        output: ['DOM: <li>gato 92%</li><li>perro 5%</li>']
      },
      {
        activeLine: 7, description: 'El navegador PINTA los resultados, reemplazando el spinner. El hilo nunca se bloqueó en ninguna de las dos esperas.',
        callStack: [],
        webApis: [{ label: '👂 click btnAnalizar → analyze', type: 'webapis' }],
        uiQueue: [], taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando resultados…', type: 'render', executing: true }],
        output: ['🖥 pantalla: lista de resultados']
      }
    ]
  },

  // ── Example 9: setInterval polling de salud del servidor (IdentifAI) ──────
  {
    id: 'health-poll',
    title: 'Ejemplo 9 — Polling de estado del servidor (setInterval + fetch)',
    description: 'Fragmento simplificado de IdentifAI. setInterval programa una tarea repetida en la Task Queue cada 10s; cada vez hace un fetch a /health. El hilo JS queda libre entre chequeos: el timer y la red trabajan en las Web APIs.',
    showIO: true,
    code: `async function checkHealth() {
  const res = await fetch('/health');
  const data = await res.json();
  setAiStatus(data.status); // online / offline
}

function setAiStatus(status) {
  // manipula el DOM: clase + texto del indicador
  if (status === 'ok') {
    indicador.classList.remove('offline');
    label.textContent = 'Motor de IA activo';
  } else {
    indicador.classList.add('offline');
    label.textContent = 'Motor de IA apagado';
  }
}

// revisar cada 10 segundos
setInterval(checkHealth, 10000);`,
    steps: [
      {
        activeLine: 18, description: 'setInterval() registra un timer repetitivo de 10s en las Web APIs. Retorna de inmediato.',
        callStack: [{ label: 'setInterval(checkHealth, 10000)', type: 'callstack', executing: true }],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 18, description: 'El script termina. El hilo JS queda IDLE. El timer corre en el navegador.',
        callStack: [],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 18, description: '⏱ Pasan 10s. El timer vence y el navegador encola checkHealth en la Task Queue (el interval sigue activo para la próxima vuelta).',
        callStack: [],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [{ label: 'checkHealth()', type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 0, description: 'Event Loop: toma la tarea de la Task Queue. checkHealth() se apila y ejecuta.',
        callStack: [{ label: 'checkHealth()', type: 'callstack', executing: true }],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 1, description: 'Se ejecuta fetch(\'/health\') apilado SOBRE checkHealth(): entrega la petición a la red (Web API) y devuelve una promesa. Luego el await PAUSA checkHealth() y libera el Call Stack.',
        callStack: [{ label: 'fetch(\'/health\')', type: 'callstack', executing: true }, { label: 'checkHealth()', type: 'callstack' }],
        webApis: [
          { label: '⏱ Interval 10s → checkHealth', type: 'webapis' },
          { label: '🌐 GET /health … (en vuelo)', type: 'webapis' }
        ],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 1, description: 'Call Stack vacío. El hilo sigue libre: puede atender la UI mientras espera la respuesta del servidor.',
        callStack: [],
        webApis: [
          { label: '⏱ Interval 10s → checkHealth', type: 'webapis' },
          { label: '🌐 GET /health … (en vuelo)', type: 'webapis' }
        ],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 1, description: '✅ El servidor responde. La reanudación de checkHealth() (tras el await) se encola como microtarea.',
        callStack: [],
        webApis: [
          { label: '⏱ Interval 10s → checkHealth', type: 'webapis' },
          { label: '🌐 GET /health ✅ 200', type: 'webapis' }
        ],
        taskQueue: [],
        microtaskQueue: [{ label: 'reanudar checkHealth (tras await fetch)', type: 'microtask' }],
        renderQueue: [], output: []
      },
      {
        activeLine: 2, description: 'La microtarea reanuda checkHealth(): ejecuta res.json() encima. OJO: res.json() TAMBIÉN es asíncrono — devuelve una promesa (parsear el body no es instantáneo).',
        callStack: [{ label: 'res.json()', type: 'callstack', executing: true }, { label: 'checkHealth()', type: 'callstack' }],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 2, description: 'El segundo await actúa sobre la promesa de res.json(): PAUSA checkHealth() otra vez y libera el Call Stack. La reanudación queda pendiente hasta que el body se parsee.',
        callStack: [],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [],
        microtaskQueue: [{ label: 'reanudar checkHealth (tras await json)', type: 'microtask' }],
        renderQueue: [], output: []
      },
      {
        activeLine: 2, description: 'El body ya está parseado: el Event Loop drena la microtarea y reanuda checkHealth() con los datos listos en "data".',
        callStack: [{ label: 'checkHealth() ↩ (tras json)', type: 'callstack', executing: true }],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 3, description: 'checkHealth() continúa y llama setAiStatus(data.status). Se apila setAiStatus() encima.',
        callStack: [{ label: 'setAiStatus("ok")', type: 'callstack', executing: true }, { label: 'checkHealth()', type: 'callstack' }],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [], renderQueue: [], output: []
      },
      {
        activeLine: 9, description: 'Dentro de setAiStatus: indicador.classList.remove("offline"). Modifica el DOM al instante (síncrono).',
        callStack: [{ label: 'indicador.classList.remove(...)', type: 'callstack', executing: true }, { label: 'setAiStatus("ok")', type: 'callstack' }, { label: 'checkHealth()', type: 'callstack' }],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 cambio DOM (sin pintar)', type: 'render' }],
        output: ['DOM: clase "offline" quitada']
      },
      {
        activeLine: 10, description: 'label.textContent = "Motor de IA activo". Otra escritura al DOM (síncrona). El render aún no corre.',
        callStack: [{ label: 'label.textContent = …', type: 'callstack', executing: true }, { label: 'setAiStatus("ok")', type: 'callstack' }, { label: 'checkHealth()', type: 'callstack' }],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 cambio DOM (sin pintar)', type: 'render' }],
        output: ['DOM: texto = "Motor de IA activo"']
      },
      {
        activeLine: 3, description: 'setAiStatus y checkHealth() retornan. Call Stack vacío. Termina la tarea.',
        callStack: [],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 cambio DOM (sin pintar)', type: 'render' }],
        output: ['DOM: texto = "Motor de IA activo"']
      },
      {
        activeLine: 18, description: 'Call Stack vacío → el navegador PINTA: el indicador pasa a verde con el texto nuevo.',
        callStack: [],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [], microtaskQueue: [],
        renderQueue: [{ label: '🖼 Pintando indicador verde…', type: 'render', executing: true }],
        output: ['🖥 indicador: 🟢 Motor de IA activo']
      },
      {
        activeLine: 18, description: '⏱ A los 10s siguientes el interval vuelve a encolar checkHealth, y el ciclo se repite indefinidamente sin bloquear el hilo.',
        callStack: [],
        webApis: [{ label: '⏱ Interval 10s → checkHealth', type: 'webapis' }],
        taskQueue: [{ label: 'checkHealth()', type: 'task' }],
        microtaskQueue: [], renderQueue: [], output: ['estado: online', '…']
      }
    ]
  }

]; // end window.EXAMPLES
