<?php

namespace Espo\Modules\ViaCrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\EntryPoint\Traits\NoAuth;

class EasyEmailEditor implements EntryPoint
{
    use NoAuth;

    public function run(Request $request, Response $response): void
    {
        $response->setHeader('Content-Type', 'text/html; charset=utf-8');

        $templateId = $request->getQueryParam('templateId') ?? 'new';
        $authToken = $request->getQueryParam('authToken') ?? '';

        $html = <<<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ViaCRM Email Editor</title>
    <link rel="stylesheet" href="/client/custom/modules/viacrm/lib/grapes.min.css" />
    <style>
      html, body { height: 100%; margin: 0; }
      body { background:#f8fafc; }
      .topbar {
        z-index: 100; top: 0; left: 0; right: 0; height: 56px;
        display: flex; align-items: center; gap: 8px; padding: 8px 12px;
        background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      #gjs { height: 100vh; }
      .btn { background:#111827; color:#fff; border:0; border-radius:6px; padding:8px 12px; cursor:pointer; }
      .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      #preset, #subject { background:#fff; }
      @media (max-width: 800px) {
        .topbar { flex-wrap: wrap; height: auto; padding-bottom: 10px; }
        #gjs { height: calc(100vh - 72px); margin-top: 72px; }
      }
    </style>
  </head>
  <body>
    <div id="gjs"></div>
    <div class="topbar">
      <select id="preset" style="padding:8px 12px;border-radius:6px;border:1px solid #d1d5db;min-width:160px">
        <option value="minimal">Minimal</option>
        <option value="newsletter">Newsletter</option>
        <option value="hero">Hero</option>
      </select>
      <input id="subject" type="text" placeholder="Subject" style="padding:8px 12px;border-radius:6px;border:1px solid #d1d5db;min-width:260px" />
      <label style="display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-size:12px;color:#374151">
        <input id="inlineStyles" type="checkbox" checked /> Inline styles
      </label>
      <select id="mergeTags" style="padding:6px 8px;border-radius:6px;border:1px solid #d1d5db;min-width:160px">
        <option value="">Insert merge tag…</option>
        <option value="{Account.name}">Account.name</option>
        <option value="{Contact.name}">Contact.name</option>
        <option value="{User.name}">User.name</option>
        <option value="{Today}">Today</option>
      </select>
      <button class="btn" id="btnBlocks" title="Blocks">Blocks</button>
      <button class="btn" id="btnLayers" title="Layers">Layers</button>
      <button class="btn" id="btnStyles" title="Styles">Styles</button>
      <button class="btn" id="btnTraits" title="Traits">Traits</button>
      <button class="btn" id="btnAssets" title="Assets">Assets</button>
      <button class="btn" id="btnDesktop" title="Desktop">Desktop</button>
      <button class="btn" id="btnMobile" title="Mobile">Mobile</button>
      <button class="btn" id="btnUndo">Undo</button>
      <button class="btn" id="btnRedo">Redo</button>
      <button class="btn" id="btnClear">Clear</button>
      <button class="btn" id="btnPreview">Preview</button>
      <button class="btn" id="btnFullscreen">Fullscreen</button>
      <button class="btn" id="btnExportHtml">Export HTML</button>
      <button class="btn" id="btnExportProject">Export Project</button>
      <button class="btn" id="btnImportProject">Import</button>
      <input id="importInput" type="file" accept="application/json" style="display:none" />
      <button class="btn" id="btnSave">Save</button>
      <button class="btn" id="btnSaveClose">Save & Close</button>
      <button class="btn" id="btnClose">Close</button>
    </div>
    <script src="/client/custom/modules/viacrm/lib/grapes.min.js"></script>
    <script src="/client/custom/modules/viacrm/lib/grapesjs-preset-newsletter.min.js"></script>
    <script>
      (function() {
        const urlParams = new URLSearchParams(window.location.search);
        const CONFIG = {
          templateId: '__TEMPLATE_ID__',
          authToken: '__AUTH_TOKEN__',
          apiBase: window.location.origin + '/api/v1',
          entityType: urlParams.get('entityType') || 'EmailTemplate',
          emailId: urlParams.get('emailId') || ''
        };

        const editor = grapesjs.init({
          container: '#gjs',
          height: 'calc(100vh - 56px)',
          fromElement: false,
          plugins: ['gjs-preset-newsletter'],
          storageManager: false,
          deviceManager: {
            devices: [
              { name: 'Desktop', width: '' },
              { name: 'Mobile', width: '375px' }
            ]
          },
          layerManager: { appendTo: null },
          selectorManager: { componentFirst: true },
          styleManager: {
            sectors: [
              { name: 'Typography', open: false, buildProps: ['color','font-size','font-weight','line-height','text-align'] },
              { name: 'Background', open: false, buildProps: ['background-color'] },
              { name: 'Spacing', open: true, buildProps: ['padding','margin'] },
              { name: 'Borders', open: false, buildProps: ['border','border-radius'] }
            ]
          },
          assetManager: {
            upload: CONFIG.apiBase + '/EasyEmailEditor/action/uploadImage',
            uploadName: 'file',
            headers: buildHeaders(),
            // Custom uploader to adapt server response to GrapesJS assets
            uploadFile: async (e) => {
              const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
              if (!files || !files.length) return;
              const file = files[0];
              try {
                const res = await fetch(CONFIG.apiBase + '/EasyEmailEditor/action/uploadImage', {
                  method: 'POST',
                  body: file,
                  headers: Object.assign({
                    'Content-Type': file.type || 'application/octet-stream',
                    'X-File-Name': file.name || 'image.jpg'
                  }, buildHeaders()),
                  credentials: 'include',
                });
                const data = await res.json();
                if (data && data.url) {
                  editor.AssetManager.add({ src: data.url });
                }
              } catch (err) {
                console.warn('Upload error', err);
              }
            },
          },
        });

        // Improve default panels and map handy commands
        const pn = editor.Panels;
        // Ensure default buttons exist
        pn.addButton('views', { id:'open-sm', className:'fa fa-paint-brush', attributes:{ title:'Style Manager' }, command:'open-sm' });
        pn.addButton('views', { id:'open-traits', className:'fa fa-cog', attributes:{ title:'Traits' }, command:'open-traits' });
        pn.addButton('views', { id:'open-layers', className:'fa fa-bars', attributes:{ title:'Layers' }, command:'open-layers' });
        pn.addButton('views', { id:'open-blocks', className:'fa fa-th-large', attributes:{ title:'Blocks' }, command:'open-blocks' });

        // Add essential blocks
        const bm = editor.BlockManager;
        bm.add('hero', { label: 'Hero', category: 'Basic', content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#667eea;color:#fff;border-radius:12px"><tr><td align="center" style="padding:40px 20px"><h1 style="margin:0;font-size:28px">Welcome</h1><p style="margin:12px 0 20px">Your catchy subtitle here</p><a href="#" style="display:inline-block;background:#fff;color:#667eea;padding:12px 20px;border-radius:8px;text-decoration:none">Call to Action</a></td></tr></table>` });
        bm.add('columns-2', { label: '2 Columns', category: 'Columns', content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" valign="top" style="padding:10px"><p>Left content</p></td><td width="50%" valign="top" style="padding:10px"><p>Right content</p></td></tr></table>` });
        bm.add('columns-3', { label: '3 Columns', category: 'Columns', content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="33%" valign="top" style="padding:10px"><p>Col 1</p></td><td width="33%" valign="top" style="padding:10px"><p>Col 2</p></td><td width="33%" valign="top" style="padding:10px"><p>Col 3</p></td></tr></table>` });
        bm.add('card', { label: 'Card', category: 'Basic', content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px"><tr><td style="padding:20px"><h3 style="margin:0 0 10px">Card Title</h3><p style="margin:0">Card content text.</p></td></tr></table>` });
        bm.add('social', { label: 'Social', category: 'Basic', content: `<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:4px"><a href="#">Twitter</a></td><td style="padding:4px"><a href="#">Facebook</a></td><td style="padding:4px"><a href="#">LinkedIn</a></td></tr></table>` });
        bm.add('table-basic', { label: 'Table', category: 'Basic', content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><thead><tr style="background:#667eea;color:#fff"><th align="left" style="padding:8px">Header 1</th><th align="left" style="padding:8px">Header 2</th></tr></thead><tbody><tr><td style="padding:8px;border-top:1px solid #e5e7eb">Cell 1</td><td style="padding:8px;border-top:1px solid #e5e7eb">Cell 2</td></tr></tbody></table>` });
        bm.add('signature', { label: 'Signature', category: 'Basic', content: `<p style="margin:0"><strong>Your Name</strong></p><p style="margin:0">Title</p><p style="margin:0">Email • Phone • Website</p>` });

        function buildHeaders() {
          const h = { 'X-Requested-With': 'XMLHttpRequest' };
          if (CONFIG.authToken) h['Authorization'] = 'Bearer ' + CONFIG.authToken;
          return h;
        }

        function applyPreset(name) {
          const presets = {
            minimal: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px"><h2 style="margin:0 0 12px">Hello!</h2><p style="margin:0 0 16px">Start typing your email...</p><a href="#" style="display:inline-block;background:#667eea;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Call to Action</a></td></tr></table>`,
            newsletter: bm.get('hero').get('content') + bm.get('columns-2').get('content') + bm.get('card').get('content'),
            hero: bm.get('hero').get('content')
          };
          const html = presets[name] || presets.minimal;
          editor.DomComponents.clear();
          editor.setComponents(html);
        }

        async function loadTemplate() {
          const subjectEl = document.getElementById('subject');
          const presetEl = document.getElementById('preset');
          presetEl.addEventListener('change', () => applyPreset(presetEl.value));
          if (CONFIG.entityType === 'Email' && CONFIG.emailId) {
            try {
              const res = await fetch(CONFIG.apiBase + '/Email/' + encodeURIComponent(CONFIG.emailId), { headers: buildHeaders(), credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                if (data.subject && subjectEl) subjectEl.value = data.subject;
                if (data.bodyMjml) { try { const p = typeof data.bodyMjml === 'string' ? JSON.parse(data.bodyMjml) : data.bodyMjml; if (p && p.gjsProjectData) editor.loadProjectData(p.gjsProjectData); } catch(e) {} }
                if (data.body) editor.setComponents(data.body);
              }
            } catch (e) { console.warn('Email load error', e); }
            if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'EASY_EMAIL_READY' }, '*');
            return;
          }
          if (!CONFIG.templateId || CONFIG.templateId === 'new') {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'EASY_EMAIL_READY' }, '*');
            }
            // Seed new template with a minimal preset
            applyPreset('minimal');
            return;
          }
          try {
            const res = await fetch(CONFIG.apiBase + '/EasyEmailEditor/' + encodeURIComponent(CONFIG.templateId), {
              credentials: 'include',
              headers: buildHeaders(),
            });
            if (!res.ok) throw new Error('Load failed');
            const data = await res.json();
            try {
              if (data.bodyMjml) {
                const p = typeof data.bodyMjml === 'string' ? JSON.parse(data.bodyMjml) : data.bodyMjml;
                if (p && p.gjsProjectData) editor.loadProjectData(p.gjsProjectData);
              }
            } catch(e) {}
            if (data.subject && subjectEl) subjectEl.value = data.subject;
            if (data.body) editor.setComponents(data.body);
          } catch (e) { console.warn('Editor load error', e); }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'EASY_EMAIL_READY' }, '*');
          }
        }

        function getOutput() {
          const html = editor.getHtml();
          const css = editor.getCss();
          const useInline = !!(document.getElementById('inlineStyles') && document.getElementById('inlineStyles').checked);
          const inlined = useInline ? inlineCss(html, css) : (css ? '<style>' + css + '</style>' + html : html);
          const project = { gjsProjectData: editor.getProjectData() };
          return {
            html: inlined,
            mjml: JSON.stringify(project),
          };
        }

        // Minimal CSS-inliner for email: applies CSS rules as inline styles
        function inlineCss(html, css) {
          try {
            const doc = document.implementation.createHTMLDocument('email');
            const wrap = doc.createElement('div');
            wrap.id = '__wrap__';
            wrap.innerHTML = html;
            doc.body.appendChild(wrap);
            if (css && css.trim()) {
              const styleEl = doc.createElement('style');
              styleEl.textContent = css;
              doc.head.appendChild(styleEl);
              const sheet = [...doc.styleSheets].find(s => s.ownerNode === styleEl);
              const rules = (sheet && sheet.cssRules) ? sheet.cssRules : [];
              for (let r = 0; r < rules.length; r++) {
                const rule = rules[r];
                if (!rule.selectorText || !rule.style) continue;
                // multiple selectors split by comma
                const selectors = rule.selectorText.split(',');
                for (const sel of selectors) {
                  const selector = sel.trim();
                  if (!selector) continue;
                  let nodes = [];
                  try { nodes = wrap.querySelectorAll(selector); } catch(e) { continue; }
                  for (const el of nodes) {
                    for (let i = 0; i < rule.style.length; i++) {
                      const prop = rule.style[i];
                      const val = rule.style.getPropertyValue(prop);
                      const pri = rule.style.getPropertyPriority(prop);
                      // append or override inline style
                      el.style.setProperty(prop, val, pri);
                    }
                  }
                }
              }
              // remove the helper style node
              styleEl.remove();
            }
            // Return inner HTML of wrapper without extra container
            return wrap.innerHTML;
          } catch (e) {
            // Fallback to original concat if inliner fails
            return (css ? '<style>' + css + '</style>' : '') + html;
          }
        }

        let isSaving = false;

        async function saveAction() {
          if (isSaving) return;
          const out = getOutput();
          const subject = (document.getElementById('subject') || {}).value || 'Email';
          const btnSave = document.getElementById('btnSave');
          const btnSaveClose = document.getElementById('btnSaveClose');
          try {
            isSaving = true;
            if (btnSave) btnSave.disabled = true;
            if (btnSaveClose) btnSaveClose.disabled = true;
            let res;
            if (CONFIG.entityType === 'Email' && CONFIG.emailId) {
              res = await fetch(CONFIG.apiBase + '/EasyEmailEditor/action/saveEmail', {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, buildHeaders()),
                credentials: 'include',
                body: JSON.stringify({ emailId: CONFIG.emailId, html: out.html, mjml: out.mjml, subject })
              });
            } else {
              res = await fetch(CONFIG.apiBase + '/EasyEmailEditor/action/saveTemplate', {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, buildHeaders()),
                credentials: 'include',
                body: JSON.stringify({
                  templateId: CONFIG.templateId === 'new' ? null : CONFIG.templateId,
                  html: out.html,
                  mjml: out.mjml,
                  subject
                })
              });
            }
            const data = await res.json().catch(() => ({}));
            if (data && data.success) {
              // Update templateId after first save to avoid creating duplicates
              if ((!CONFIG.templateId || CONFIG.templateId === 'new') && data.id) {
                CONFIG.templateId = data.id;
              }
              const payload = { html: out.html, mjml: out.mjml, templateId: data.id || CONFIG.templateId };
              if (window.opener) window.opener.postMessage({ type: 'EASY_EMAIL_SAVE', data: payload }, '*');
              if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'EASY_EMAIL_SAVE', data: payload }, '*');
              // Clear dirty flag after successful save
              dirty = false;
            }
          } catch (e) { console.warn('Save error', e); }
          finally {
            isSaving = false;
            if (btnSave) btnSave.disabled = false;
            if (btnSaveClose) btnSaveClose.disabled = false;
          }
        }

        // Topbar actions
        const $ = (id) => document.getElementById(id);
        $('btnBlocks').addEventListener('click', () => editor.runCommand('open-blocks'));
        $('btnLayers').addEventListener('click', () => editor.runCommand('open-layers'));
        $('btnStyles').addEventListener('click', () => editor.runCommand('open-sm'));
        $('btnTraits').addEventListener('click', () => editor.runCommand('open-traits'));
        $('btnAssets').addEventListener('click', () => editor.runCommand('open-assets'));
        $('btnDesktop').addEventListener('click', () => editor.setDevice('Desktop'));
        $('btnMobile').addEventListener('click', () => editor.setDevice('Mobile'));
        $('btnUndo').addEventListener('click', () => editor.runCommand('core:undo'));
        $('btnRedo').addEventListener('click', () => editor.runCommand('core:redo'));
        $('btnClear').addEventListener('click', () => { if (confirm('Clear all content?')) editor.DomComponents.clear(); });

        $('btnPreview').addEventListener('click', () => {
          const out = getOutput();
          const w = window.open('', '_blank');
          if (w) { w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Preview</title></head><body>' + out.html + '</body></html>'); w.document.close(); }
        });
        $('btnFullscreen').addEventListener('click', () => editor.runCommand('fullscreen'));
        $('btnExportHtml').addEventListener('click', () => {
          const out = getOutput();
          const blob = new Blob([out.html], { type: 'text/html;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = (document.getElementById('subject').value || 'email') + '.html';
          a.click();
          URL.revokeObjectURL(a.href);
        });
        $('btnExportProject').addEventListener('click', () => {
          const project = { gjsProjectData: editor.getProjectData() };
          const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'email-project.json';
          a.click();
          URL.revokeObjectURL(a.href);
        });
        $('btnImportProject').addEventListener('click', () => $('importInput').click());
        $('importInput').addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (json && json.gjsProjectData) {
              editor.loadProjectData(json.gjsProjectData);
              console.log('Project imported');
            }
          } catch (err) {
            console.warn('Import failed', err);
          } finally {
            e.target.value = '';
          }
        });
        $('btnSave').addEventListener('click', saveAction);
        $('btnSaveClose').addEventListener('click', async () => { await saveAction(); window.close(); });
        $('btnClose').addEventListener('click', () => {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'EASY_EMAIL_CLOSE' }, '*');
          }
          window.close();
        });

        window.addEventListener('message', (event) => {
          const msg = event && event.data ? event.data : {};
          if (!msg.type) return;
          if (msg.type === 'EASY_EMAIL_REQUEST_SAVE') saveAction();
          if (msg.type === 'EASY_EMAIL_LOAD' && msg.data) {
            if (msg.data.mjml) {
              try {
                const p = typeof msg.data.mjml === 'string' ? JSON.parse(msg.data.mjml) : msg.data.mjml;
                if (p && p.gjsProjectData) editor.loadProjectData(p.gjsProjectData);
              } catch (e) {}
            }
            if (msg.data.html) editor.setComponents(msg.data.html);
          }
        });

        document.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveAction();
          }
        });

        // Unsaved changes guard
        let dirty = false;
        editor.on('update', () => { dirty = true; });
        window.addEventListener('beforeunload', (e) => {
          if (!dirty) return;
          e.preventDefault();
          e.returnValue = '';
        });

        // Simple autosave every 30s when editing existing records
        setInterval(() => {
          const canAutosave = (CONFIG.entityType === 'Email' && !!CONFIG.emailId) || (!!CONFIG.templateId && CONFIG.templateId !== 'new');
          if (canAutosave && dirty && !isSaving) {
            saveAction();
          }
        }, 30000);

        // Traits for common elements
        const tm = editor.TraitManager;
        tm.addType('content', {
          createInput() { const el=document.createElement('input'); el.type='text'; el.style.width='100%'; return el; },
          onUpdate({ elInput, component }) { const el=component.getEl(); elInput.value = (el && (el.textContent||'').trim()) || ''; },
          onEvent({ elInput, component }) { const el=component.getEl(); if (el) { el.textContent = elInput.value; component.view && component.view.render && component.view.render(); } }
        });
        editor.on('component:selected', (comp) => {
          const tag = (comp && comp.get && comp.get('tagName')) || '';
          if (tag === 'a') {
            comp.set({ traits: [
              { type: 'text', name: 'href', label: 'Link URL', placeholder: 'https://...' },
              { type: 'select', name: 'target', label: 'Target', options: [{ id:'_self', name:'Same tab'}, { id:'_blank', name:'New tab'}] },
              { type: 'content', name: 'text', label: 'Text' }
            ]});
          } else if (tag === 'img') {
            comp.set({ traits: [
              { type: 'text', name: 'src', label: 'Image URL', placeholder: 'https://...' },
              { type: 'text', name: 'alt', label: 'Alt' },
              { type: 'number', name: 'width', label: 'Width (px)' }
            ]});
          }
        });

        // Merge tag insertion
        (function setupMergeTags(){
          const sel = document.getElementById('mergeTags');
          if (!sel) return;
          sel.addEventListener('change', () => {
            const tag = sel.value;
            if (!tag) return;
            try {
              const comp = editor.getSelected();
              if (comp && comp.view && comp.view.el && comp.view.el.isContentEditable) {
                // Append to current editable element
                comp.view.el.focus();
                document.execCommand('insertText', false, tag);
                comp.view && comp.view.render && comp.view.render();
              } else if (comp) {
                // Fallback: append to component content
                comp.append(`<span>${tag}</span>`);
              } else {
                // No selection: add a paragraph at root
                editor.addComponents(`<p>${tag}</p>`);
              }
            } catch (e) { console.warn('Merge tag insert failed', e); }
            sel.selectedIndex = 0;
          });
        })();

        // Open blocks panel by default
        editor.on('load', () => editor.runCommand('open-blocks'));

        loadTemplate();
      })();
    </script>
  </body>
</html>
HTML;

        $html = str_replace(
            ['__TEMPLATE_ID__', '__AUTH_TOKEN__'],
            [htmlspecialchars($templateId, ENT_QUOTES), htmlspecialchars($authToken, ENT_QUOTES)],
            $html
        );

        $response->writeBody($html);
    }
}
