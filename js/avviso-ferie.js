/* Avviso "Gentile cliente, siamo chiusi per ferie" (Gabriele, 01/11/2026, copy di Gabriele). Si mostra a ogni apertura di pagina fino alla fine
   del 10 novembre 2026 (ora italiana), poi smette da solo. Per toglierlo: cancellare questo file e il suo <script>. */
(function () {
  if (Date.now() >= Date.parse('2026-11-11T00:00:00+01:00')) return;

  var css = ''
    + '.ferie{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;'
    + 'background:rgba(11,43,90,.35);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;transition:opacity .4s}'
    + '.ferie.aperto{opacity:1}'
    + '.ferie-box:focus{outline:none;box-shadow:0 20px 60px rgba(11,43,90,.35)}.ferie-box{position:relative;box-sizing:border-box;width:min(1100px,100%);max-height:100%;overflow:auto;padding:64px 48px 56px;'
    + 'background:#FFFFFF;color:#0B2B5A;text-align:center;box-shadow:0 20px 60px rgba(11,43,90,.35)}'
    + '.ferie-logo{display:block;width:189px;height:auto;margin:0 auto 28px}'
    + '.ferie-titolo{font-family:"Fahkwang",sans-serif;font-size:45px;line-height:63px;margin:0}'
    + '.ferie-linea{width:80px;height:1px;margin:24px auto;background:#8595AD}'
    + '.ferie-testo{font-size:22px;line-height:34px;margin:0}'
    + '.ferie-testo strong{font-weight:700}.ferie-una-riga{white-space:nowrap}.ferie-solo-tel{display:none}'
    + '.ferie-riapro{font-family:"Cormorant Garamond",serif;font-weight:300;font-style:italic;font-size:28px;line-height:38px;margin:18px 0 0}'
    + '.ferie-ok{display:inline-flex;align-items:center;justify-content:center;width:180px;height:44px;margin-top:36px;border:1px solid #0B2B5A;'
    + 'background:#0B2B5A;color:#FFFFFF;font-family:"Fahkwang",sans-serif;font-size:16px;letter-spacing:.1em;cursor:pointer;transition:.2s}'
    + '.ferie-ok:hover{background:#FFFFFF;color:#0B2B5A}'
    + '.ferie-x{position:absolute;top:14px;right:14px;width:44px;height:44px;border:0;background:transparent;color:#0B2B5A;font-size:34px;line-height:44px;cursor:pointer}'
    + '.ferie-x:hover{color:#B85423}'
    + 'html.ferie-blocca,html.ferie-blocca body{overflow:hidden}'
    + '@media (max-width:767px){.ferie{padding:14px}.ferie-box{padding:52px 20px 40px}'
    + '.ferie-logo{width:130px;margin-bottom:20px}.ferie-titolo{font-size:30px;line-height:42px}'
    + '.ferie-solo-tel{display:inline}.ferie-testo{font-size:18px;line-height:28px}.ferie-riapro{font-size:22px;line-height:30px}.ferie-ok{margin-top:28px}}';

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'ferie';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'ferie-titolo');
  box.innerHTML = '<div class="ferie-box" tabindex="-1">'
    + '<button type="button" class="ferie-x" aria-label="Chiudi l\'avviso">&times;</button>'
    + '<img class="ferie-logo" src="/img/f4c59d_f3e3ba00640a411fac362ad917c9c6fc~mv2_378x210.jpg" width="189" height="105" alt="Cappello da cuoco, logo del Ristorante Osteria da Anna">'
    + '<p class="ferie-titolo" id="ferie-titolo">Gentile cliente,<br class="ferie-solo-tel"> siamo chiusi per&nbsp;ferie</p>'
    + '<div class="ferie-linea"></div>'
    + '<p class="ferie-testo font-testo">Il ristorante rimarrà<br class="ferie-solo-tel"> chiuso per&nbsp;ferie<br><strong class="ferie-una-riga">dal 2 al 10 novembre</strong>.</p>'
    + '<p class="ferie-riapro">Vi aspettiamo da mercoledì&nbsp;11&nbsp;novembre.</p>'
    + '<button type="button" class="ferie-ok">HO CAPITO</button>'
    + '</div>';

  function chiudi() {
    box.classList.remove('aperto');
    document.documentElement.classList.remove('ferie-blocca');
    document.removeEventListener('keydown', esc);
    setTimeout(function () { box.remove(); }, 400);
  }
  function esc(e) { if (e.key === 'Escape') chiudi(); }

  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.closest('.ferie-x') || e.target.closest('.ferie-ok')) chiudi();
  });

  function apri() {
    document.body.appendChild(box);
    document.documentElement.classList.add('ferie-blocca');
    document.addEventListener('keydown', esc);
    requestAnimationFrame(function () { box.classList.add('aperto'); box.querySelector('.ferie-box').focus({ preventScroll: true }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apri); else apri();
})();
