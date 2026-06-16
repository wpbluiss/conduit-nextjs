/**
 * Pre-paint theme + accent bootstrap.
 *
 * Runs before any DOM renders so the Praxis Console never flashes the
 * wrong palette or accent. Reads localStorage `praxis.theme` and
 * `praxis.accent`, resolves system → matchMedia for theme, and writes
 * both `data-praxis-theme` on <html> and inline CSS vars for accent.
 *
 * Scoped to .praxis-root (the /app shell) — marketing surfaces are
 * unaffected because they don't carry the praxis-root class.
 */

export { ACCENT_PRESETS, ACCENT_STORAGE_KEY, DEFAULT_ACCENT } from "@/lib/conduit/accent-presets";

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
}
try{
  var ACCENTS={violet:{a:'#7C6CFF',h:'#9B8CFF',d:'#5548CC'},blue:{a:'#4E8EFF',h:'#7DAEFF',d:'#2563EB'},rose:{a:'#F43F5E',h:'#FB7185',d:'#BE123C'},sage:{a:'#5F9E6E',h:'#7EB88D',d:'#3A6B47'},amber:{a:'#F59E0B',h:'#FCD34D',d:'#D97706'},slate:{a:'#6B7A8D',h:'#8FA0B5',d:'#3D4F63'},ember:{a:'#FF8A3D',h:'#FFA876',d:'#D9532A'}};
  var ak=localStorage.getItem('praxis.accent')||'violet';
  var ac=ACCENTS[ak]||ACCENTS.violet;
  var s=document.documentElement.style;
  s.setProperty('--color-accent',ac.a);
  s.setProperty('--color-accent-hi',ac.h);
  s.setProperty('--color-accent-deep',ac.d);
}catch(e){}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
