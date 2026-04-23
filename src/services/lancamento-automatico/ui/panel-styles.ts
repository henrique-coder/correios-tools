export const PANEL_STYLES_ID = 'sro-styles';

export const PANEL_CSS = `
#sro-container{position:fixed;top:15px;right:15px;z-index:999999;display:flex;flex-direction:column;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3));will-change:transform;font-family:'Segoe UI',sans-serif}
.sro-card{width:360px;background:#fff;border-radius:6px;overflow:hidden;border-left:8px solid #999;display:block}
.sro-header{padding:8px 12px;display:flex;justify-content:space-between;align-items:center;background:#fdfdfd;border-bottom:1px solid #eee;cursor:grab;user-select:none}
.sro-status-block{display:flex;align-items:center;gap:8px;flex:1}
.sro-status-text{font-size:.95rem;font-weight:800;text-transform:uppercase;color:#444}
.sro-btn-group{display:flex;align-items:center;gap:8px}
.sro-btn-panel{cursor:pointer;font-size:1.2rem;color:#555;transition:all .2s;line-height:1;font-weight:bold;padding:2px 5px;border-radius:4px}
.sro-btn-panel:hover{color:#00416B;background:#f0f0f0}
.sro-btn-disabled{opacity:.3;pointer-events:none}
.sro-body{padding:12px;text-align:center;background:#fff}
.sro-distrito{font-size:3rem;font-weight:900;line-height:1;color:#00416B;margin:6px 0}
.sro-new{color:#00416B;font-size:3rem;font-weight:900}
.sro-old{font-size:2rem;opacity:.35;font-weight:700;color:#000;margin-right:5px}
.sro-arrow{font-size:2rem;margin:0 10px;color:#444;font-weight:400}
.mode-loading{border-left-color:#7f8c8d}
.mode-success{border-left-color:#009688}
.mode-success .sro-header{background:#e0f2f1}
.mode-success .sro-status-text{color:#00695c}
.mode-error{border-left-color:#d32f2f}
.mode-error .sro-header{background:#ffebee}
.mode-error .sro-status-text{color:#c62828}
.mode-info{border-left-color:#1976d2}
.mode-info .sro-header{background:#e3f2fd}
.mode-info .sro-status-text{color:#0d47a1}
#sro-table-wrapper{margin-top:25px;font-family:'Segoe UI',Tahoma,sans-serif;border:1px solid #ccc;background:#fff;width:100%;box-sizing:border-box;clear:both;pointer-events:auto}
.sro-table-header{background:#00416B;color:#fff!important;padding:8px 12px;font-weight:700;font-size:13px;text-transform:uppercase;display:flex;justify-content:space-between;border-bottom:3px solid #FFE600}
.sro-full-table{width:100%;border-collapse:collapse;font-size:11px}
.sro-full-table th{background:#f0f0f0;color:#333;text-align:left;padding:5px 8px;border:1px solid #ddd;font-weight:700;white-space:nowrap;width:1%}
.sro-full-table td{padding:5px 8px;border:1px solid #ddd;color:#000;word-break:break-word}
.hl-val{color:#2e7d32;font-weight:800;background:#e8f5e9;padding:1px 4px;border-radius:3px}
.hl-err{color:#c62828;font-weight:800;background:#ffebee;padding:1px 4px;border-radius:3px}
.hl-dist{font-size:15px;font-weight:800;color:#00416B}
.hl-serv{background:#fff8e1;color:#ff8f00;padding:0 3px;border-radius:2px;font-weight:bold;border:1px solid #ffecb3;margin-right:3px}
.hl-serv-off{opacity:.2;margin-right:3px}
`;
