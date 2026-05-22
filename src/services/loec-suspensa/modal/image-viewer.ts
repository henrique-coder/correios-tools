import { SROINTRANET_ORIGIN } from '../../../shared/constants/urls.js';

export function openImageViewer(obj: string, dh: string): void {
  if (document.getElementById('ct-img-viewer-container')) return;

  const rand = Math.floor(Math.random() * 1000000);
  const url = `${SROINTRANET_ORIGIN}/imagem?objeto=${obj}&dataHora=${dh}&_t=${Date.now()}_${rand}`;
  const id = 'ct-img-modal-' + Date.now();

  const m = document.createElement('div');
  m.id = 'ct-img-viewer-container';
  m.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,.9);z-index:999999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

  m.innerHTML = `<div id="${id}-inner" style="background:#1e293b;padding:16px;border-radius:12px;position:relative;min-width:300px;min-height:300px;max-width:85vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);border:1px solid #334155">
    <button id="${id}-close" style="position:absolute;top:-16px;right:-16px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-weight:bold;z-index:11;font-size:18px;box-shadow:0 4px 6px rgba(0,0,0,.2);transition:transform .2s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">✕</button>
    <div style="position:absolute;bottom:24px;right:24px;display:flex;gap:12px;z-index:11">
      <button id="${id}-rotL" style="background:rgba(15,23,42,.85);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:12px;width:54px;height:54px;cursor:pointer;font-size:24px" title="Girar para Esquerda">↺</button>
      <button id="${id}-rotR" style="background:rgba(15,23,42,.85);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:12px;width:54px;height:54px;cursor:pointer;font-size:24px" title="Girar para Direita">↻</button>
    </div>
    <div id="${id}-ld" style="padding:50px;text-align:center;font-weight:bold;color:#60a5fa;font-size:15px;flex:1;display:flex;align-items:center;justify-content:center">Procurando a imagem...</div>
    <div style="overflow:hidden;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#0f172a;flex:1;min-height:200px">
      <img src="${url}" id="${id}-img" style="max-width:100%;max-height:calc(85vh - 32px);object-fit:contain;transition:transform .15s ease-out;display:none;transform-origin:center"
        onload="this.style.display='block';document.getElementById('${id}-ld').style.display='none'"
        onerror="document.getElementById('${id}-ld').innerHTML='⚠️<br><br>Não conseguimos encontrar esta imagem.';document.getElementById('${id}-ld').style.color='#ef4444'">
    </div>
  </div>`;

  document.body.appendChild(m);

  const closeViewer = () => m.remove();

  document
    .getElementById(`${id}-close`)!
    .addEventListener('click', closeViewer);
  m.addEventListener('click', (e) => {
    if (e.target === m) closeViewer();
  });

  const img = document.getElementById(`${id}-img`) as HTMLImageElement;
  let rotation = 0;
  document.getElementById(`${id}-rotL`)!.addEventListener('click', () => {
    rotation -= 90;
    img.style.transform = `rotate(${rotation}deg)`;
  });
  document.getElementById(`${id}-rotR`)!.addEventListener('click', () => {
    rotation += 90;
    img.style.transform = `rotate(${rotation}deg)`;
  });
}
