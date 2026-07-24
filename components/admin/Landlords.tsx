'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase/client';
import './Landlords.css';

export default function Landlords() {
  const initedRef = useRef(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    let landlords: any[] = [];
    let editingId: string | null = null;

    function esc(str: string): string {
      return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function truncateType(type: string): string {
      const map: Record<string, string> = {
        'Property Management Company':        'Prop. Mgmt. Co.',
        "Individual Investor's LLC":          "Investor's LLC",
        'Small Local RE Company':             'Small Local RE',
        'Regional Portfolio Operator':        'Regional Portfolio',
        'Institutional Landlord':             'Institutional',
        'Real Estate Agent':                  'RE Agent',
        'Turnkey Rental Company':             'Turnkey Rental',
        'Relocation/Corporate Housing Company': 'Relocation/Corp.',
      };
      return map[type] ?? type;
    }

    async function loadLandlords() {
      const container = document.getElementById('landlords-container')!;
      container.innerHTML = '<div class="loading-state"><span class="loading-text">Loading landlords…</span></div>';

      const { data, error } = await supabase
        .from('landlords')
        .select('*, properties_count:properties!landlord_id(count)')
        .order('name', { ascending: true });

      if (error) { container.innerHTML = '<div class="empty-state">Failed to load. Please refresh.</div>'; return; }
      landlords = data || [];
      renderTable();
    }

    function renderTable() {
      const container = document.getElementById('landlords-container')!;
      if (!landlords.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(37,74,52,.2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" style="display:block;margin:0 auto 16px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="empty-title">No landlords yet</div>
            <div class="empty-body">Add landlords first — properties must be linked to a landlord.</div>
          </div>`;
        return;
      }

      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th class="num-col">Properties</th>
                <th>Added</th>
                <th style="width:64px"></th>
              </tr>
            </thead>
            <tbody>
              ${landlords.map(l => {
                const count = (l.properties_count as any)?.[0]?.count ?? 0;
                const ts    = new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return `
                  <tr class="data-row">
                    <td>
                      <div class="landlord-name">${esc(l.name)}</div>
                      ${l.website ? `<div class="landlord-website"><a href="${esc(l.website)}" target="_blank" rel="noopener noreferrer">${esc(l.website.replace(/^https?:\/\//, ''))}</a></div>` : ''}
                    </td>
                    <td><span class="type-badge">${esc(truncateType(l.type))}</span></td>
                    <td class="muted-cell">${l.email ? `<a href="mailto:${esc(l.email)}" class="contact-link">${esc(l.email)}</a>` : '<span class="dash">—</span>'}</td>
                    <td class="muted-cell">${l.phone ? `<a href="tel:${esc(l.phone)}" class="contact-link">${esc(l.phone)}</a>` : '<span class="dash">—</span>'}</td>
                    <td class="num-col">
                      ${count > 0
                        ? `<a href="/admin/properties" class="count-link">${count}</a>`
                        : `<span class="dash">0</span>`}
                    </td>
                    <td class="ts-cell">${ts}</td>
                    <td class="action-cell">
                      <button class="row-action-btn btn-edit" data-id="${l.id}" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button class="row-action-btn btn-del" data-id="${l.id}" data-count="${count}" data-name="${esc(l.name)}" title="Delete">
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
        btn.addEventListener('click', () => deleteLandlord(btn.dataset.id!, btn.dataset.name!, parseInt(btn.dataset.count ?? '0')));
      });
    }

    async function deleteLandlord(id: string, name: string, propCount: number) {
      if (propCount > 0) {
        alert(`Cannot delete "${name}" — they have ${propCount} linked ${propCount === 1 ? 'property' : 'properties'}. Reassign or delete those properties first.`);
        return;
      }
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
      const { error } = await supabase.from('landlords').delete().eq('id', id);
      if (error) { alert('Delete failed: ' + error.message); return; }
      await loadLandlords();
    }

    // ── Slide-over ───────────────────────────────────────────────────────────────

    function openSlideOver(editId?: string) {
      editingId = editId ?? null;
      const titleEl = document.getElementById('slide-over-title')!;
      const saveBtn = document.getElementById('btn-so-save') as HTMLButtonElement;
      const errorEl = document.getElementById('form-error')!;
      errorEl.style.display = 'none';

      if (editingId) {
        const l = landlords.find(x => x.id === editingId)!;
        titleEl.textContent = 'Edit Landlord';
        saveBtn.textContent = 'Save Changes';
        (document.getElementById('f-name')    as HTMLInputElement).value   = l.name    ?? '';
        (document.getElementById('f-type')    as HTMLSelectElement).value  = l.type    ?? '';
        (document.getElementById('f-phone')   as HTMLInputElement).value   = l.phone   ?? '';
        (document.getElementById('f-email')   as HTMLInputElement).value   = l.email   ?? '';
        (document.getElementById('f-website') as HTMLInputElement).value   = l.website ?? '';
        (document.getElementById('f-notes')   as HTMLTextAreaElement).value = l.notes  ?? '';
      } else {
        titleEl.textContent = 'Add Landlord';
        saveBtn.textContent = 'Create Landlord';
        ['f-name','f-phone','f-email','f-website','f-notes'].forEach(id => {
          (document.getElementById(id) as HTMLInputElement).value = '';
        });
        (document.getElementById('f-type') as HTMLSelectElement).value = '';
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
      const name    = (document.getElementById('f-name')    as HTMLInputElement).value.trim();
      const type    = (document.getElementById('f-type')    as HTMLSelectElement).value;
      const phone   = (document.getElementById('f-phone')   as HTMLInputElement).value.trim();
      const email   = (document.getElementById('f-email')   as HTMLInputElement).value.trim();
      const website = (document.getElementById('f-website') as HTMLInputElement).value.trim();
      const notes   = (document.getElementById('f-notes')   as HTMLTextAreaElement).value.trim();
      const errorEl = document.getElementById('form-error')!;

      if (!name || !type) {
        errorEl.textContent   = 'Name and type are required.';
        errorEl.style.display = '';
        return;
      }
      errorEl.style.display = 'none';

      const btn = document.getElementById('btn-so-save') as HTMLButtonElement;
      btn.disabled    = true;
      btn.textContent = editingId ? 'Saving…' : 'Creating…';

      const payload = {
        name,
        type,
        phone:   phone   || null,
        email:   email   || null,
        website: website || null,
        notes:   notes   || null,
      };

      let error: any;
      if (editingId) {
        const res = await supabase
          .from('landlords')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        error = res.error;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase
          .from('landlords')
          .insert([{ ...payload, user_id: session?.user.id }]);
        error = res.error;
      }

      btn.disabled    = false;
      btn.textContent = editingId ? 'Save Changes' : 'Create Landlord';

      if (error) {
        errorEl.textContent   = 'Failed: ' + error.message;
        errorEl.style.display = '';
        return;
      }

      closeSlideOver();
      await loadLandlords();
    }

    // ── Button wiring ────────────────────────────────────────────────────────────

    document.getElementById('btn-create-landlord')?.addEventListener('click', () => openSlideOver());
    document.getElementById('btn-so-cancel')?.addEventListener('click', closeSlideOver);
    document.getElementById('slide-over-close')?.addEventListener('click', closeSlideOver);
    document.getElementById('overlay')?.addEventListener('click', closeSlideOver);
    document.getElementById('btn-so-save')?.addEventListener('click', handleSave);

    // ── Init ─────────────────────────────────────────────────────────────────────

    (async () => {
      await loadLandlords();
      pageRef.current?.classList.add('ready');
    })();
  }, []);

  return (
    <div className="admin-page" ref={pageRef}>
      <div className="page-content">

        <div className="page-header">
          <div className="section-label">Landlords</div>
          <button className="btn btn-primary" id="btn-create-landlord">
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Landlord
          </button>
        </div>

        <div id="landlords-container">
          <div className="loading-state"><span className="loading-text">Loading landlords…</span></div>
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
          <div className="slide-over-title" id="slide-over-title">Add Landlord</div>
          <button className="slide-over-close" id="slide-over-close" aria-label="Close">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="slide-over-body">
          <div className="form-error" id="form-error" style={{ display: 'none' }}></div>

          <div className="field-group">
            <label htmlFor="f-name">Name <span className="req">*</span></label>
            <input type="text" id="f-name" placeholder="Acme Property Management" />
          </div>
          <div className="field-group">
            <label htmlFor="f-type">Type <span className="req">*</span></label>
            <select id="f-type" defaultValue="">
              <option value="">— Select type —</option>
              <option>Property Management Company</option>
              <option>Property Owner</option>
              <option>Individual Investor&apos;s LLC</option>
              <option>Small Local RE Company</option>
              <option>Regional Portfolio Operator</option>
              <option>Institutional Landlord</option>
              <option>Real Estate Agent</option>
              <option>Turnkey Rental Company</option>
              <option>Relocation/Corporate Housing Company</option>
            </select>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="f-phone">Phone</label>
              <input type="text" id="f-phone" placeholder="(555) 000-0000 (optional)" />
            </div>
            <div className="field-group">
              <label htmlFor="f-email">Email</label>
              <input type="email" id="f-email" placeholder="contact@example.com (optional)" />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="f-website">Website</label>
            <input type="text" id="f-website" placeholder="https://example.com (optional)" />
          </div>
          <div className="field-group">
            <label htmlFor="f-notes">Notes</label>
            <textarea id="f-notes" placeholder="Optional notes about this landlord…"></textarea>
          </div>

          <div className="slide-over-actions">
            <button className="btn btn-ghost" id="btn-so-cancel">Cancel</button>
            <button className="btn btn-primary" id="btn-so-save">Create Landlord</button>
          </div>
        </div>
      </div>
    </div>
  );
}
