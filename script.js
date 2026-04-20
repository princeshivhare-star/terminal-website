// keeps the cursor in sync with the real input caret position
// (just hide the native caret and use our own blinking block)

const output   = document.getElementById('output');
const input    = document.getElementById('cmd-input');
const cursor   = document.getElementById('cursor');

let soundEnabled = false;
let cmdHistory   = [];
let historyIdx   = -1;

// tiny Web Audio click — optional, very subtle
function playClick() {
  if (!soundEnabled) return;
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch(e) { /* silently fail on browsers that block autoplay */ }
}

// ─── output helpers ──────────────────────────────────────────────────────────

function addLine(text, cls = 'output') {
  const el = document.createElement('div');
  el.className = `line ${cls}`;
  el.innerHTML = text;  // allows inline HTML for links/colors
  output.appendChild(el);
  scrollBottom();
}

function addBlank() {
  const el = document.createElement('div');
  el.className = 'line blank';
  output.appendChild(el);
}

function scrollBottom() {
  output.scrollTop = output.scrollHeight;
}

// print a bunch of lines with a tiny stagger between them
function printLines(lines, delay = 30) {
  return new Promise(resolve => {
    let i = 0;
    function next() {
      if (i >= lines.length) { resolve(); return; }
      const [text, cls] = Array.isArray(lines[i]) ? lines[i] : [lines[i], 'output'];
      if (text === '') { addBlank(); }
      else { addLine(text, cls); }
      i++;
      setTimeout(next, delay);
    }
    next();
  });
}

// ─── command definitions ──────────────────────────────────────────────────────

const commands = {

  help() {
    return printLines([
      ['Available commands:', 'info'],
      '',
      ['  help       — show this list', 'muted'],
      ['  about      — who I am', 'muted'],
      ['  projects   — things I\'ve built', 'muted'],
      ['  skills     — tech I work with', 'muted'],
      ['  contact    — reach me', 'muted'],
      ['  clear      — clear screen', 'muted'],
      '',
      ['Tip: use ↑/↓ to cycle history', 'muted'],
    ]);
  },

  about() {
    return printLines([
      ['Alex Chen', 'bright'],
      ['Full-stack developer. I build things for the web.', 'output'],
      '',
      ['Currently focused on distributed systems and frontend', 'output'],
      ['performance. When I\'m not writing code I\'m probably', 'output'],
      ['messing with synthesizers or making coffee badly.', 'output'],
      '',
      ['Based in Berlin. Previously at Stripe, Vercel.', 'muted'],
    ]);
  },

  projects() {
    return printLines([
      ['Projects', 'info'],
      '',
      ['<span class="project-name">◆ Relay</span>         <span class="project-desc">— real-time collab layer on top of CRDTs</span>', 'output'],
      ['<span class="project-name">◆ Patchwork CLI</span>  <span class="project-desc">— git workflow tool, ~3k GitHub stars</span>', 'output'],
      ['<span class="project-name">◆ Lantern</span>       <span class="project-desc">— minimalist Markdown CMS (side project)</span>', 'output'],
      ['<span class="project-name">◆ Driftwood</span>     <span class="project-desc">— procedural map generator in WebGL</span>', 'output'],
      ['<span class="project-name">◆ Helix</span>         <span class="project-desc">— job queue built on Redis streams</span>', 'output'],
      '',
      ['<span class="muted">More on</span> <span class="tlink" onclick="window.open(\'https://github.com\')">github.com/alexchen</span>', 'output'],
    ]);
  },

  skills() {
    return printLines([
      ['Languages   →  TypeScript, Go, Rust (learning), Python', 'output'],
      ['Frontend    →  React, Next.js, vanilla JS, WebGL', 'output'],
      ['Backend     →  Node, Postgres, Redis, gRPC, Kafka', 'output'],
      ['Infra       →  Docker, Kubernetes, AWS, Terraform', 'output'],
      ['Other       →  neovim, tmux, obsessive about perf', 'output'],
    ]);
  },

  contact() {
    return printLines([
      ['Find me here:', 'info'],
      '',
      ['  email    <span class="tlink" onclick="window.open(\'mailto:alex@example.dev\')">alex@example.dev</span>', 'output'],
      ['  github   <span class="tlink" onclick="window.open(\'https://github.com\')">github.com/alexchen</span>', 'output'],
      ['  twitter  <span class="tlink" onclick="window.open(\'https://twitter.com\')">@alexchen_dev</span>', 'output'],
      ['  linkedin <span class="tlink" onclick="window.open(\'https://linkedin.com\')">linkedin.com/in/alexchen</span>', 'output'],
      '',
      ['Response time: usually same day.', 'muted'],
    ]);
  },

  clear() {
    output.innerHTML = '';
    return Promise.resolve();
  },

  // easter egg
  whoami() {
    return printLines([['you', 'muted']]);
  },

  sudo() {
    return printLines([['nice try', 'warn']]);
  },

  ls() {
    return printLines([['about  contact  projects  skills  resume.pdf', 'output']]);
  },

  pwd() {
    return printLines([['/', 'output']]);
  },

  date() {
    return printLines([[new Date().toString(), 'muted']]);
  },
};

// ─── boot sequence ────────────────────────────────────────────────────────────

async function boot() {
  const ascii = [
    '  ██████╗  ██████╗ ██████╗ ████████╗███████╗ ',
    '  ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝ ',
    '  ██████╔╝██║   ██║██████╔╝   ██║   █████╗   ',
    '  ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝   ',
    '  ██║     ╚██████╔╝██║  ██║   ██║   ██║      ',
    '  ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ',
  ];

  for (const row of ascii) {
    addLine(row, 'ascii');
    await sleep(40);
  }

  addBlank();

  await printLines([
    ['Alex Chen — developer & builder', 'bright'],
    ['v2.4.1  |  last updated April 2026', 'muted'],
    '',
    ['Type <span style="color:var(--cyan)">help</span> to see available commands.', 'output'],
    '',
  ], 25);
}

// ─── command runner ───────────────────────────────────────────────────────────

async function runCommand(raw) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return;

  // echo the command back
  addLine(raw, 'cmd');
  addBlank();

  // small fake processing delay
  await sleep(120 + Math.random() * 80);

  if (commands[trimmed]) {
    await commands[trimmed]();
  } else {
    await printLines([
      [`command not found: ${trimmed}`, 'error'],
      ['try <span style="color:var(--cyan)">help</span>', 'muted'],
    ]);
  }

  addBlank();
}

// ─── input handling ───────────────────────────────────────────────────────────

input.addEventListener('keydown', async (e) => {
  playClick();

  if (e.key === 'Enter') {
    const val = input.value;
    input.value = '';
    syncCursor();

    if (val.trim()) {
      cmdHistory.unshift(val);
      if (cmdHistory.length > 50) cmdHistory.pop();
    }
    historyIdx = -1;

    // disable input while processing
    input.disabled = true;
    await runCommand(val);
    input.disabled = false;
    input.focus();

  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIdx < cmdHistory.length - 1) {
      historyIdx++;
      input.value = cmdHistory[historyIdx];
      syncCursor();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIdx > 0) {
      historyIdx--;
      input.value = cmdHistory[historyIdx];
    } else {
      historyIdx = -1;
      input.value = '';
    }
    syncCursor();
  }
});

input.addEventListener('input', syncCursor);

// move our fake cursor div after the input text
function syncCursor() {
  // we just let the cursor sit at the end — CSS takes care of the blink
  // this is enough since caret-color is transparent
}

// keep focus in the input whenever user clicks anywhere
document.addEventListener('click', () => {
  if (!input.disabled) input.focus();
});

// ─── sound toggle ─────────────────────────────────────────────────────────────

const soundBtn = document.createElement('button');
soundBtn.id = 'sound-btn';
soundBtn.textContent = '[sound: off]';
document.body.appendChild(soundBtn);

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '[sound: on]' : '[sound: off]';
});

// ─── utils ────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── init ─────────────────────────────────────────────────────────────────────

boot().then(() => {
  input.focus();
});
