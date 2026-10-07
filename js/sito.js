// Osteria da Anna — comportamenti copiati dal sito Wix online. Senza librerie.

// Animazioni di comparsa: partono quando l'elemento entra nella finestra (data-anim-pc / data-anim-tel).
(function () {
  var elementi = document.querySelectorAll('[data-anim-pc], [data-anim-tel]');
  if (!('IntersectionObserver' in window)) { elementi.forEach(function (e) { e.classList.add('entrato'); }); return; }
  var osservatore = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add('entrato'); osservatore.unobserve(v.target); } });
  }, { threshold: 0.15 });
  elementi.forEach(function (e) { osservatore.observe(e); });
})();

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

// Galleria di I Piatti: vista grande come su Wix (indirizzo ?pgid=…, frecce, Esc, a telefono scorrimento col dito).
(function () {
  var vista = document.querySelector('[data-vista]');
  if (!vista) return;
  var binario = vista.querySelector('[data-binario]'), foto = binario.children, attuale = 0, y = 0;
  var aggiorna = function () {
    vista.toggleAttribute('data-primo', attuale === 0);
    vista.toggleAttribute('data-ultimo', attuale === foto.length - 1);
    history.replaceState(null, '', location.pathname + '?pgid=' + foto[attuale].getAttribute('data-pgid'));
  };
  var vai = function (i) { attuale = Math.max(0, Math.min(foto.length - 1, i)); binario.scrollLeft = attuale * binario.clientWidth; aggiorna(); };
  var apri = function (i) { y = scrollY; vista.hidden = false; document.body.classList.add('vista-aperta'); vai(i); };
  var chiudi = function () { vista.hidden = true; document.body.classList.remove('vista-aperta'); history.replaceState(null, '', location.pathname); scrollTo(0, y); };
  // Il Menu: a telefono la foto non si apre (come online).
  var soloPc = vista.hasAttribute('data-solo-pc');
  document.querySelectorAll('[data-voce]').forEach(function (v) { v.addEventListener('click', function () { if (!(soloPc && matchMedia('(max-width: 767px)').matches)) apri(+v.getAttribute('data-voce')); }); });
  var prec = vista.querySelector('[data-prec]'), succ = vista.querySelector('[data-succ]');
  if (prec) prec.addEventListener('click', function () { vai(attuale - 1); });
  if (succ) succ.addEventListener('click', function () { vai(attuale + 1); });
  vista.querySelector('[data-chiudi]').addEventListener('click', chiudi);
  vista.querySelector('[data-espandi]').addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); else if (vista.requestFullscreen) vista.requestFullscreen(); });
  document.addEventListener('keydown', function (e) {
    if (vista.hidden) return;
    if (e.key === 'Escape') chiudi(); else if (e.key === 'ArrowRight' && succ) vai(attuale + 1); else if (e.key === 'ArrowLeft' && prec) vai(attuale - 1);
  });
  binario.addEventListener('scroll', function () { var i = Math.round(binario.scrollLeft / binario.clientWidth); if (i !== attuale) { attuale = i; aggiorna(); } });
  var pgid = new URLSearchParams(location.search).get('pgid');
  if (pgid) for (var i = 0; i < foto.length; i++) if (foto[i].getAttribute('data-pgid') === pgid) apri(i);
})();

// Il Menu: galleria a scorrimento come online dopo il primo scorrimento della pagina: foto al centro,
// frecce ai lati, giro infinito (tre copie della stessa foto; finito lo scorrimento si torna su quella di mezzo).
(function () {
  var scorri = document.querySelector('[data-scorri]');
  if (!scorri) return;
  var mezzo = scorri.children[1], passo = function () { return mezzo.offsetWidth + 10; };
  var centra = function () { scorri.scrollLeft = mezzo.offsetLeft - (scorri.clientWidth - mezzo.offsetWidth) / 2; };
  var attesa;
  centra();
  addEventListener('resize', centra);
  scorri.addEventListener('scroll', function () { clearTimeout(attesa); attesa = setTimeout(centra, 200); });
  document.querySelector('[data-scorri-succ]').addEventListener('click', function () { scorri.scrollBy({ left: passo(), behavior: 'smooth' }); });
  document.querySelector('[data-scorri-prec]').addEventListener('click', function () { scorri.scrollBy({ left: -passo(), behavior: 'smooth' }); });
})();

// Ricerca (come Wix: pannello dalla testata con suggerimenti, Invio o "Show All Results" portano a /search?q=…).
// Cerca nelle 7 pagine con l'indice statico /ricerca.json (generato dalle pagine), senza librerie.
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
