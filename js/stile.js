// Osteria da Anna — comportamenti di tutte le pagine (stile nuovo, 13/11/2026). Senza librerie.
// Prima parte: menu del telefono, video, Skip, ricerca. Seconda: recensioni, timone, FAQ, cappelli che si disegnano,
// conchiglia, foto che scorrono, galleria dei piatti, creature e barche. Ogni pezzo parte solo se trova i suoi elementi.

// Menu del telefono: apre e chiude il pannello a tutto schermo.
(function () {
  var bottone = document.querySelector('[data-menu-tel]');
  if (!bottone) return;
  bottone.addEventListener('click', function () {
    var aperto = document.body.classList.toggle('menu-aperto');
    bottone.setAttribute('aria-expanded', aperto ? 'true' : 'false');
    bottone.setAttribute('aria-label', aperto ? 'Close navigation menu' : 'Open navigation menu');
  });
})();

// Video: clic = pausa/play; icona pausa al passaggio del mouse mentre il video gira.
document.querySelectorAll('[data-video]').forEach(function (box) {
  var video = box.querySelector('video');
  // Come Wix: lo stato (icone) cambia con il clic dell'utente, non con una pausa decisa dal browser.
  var stato = function (gira) { if (gira) box.setAttribute('data-playing', ''); else box.removeAttribute('data-playing'); box.setAttribute('aria-pressed', gira ? 'true' : 'false'); };
  stato(true);
  var pronto = function () { box.setAttribute('data-pronto', ''); }; // come Wix: la locandina sparisce quando il video è caricato
  if (video.readyState >= 2) pronto(); else video.addEventListener('loadeddata', pronto);
  box.addEventListener('mouseenter', function () { box.setAttribute('data-roll-in', ''); });
  box.addEventListener('mouseleave', function () { box.removeAttribute('data-roll-in'); });
  var cambia = function () { if (video.paused) { video.play(); stato(true); } else { video.pause(); stato(false); } };
  box.addEventListener('click', cambia);
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cambia(); } });
});

// Pulsante "Skip to Main Content" (come su Wix): porta il fuoco al contenuto principale.
document.querySelectorAll('[data-salta]').forEach(function (b) {
  b.addEventListener('click', function () { var m = document.getElementById('principale'); if (m) m.focus(); });
});

// Ricerca: pannello dalla testata con suggerimenti, Invio o "Show All Results" portano a /search?q=….
// Cerca nelle pagine con l'indice statico /ricerca.json (generato dalle pagine), senza librerie.
(function () {
  var indice;
  var carica = function () { return indice || (indice = fetch('/ricerca.json').then(function (r) { return r.json(); })); };
  var norma = function (t) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var esc = function (t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  // come Wix, trova anche le parole con la stessa radice ("pesce" trova "pescato"): alle parole lunghe si toglie la vocale finale
  var parole = function (q) { return norma(q).split(/\s+/).filter(Boolean).map(function (p) { return p.length > 4 ? p.replace(/[aeiou]$/, '') : p; }); };
  // evidenzia le parole cercate (senza badare a maiuscole e accenti)
  var evidenzia = function (testo, pp) {
    if (!pp.length) return esc(testo);
    var n = norma(testo), segni = [];
    pp.forEach(function (p) { var i = 0, f; while ((i = n.indexOf(p, i)) > -1) { f = i + p.length; while (f < n.length && /[a-z0-9]/.test(n[f])) f++; segni.push([i, f]); i = f; } });
    segni.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', da = 0;
    segni.forEach(function (s) { if (s[0] < da) return; out += esc(testo.slice(da, s[0])) + '<mark>' + esc(testo.slice(s[0], s[1])) + '</mark>'; da = s[1]; });
    return out + esc(testo.slice(da));
  };
  var trova = function (voci, q) {
    var pp = parole(q);
    return voci.map(function (v, ordine) {
      var t = norma(v.titolo), x = norma(v.testo), punti = 0;
      for (var i = 0; i < pp.length; i++) { if (x.indexOf(pp[i]) < 0 && t.indexOf(pp[i]) < 0) return null; punti += 10 * t.split(pp[i]).length + x.split(pp[i]).length; }
      return { v: v, punti: punti, ordine: ordine };
    }).filter(Boolean).sort(function (a, b) { return b.punti - a.punti || a.ordine - b.ordine; }).map(function (r) { return r.v; });
  };
  // il pezzo di testo da mostrare: dall'inizio della frase che contiene la prima parola cercata
  var estratto = function (v, pp) {
    if (!pp.length) return v.testo;
    var i = norma(v.testo).indexOf(pp[0]);
    if (i < 0) return v.testo;
    var inizio = Math.max(v.testo.lastIndexOf('. ', i) + 2, v.testo.lastIndexOf(' ', Math.max(0, i - 60)) + 1, 0);
    return v.testo.slice(i - inizio > 60 ? v.testo.lastIndexOf(' ', i - 40) + 1 : inizio);
  };
  // completamenti: la parola cercata e le coppie di parole più frequenti che cominciano con lei
  var suggerimenti = function (voci, q) {
    var qn = norma(q).trim(), conta = {};
    if (qn.indexOf(' ') > -1) return [q.trim()];
    voci.forEach(function (v) {
      var w = norma(v.testo + ' ' + v.titolo).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
      for (var i = 0; i < w.length; i++) {
        if (w[i].indexOf(qn) !== 0) continue;
        conta[w[i]] = (conta[w[i]] || 0) + 1;
        if (w[i + 1]) conta[w[i] + ' ' + w[i + 1]] = (conta[w[i] + ' ' + w[i + 1]] || 0) + 1;
      }
    });
    return Object.keys(conta).sort(function (a, b) { return (b === qn) - (a === qn) || conta[b] - conta[a]; }).slice(0, 3);
  };
  var miniatura = '<span class="ricerca-miniatura"><picture><source type="image/avif" srcset="/img/f4c59d_fd06059a17c2491ca986d9f26ad82a1e~mv2_164x164.avif"><img src="/img/f4c59d_fd06059a17c2491ca986d9f26ad82a1e~mv2_164x164.png" width="82" height="82" alt=""></picture></span>';
  var scheda = function (v) { return '<li class="ricerca-scheda">' + miniatura + '<span class="ricerca-testi"><a href="' + v.url + '" target="_self">' + esc(v.titolo) + '</a><span class="ricerca-desc">' + esc(v.testo) + '</span></span></li>'; };

  // Pannello
  var pannello = document.querySelector('[data-ricerca]');
  if (pannello) {
    var campo = pannello.querySelector('[data-ricerca-input]'), corpo = pannello.querySelector('[data-ricerca-corpo]'), svuota = pannello.querySelector('[data-ricerca-svuota]');
    var iniziale = corpo.innerHTML, attesa;
    var apri = function () { pannello.hidden = false; document.body.classList.add('ricerca-aperta'); campo.focus(); carica(); };
    var chiudi = function () { pannello.hidden = true; document.body.classList.remove('ricerca-aperta'); };
    var mostra = function () {
      var q = campo.value.trim(); svuota.hidden = !campo.value;
      if (!q) { corpo.innerHTML = iniziale; return; }
      carica().then(function (voci) {
        if (campo.value.trim() !== q) return;
        var pagine = trova(voci, q).slice(0, 3), sugg = suggerimenti(voci, q);
        if (!pagine.length) { corpo.innerHTML = '<h1 class="ricerca-vuoto">No suggestions found. Press Enter or Return to see all results.</h1>'; return; }
        corpo.innerHTML = '<div class="ricerca-due"><div class="ricerca-suggerimenti"><h2 class="fk">Top suggestions</h2><ol>' +
          sugg.map(function (s) { return '<li><a href="/search?q=' + encodeURIComponent(s).replace(/%20/g, '+') + '" target="_self">' + esc(s) + '</a></li>'; }).join('') +
          '</ol></div><div class="ricerca-pagine"><h2 class="fk">Other Pages</h2><ul>' + pagine.map(scheda).join('') +
          '</ul><button class="ricerca-tutti" type="submit" form="ricerca-modulo">Show All Results</button></div></div>';
      });
    };
    document.querySelectorAll('[data-ricerca-apri]').forEach(function (b) { b.addEventListener('click', apri); });
    pannello.querySelectorAll('[data-ricerca-chiudi]').forEach(function (b) { b.addEventListener('click', chiudi); });
    campo.addEventListener('input', function () { clearTimeout(attesa); attesa = setTimeout(mostra, 150); });
    svuota.addEventListener('click', function () { campo.value = ''; mostra(); campo.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pannello.hidden) chiudi(); });
  }

  // Pagina /search
  var lista = document.querySelector('[data-cerca-lista]');
  if (lista) {
    var q = (new URLSearchParams(location.search).get('q') || '').trim(), pp = parole(q);
    var input = document.querySelector('[data-cerca-input]'), via = document.querySelector('[data-cerca-svuota]');
    input.value = q; via.hidden = !q;
    via.addEventListener('click', function () { input.value = ''; via.hidden = true; input.focus(); });
    input.addEventListener('input', function () { via.hidden = !input.value; });
    if (q) document.title = "Risultati di ricerca: '" + q + "' - Osteria da Anna";
    document.querySelector('[data-cerca-nascosto]').textContent = q ? 'Search results for "' + q + '"' : 'Search this site';
    carica().then(function (voci) {
      var r = q ? trova(voci, q) : voci;
      document.querySelector('[data-cerca-stato]').textContent = !q ? r.length + ' results found with an empty search' : r.length ? r.length + ' results found for "' + q + '"' : 'No results found for "' + q + '". Try a new search.';
      lista.innerHTML = r.map(function (v) {
        return '<li><a class="cerca-miniatura" href="' + v.url + '"><picture><source type="image/avif" srcset="/img/f4c59d_fd06059a17c2491ca986d9f26ad82a1e~mv2_352x248.avif"><img src="/img/f4c59d_fd06059a17c2491ca986d9f26ad82a1e~mv2_352x248.png" width="176" height="124" alt=""></picture></a>' +
          '<a class="cerca-titolo" href="' + v.url + '">' + evidenzia(v.titolo, pp) + '</a><p class="cerca-testo">' + evidenzia(estratto(v, pp), pp) + '</p></li>';
      }).join('');
    });
  }
})();

(function () {
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Movimento ridotto: il video resta fermo sulla locandina (si avvia col clic).
  if (ridotto) document.querySelectorAll('[data-video]').forEach(function (box) {
    box.querySelector('video').pause();
    box.removeAttribute('data-playing');
    box.setAttribute('aria-pressed', 'false');
  });

  // Menu del telefono: Esc lo chiude.
  document.addEventListener('keydown', function (e) {
    var b = document.querySelector('[data-menu-tel]');
    if (e.key === 'Escape' && document.body.classList.contains('menu-aperto') && b) { b.click(); b.focus(); }
  });

  // Recensioni: ogni 5 s la prima svanisce e ne entra una da destra. Ferme solo finché il mouse o il dito sono sulle
  // schede, o finché un comando della sezione ha il fuoco da tastiera (:focus-visible). Le schede si spostano in fondo
  // (o in testa) al binario. Round 1b: prima bastava un clic su una freccia per fermarle per sempre (il bottone teneva
  // il fuoco e contava come fuoco da tastiera), e la zona del mouse era tutta la sezione, titolo compreso.
  var zona = document.querySelector('[data-recensioni]');
  if (zona) {
    var binario = zona.querySelector('[data-rec-binario]'), occupato = false, timer, fermo = { mouse: 0, dito: 0, fuoco: 0 };
    var passo = function () { return binario.firstElementChild.offsetWidth + parseFloat(getComputedStyle(binario).columnGap || 0); };
    var scorri = function (x, animato) {
      binario.style.transition = animato ? 'transform 650ms cubic-bezier(0.2, 0.7, 0.2, 1)' : 'none';
      binario.style.transform = x ? 'translateX(' + x + 'px)' : '';
    };
    var avanti = function () {
      if (occupato) return;
      var prima = binario.firstElementChild;
      if (ridotto) { binario.appendChild(prima); return; }
      occupato = true;
      prima.classList.add('esce');
      scorri(-passo(), true);
      setTimeout(function () { scorri(0, false); binario.appendChild(prima); prima.classList.remove('esce'); occupato = false; }, 680);
    };
    var indietro = function () {
      if (occupato) return;
      var ultima = binario.lastElementChild;
      binario.insertBefore(ultima, binario.firstElementChild);
      if (ridotto) return;
      occupato = true;
      ultima.style.transition = 'none';
      ultima.classList.add('esce');
      scorri(-passo(), false);
      binario.offsetWidth; // applica la posizione di partenza prima di animare
      ultima.style.transition = '';
      ultima.classList.remove('esce');
      scorri(0, true);
      setTimeout(function () { occupato = false; }, 680);
    };
    var programma = function () {
      clearTimeout(timer);
      if (!ridotto && !fermo.mouse && !fermo.dito && !fermo.fuoco) timer = setTimeout(function () { if (!document.hidden) avanti(); programma(); }, 5000);
    };
    var imposta = function (k, v) { fermo[k] = v; programma(); };
    zona.querySelector('[data-rec-avanti]').addEventListener('click', function () { avanti(); programma(); });
    zona.querySelector('[data-rec-indietro]').addEventListener('click', function () { indietro(); programma(); });
    var schede = zona.querySelector('.rec-finestra');
    schede.addEventListener('mouseenter', function () { imposta('mouse', 1); });
    schede.addEventListener('mouseleave', function () { imposta('mouse', 0); });
    schede.addEventListener('touchstart', function () { imposta('dito', 1); }, { passive: true });
    schede.addEventListener('touchend', function () { imposta('dito', 0); });
    schede.addEventListener('touchcancel', function () { imposta('dito', 0); });
    zona.addEventListener('focusin', function (e) { imposta('fuoco', e.target.matches(':focus-visible') ? 1 : 0); });
    zona.addEventListener('focusout', function (e) { if (!zona.contains(e.relatedTarget)) imposta('fuoco', 0); });
    programma();
  }

  // Timone (13/11): un clic apre accanto a sé il link "Seguici su Instagram" (già nell'HTML, mostrato dal CSS con
  // aria-expanded="true"); si chiude con un altro clic sul timone, con Esc (il fuoco torna al timone) o con un clic fuori.
  var timone = document.querySelector('[data-timone]');
  if (timone) {
    var linkIg = document.getElementById(timone.getAttribute('aria-controls'));
    var apriTimone = function (si) { timone.setAttribute('aria-expanded', si ? 'true' : 'false'); };
    timone.addEventListener('click', function () { apriTimone(timone.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || timone.getAttribute('aria-expanded') !== 'true') return;
      var dentro = document.activeElement === linkIg;
      apriTimone(false); if (dentro) timone.focus();
    });
    document.addEventListener('click', function (e) { if (!timone.contains(e.target) && !linkIg.contains(e.target)) apriTimone(false); });
  }

  // Domande frequenti (13/11): apertura e chiusura graduali, 800 ms con la curva dell'ancora; l'ancora e la catena seguono
  // il bordo di sotto. Si apre e si chiude cliccando in qualunque punto della riga fra le due linee (link esclusi, e non
  // quando si sta selezionando del testo); da tastiera resta il <summary>. Le risposte sono nell'HTML dall'inizio.
  document.querySelectorAll('.faq details').forEach(function (d) {
    var anim = null, aperta = d.open;
    var muovi = function (apri) {
      aperta = apri;
      if (ridotto || !d.animate) { d.open = apri; return; }
      var da = d.offsetHeight;
      if (anim) anim.cancel();
      d.classList.add('scorre'); d.classList.toggle('si-chiude', !apri);
      d.open = true;
      var a = apri ? d.offsetHeight : d.querySelector('summary').offsetHeight;
      anim = d.animate([{ height: da + 'px' }, { height: a + 'px' }], { duration: 800, easing: 'cubic-bezier(0.3, 0.7, 0.25, 1)' });
      anim.onfinish = function () { anim = null; d.open = apri; d.classList.remove('scorre', 'si-chiude'); };
    };
    d.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      if (!e.target.closest('summary') && String(getSelection())) return;
      e.preventDefault();
      muovi(!aperta);
    });
  });

  // Cappello che si disegna con due matite che lavorano insieme (13/11): data-matita="1" la parte di sopra, "2" il
  // riquadro di "DA ANNA". Ogni matita fa i suoi tratti uno dopo l'altro, mai due insieme, a velocità costante
  // (durata di ogni tratto proporzionale alla sua lunghezza); le due finiscono insieme in DISEGNO ms. Poi riempimento e
  // "DA ANNA". Il tratto ha spessore fisso a schermo (non-scaling-stroke), quindi le lunghezze del tratteggio si danno in
  // pixel di schermo (scala del CTM, rotazione compresa). Tre cappelli (.si-disegna): quello della hero parte a pagina
  // visibile; quelli sull'angolo della foto di Anna e nel footer quando arrivano a schermo, una volta sola.
  var DISEGNO = 2000;
  var disegna = function (svg) {
    if (svg.classList.contains('disegnato')) return;
    var tratti = svg.querySelectorAll('.tratto'), m = svg.getScreenCTM(), scala = Math.hypot(m.a, m.b), fine = DISEGNO, matite = {};
    tratti.forEach(function (t) {
      var k = t.getAttribute('data-matita'), L = t.getTotalLength() * scala;
      (matite[k] = matite[k] || { tot: 0, tratti: [] }).tratti.push([t, L]); matite[k].tot += L;
    });
    Object.keys(matite).forEach(function (k) {
      var mt = matite[k], r = 0;
      mt.tratti.forEach(function (x) {
        var t = x[0], L = x[1], d = DISEGNO * L / mt.tot;
        t.style.strokeDasharray = L + 'px ' + L + 'px';
        t.animate([{ strokeDashoffset: L + 'px' }, { strokeDashoffset: '0px' }], { duration: d, delay: r, easing: 'linear', fill: 'backwards' });
        r += d;
      });
    });
    svg.querySelectorAll('.cappello-pieno, .cappello-scritta').forEach(function (e) { e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: fine, easing: 'ease-out', fill: 'backwards' }); });
    svg.classList.add('disegnato');
    setTimeout(function () { tratti.forEach(function (t) { t.style.strokeDasharray = ''; }); }, fine + 100);
  };
  var daDisegnare = document.querySelectorAll('.si-disegna');
  if (!ridotto && document.documentElement.animate) {
    var pronti = function (svg) { (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { requestAnimationFrame(function () { disegna(svg); }); }); };
    daDisegnare.forEach(function (svg) {
      if (svg.classList.contains('cappello')) {   // hero: a pagina visibile
        if (document.visibilityState === 'visible') pronti(svg);
        else document.addEventListener('visibilitychange', function attendi() {
          if (document.visibilityState !== 'visible') return;
          document.removeEventListener('visibilitychange', attendi); pronti(svg);
        });
      } else if ('IntersectionObserver' in window) {   // foto e footer: quando sono a schermo (visibili almeno al 60%)
        var io = new IntersectionObserver(function (voci) {
          if (voci[0].intersectionRatio >= 0.6 && document.visibilityState === 'visible') { io.disconnect(); pronti(svg); }
        }, { threshold: [0, 0.6] });
        io.observe(svg);
      } else svg.classList.add('disegnato');
    });
  }

  // Conchiglia B in 3D (round 1, 12/11/2026): due valve a cupola unite dalla cerniera, mollusco rosato con la perla.
  // Si proietta con una telecamera a tre quarti (bocca girata verso destra, occhio 30° sopra). Le linee delle facce
  // girate dall'altra parte non si disegnano e la valva più lontana si disegna per prima.
  // Uso: var c = conchiglia3d(svg); c.angolo(gradi)  — 0 chiusa, ~105 aperta.
  function conchiglia3d(svg) {
    var NS = 'http://www.w3.org/2000/svg', rad = Math.PI / 180, S = 120;
    var phi = -40 * rad, alfa = 30 * rad;                       // bocca verso destra, vista dall'alto
    var R = [Math.cos(phi), 0, -Math.sin(phi)];                 // destra dello schermo
    var U = [-Math.sin(phi) * Math.sin(alfa), Math.cos(alfa), -Math.cos(phi) * Math.sin(alfa)]; // su dello schermo
    var D = [Math.sin(phi) * Math.cos(alfa), Math.sin(alfa), Math.cos(phi) * Math.cos(alfa)];   // verso chi guarda
    var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
    var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
    var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var pr = function (p) { return [dot(p, R) * S, -dot(p, U) * S]; };
    var f = function (v) { return v.toFixed(1); };

    // Valva: margine nel piano di chiusura (cerniera a t = 0, bordo davanti a t = π), cupola alta H sull'umbone.
    var margine = function (t) { return [0.62 * Math.sin(t), 0, (1 - Math.cos(t)) / 2]; };
    var superficie = function (H) {
      return function (s, t) { var m = margine(t); return [m[0] * s, H * Math.pow(Math.max(0, 1 - s * s), 0.7), 0.04 + (m[2] - 0.04) * s]; };
    };
    var sopra = superficie(0.24), sotto = superficie(-0.3);
    var ruota = function (p, th) { return [p[0], p[1] * Math.cos(th) + p[2] * Math.sin(th), -p[1] * Math.sin(th) + p[2] * Math.cos(th)]; };
    // normale esterna (verso l'alto per la valva di sopra, verso il basso per quella di sotto)
    var normale = function (sup, s, t, verso) {
      var e = 1e-3, a = sub(sup(Math.min(1, s + e), t), sup(Math.max(0, s - e), t)), b = sub(sup(s, t + e), sup(s, t - e)), n = cross(b, a);
      return n[1] * verso < 0 ? [-n[0], -n[1], -n[2]] : n;
    };

    // linee: costole dall'umbone al margine, linee di crescita parallele al margine
    var linee = function (sup, th, verso, soloVisibili) {
      var d = '', tratto = function (pts) {
        var aperto = false;
        pts.forEach(function (q) {
          var vis = !soloVisibili || dot(ruota(q.n, th), D) > 0, p = pr(ruota(q.p, th));
          if (vis) { d += (aperto ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); aperto = true; } else aperto = false;
        });
      };
      for (var k = 1; k < 10; k++) {
        var t = 0.35 + (Math.PI * 2 - 0.7) * (k - 1) / 8, pts = [];
        for (var i = 2; i <= 24; i++) { var s = i / 24; pts.push({ p: sup(s, t), n: normale(sup, s, t, verso) }); }
        tratto(pts);
      }
      [0.45, 0.68, 0.86].forEach(function (s) {
        var pts = [];
        for (var i = 0; i <= 48; i++) { var t = 0.3 + (Math.PI * 2 - 0.6) * i / 48; pts.push({ p: sup(s, t), n: normale(sup, s, t, verso) }); }
        tratto(pts);
      });
      return d;
    };
    // contorno di un insieme di punti proiettati (inviluppo convesso)
    var inviluppo = function (pts) {
      pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
      var giro = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
      var basso = [], alto = [];
      pts.forEach(function (p) { while (basso.length > 1 && giro(basso[basso.length - 2], basso[basso.length - 1], p) <= 0) basso.pop(); basso.push(p); });
      pts.slice().reverse().forEach(function (p) { while (alto.length > 1 && giro(alto[alto.length - 2], alto[alto.length - 1], p) <= 0) alto.pop(); alto.push(p); });
      var h = basso.slice(0, -1).concat(alto.slice(0, -1));
      return 'M' + h.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z';
    };
    var guscio = function (sup, th) {
      var pts = [];
      for (var i = 0; i <= 8; i++) for (var j = 0; j < 48; j++) pts.push(pr(ruota(sup(i / 8, Math.PI * 2 * j / 48), th)));
      return inviluppo(pts);
    };
    var bordo = function (th, scala, onda) {
      var d = '';
      for (var j = 0; j <= 96; j++) {
        var t = Math.PI * 2 * j / 96, m = margine(t), c = [0, 0, 0.5];
        var p = [c[0] + (m[0] - c[0]) * scala, (onda || 0) * Math.sin(t * 18), c[2] + (m[2] - c[2]) * scala], q = pr(ruota(p, th));
        d += (j ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]);
      }
      return d + 'Z';
    };
    var bordoVisibile = function (sup, th, verso) {
      var d = '', aperto = false;
      for (var j = 0; j <= 96; j++) {
        var t = Math.PI * 2 * j / 96, q = pr(ruota(sup(1, t), th)), vis = dot(ruota(normale(sup, 0.999, t, verso), th), D) > 0;
        if (vis) { d += (aperto ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]); aperto = true; } else aperto = false;
      }
      return d;
    };
    var ellissoide = function (c, r) {
      var pts = [];
      for (var i = 0; i <= 12; i++) for (var j = 0; j < 24; j++) {
        var u = Math.PI * i / 12, v = Math.PI * 2 * j / 24;
        pts.push(pr([c[0] + r[0] * Math.sin(u) * Math.cos(v), c[1] + r[1] * Math.cos(u), c[2] + r[2] * Math.sin(u) * Math.sin(v)]));
      }
      return inviluppo(pts);
    };
    var arco = function (z, larg, alt) {
      var d = '';
      for (var i = 0; i <= 16; i++) { var x = -larg + 2 * larg * i / 16, p = pr([x, alt * (1 - Math.pow(x / 0.42, 2)) - 0.05, z]); d += (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }
      return d;
    };

    // elementi (si creano una volta, poi si aggiornano solo i tracciati della valva di sopra)
    var nuovo = function (tag, cls, padre) { var e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); (padre || svg).appendChild(e); return e; };
    var id = 'bocca-' + Math.random().toString(36).slice(2, 7);
    var taglio = nuovo('clipPath', null, nuovo('defs')); taglio.id = id;
    nuovo('path', null, taglio).setAttribute('d', bordo(0, 1));
    var gSotto = nuovo('g', 'valva-sotto'), gSopra = nuovo('g', 'valva-sopra');
    nuovo('path', 'guscio fuori', gSotto).setAttribute('d', guscio(sotto, 0));
    nuovo('path', 'segni', gSotto).setAttribute('d', linee(sotto, 0, -1, true));
    nuovo('path', 'bocca dentro', gSotto).setAttribute('d', bordo(0, 1));
    var gMollusco = nuovo('g', 'mollusco-gruppo', gSotto); gMollusco.setAttribute('clip-path', 'url(#' + id + ')');
    nuovo('path', 'mollusco', gMollusco).setAttribute('d', ellissoide([0, -0.05, 0.5], [0.42, 0.1, 0.33]));
    nuovo('path', 'segni', gMollusco).setAttribute('d', arco(0.4, 0.26, 0.09) + arco(0.5, 0.32, 0.1));
    nuovo('path', 'frangia', gMollusco).setAttribute('d', bordo(0, 0.86, 0.012));
    var perla = pr([0.13, 0.065, 0.5]);
    var cp = nuovo('circle', 'perla', gMollusco); cp.setAttribute('cx', f(perla[0])); cp.setAttribute('cy', f(perla[1])); cp.setAttribute('r', '5.4');
    var cl = nuovo('circle', 'perla-luce', gMollusco); cl.setAttribute('cx', f(perla[0] - 1.6)); cl.setAttribute('cy', f(perla[1] - 1.6)); cl.setAttribute('r', '1.5');
    nuovo('path', 'bordo-valva', gSotto).setAttribute('d', bordo(0, 1));
    var sGuscio = nuovo('path', 'guscio', gSopra), sSegni = nuovo('path', 'segni', gSopra), sBordo = nuovo('path', 'bordo-valva', gSopra);

    var angolo = function (gradi) {
      var th = gradi * rad, fuori = dot(ruota([0, 1, 0], th), D) > 0;   // si vede la faccia esterna della valva di sopra?
      sGuscio.setAttribute('d', guscio(sopra, th));
      sGuscio.setAttribute('class', 'guscio ' + (fuori ? 'fuori' : 'dentro'));
      sSegni.setAttribute('d', linee(sopra, th, 1, fuori));
      sSegni.setAttribute('class', fuori ? 'segni' : 'segni tenui');
      sBordo.setAttribute('d', fuori ? bordoVisibile(sopra, th, 1) : bordo(th, 1));
      // la valva più lontana va disegnata prima
      var cSopra = dot(ruota(sopra(0.5, Math.PI), th), D), cSotto = dot(sotto(0.5, Math.PI), D);
      if ((cSopra < cSotto) !== (gSopra.nextSibling === gSotto)) svg.insertBefore(cSopra < cSotto ? gSopra : gSotto, cSopra < cSotto ? gSotto : gSopra);
    };
    // riquadro della conchiglia chiusa: fondo e bordo sinistro della valva di sotto, che resta ferma;
    // la valva di sopra, aprendosi, esce sopra il riquadro (overflow visibile)
    var limiti = function (gradiMax) {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, add = function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); };
      for (var g = 0; g <= gradiMax; g += 5) for (var i = 0; i <= 8; i++) for (var j = 0; j < 48; j++) add(pr(ruota(sopra(i / 8, Math.PI * 2 * j / 48), g * rad)));
      for (i = 0; i <= 8; i++) for (j = 0; j < 48; j++) add(pr(sotto(i / 8, Math.PI * 2 * j / 48)));
      return [x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2].map(f).join(' ');
    };
    return { angolo: angolo, limiti: limiti };
  }

  // Si apre (0° → 100°, 1,5 s) quando è visibile al 60%, resta aperta, si richiude senza animazione quando esce
  // dallo schermo. Movimento ridotto: già aperta.
  var svgConchiglia = document.querySelector('[data-conchiglia-3d]');
  if (svgConchiglia) {
    var c3d = conchiglia3d(svgConchiglia), apertura = 0, gradi = 0;
    svgConchiglia.setAttribute('viewBox', c3d.limiti(0));
    var porta = function (g) { gradi = g; c3d.angolo(g); };
    var apri = function () {
      if (apertura || gradi) return;
      var t0 = performance.now();
      var passo = function (t) {
        var k = Math.min(1, (t - t0) / 1500);
        porta(100 * (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2));
        apertura = k < 1 ? requestAnimationFrame(passo) : 0;
      };
      apertura = requestAnimationFrame(passo);
    };
    var chiudi = function () { cancelAnimationFrame(apertura); apertura = 0; porta(0); };
    if (ridotto || !('IntersectionObserver' in window)) porta(100);
    else {
      porta(0);
      new IntersectionObserver(function (voci) {
        voci.forEach(function (v) { if (v.intersectionRatio >= 0.6) apri(); else if (!v.isIntersecting) chiudi(); });
      }, { threshold: [0, 0.6] }).observe(svgConchiglia.parentNode);
    }
  }


  // Foto che scorrono (L10): più foto nello stesso riquadro, una alla volta, in dissolvenza ogni 5 s. La prima è già
  // visibile nell'HTML (classe "attiva"); con il movimento ridotto resta quella. I riquadri partono sfalsati.
  if (!ridotto) document.querySelectorAll('[data-scorrono]').forEach(function (box, n) {
    var foto = box.children, i = 0, ogni = +box.getAttribute('data-scorrono') || 5000;   // data-scorrono="3000": una foto ogni 3 s
    if (foto.length < 2) return;
    setTimeout(function () {
      setInterval(function () {
        if (document.hidden) return;
        foto[i].classList.remove('attiva'); i = (i + 1) % foto.length; foto[i].classList.add('attiva');
      }, ogni);
    }, n * 1700);
  });

  // Galleria dei piatti: scorre in orizzontale col dito, con la rotella o con le frecce (quasi una schermata alla volta).
  document.querySelectorAll('[data-piatti]').forEach(function (g) {
    var lista = g.querySelector('[data-piatti-lista]');
    var vai = function (verso) { lista.scrollBy({ left: verso * lista.clientWidth * 0.8, behavior: ridotto ? 'auto' : 'smooth' }); };
    g.querySelector('[data-piatti-prec]').addEventListener('click', function () { vai(-1); fermo(); });
    g.querySelector('[data-piatti-succ]').addEventListener('click', function () { vai(1); fermo(); });

    // 20/11/2026 (Gabriele): il nastro gira da solo, piano e sempre (20 px al secondo), partendo dal piatto con data-inizio.
    // Per girare senza fine la lista si ripete una volta (copie nascoste a lettori di schermo e tastiera); arrivato in fondo
    // all'originale torna indietro di una lista intera, e l'occhio non vede il salto. Si ferma sotto il mouse, col fuoco,
    // mentre si tocca o si scorre a mano e con la foto ingrandita aperta; riparte 3 s dopo. Con "riduci movimento": fermo.
    var fermo = function () {};
    if (ridotto || !window.requestAnimationFrame) return;
    var originali = [].slice.call(lista.children);
    originali.forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('data-copia', ''); c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('button, a').forEach(function (b) { b.tabIndex = -1; });
      lista.appendChild(c);
    });
    lista.setAttribute('data-gira', '');
    var giro = function () { return lista.children[originali.length].offsetLeft - originali[0].offsetLeft; };
    var inizio = lista.querySelector('[data-inizio]');
    var pos = inizio ? inizio.offsetLeft - originali[0].offsetLeft : 0, prima = 0, sopra = false, ripartenza = 0;
    lista.scrollLeft = pos;
    fermo = function () { ripartenza = performance.now() + 3000; };
    lista.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') sopra = true; });
    lista.addEventListener('pointerleave', function () { sopra = false; });
    ['pointerdown', 'wheel', 'touchmove', 'focusin'].forEach(function (t) { lista.addEventListener(t, fermo, { passive: true }); });
    // Gira dall'apertura della pagina, anche fuori schermo. Lo scorrimento del browser va a pixel interi e a 20 px/s
    // scatterebbe: la parte decimale la fa una traslazione dei piatti (--resto), così il moto è continuo.
    var passo = function (ora) {
      var dt = prima ? Math.min(ora - prima, 100) : 0; prima = ora;
      var aperta = document.querySelector('dialog[open]');
      if (sopra || aperta || ora < ripartenza || document.activeElement && lista.contains(document.activeElement)) {
        pos = lista.scrollLeft;   // riparte da dove l'ha lasciata la mano
        lista.style.setProperty('--resto', '0px');
      } else {
        var g2 = giro();
        pos += dt * 0.02;
        if (pos >= g2) pos -= g2;
        lista.scrollLeft = pos;
        lista.style.setProperty('--resto', (lista.scrollLeft - pos).toFixed(3) + 'px');
      }
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });

  // Foto ingrandita: ogni bottone con data-grande apre la sua foto nel <dialog data-lente> della pagina, con il nome
  // sotto. Frecce (anche da tastiera) per le altre foto dello stesso gruppo (data-gruppo); Esc, la X o un clic fuori chiudono.
  var lente = document.querySelector('[data-lente]');
  if (lente && lente.showModal) {
    var lenteImg = lente.querySelector('img'), lenteNome = lente.querySelector('[data-lente-nome]'), gruppo = [], quale = 0;
    var apriFoto = function (i) {
      quale = (i + gruppo.length) % gruppo.length;
      var b = gruppo[quale];
      lenteImg.src = b.getAttribute('data-grande'); lenteImg.alt = b.getAttribute('data-nome'); lenteNome.textContent = b.getAttribute('data-nome');
    };
    document.querySelectorAll('[data-grande]').forEach(function (b) {
      b.addEventListener('click', function () {
        // le copie del nastro (data-copia) non contano: una copia apre la foto del suo originale
        gruppo = [].filter.call((b.closest('[data-gruppo]') || document).querySelectorAll('[data-grande]'), function (x) { return !x.closest('[data-copia]'); });
        lente.toggleAttribute('data-sola', gruppo.length < 2);
        var i = gruppo.indexOf(b);
        if (i < 0) i = gruppo.findIndex(function (x) { return x.getAttribute('data-grande') === b.getAttribute('data-grande'); });
        apriFoto(i); lente.showModal();
      });
    });
    lente.querySelector('[data-lente-prec]').addEventListener('click', function () { apriFoto(quale - 1); });
    lente.querySelector('[data-lente-succ]').addEventListener('click', function () { apriFoto(quale + 1); });
    lente.querySelector('[data-lente-chiudi]').addEventListener('click', function () { lente.close(); });
    lente.addEventListener('click', function (e) { if (e.target === lente) lente.close(); });
    lente.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') apriFoto(quale + 1); else if (e.key === 'ArrowLeft') apriFoto(quale - 1); });
  }

  // Creature a tempo (pesci, meduse, polpi, cavallucci, barche), un solo requestAnimationFrame per tutte. Le misure si
  // prendono all'avvio e quando la pagina cambia misura; durante il movimento si leggono solo scrollY e innerHeight.
  // Ogni creatura è uno span dentro .acquario con l'id della sua fascia: data-pesce, data-medusa, data-polipo,
  // data-cavalluccio. data-telefono = c'è solo sotto i 768 px. data-fetta="1/2" = a telefono sta nella prima metà della
  // fascia (2/2 la seconda): un animale per schermata. Le barche: data-barca sulla pista della fascia.
  var acquario = document.querySelector('.acquario');
  if (!('IntersectionObserver' in window)) return;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var limita = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var liscia = function (t) { return t * t * (3 - 2 * t); };
  var giro = function (a) { return Math.atan2(Math.sin(a), Math.cos(a)); };
  var bez = function (p, t) { var u = 1 - t; return [0, 1].map(function (i) { return u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]; }); };
  var bezD = function (p, t) { var u = 1 - t; return [0, 1].map(function (i) { return 3 * u * u * (p[1][i] - p[0][i]) + 6 * u * t * (p[2][i] - p[1][i]) + 3 * t * t * (p[3][i] - p[2][i]); }); };
  var cima = function (el) { return el.getBoundingClientRect().top + scrollY; };
  var testata = document.querySelector('.testata'), altoTestata = 0;   // la navbar resta in cima: sotto di lei non si vede
  var W = 0, foto = [];   // foto: riquadri delle cornici in coordinate di pagina [sinistra, destra, sopra, sotto]
  var inAcquario = function (sel, attr, base) {
    return acquario ? [].map.call(acquario.querySelectorAll(sel), function (n) {
      var c = { n: n, s: document.getElementById(n.getAttribute(attr)), x: null, dietro: 0, attiva: false, soloTel: n.hasAttribute('data-telefono'), lato: n.getAttribute('data-lato'), fetta: (n.getAttribute('data-fetta') || '1/1').split('/').map(Number) };
      for (var k in base) c[k] = base[k];
      return c;
    }).filter(function (c) { return c.s; }) : [];
  };

  // Pesci: entrata veloce (tuffo di 1,3 s da fuori schermo a ~200 px dentro, poi frenata morbida), poi nuoto lento e
  // regolare (60 px/s) fino alla sosta in uno spazio libero; uscita in basso a destra quando il centro della sezione
  // supera il centro dello schermo; si azzerano quando la sezione esce dallo schermo.
  var pesci = inAcquario('[data-pesce]', 'data-pesce', { fase: 'attesa', a: 0, y: 0, visto: 0 });
  pesci.forEach(function (f) { f.x = 0; f.da = document.getElementById(f.n.getAttribute('data-pesce-da')); f.subito = f.s.classList.contains('hero-blu'); });
  // Medusa e polpo nuotano a spinte nella direzione della testa; il cavalluccio va dritto, su e giù, lontano dalla medusa.
  var meduse = inAcquario('[data-medusa]', 'data-medusa', { tipo: 'medusa', dir: -1, w: 0, p: 0, v0: 9, v1: 26, ritmo: 2.6 });
  meduse.forEach(function (m) { m.cupola = m.n.querySelector('.medusa-cupola'); m.tentacoli = m.n.querySelector('.medusa-tentacoli'); });
  var polpi = inAcquario('[data-polipo]', 'data-polipo', { tipo: 'polipo', dir: -1, w: 0, p: 0.4, v0: 7, v1: 20, ritmo: 3.2 });
  var cavallucci = inAcquario('[data-cavalluccio]', 'data-cavalluccio', { tipo: 'cavalluccio', vx: 8, vy: 0, vmax: 14, verso: 1, giro: 1 });
  cavallucci.forEach(function (c) { c.evita = function () { return meduse.filter(function (m) { return m.s === c.s && !m.spento; }).map(function (m) { return [m.x, m.y]; }).concat(pesci.filter(function (f) { return f.s === c.s && f.fase !== 'attesa' && f.fase !== 'fine'; }).map(function (f) { return [f.x, f.y]; })); }; });
  var nuotatori = meduse.concat(polpi), animali = nuotatori.concat(cavallucci);
  // Barche (13/11): una per ogni fascia con data-barca, ciascuna sulla propria onda. Se la pista è vuota la riempie qui
  // con il disegno #barca-disegno (basta l'attributo). Partono a schermo e sfalsate, così due barche non si muovono in coppia.
  var barche = [].map.call(document.querySelectorAll('[data-barca]'), function (pista, i) {
    pista.classList.add('barca-pista');
    if (!pista.querySelector('.barca')) pista.innerHTML = '<div class="barca-binario"><span class="barca"><svg viewBox="0 0 200 140"><use href="#barca-disegno"/></svg></span></div>';
    var onda = pista.parentNode.querySelector(':scope > .onda-bordo');
    return { n: pista.querySelector('.barca'), pista: pista, fr: onda && onda.querySelector('.onda-fronte'), di: onda && onda.querySelector('.onda-dietro'), x: null, i: i, y: null, a: 0, va: 0, r: 0, vr: 0, vy: 0, fase: i * 4.1, attiva: false };
  });

  // A telefono (13/11): niente strisce. Ogni animale ha la sua fetta di fascia e ci nuota dentro, anche SOTTO i testi
  // (l'acquario sta sotto il contenuto), ma mai dietro foto, bottoni, pillole, mappe e riquadri: sono ostacoli pieni.
  var OSTACOLI = '.cornice-foto, .bottone, .mappa, .pillole, .riquadro, .menu-card, .percorso-card, .piatti, .indicazioni-lista';
  var tocca = function (c, x, y) {   // quanto il corpo (cerchio di raggio c.rag) entra nell'ostacolo più vicino; 0 = libero
    var m = 0;
    c.ost.forEach(function (R) { var d = Math.hypot(Math.max(R[0] - x, 0, x - R[1]), Math.max(R[2] - y, 0, y - R[3])); if (d < c.rag) m = Math.max(m, c.rag - d); });
    return m;
  };
  var postoLibero = function (c, Z) {   // il punto di Z (se manca: la sua zona) più lontano da ostacoli e bordi
    Z = Z || c.zona;
    var best = [(Z[0] + Z[1]) / 2, (Z[2] + Z[3]) / 2], bd = -1, rag = c.rag || c.r;
    // a computer gli ostacoli sono le foto e gli altri animali della stessa fascia
    var ost = c.ost || foto.concat(animali.filter(function (o) { return o !== c && o.s === c.s && o.x !== null; }).map(function (o) { return [o.x - o.r, o.x + o.r, o.y - o.r, o.y + o.r]; }));
    for (var y = Z[2] + rag; y <= Z[3] - rag; y += 12) for (var x = Z[0] + rag; x <= Z[1] - rag; x += 12) {
      var d = Math.min(x - Z[0], Z[1] - x, y - Z[2], Z[3] - y);
      ost.forEach(function (R) { d = Math.min(d, Math.hypot(Math.max(R[0] - x, 0, x - R[1]), Math.max(R[2] - y, 0, y - R[3]))); });
      if (d > bd) { bd = d; best = [x, y]; }
    }
    return best.concat(bd);
  };
  // dove parte ogni animale (a computer e tablet: i posti della home del 12–13/11)
  var colloca = function (c) {
    var Z = c.zona, striscia = Z[3] - Z[2] < 2 * c.r;
    if (c.ost || (!c.fascia && !striscia)) { var p = postoLibero(c); c.x = p[0]; c.y = p[1]; c.dir = c.ost ? 0 : -Math.PI / 2; return; }   // telefono, o computer senza fasce libere ai lati
    if (c.tipo === 'medusa') { c.x = (Z[0] + Z[1]) / 2; c.y = c.fascia ? c.top + c.h * 0.6 : (Z[2] + Z[3]) / 2; c.dir = striscia ? 0 : -Math.PI / 2; }
    else if (c.tipo === 'cavalluccio') { c.x = (Z[0] + Z[1]) / 2 + (c.fascia ? 0 : W * 0.25); c.y = c.top + c.h * 0.4; }
    else {   // polpo: nella striscia parte a destra (il pesce entra da sinistra); fra 1024 e 1439 px a sinistra, lontano dalla foto
      c.x = (Z[0] + Z[1]) / 2 + (c.fascia ? 0 : striscia ? W * 0.25 : -W * 0.25); c.y = striscia ? (Z[2] + Z[3]) / 2 : c.top + c.h * 0.6; c.dir = striscia ? Math.PI : -Math.PI / 2;
    }
  };

  var misura = function () {
    W = document.documentElement.clientWidth; altoTestata = testata ? testata.offsetHeight : 0;
    foto = [].map.call(document.querySelectorAll('.cornice-foto, .mappa, .menu-card, .percorso-card, .piatti-lista'), function (e) { var r = e.getBoundingClientRect(); return [r.left - 8, r.right + 8, r.top + scrollY - 8, r.bottom + scrollY + 8]; });   // + la cornice oro (7 px fuori)
    pesci.forEach(function (f) {
      f.top = cima(f.s); f.h = f.s.offsetHeight; f.w2 = f.n.offsetWidth / 2; f.h2 = f.n.offsetHeight / 2;
      if (f.da) f.daFine = cima(f.da) + f.da.offsetHeight;
      // sosta: a computer nella fascia libera a destra del contenuto (se è larga almeno 140 px), altrimenti nello spazio
      // libero in alto a destra della sezione; sotto i 1024 px nel margine sotto il contenuto
      var cont = f.s.querySelector('.contenuto'), banda = cont.getBoundingClientRect().left + parseFloat(getComputedStyle(cont).paddingLeft);
      if (W < 1024) f.sosta = [W * 0.5, f.top + f.h - parseFloat(getComputedStyle(f.s).paddingBottom) / 2];
      else if (banda >= 140) f.sosta = [W - banda / 2, f.top + f.h * 0.5];
      else f.sosta = [W - banda - 70, f.top + 48];
      f.previsto = linea(curveEntrata(f));   // dove passerà entrando: medusa e polpo ci stanno lontani anche prima
    });
    animali.forEach(function (c) {
      c.top = cima(c.s); c.h = c.s.offsetHeight; c.w2 = c.n.offsetWidth / 2; c.h2 = c.n.offsetHeight / 2; c.r = Math.max(c.w2, c.h2);
      c.spento = c.soloTel && W >= 768;
      var cont = c.s.querySelector('.contenuto'), banda = cont.getBoundingClientRect().left + parseFloat(getComputedStyle(cont).paddingLeft);
      var st = getComputedStyle(c.s), pt = parseFloat(st.paddingTop), pb = parseFloat(st.paddingBottom), modo = W < 768 ? 'tel' : 'pc';
      c.fascia = W >= 1024 && banda >= 140; c.ost = null;
      var lato = (c.lato || (c.tipo === 'cavalluccio' ? 'dx' : 'sx')) === 'dx' ? [W - banda + 12, W - 12] : [12, banda - 12];   // data-lato="sx|dx": in quale fascia libera sta
      if (modo === 'tel') {
        c.zona = [8, W - 8, c.top + c.h * (c.fetta[0] - 1) / c.fetta[1] + 6, c.top + c.h * c.fetta[0] / c.fetta[1] - 6];
        c.rag = c.r + 4;
        c.ost = [].map.call(c.s.querySelectorAll(OSTACOLI), function (e) { var q = e.getBoundingClientRect(), m = e.classList.contains('cornice-foto') ? 8 : 0; return [q.left - m, q.right + m, q.top + scrollY - m, q.bottom + scrollY + m]; });
        if (postoLibero(c)[2] < c.rag) c.zona = [8, W - 8, c.top + 6, c.top + c.h - 6];   // nella sua metà non c'è posto: tutta la fascia
      } else if (c.tipo === 'medusa') {
        // la fascia vuota a sinistra del contenuto, se è larga almeno 140 px; fra 1024 e 1371 px tutta la sezione, come polpo e
        // cavalluccio (13/11 sera); sotto i 1024 px il margine sotto il contenuto (lì nuota in orizzontale)
        c.zona = c.fascia ? [lato[0], lato[1], c.top + 20, c.top + c.h - 20]
          : W < 1024 ? [12, W - 12, c.top + c.h - pb + 8, c.top + c.h - 8] : [12, W - 12, c.top + 20, c.top + c.h - 20];
      } else if (c.tipo === 'cavalluccio') {
        // la fascia libera a destra (la medusa sta a sinistra); fra 1024 e 1439 px tutta la sezione, sotto il contenuto; sotto i 1024 px la striscia sopra la foto
        c.zona = c.fascia ? [lato[0], lato[1], c.top + 20, c.top + c.h - 20]
          : W < 1024 ? [12, W - 12, c.top + pt / 2, c.top + pt / 2] : [12, W - 12, c.top + 20, c.top + c.h - 20];
      } else {
        // polpo: la fascia libera a sinistra (il pesce sosta a destra); fra 1024 e 1439 px tutta la sezione; sotto i 1024 px la striscia sopra la foto
        c.zona = c.fascia ? [lato[0], lato[1], c.top + 20, c.top + c.h - 20]
          : W < 1024 ? [12, W - 12, c.top + pt / 2, c.top + pt / 2] : [12, W - 12, c.top + 20, c.top + c.h - 20];
      }
      // posto di partenza: la prima volta, quando si passa da telefono a computer, o se a telefono la pagina si è mossa sotto di lui
      if (c.x === null || c.modo !== modo || (c.ost && (tocca(c, c.x, c.y) > 0 || c.y < c.zona[2] || c.y > c.zona[3]))) colloca(c);
      c.modo = modo;
    });
    if (barche[0] && barche[0].fr) { var altoOnda = barche[0].fr.getBoundingClientRect().height; ondaScala = altoOnda / 40; ondaCima = 1 - altoOnda; ondaLargo = barche[0].fr.getBoundingClientRect().width || 2 * W; }
    barche.forEach(function (bc) { bc.w = bc.n.offsetWidth; bc.h = bc.n.offsetHeight; bc.cima = bc.pista.offsetTop; if (bc.x === null) bc.x = W * (bc.i % 2 ? 0.45 : 0.12); });   // partono già a schermo, sfalsate
  };
  var colora = function (f, x, y, a, op) {
    var mix = f.da ? liscia(limita((y - (f.top - 35)) / 70, 0, 1)) : 1; // 0 = sulla fascia bianca, 1 = sul blu
    f.n.style.color = 'rgba(' + Math.round(lerp(0, 255, mix)) + ',' + Math.round(lerp(37, 255, mix)) + ',' + Math.round(lerp(88, 255, mix)) + ',' + lerp(1, 0.9, mix).toFixed(2) + ')';
    f.n.style.opacity = (op * lerp(0.12, 0.18, mix)).toFixed(3);
    f.n.style.transform = 'translate(' + (x - f.w2).toFixed(1) + 'px,' + (y - f.h2).toFixed(1) + 'px) rotate(' + a.toFixed(3) + 'rad)';
  };
  var VEL = 60, RAMPA = 1.6, TUFFO = 1.3;
  var linea = function (curve) { var pts = []; curve.forEach(function (c) { for (var k = 0; k <= 24; k++) pts.push(bez(c, k / 24)); }); return pts; };
  // percorso fatto di curve: tabella lunghezza → (curva, parametro), calcolata all'avvio di ogni tratto (niente letture di layout dopo)
  var prepara = function (f, curve) {
    var tab = [[0, 0, 0]], L = 0, q = bez(curve[0], 0);
    curve.forEach(function (c, i) {
      for (var k = 1; k <= 80; k++) { var p = bez(c, k / 80); L += Math.hypot(p[0] - q[0], p[1] - q[1]); tab.push([L, i, k / 80]); q = p; }
      if (!i) f.LA = L;
    });
    f.curve = curve; f.tab = tab; f.L = L; f.ultima = curve[curve.length - 1]; f.linea = linea(curve);
  };
  var punto = function (f, d) {
    var tab = f.tab, lo = 0, hi = tab.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (tab[mid][0] < d) lo = mid; else hi = mid; }
    var a = tab[lo], b = tab[hi], k = (d - a[0]) / Math.max(1e-6, b[0] - a[0]), u = a[1] === b[1] ? a[2] + (b[2] - a[2]) * k : b[2] * k, c = f.curve[b[1]];
    return [bez(c, u), bezD(c, u)];
  };
  var rampa = function (x, ta) { return VEL * (x / 2 - ta / (2 * Math.PI) * Math.sin(Math.PI * x / ta)); };
  // entrata: la prima curva in TUFFO secondi, con la velocità che scende morbida fino a 60 px/s; poi 60 px/s e arrivo dolce
  var profiloEntrata = function (f) {
    var LA = f.LA, LB = f.L - LA, v0 = VEL + 3 * (LA - VEL * TUFFO) / TUFFO, ta = Math.min(RAMPA, 2 * LB / VEL), TB = (LB - VEL * ta / 2) / VEL + ta;
    f.T = TUFFO + TB;
    f.prof = function (t) {
      if (t <= 0) return 0;
      if (t < TUFFO) return VEL * t + (v0 - VEL) * TUFFO / 3 * (1 - Math.pow(1 - t / TUFFO, 3));
      var r = t - TUFFO;
      return r >= TB ? f.L : LA + (r < TB - ta ? VEL * r : LB - rampa(TB - r, ta));
    };
  };
  // uscita: partenza dolce, 60 px/s
  var profiloUscita = function (f) {
    var ta = Math.min(RAMPA, f.L / VEL);
    f.T = f.L / VEL + ta;
    f.prof = function (t) {
      if (t <= 0) return 0;
      if (t >= f.T) return f.L;
      if (t < ta) return rampa(t, ta);
      if (t > f.T - ta) return f.L - rampa(f.T - t, ta);
      return VEL * ta / 2 + VEL * (t - ta);
    };
  };
  var curveEntrata = function (f) {
    var C = f.sosta, dx = Math.min(200, W * 0.45), D = [dx, f.top + (f.da ? 90 : 110)];
    // tuffo: Filosofia entra da fuori schermo in alto a sinistra; Dove siamo parte in basso a sinistra di Recensioni e si tuffa nel blu
    var A = f.da ? [[-140, f.daFine - 160], [-10, f.daFine - 150], [dx * 0.6, f.top + 20], D]
                 : [[-140, f.top + 40], [-20, f.top + 40], [dx * 0.6, f.top + 100], D];
    var g = Math.hypot(D[0] - A[2][0], D[1] - A[2][1]), u = [(D[0] - A[2][0]) / g, (D[1] - A[2][1]) / g];
    return [A, [D, [D[0] + u[0] * 160, D[1] + u[1] * 160], [C[0] - Math.min(220, W * 0.35), C[1] - 30], C]];
  };
  var entra = function (f, t) {
    var curve = curveEntrata(f), A = curve[0];
    prepara(f, curve); profiloEntrata(f);
    f.fase = 'entra'; f.t0 = t; f.coda = f.passato;
    f.a = Math.atan2(A[1][1] - A[0][1], A[1][0] - A[0][0]);
  };
  var esce = function (f, t) {
    var d = [Math.cos(f.dirSosta), Math.sin(f.dirSosta)];
    prepara(f, [[[f.x, f.y], [f.x + d[0] * 120, f.y + d[1] * 120], [Math.max(f.x + 100, W + 40), f.top + f.h - 80], [Math.max(f.x + 200, W + 140), f.top + f.h - 30]]]);
    profiloUscita(f);
    f.fase = 'esce'; f.t0 = t;
  };
  var azzera = function (f) { f.fase = 'attesa'; f.coda = false; f.n.style.opacity = '0'; };
  var muoviPesce = function (f, t, dt) {
    if (f.fase === 'attesa' || f.fase === 'fine') return false;
    var x, y, dir, op = 1;
    if (f.fase === 'sosta') {
      var s = (t - f.t0) / 1000, avanti = 5 * (1 - Math.cos(s * Math.PI * 2 / 4)), su = 2.5 * Math.sin(s * Math.PI * 2 / 2.6);
      x = f.fermo[0] + Math.cos(f.dirSosta) * avanti - Math.sin(f.dirSosta) * su;
      y = f.fermo[1] + Math.sin(f.dirSosta) * avanti + Math.cos(f.dirSosta) * su;
      dir = f.dirSosta;
    } else {
      var sec = (t - f.t0) / 1000, d = f.prof(sec), q = punto(f, d), p = q[0], v = q[1];
      x = p[0]; y = p[1]; dir = Math.atan2(v[1], v[0]);
      op = f.fase === 'entra' ? Math.min(1, d / 80) : Math.min(1, (f.L - d) / 80);
      if (sec >= f.T) {
        if (f.fase === 'esce') { f.fase = 'fine'; f.n.style.opacity = '0'; return false; }
        f.dirSosta = limita(Math.atan2(f.ultima[3][1] - f.ultima[2][1], f.ultima[3][0] - f.ultima[2][0]), -0.5, 0.5);
        f.fermo = [x, y]; f.x = x; f.y = y;
        if (f.coda) esce(f, t); else { f.fase = 'sosta'; f.t0 = t; }
      }
    }
    f.x = x; f.y = y;
    var tuffo = f.fase === 'entra' && (t - f.t0) / 1000 < TUFFO;
    f.a += giro(limita(dir, -0.9, 0.9) - f.a) * Math.min(1, dt * (tuffo ? 5 : 1.5)); // il corpo gira piano (un po' più svelto nel tuffo)
    colora(f, x, y, f.a, op);
    return true;
  };

  // Medusa e polpo (13/11): avanzano SOLO nella direzione in cui punta la testa (cupola, mantello), a spinte (si contrae,
  // avanza, poi scivola); per cambiare direzione girano tutto il corpo, piano (al massimo ~50 gradi al secondo), e possono
  // puntare ovunque, anche a testa in giù. Mai di lato o all'indietro: la posizione non viene mai bloccata di lato; se il
  // passo li porterebbe fuori dalla zona (o sul percorso del pesce, o dentro un ostacolo a telefono) non avanzano e
  // intanto girano. Ai bordi curvano prima di arrivarci. Stanno lontani dal percorso del pesce quando il pesce è a schermo
  // (e da quello che farà entrando). A computer escono da dietro una foto con una spinta che cresce col tempo.
  var impulso = function (p) { return p < 0.22 ? Math.sin(p / 0.22 * Math.PI / 2) : p < 0.55 ? Math.cos((p - 0.22) / 0.33 * Math.PI / 2) : 0; };
  var distSeg = function (p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], t = limita(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return [Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy), a[0] + t * dx, a[1] + t * dy]; };
  var tagliaSeg = function (p, q, a, b) {
    var d = function (o, u, v) { return (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]); };
    return d(p, q, a) * d(p, q, b) < 0 && d(a, b, p) * d(a, b, q) < 0;
  };
  // percorsi dei pesci della stessa sezione: quello che stanno facendo, o quello che faranno entrando
  var percorsi = function (c) {
    var out = [];
    pesci.forEach(function (f) {
      if (f.s !== c.s || f.fase === 'fine' || !f.previsto) return;
      if (f.fase === 'attesa') out.push(f.previsto);
      else if (f.fase === 'sosta') out.push([f.fermo, f.fermo]);
      else out.push(f.linea.concat([[f.x, f.y]]));
    });
    return out;
  };
  var vicino = function (c, p) {   // punto più vicino sui percorsi: [distanza, x, y]
    var best = [Infinity, 0, 0];
    percorsi(c).forEach(function (L) { for (var i = 1; i < L.length; i++) { var d = distSeg(p, L[i - 1], L[i]); if (d[0] < best[0]) best = d; } });
    return best;
  };
  var incrocia = function (c, p, q) {
    return percorsi(c).some(function (L) { for (var i = 1; i < L.length; i++) if (tagliaSeg(p, q, L[i - 1], L[i])) return true; return false; });
  };
  // dietro una foto? Conta i secondi di fila e dà la direzione per uscirne dal lato più vicino che sta nella zona
  var dietroFoto = function (c, dt, rag, x0, x1, y0, y1) {
    var via = null, sotto = false;
    foto.forEach(function (R) {
      if (c.x + rag > R[0] - 24 && c.x - rag < R[1] + 24 && c.y + rag > R[2] - 24 && c.y - rag < R[3] + 24) {
        if (c.x + rag > R[0] && c.x - rag < R[1] && c.y + rag > R[2] && c.y - rag < R[3]) sotto = true;
        var uscite = [[R[0] - rag - 24, c.y, -1, 0], [R[1] + rag + 24, c.y, 1, 0], [c.x, R[2] - rag - 24, 0, -1], [c.x, R[3] + rag + 24, 0, 1]];
        var dentro = uscite.filter(function (u) { return u[0] >= x0 && u[0] <= x1 && u[1] >= y0 && u[1] <= y1; });
        (dentro.length ? dentro : uscite).forEach(function (u) { var d = Math.hypot(u[0] - c.x, u[1] - c.y); if (!via || d < via[2]) via = [u[2], u[3], d]; });
      }
    });
    c.dietro = sotto ? c.dietro + dt : 0;
    return via;
  };

  var nuota = function (c, dt, sy, vh) {
    c.p = (c.p + dt / c.ritmo) % 1;
    var spinta = c.p < 0.18 ? c.p / 0.18 : Math.exp(-(c.p - 0.18) * 3.4), v = c.v0 + c.v1 * spinta;
    var Z = c.zona, r = c.r, x0 = Z[0] + r, x1 = Math.max(x0, Z[1] - r), y0 = Z[2] + r, y1 = Math.max(y0, Z[3] - r), striscia = Z[3] - Z[2] < 2 * r;
    if (striscia) y0 = y1 = (Z[2] + Z[3]) / 2;                                           // striscia bassa: testa a destra o a sinistra
    var v0 = Math.max(y0, sy + r + 20), v1 = Math.min(y1, sy + vh - r - 20);
    if (!striscia && v1 - v0 > 260) { y0 = v0; y1 = v1; }                                // dentro la parte visibile, se ce n'è abbastanza
    // dove vorrebbe andare: la sua direzione, piegata a caso piano piano
    c.w = limita((c.w + (Math.random() - 0.5) * 1.2 * dt) * Math.pow(0.6, dt), -0.35, 0.35);
    var vx = Math.cos(c.dir + c.w), vy = Math.sin(c.dir + c.w);
    var zx = Math.min(120, Math.max(20, (x1 - x0) / 2)), zy = Math.min(120, Math.max(20, (y1 - y0) / 2));
    vx += 2 * (Math.max(0, (x0 + zx - c.x) / zx) - Math.max(0, (c.x - (x1 - zx)) / zx));
    if (!striscia) vy += 2 * (Math.max(0, (y0 + zy - c.y) / zy) - Math.max(0, (c.y - (y1 - zy)) / zy));
    if (c.ost) {   // telefono: si tiene lontano dagli ostacoli (comincia a girare 50 px prima)
      c.ost.forEach(function (R) {
        var qx = limita(c.x, R[0], R[1]), qy = limita(c.y, R[2], R[3]), d = Math.hypot(c.x - qx, c.y - qy);
        if (d < c.rag + 50 && d > 0) { var k = 3 * (c.rag + 50 - d) / 50; vx += (c.x - qx) / d * k; vy += (c.y - qy) / d * k; }
      });
    } else {
      var fu = dietroFoto(c, dt, r * 0.6, x0, x1, y0, y1);
      if (fu) { vx += fu[0] * 1.5 * (1 + c.dietro); vy += fu[1] * 1.5 * (1 + c.dietro); }
    }
    var pv = vicino(c, [c.x, c.y]), CL = r + 40;
    if (pv[0] < CL + 120) { var d = pv[0] || 1, k = 3 * (CL + 120 - pv[0]) / 120; vx += (c.x - pv[1]) / d * k; vy += (c.y - pv[2]) / d * k; }
    // fuori dalla zona (la pagina ha cambiato misura dopo il caricamento, o la parte visibile si è spostata): torna dentro,
    // girandosi verso la zona; nella striscia la testa punta a destra o a sinistra solo quando c'è già dentro
    var ox = c.x < x0 ? x0 - c.x : c.x > x1 ? x1 - c.x : 0, oy = c.y < y0 - 4 ? y0 - c.y : c.y > y1 + 4 ? y1 - c.y : 0;
    if (ox || oy) { var dd = Math.hypot(ox, oy); vx += ox / dd * 4; vy += oy / dd * 4; }
    else if (striscia) vy = 0;
    var e = giro(Math.atan2(vy, vx) - c.dir);
    c.dir = giro(c.dir + limita(e, -0.9 * dt, 0.9 * dt));
    // avanza solo dove punta la testa; rallenta mentre gira; se il passo lo porta fuori zona, sul percorso del pesce o dentro un ostacolo, gira sul posto
    var passo = v * dt * limita(Math.cos(e), 0.15, 1), nx = c.x + Math.cos(c.dir) * passo, ny = c.y + Math.sin(c.dir) * passo;
    var fuori = function (x, y) { return Math.max(0, x0 - x, x - x1) + Math.max(0, y0 - 4 - y, y - y1 - 4); };
    var nv = vicino(c, [nx, ny])[0];
    if (fuori(nx, ny) <= fuori(c.x, c.y) + 1e-6 && !incrocia(c, [c.x, c.y], [nx, ny]) && !(nv < CL && nv < pv[0]) && !(c.ost && tocca(c, nx, ny) > tocca(c, c.x, c.y) + 1e-6)) { c.x = nx; c.y = ny; }
    c.n.style.transform = 'translate(' + (c.x - c.w2).toFixed(1) + 'px,' + (c.y - c.h2).toFixed(1) + 'px) rotate(' + (c.dir + Math.PI / 2).toFixed(3) + 'rad)';
    if (c.cupola) {   // medusa: la cupola si contrae a ogni spinta
      var k1 = impulso(c.p), k2 = impulso((c.p + 0.88) % 1);
      c.cupola.style.transform = 'scale(' + (1 - 0.12 * k1).toFixed(3) + ',' + (1 + 0.07 * k1).toFixed(3) + ')';
      c.tentacoli.style.transform = 'scale(' + (1 - 0.1 * k2).toFixed(3) + ',' + (1.04 - 0.08 * k2).toFixed(3) + ') skewX(' + (3 * Math.sin(c.p * Math.PI * 2)).toFixed(2) + 'deg)';
    }
  };

  // Sempre in vista (Gabriele, 13/11 sera): quando l'animale è fuori dallo schermo (almeno per metà) e nella parte visibile della sua
  // zona c'è posto per lui, ricompare lì in dissolvenza (500 ms, CSS). Così, quando una fascia entra a schermo, i suoi
  // animali ci sono già dopo i primi ~200 px. Nelle strisce del tablet non serve: la striscia o si vede o no.
  var riporta = function (c, sy, vh) {
    var Z = c.zona, r = c.r, a = Math.max(Z[2], sy + altoTestata + 8), b = Math.min(Z[3], sy + vh - 8);
    if (Z[3] - Z[2] < 2 * r) return;   // striscia del tablet
    // serve il posto per tutto il corpo; nelle fasce basse (In televisione di Chi Sono) basta il 45% della zona, così a metà fascia c'è già
    if (b - a < Math.min(2 * r + 16, (Z[3] - Z[2]) * 0.45) || (c.y > sy + altoTestata && c.y < sy + vh)) return;   // in vista = il suo centro è a schermo
    var p = c.fascia ? [c.x, c.y > b ? b - r - 8 : a + r + 8, r] : postoLibero(c, [Z[0], Z[1], a, b]);
    if (p[2] < (c.ost ? c.rag : r * 0.6)) return;   // nella parte visibile non c'è posto: resta dov'è
    c.x = p[0]; c.y = p[1]; c.dietro = 0;
    c.n.style.transition = 'none'; c.n.style.opacity = '0'; c.torna = true;   // al fotogramma dopo si riaccende (ciclo)
  };

  // Cavalluccio: nuoto a caso, lento, dentro la parte visibile della sua zona e lontano dalla medusa (c.evita); sempre
  // dritto, va su e giù e si gira specchiandosi quando cambia verso. Nella striscia sopra la foto (tablet) il centro sta
  // sulla linea della striscia; a computer, se passa dietro una foto, ne esce verso il lato libero più vicino (40 px/s, fino
  // a 100 se ci resta); a telefono gli ostacoli sono pieni: se il passo lo porterebbe dentro, rimbalza piano.
  var vaga = function (c, dt, sy, vh, t) {
    var Z = c.zona, x0 = Z[0] + c.w2, x1 = Math.max(x0, Z[1] - c.w2), y0 = Z[2] + c.h2, y1 = Math.max(y0, Z[3] - c.h2);
    if (Z[3] - Z[2] < 2 * c.h2) y0 = y1 = (Z[2] + Z[3]) / 2;
    var v0 = Math.max(y0, sy + c.h2 + 20), v1 = Math.min(y1, sy + vh - c.h2 - 20);
    if (v1 - v0 > 160) { y0 = v0; y1 = v1; }
    var vm = c.fuga ? 100 : c.vmax;   // mentre esce da dietro una foto può andare più svelto
    c.vx = limita(c.vx + (Math.random() - 0.5) * 14 * dt, -vm, vm);
    c.vy = limita(c.vy + (Math.random() - 0.5) * 10 * dt, -(c.fuga ? 100 : 9), c.fuga ? 100 : 9);
    var bordo = 60;
    if (c.x < x0 + bordo) c.vx += (x0 + bordo - c.x) / bordo * 12 * dt;
    if (c.x > x1 - bordo) c.vx -= (c.x - x1 + bordo) / bordo * 12 * dt;
    if (c.y < y0 + bordo) c.vy += (y0 + bordo - c.y) / bordo * 10 * dt;
    if (c.y > y1 - bordo) c.vy -= (c.y - y1 + bordo) / bordo * 10 * dt;
    c.evita().forEach(function (o) { var dx = c.x - o[0], dy = c.y - o[1], dd = Math.hypot(dx, dy) || 1; if (dd < 170) { c.vx += dx / dd * (170 - dd) / 170 * 30 * dt; c.vy += dy / dd * (170 - dd) / 170 * 30 * dt; } });
    var nx, ny;
    if (c.ost) {
      c.ost.forEach(function (R) {
        var qx = limita(c.x, R[0], R[1]), qy = limita(c.y, R[2], R[3]), d = Math.hypot(c.x - qx, c.y - qy);
        if (d < c.rag + 40 && d > 0) { c.vx += (c.x - qx) / d * (c.rag + 40 - d) / 40 * 30 * dt; c.vy += (c.y - qy) / d * (c.rag + 40 - d) / 40 * 30 * dt; }
      });
      nx = limita(c.x + c.vx * dt, x0, x1); ny = limita(c.y + c.vy * dt, y0, y1);
      var t0 = tocca(c, c.x, c.y) + 1e-6;
      if (tocca(c, nx, ny) > t0) {
        if (tocca(c, nx, c.y) <= t0) { ny = c.y; c.vy *= -0.5; } else if (tocca(c, c.x, ny) <= t0) { nx = c.x; c.vx *= -0.5; } else { nx = c.x; ny = c.y; c.vx *= -0.5; c.vy *= -0.5; }
      }
    } else {
      // vicino o dietro una foto: va verso il lato libero più vicino, a 40 px/s, e più svelto (fino a 100) quanto più ci resta
      var fu = dietroFoto(c, dt, Math.min(c.w2, c.h2), x0, x1, y0, y1);
      c.fuga = !!fu;
      if (fu) { var k = Math.min(1, dt * (3 + 4 * c.dietro)), sv = Math.min(100, 40 + 30 * c.dietro); c.vx += (fu[0] * sv - c.vx) * k; c.vy += (fu[1] * sv - c.vy) * k; }
      nx = limita(c.x + c.vx * dt, x0, x1); ny = limita(c.y + c.vy * dt, y0, y1);
    }
    c.x = nx; c.y = ny;
    var su = (W < 1024 ? 3 : 5) * Math.sin(t / 1000 * Math.PI * 2 / 3.4);
    if (c.vx > 2) c.verso = 1; else if (c.vx < -2) c.verso = -1;
    c.giro += (c.verso - c.giro) * Math.min(1, dt * 2.2);
    c.n.style.transform = 'translate(' + (c.x - c.w2).toFixed(1) + 'px,' + (c.y + su - c.h2).toFixed(1) + 'px) scaleX(' + c.giro.toFixed(3) + ')';
  };

  // Barca: da un bordo all'altro della pagina, DIETRO le onde di Il locale e dietro la foto che sporge (z-index nel CSS).
  // In ogni istante la superficie si calcola dalla forma delle due onde (tracciati di index.html: tratti di 180 unità su
  // 2880, ampiezza 8,75 e 11,25) e da quanto sono scivolate (la durata si legge dalle loro animazioni CSS): l'acqua è la
  // più alta delle due, che è proprio quella che si vede.
  var ondaCima = -27, ondaScala = 0.7, ondaLargo = 0;   // ondaLargo: larghezza del disegno dell'onda (2 schermi a computer, 6 a telefono)   // il disegno dell'onda è alto 28 px (14 a telefono, dal CSS): misura() li rilegge
  var scivolata = function (el, inverso) {
    var an = el && el.getAnimations ? el.getAnimations()[0] : null;
    if (!an) return 0;
    var durata = an.effect.getComputedTiming().duration, k = ((an.currentTime || 0) % durata) / durata;
    return -(ondaLargo || 2 * W) / 2 * (inverso ? 1 - k : k);
  };
  var acqua = function (x, sf, sd) {
    var onda = function (off, base, amp, primaGiu) { var u = (x - off) * 2880 / (ondaLargo || 2 * W), k = Math.floor(u / 180), q = u / 180 - k; return base + (primaGiu ? 1 : -1) * ((k & 1) ? -1 : 1) * 2 * amp * q * (1 - q); };
    return ondaCima + Math.min(onda(sf, 27, 8.75, true), onda(sd, 22, 11.25, false)) * ondaScala;   // px dalla cima della sezione
  };
  // Oscillazione (13/11): lenta e con inerzia. Beccheggio = pendenza media dell'acqua sotto lo scafo (minimi quadrati su 9
  // punti) più due onde lentissime, seguita da una molla smorzata (~0,35 Hz): la barca arriva con un piccolo ritardo, mai a
  // scatti. Rollio (l'albero che si accorcia di poco: la barca si piega verso chi guarda o dall'altra parte) da due onde
  // lente e dal beccheggio stesso, con una molla più lenta (~0,25 Hz). La quota segue l'acqua con una terza molla.
  // Pomeriggio del 13/11: la barca sta FRA le due onde (CSS) e galleggia un po' più alta. La superficie su cui posa è la
  // più alta delle due onde (quasi sempre quella dietro): il fondo dello scafo, punte di poppa e prua comprese (CHIGLIA,
  // fino alla linea di galleggiamento), sta sempre alla superficie o sotto, quindi sotto lo scafo c'è sempre il blu di
  // un'onda e mai lo sfondo. La carena color mattone si vede dove l'onda DAVANTI è più bassa della linea di
  // galleggiamento, e sparisce quando la sua cresta passa. La quota oscilla piano fra "più alta possibile" e "linea di
  // galleggiamento 3,4 px sotto la superficie" (emersione).
  // Il perno è il centro della chiglia (x 100, y 129 del disegno; transform-origin nel CSS).
  // telefono (Gabriele, 13/11 sera): lo scafo resta fuori dall'acqua fra ~70% e ~90%. Lo scafo è alto 13 unità al centro e 22 alle punte
  // (disegno 200 × 140), più la carena che scende 1,5 unità sotto la chiglia; la chiglia affonda fra 4 e 6,5 unità sotto l'acqua più alta
  // che ha sotto, oscillando piano (stesse onde lente della quota a computer)
  var AFFONDA = [3, 9.5];
  var LINEA = [33, 49, 65, 81, 97, 113, 129, 145, 160];   // x della linea di galleggiamento (y 124 del disegno), da poppa a prua
  var CHIGLIA = [[32.9, 124], [38.3, 127.2], [44, 129], [57.6, 129], [71.3, 129], [84.9, 129], [98.5, 129], [112.1, 129], [125.8, 129], [139.4, 129], [153, 129], [157.2, 126.6], [161.3, 124]];   // fondo dello scafo sotto la linea, da poppa a prua
  var ondula = function (t, a) { return a[0] * Math.sin(t * 2 * Math.PI / a[1] + a[2]); };
  var posaBarca = function (bc, dt, t) {
    var sf = scivolata(bc.fr, false), sd = scivolata(bc.di, true), s = t / 1000 + bc.fase, k = bc.w / 200, xo = bc.x + bc.w / 2;
    var sx = 0, sw = 0, sxx = 0, sxw = 0, n = LINEA.length;
    LINEA.forEach(function (u) { var x = (u - 100) * k, w = acqua(xo + x, sf, sd); sx += x; sw += w; sxx += x * x; sxw += x * w; });
    var pend = limita(Math.atan((n * sxw - sx * sw) / (n * sxx - sx * sx)), W < 768 ? -0.2 : -0.07, W < 768 ? 0.2 : 0.07);   // telefono: onde più ripide in proporzione, la barca le segue tutte
    var aT = ridotto ? pend : pend + ondula(s, [0.006, 7.3, 0]) + ondula(s, [0.004, 11.1, 1.7]);
    if (!dt) { bc.a = aT; bc.va = 0; bc.r = 0; bc.vr = 0; }
    else {
      if (W < 768) { bc.va += (40 * (aT - bc.a) - 12 * bc.va) * dt; } else bc.va += (4.8 * (aT - bc.a) - 2.6 * bc.va) * dt;   // telefono: molla più rigida, appoggia sull'onda senza staccarsi
      bc.a += bc.va * dt;
      var rT = limita(ondula(s, [0.55, 6.1, 0.8]) + ondula(s, [0.35, 9.7, 2.1]) + bc.va * 4, -1, 1);
      bc.vr += (2.5 * (rT - bc.r) - 1.3 * bc.vr) * dt; bc.r += bc.vr * dt;
    }
    var ca = Math.cos(bc.a), sa = Math.sin(bc.a), sc = 1 - 0.05 * bc.r * bc.r;
    var serve = function (punti) {   // quota del perno che porta tutti i punti alla superficie o sotto
      var y = -Infinity;
      punti.forEach(function (q) { var dx = (q[0] - 100) * k, dy = (q[1] - 129) * k * sc; y = Math.max(y, acqua(xo + dx * ca - dy * sa, sf, sd) - (dx * sa + dy * ca)); });
      return y;
    };
    var alto = serve(CHIGLIA) + 0.3, basso = serve(LINEA.map(function (u) { return [u, 124]; })) + 3.4;
    // telefono (Gabriele, 13/11 sera): la barca è piccola e non affonda mai: la chiglia sta sempre sul pelo dell'acqua, tutto lo scafo fuori
    var oscilla = limita(0.3 + ondula(s, [0.75, 9.3, 0.3]) + ondula(s, [0.45, 14.1, 1.9]) + ondula(s, [0.2, 5.7, 4.0]), 0, 1);
    var emersione = ridotto || W < 768 ? 1 : limita(0.3 + ondula(s, [0.75, 9.3, 0.3]) + ondula(s, [0.45, 14.1, 1.9]) + ondula(s, [0.2, 5.7, 4.0]), 0, 1);
    var meta = basso - (basso - alto) * emersione;
    if (!dt || bc.y === null) { bc.y = meta; bc.vy = 0; }
    else { bc.vy += (9.9 * (meta - bc.y) - 4.4 * bc.vy) * dt; bc.y += bc.vy * dt; }
    if (W < 768) {   // telefono: sale e scende con l'acqua senza ritardo, e la chiglia sta sull'acqua più alta che ha sotto (mai dentro una cresta), affondata di 1 px
      var sopra = Infinity;
      CHIGLIA.forEach(function (q) { var dx = (q[0] - 100) * k, dy = (q[1] - 129) * k * sc; sopra = Math.min(sopra, acqua(xo + dx * ca - dy * sa, sf, sd) - (dx * sa + dy * ca)); });
      bc.y = sopra + lerp(AFFONDA[1], AFFONDA[0], ridotto ? 1 : oscilla) * k; bc.vy = 0;   // fuori dall'acqua fra ~70% e ~90% dello scafo (Gabriele, 13/11 sera)
    }
    if (W >= 768 && bc.y < alto) { bc.y = alto; bc.vy = Math.max(0, bc.vy); }
    if (W >= 768 && bc.y > basso) { bc.y = basso; bc.vy = Math.min(0, bc.vy); }
    bc.n.style.transform = 'translate(' + bc.x.toFixed(2) + 'px,' + (bc.y - bc.cima - bc.h * 129 / 140).toFixed(2) + 'px) rotate(' + bc.a.toFixed(4) + 'rad) scaleY(' + sc.toFixed(4) + ')';
  };
  var muoviBarca = function (bc, dt, t) {
    bc.x += 46 * dt;                                   // ~46 px/s, come prima
    if (bc.x >= W) bc.x = -bc.w;                       // appena esce a destra rientra subito da sinistra (Gabriele, 13/11)
    posaBarca(bc, dt, t);
  };

  misura();
  var mostra = function (c) { c.n.style.opacity = c.spento ? '0' : '0.18'; };
  if (ridotto) { // tutto fermo: pesci al loro punto di sosta, gli altri in un angolo libero della loro zona, barche ferme
    var fermi = function () {
      misura();
      pesci.forEach(function (f) { colora(f, f.sosta[0], f.sosta[1], 0, 1); });
      animali.forEach(function (c) {
        var Z = c.zona, x, y;
        if (c.ost) { x = c.x; y = c.y; }
        else if (c.tipo === 'medusa') { x = c.fascia ? (Z[0] + Z[1]) / 2 : W - 20 - c.w2; y = Z[3] - c.h2 - (c.fascia ? 40 : 0); }   // cupola in su, in basso a sinistra (o a destra nella striscia)
        else if (c.tipo === 'cavalluccio') { x = c.fascia ? (Z[0] + Z[1]) / 2 : W - 20 - c.w2; y = c.fascia ? Z[3] - c.h2 - 40 : c.top + c.h2 + 8; }
        else { x = c.fascia ? (Z[0] + Z[1]) / 2 : 20 + c.w2; y = c.fascia ? Z[3] - c.h2 - 40 : c.top + c.h2 + 8; }
        mostra(c); c.n.style.transform = 'translate(' + (x - c.w2).toFixed(1) + 'px,' + (y - c.h2).toFixed(1) + 'px)';
      });
      barche.forEach(function (bc, i) { bc.x = W * (i ? 0.62 : 0.33); bc.y = null; posaBarca(bc, 0, 0); });
    };
    fermi();
    if ('ResizeObserver' in window) new ResizeObserver(fermi).observe(document.body);
    return;
  }

  var raf = 0, prima = 0;
  var ciclo = function (t) {
    var dt = Math.min(0.05, Math.max(0, (t - prima) / 1000)), sy = scrollY, vh = innerHeight, vivo = false;
    prima = t; raf = 0;
    pesci.forEach(function (f) { if (muoviPesce(f, t, dt)) vivo = true; });
    animali.forEach(function (c) {
      if (!c.attiva || c.spento) return;
      if (c.torna) { c.torna = false; c.n.style.transition = ''; mostra(c); } else riporta(c, sy, vh);
      if (c.tipo === 'cavalluccio') vaga(c, dt, sy, vh, t); else nuota(c, dt, sy, vh);
      vivo = true;
    });
    barche.forEach(function (bc) { if (bc.attiva) { muoviBarca(bc, dt, t); vivo = true; } });
    if (vivo) raf = requestAnimationFrame(ciclo);
  };
  var sveglia = function () { if (!raf) { prima = performance.now(); raf = requestAnimationFrame(ciclo); } };

  // I pesci partono solo quando chi legge scorre e la sezione è visibile almeno al 15% (13/11 sera; prima 30%): al
  // caricamento (anche con lo scorrimento ripristinato dal browser) non partono da soli. Fa eccezione il pesce di una
  // hero blu (f.subito): parte appena la pagina si apre, ed esce quando il fondo della hero supera il centro dello schermo.
  var scorre = false, prova = function () {
    pesci.forEach(function (f) { if (f.fase === 'attesa' && f.visto >= 0.15 && (scorre || f.subito)) { entra(f, performance.now()); sveglia(); } });
  };
  ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(function (ev) { addEventListener(ev, function () { scorre = true; }, { passive: true }); });
  addEventListener('scroll', prova, { passive: true });
  pesci.forEach(function (f) {
    new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        f.visto = v.isIntersecting ? v.intersectionRatio : 0;
        if (!v.isIntersecting) azzera(f); else prova();
      });
    }, { threshold: [0, 0.15, 0.3, 0.6] }).observe(f.s);
    // sentinella a metà sezione (in fondo, nelle hero blu): la sua riga supera il centro dello schermo → il pesce esce
    var sentinella = document.createElement('span');
    sentinella.className = 'sentinella';
    if (f.subito) sentinella.style.top = '100%';
    f.s.appendChild(sentinella);
    new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        f.passato = v.boundingClientRect.top < innerHeight / 2;
        if (!f.passato) return;
        if (f.fase === 'entra') f.coda = true;
        else if (f.fase === 'sosta') { esce(f, performance.now()); sveglia(); }
      });
    }, { rootMargin: '0px 0px -50% 0px' }).observe(sentinella);
  });

  animali.forEach(function (c) {
    mostra(c);
    if (c.tipo === 'cavalluccio') vaga(c, 0, scrollY, innerHeight, 0); else nuota(c, 0, scrollY, innerHeight);
    new IntersectionObserver(function (voci) { c.attiva = voci[0].isIntersecting; if (c.attiva) sveglia(); }).observe(c.s);
  });
  barche.forEach(function (bc) {
    posaBarca(bc, 0, 0);
    new IntersectionObserver(function (voci) { bc.attiva = voci[0].isIntersecting; if (bc.attiva) sveglia(); }).observe(bc.pista);
  });
  var rimisura = function () { misura(); animali.forEach(mostra); };
  if ('ResizeObserver' in window) new ResizeObserver(rimisura).observe(document.body);
  else addEventListener('resize', rimisura);
})();

// Mappa di Google (24/11/2026): parte solo al clic sul disegno. La scelta non si salva: a ogni pagina si riparte dal
// disegno. Senza script resta il disegno con il link a Google Maps.
document.querySelectorAll('[data-mappa]').forEach(function (m) {
  var f = m.querySelector('iframe');
  m.querySelector('[data-mappa-mostra]').addEventListener('click', function () {
    f.hidden = false;
    m.querySelector('[data-mappa-ferma]').hidden = true;
    f.src = f.getAttribute('data-src');
    f.focus();
  });
});
