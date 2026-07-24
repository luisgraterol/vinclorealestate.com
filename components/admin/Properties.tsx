'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase/client';
import './Properties.css';

export default function Properties() {
  const initedRef = useRef(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    let properties: any[] = [];
    let editingId: string | null = null;

    function esc(str: string): string {
      return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Data loading ─────────────────────────────────────────────────────────────

    async function loadLandlords() {
      const { data } = await supabase.from('landlords').select('id, name').order('name');
      const landlordsList = data || [];
      const sel = document.getElementById('f-landlord') as HTMLSelectElement;
      sel.innerHTML = '<option value="">— Select landlord —</option>' +
        landlordsList.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('');
    }

    async function loadProperties() {
      const container = document.getElementById('properties-container')!;
      container.innerHTML = '<div class="loading-state"><span class="loading-text">Loading properties…</span></div>';
      const { data, error } = await supabase
        .from('properties')
        .select('*, landlord:landlords(id, name), analyses_count:property_analyses!property_id(count)')
        .order('created_at', { ascending: false });
      if (error) { container.innerHTML = '<div class="empty-state">Failed to load. Please refresh.</div>'; return; }
      properties = data || [];
      renderTable();
    }

    function renderTable() {
      const container = document.getElementById('properties-container')!;
      if (!properties.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(37,74,52,.2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" style="display:block;margin:0 auto 16px"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div class="empty-title">No properties yet</div>
            <div class="empty-body">Add your first property to start creating analyses.</div>
          </div>`;
        return;
      }
      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>City</th>
                <th>Neighborhood</th>
                <th>Landlord</th>
                <th class="num-col">Analyses</th>
                <th>Added</th>
                <th style="width:96px"></th>
              </tr>
            </thead>
            <tbody>
              ${properties.map(p => {
                const landlord = p.landlord as any;
                const count    = (p.analyses_count as any)?.[0]?.count ?? 0;
                const ts       = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return `
                  <tr class="data-row" data-id="${p.id}">
                    <td>
                      <div class="prop-addr">${esc(p.address_line1)}</div>
                      ${p.address_line2 ? `<div class="prop-addr2">${esc(p.address_line2)}</div>` : ''}
                    </td>
                    <td class="muted-cell">${esc(p.city)}, ${esc(p.zip_code)}</td>
                    <td class="muted-cell">${p.neighborhood ? esc(p.neighborhood) : '<span class="dash">—</span>'}</td>
                    <td class="muted-cell">${landlord?.name ? esc(landlord.name) : '<span class="dash">—</span>'}</td>
                    <td class="num-col">
                      ${count > 0
                        ? `<a href="/admin/analyses" class="count-link">${count}</a>`
                        : `<span class="dash">0</span>`}
                    </td>
                    <td class="ts-cell">${ts}</td>
                    <td class="action-cell">
                      <a href="/admin/analyzer" class="row-action-btn" title="New Analysis for this property" data-property-id="${p.id}" data-property-addr="${esc(p.address_line1)}, ${esc(p.city)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </a>
                      <button class="row-action-btn btn-edit" data-id="${p.id}" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="row-action-btn btn-del" data-id="${p.id}" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;

      bindTableEvents();
    }

    function bindTableEvents() {
      document.querySelectorAll<HTMLButtonElement>('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openSlideOver(btn.dataset.id!));
      });
      document.querySelectorAll<HTMLButtonElement>('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => deleteProperty(btn.dataset.id!));
      });
      // "New Analysis" shortcut: navigate to analyzer with property pre-selected
      document.querySelectorAll<HTMLAnchorElement>('a[data-property-id]').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const pid  = a.dataset.propertyId!;
          const addr = a.dataset.propertyAddr!;
          // Store pending selection so the analyzer can pick it up
          sessionStorage.setItem('analyzer_property_id',   pid);
          sessionStorage.setItem('analyzer_property_addr', addr);
          window.location.href = '/admin/analyzer';
        });
      });
    }

    async function deleteProperty(id: string) {
      const p = properties.find(x => x.id === id);
      if (!p) return;
      const count = (p.analyses_count as any)?.[0]?.count ?? 0;
      const msg   = count > 0
        ? `Delete "${p.address_line1}"? This will unlink ${count} saved ${count === 1 ? 'analysis' : 'analyses'}. This cannot be undone.`
        : `Delete "${p.address_line1}"? This cannot be undone.`;
      if (!confirm(msg)) return;
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) { alert('Delete failed: ' + error.message); return; }
      await loadProperties();
    }

    // ── Slide-over ───────────────────────────────────────────────────────────────

    function openSlideOver(editId?: string) {
      editingId = editId ?? null;
      const titleEl  = document.getElementById('slide-over-title')!;
      const saveBtn  = document.getElementById('btn-so-save') as HTMLButtonElement;
      const errorEl  = document.getElementById('form-error')!;
      errorEl.style.display = 'none';

      if (editingId) {
        const p = properties.find(x => x.id === editingId)!;
        titleEl.textContent    = 'Edit Property';
        saveBtn.textContent    = 'Save Changes';
        (document.getElementById('f-addr1')        as HTMLInputElement).value    = p.address_line1 ?? '';
        (document.getElementById('f-addr2')        as HTMLInputElement).value    = p.address_line2 ?? '';
        (document.getElementById('f-city')         as HTMLInputElement).value    = p.city ?? '';
        (document.getElementById('f-zip')          as HTMLInputElement).value    = p.zip_code ?? '';
        (document.getElementById('f-neighborhood') as HTMLInputElement).value    = p.neighborhood ?? '';
        (document.getElementById('f-bedrooms')     as HTMLSelectElement).value   = p.bedrooms   != null ? String(p.bedrooms)   : '';
        (document.getElementById('f-bathrooms')    as HTMLSelectElement).value   = p.bathrooms  != null ? String(p.bathrooms)  : '';
        (document.getElementById('f-type')         as HTMLSelectElement).value   = p.property_type ?? '';
        (document.getElementById('f-notes')        as HTMLTextAreaElement).value  = p.notes ?? '';
        (document.getElementById('f-landlord')     as HTMLSelectElement).value   = p.landlord_id ?? '';
      } else {
        titleEl.textContent    = 'Add Property';
        saveBtn.textContent    = 'Create Property';
        ['f-addr1','f-addr2','f-city','f-zip','f-neighborhood','f-notes'].forEach(id => {
          (document.getElementById(id) as HTMLInputElement).value = '';
        });
        (document.getElementById('f-landlord')  as HTMLSelectElement).value = '';
        (document.getElementById('f-bedrooms')  as HTMLSelectElement).value = '';
        (document.getElementById('f-bathrooms') as HTMLSelectElement).value = '';
        (document.getElementById('f-type')      as HTMLSelectElement).value = '';
      }

      document.getElementById('overlay')!.classList.add('visible');
      document.getElementById('slide-over')!.classList.add('open');
    }

    function closeSlideOver() {
      document.getElementById('overlay')!.classList.remove('visible');
      document.getElementById('slide-over')!.classList.remove('open');
      editingId = null;
    }

    async function handleSave() {
      const addr1        = (document.getElementById('f-addr1')        as HTMLInputElement).value.trim();
      const addr2        = (document.getElementById('f-addr2')        as HTMLInputElement).value.trim();
      const city         = (document.getElementById('f-city')         as HTMLInputElement).value.trim();
      const zip          = (document.getElementById('f-zip')          as HTMLInputElement).value.trim();
      const neighborhood = (document.getElementById('f-neighborhood') as HTMLInputElement).value.trim();
      const notes        = (document.getElementById('f-notes')        as HTMLTextAreaElement).value.trim();
      const landlordId   = (document.getElementById('f-landlord')     as HTMLSelectElement).value;
      const bedroomsVal  = (document.getElementById('f-bedrooms')     as HTMLSelectElement).value;
      const bathroomsVal = (document.getElementById('f-bathrooms')    as HTMLSelectElement).value;
      const typeVal      = (document.getElementById('f-type')         as HTMLSelectElement).value;
      const errorEl      = document.getElementById('form-error')!;

      if (!addr1 || !city || !zip || !landlordId) {
        errorEl.textContent    = 'Address line 1, city, zip code, and landlord are required.';
        errorEl.style.display  = '';
        return;
      }
      errorEl.style.display = 'none';

      const btn = document.getElementById('btn-so-save') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = editingId ? 'Saving…' : 'Creating…';

      const payload = {
        address_line1: addr1,
        address_line2: addr2 || null,
        city,
        zip_code: zip,
        neighborhood:  neighborhood || null,
        notes:         notes        || null,
        landlord_id:   landlordId,
        bedrooms:      bedroomsVal  ? parseInt(bedroomsVal)    : null,
        bathrooms:     bathroomsVal ? parseFloat(bathroomsVal) : null,
        property_type: typeVal      || null,
      };

      let error: any;
      if (editingId) {
        const res = await supabase
          .from('properties')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        error = res.error;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase
          .from('properties')
          .insert([{ ...payload, user_id: session?.user.id }]);
        error = res.error;
      }

      btn.disabled    = false;
      btn.textContent = editingId ? 'Save Changes' : 'Create Property';

      if (error) {
        errorEl.textContent   = 'Failed: ' + error.message;
        errorEl.style.display = '';
        return;
      }

      closeSlideOver();
      await loadProperties();
    }

    // ── Button wiring ────────────────────────────────────────────────────────────

    document.getElementById('btn-create-property')?.addEventListener('click', () => openSlideOver());
    document.getElementById('btn-so-cancel')?.addEventListener('click', closeSlideOver);
    document.getElementById('slide-over-close')?.addEventListener('click', closeSlideOver);
    document.getElementById('overlay')?.addEventListener('click', closeSlideOver);
    document.getElementById('btn-so-save')?.addEventListener('click', handleSave);

    // ── Init ─────────────────────────────────────────────────────────────────────

    (async () => {
      await Promise.all([loadLandlords(), loadProperties()]);
      pageRef.current?.classList.add('ready');
    })();
  }, []);

  return (
    <div className="admin-page" ref={pageRef}>
      <div className="page-content">

        <div className="page-header">
          <div className="section-label">Properties</div>
          <button className="btn btn-primary" id="btn-create-property">
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Property
          </button>
        </div>

        <div id="properties-container">
          <div className="loading-state"><span className="loading-text">Loading properties…</span></div>
        </div>

      </div>

      <footer>
        <div className="footer-brand">Vinclo Real Estate</div>
        <div className="footer-meta">&copy; 2026 &middot; Abilene, TX &middot; Owner Portal</div>
      </footer>

      {/* Slide-over overlay */}
      <div className="overlay" id="overlay"></div>

      {/* Slide-over panel */}
      <div className="slide-over" id="slide-over">
        <div className="slide-over-header">
          <div className="slide-over-title" id="slide-over-title">Add Property</div>
          <button className="slide-over-close" id="slide-over-close" aria-label="Close">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="slide-over-body">
          <div className="form-error" id="form-error" style={{ display: 'none' }}></div>

          <div className="field-group">
            <label htmlFor="f-addr1">Address Line 1 <span className="req">*</span></label>
            <input type="text" id="f-addr1" placeholder="123 Main St" />
          </div>
          <div className="field-group">
            <label htmlFor="f-addr2">Address Line 2</label>
            <input type="text" id="f-addr2" placeholder="Apt 2B, Unit 4…" />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="f-city">City <span className="req">*</span></label>
              <input type="text" id="f-city" placeholder="Abilene" />
            </div>
            <div className="field-group">
              <label htmlFor="f-zip">Zip Code <span className="req">*</span></label>
              <input type="text" id="f-zip" placeholder="79601" />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="f-neighborhood">Neighborhood</label>
            <input type="text" id="f-neighborhood" placeholder="Optional" />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="f-bedrooms">Bedrooms</label>
              <select id="f-bedrooms" defaultValue="">
                <option value="">—</option>
                <option value="0">Studio</option>
                <option value="1">1 BR</option>
                <option value="2">2 BR</option>
                <option value="3">3 BR</option>
                <option value="4">4 BR</option>
                <option value="5">5+ BR</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="f-bathrooms">Bathrooms</label>
              <select id="f-bathrooms" defaultValue="">
                <option value="">—</option>
                <option value="1">1 BA</option>
                <option value="1.5">1.5 BA</option>
                <option value="2">2 BA</option>
                <option value="2.5">2.5 BA</option>
                <option value="3">3 BA</option>
                <option value="3.5">3.5 BA</option>
                <option value="4">4 BA</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="f-type">Property Type</label>
              <select id="f-type" defaultValue="">
                <option value="">—</option>
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Condo">Condo</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Duplex">Duplex</option>
              </select>
            </div>
            <div className="field-group"></div>
          </div>
          <div className="field-group">
            <label htmlFor="f-landlord">Landlord <span className="req">*</span></label>
            <select id="f-landlord" defaultValue="">
              <option value="">— Select landlord —</option>
            </select>
            <span className="field-note">
              <a href="/admin/landlords" target="_blank">Manage landlords →</a>
            </span>
          </div>
          <div className="field-group">
            <label htmlFor="f-notes">Notes</label>
            <textarea id="f-notes" placeholder="Optional notes about this property…"></textarea>
          </div>

          <div className="slide-over-actions">
            <button className="btn btn-ghost" id="btn-so-cancel">Cancel</button>
            <button className="btn btn-primary" id="btn-so-save">Create Property</button>
          </div>
        </div>
      </div>
    </div>
  );
}
