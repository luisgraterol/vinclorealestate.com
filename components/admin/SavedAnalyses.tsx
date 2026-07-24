'use client';

import { useEffect, useRef } from 'react';
import { fmt, fmtPct, fmtX } from '@lib/formatters';
import { supabase } from '@lib/supabase/client';
import './SavedAnalyses.css';

export default function SavedAnalyses() {
  const initedRef = useRef(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    let analyses: any[] = [];
    const compareIds = new Set<string>();

    function esc(str: string): string {
      return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    async function loadAnalyses() {
      const container = document.getElementById('analyses-container')!;
      container.innerHTML = '<div class="loading-state"><span class="loading-text">Loading analyses…</span></div>';

      const { data, error } = await supabase
        .from('property_analyses')
        .select('*, property:properties(id, address_line1, address_line2, city, landlord:landlords(id, name))')
        .order('created_at', { ascending: false });

      if (error) {
        container.innerHTML = '<div class="empty-state">Failed to load analyses. Please refresh.</div>';
        return;
      }

      analyses = data || [];
      renderTable();
    }

    function renderTable() {
      const container = document.getElementById('analyses-container')!;

      if (!analyses.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(37,74,52,.2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" style="display:block;margin:0 auto 16px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="rgba(37,74,52,.2)" stroke="none"/><circle cx="3" cy="12" r="1" fill="rgba(37,74,52,.2)" stroke="none"/><circle cx="3" cy="18" r="1" fill="rgba(37,74,52,.2)" stroke="none"/></svg>
            </div>
            <div class="empty-title">No saved analyses yet</div>
            <div class="empty-body">Use the Property Analyzer to create and save your first analysis.</div>
            <a href="/admin/analyzer" class="btn btn-primary" style="margin-top:16px">Open Analyzer</a>
          </div>`;
        updateComparePanel();
        return;
      }

      container.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:32px"></th>
                <th>Analysis</th>
                <th>Property</th>
                <th>Landlord</th>
                <th class="num-col">Net/Mo</th>
                <th class="num-col">Net/Yr</th>
                <th class="num-col">ROI 12mo</th>
                <th>Updated</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody id="analyses-tbody"></tbody>
          </table>
        </div>`;

      renderRows();
      bindRowEvents();
      updateComparePanel();
    }

    function renderRows() {
      const tbody = document.getElementById('analyses-tbody')!;
      tbody.innerHTML = analyses.map(a => {
        const r          = a.results || {};
        const prop       = a.property as any;
        const landlord   = prop?.landlord;
        const netMonthly = r.netMonthly ?? 0;
        const netAnnual  = r.netAnnual  ?? 0;
        const roi12      = r.roi12      ?? 0;
        const profitCls  = netMonthly >= 0 ? 'green' : 'red';
        const ts         = new Date(a.updated_at || a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const orphan     = !a.property_id;
        const addrParts  = prop ? [prop.address_line1, prop.city].filter(Boolean).join(', ') : '';

        return `
          <tr class="data-row${orphan ? ' orphan-row' : ''}" data-id="${a.id}">
            <td class="check-cell">
              <label class="compare-label" onclick="event.stopPropagation()">
                <input type="checkbox" class="compare-cb" data-id="${a.id}" />
              </label>
            </td>
            <td>
              <div class="analysis-name">${esc(a.name)}</div>
              ${orphan ? '<span class="orphan-badge">No property</span>' : ''}
            </td>
            <td class="muted-cell">${addrParts ? esc(addrParts) : '<span class="dash">—</span>'}</td>
            <td class="muted-cell">${landlord?.name ? esc(landlord.name) : '<span class="dash">—</span>'}</td>
            <td class="num-col ${profitCls}">${fmt(netMonthly)}</td>
            <td class="num-col ${profitCls}">${fmt(netAnnual)}</td>
            <td class="num-col">${fmtPct(roi12)}</td>
            <td class="ts-cell">${ts}</td>
            <td class="action-cell">
              <a href="/admin/analyzer?load=${a.id}" class="row-action-btn" title="Open in Analyzer" onclick="event.stopPropagation()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </a>
              <button class="row-action-btn row-del-btn" data-id="${a.id}" title="Delete" onclick="event.stopPropagation()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </td>
          </tr>`;
      }).join('');
    }

    function bindRowEvents() {
      document.querySelectorAll<HTMLButtonElement>('.row-del-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          deleteAnalysis(btn.dataset.id!);
        });
      });

      document.querySelectorAll<HTMLInputElement>('.compare-cb').forEach(cb => {
        cb.addEventListener('change', () => {
          if (cb.checked) compareIds.add(cb.dataset.id!);
          else compareIds.delete(cb.dataset.id!);
          updateComparePanel();
        });
        cb.checked = compareIds.has(cb.dataset.id!);
      });
    }

    async function deleteAnalysis(id: string) {
      const a = analyses.find(x => x.id === id);
      if (!a || !confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
      const { error } = await supabase.from('property_analyses').delete().eq('id', id);
      if (error) { alert('Delete failed: ' + error.message); return; }
      compareIds.delete(id);
      await loadAnalyses();
    }

    // ── Compare ──────────────────────────────────────────────────────────────────

    function updateComparePanel() {
      const panel    = document.getElementById('compare-panel')!;
      const selected = analyses.filter(a => compareIds.has(a.id));
      if (selected.length < 2) { panel.style.display = 'none'; return; }
      panel.style.display = '';
      renderCompareTable(selected);
    }

    function renderCompareTable(items: any[]) {
      const head = document.getElementById('compare-head')!;
      const body = document.getElementById('compare-body')!;
      head.innerHTML = '<th>Metric</th>' + items.map(a => `<th>${esc(a.name)}</th>`).join('');
      const rows = [
        { label: 'Net Monthly Profit',   key: 'netMonthly',   fmtFn: fmt,    higherBetter: true },
        { label: 'Net Annual Profit',    key: 'netAnnual',    fmtFn: fmt,    higherBetter: true },
        { label: 'Gross Revenue/mo',     key: 'grossRevenue', fmtFn: fmt,    higherBetter: true },
        { label: 'Break-Even Occ%',      key: 'breakEvenOcc', fmtFn: fmtPct, higherBetter: false },
        { label: 'Margin %',             key: 'margin',       fmtFn: fmtPct, higherBetter: true },
        { label: 'Rent-to-Rev Multiple', key: 'multiple',     fmtFn: fmtX,   higherBetter: true },
        { label: 'Total Investment',     key: 'totalInvest',  fmtFn: fmt,    higherBetter: false },
        { label: 'Payback (months)',     key: 'payback',      fmtFn: (v: number) => isFinite(v) ? v.toFixed(1) : '—', higherBetter: false },
        { label: '12-Month ROI',         key: 'roi12',        fmtFn: fmtPct, higherBetter: true },
        { label: '24-Month ROI',         key: 'roi24',        fmtFn: fmtPct, higherBetter: true },
      ];
      body.innerHTML = rows.map(row => {
        const vals = items.map(a => (a.results || {})[row.key]);
        const nums = vals.map((v: any) => parseFloat(v) || 0);
        const best = row.higherBetter ? Math.max(...nums) : Math.min(...nums);
        return `<tr><td>${row.label}</td>${vals.map((v: any, i: number) => {
          const isBest = nums[i] === best && nums.filter((x: number) => x === best).length < nums.length;
          return `<td class="${isBest ? 'best' : ''}">${row.fmtFn(v)}</td>`;
        }).join('')}</tr>`;
      }).join('');
    }

    // ── Init ─────────────────────────────────────────────────────────────────────

    (async () => {
      await loadAnalyses();
      pageRef.current?.classList.add('ready');
    })();
  }, []);

  return (
    <div className="admin-page" ref={pageRef}>
      <div className="page-content">

        <div className="page-header">
          <div>
            <div className="section-label">Saved Analyses</div>
          </div>
          <a href="/admin/analyzer" className="btn btn-primary">
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Analysis
          </a>
        </div>

        <div id="analyses-container">
          <div className="loading-state">
            <span className="loading-text">Loading analyses…</span>
          </div>
        </div>

        {/* Compare panel */}
        <div className="compare-panel" id="compare-panel">
          <div className="compare-panel-title">Side-by-Side Comparison</div>
          <div className="compare-scroll">
            <table className="compare-table" id="compare-table">
              <thead><tr id="compare-head"></tr></thead>
              <tbody id="compare-body"></tbody>
            </table>
          </div>
        </div>

      </div>

      <footer>
        <div className="footer-brand">Vinclo Real Estate</div>
        <div className="footer-meta">&copy; 2026 &middot; Abilene, TX &middot; Owner Portal</div>
      </footer>
    </div>
  );
}
