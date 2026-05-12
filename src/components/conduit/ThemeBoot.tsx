/**
 * Pre-paint theme bootstrap.
 *
 * Runs before any DOM renders so the Praxis Console never flashes the
 * wrong palette. Reads localStorage `praxis.theme` (one of system|light|
 * dark, default system), resolves system → matchMedia, and writes
 * `data-praxis-theme` on <html>. CSS in praxis-tokens.css keys off that
 * attribute to flip surface tokens for everything inside .praxis-root.
 *
 * Scoped to .praxis-root (the /app shell) — marketing surfaces are
 * unaffected because they don't carry the praxis-root class.
 */
export function ThemeBoot() {
  const code = `
(function(){try{
  var p=localStorage.getItem('praxis.theme')||'system';
  var dark=p==='dark'||(p!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-praxis-theme',dark?'dark':'light');
  document.documentElement.setAttribute('data-praxis-theme-pref',p);
}catch(e){
  document.documentElement.setAttribute('data-praxis-theme','dark');
  document.documentElement.setAttribute('data-praxis-theme-pref','system');
}})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
