'use client';

import { useEffect, useRef } from 'react';
import { fmt } from '@lib/formatters';
import { calcAll, calcMaintenance, getRiskFlags } from '@lib/calculations';
import type { AnalysisInputs, RampSettings } from '@lib/calculations';
import { OCC_CAP, PAYBACK_RULE_MONTHS } from '@lib/constants';
import { supabase } from '@lib/supabase/client';
import { renderVisuals } from '@lib/charts';
import type { RenderContext } from '@lib/charts';
import { exportMarkdown } from '@lib/exportMarkdown';
import { initPropertyModal } from '@lib/propertyModal';
import './Calculator.css';

export default function Calculator() {
  const initedRef = useRef(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    // ── DOM helpers ──────────────────────────────────────────────────────────

    function setOut(id: string, text: string, cls?: string) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.className = 'metric-value' + (cls ? ' ' + cls : '');
    }

    function inp(id: string): number {
      const el = document.getElementById(id) as HTMLInputElement | null;
      return el ? parseFloat(el.value) || 0 : 0;
    }

    function inpStr(id: string): string {
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      return el ? el.value.trim() : '';
    }

    function esc(str: string): string {
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function show(id: string) { const el = document.getElementById(id); if (el) el.style.display = ''; }
    function hide(id: string) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

    // ── State ─────────────────────────────────────────────────────────────────

    let currentAnalysisId: string | null = null;
    let selectedPropertyId: string | null = null;
    let propertiesList: any[] = [];
    let lastResults: ReturnType<typeof calcAll> | null = null;

    // ── Accordion ────────────────────────────────────────────────────────────

    document.querySelectorAll<HTMLButtonElement>('.calc-section-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.target!;
        const body = document.getElementById(id)!;
        const open = body.classList.contains('open');
        body.classList.toggle('open', !open);
        btn.classList.toggle('open', !open);
      });
    });

    // ── Calculations ─────────────────────────────────────────────────────────

    function gatherInputs(): AnalysisInputs {
      return {
        rentNeg:              inp('inp-rent-neg'),
        rentAsk:              inp('inp-rent-ask'),
        deposit:              inp('inp-deposit'),
        adr:                  inp('inp-adr'),
        occ:                  inp('inp-occ'),
        avgStay:              inp('inp-stay'),
        cleaning:             inp('inp-cleaning'),
        utilities:            0,
        electricity:          inp('inp-electricity'),
        water:                inp('inp-water'),
        sewer:                inp('inp-sewer'),
        garbage:              inp('inp-garbage'),
        internet:             inp('inp-internet'),
        insurance:            inp('inp-insurance'),
        supplies:             inp('inp-supplies'),
        linens:               inp('inp-linens'),
        pms:                  inp('inp-pms'),
        pricing:              inp('inp-pricing'),
        minutSubscription:    inp('inp-minut-subscription'),
        streaming:            inp('inp-streaming'),
        airbnbFeeType:        (inpStr('inp-airbnb-fee-type') as '3%' | '15.5%') || '3%',
        hasYard:              inpStr('inp-has-yard') === 'Yes',
        lawnCare:             inp('inp-lawn-care'),
        pestControl:          inp('inp-pest-control'),
        bulkPickup:           inp('inp-bulk-pickup'),
        preventiveInspection: inp('inp-preventive-inspection'),
        hvacFilters:          inp('inp-hvac-filters'),
        cpa:                  inp('inp-cpa'),
        furniture:            inp('inp-furniture'),
        photo:                inp('inp-photo'),
        lock:                 inp('inp-lock'),
        legal:                inp('inp-legal'),
        misc:                 inp('inp-misc'),
        minutHardware:        inp('inp-minut-hardware'),
        wifiRouter:           inp('inp-wifi-router'),
        welcomeKits:          inp('inp-welcome-kits'),
        isHOA:                inpStr('inp-hoa') === 'Yes',
      };
    }

    function gatherRamp(): RampSettings {
      return {
        enabled:           inpStr('inp-ramp-enabled') === 'Yes',
        makeReadyMonth:    inpStr('inp-make-ready') === 'Yes',
        rentFreeMonth1:    inpStr('inp-rent-free') === 'Yes',
        paybackRuleMonths: inp('inp-payback-rule') || PAYBACK_RULE_MONTHS,
        phases: [
          { months: inp('inp-ramp1-months'), occFactor: inp('inp-ramp1-occ'), adrFactor: inp('inp-ramp1-adr') },
          { months: inp('inp-ramp2-months'), occFactor: inp('inp-ramp2-occ'), adrFactor: inp('inp-ramp2-adr') },
          { months: Infinity, occFactor: 1, adrFactor: 1 },
        ],
      };
    }

    function runCalc() {
      const inputs = gatherInputs();
      const ramp   = gatherRamp();
      const isHOA  = inputs.isHOA;

      // Occupancy > 95% is clamped in the engine; show the inline note here.
      const capNote = document.getElementById('occ-cap-note');
      if (capNote) capNote.style.display = inputs.occ > OCC_CAP ? '' : 'none';

      const rampFields = document.getElementById('ramp-fields');
      if (rampFields) rampFields.style.display = ramp.enabled ? '' : 'none';

      document.getElementById('hoa-block')?.classList.toggle('visible', isHOA);
      document.getElementById('hoa-save-block')?.classList.toggle('visible', isHOA);

      const saveBtn   = document.getElementById('btn-save')   as HTMLButtonElement;
      const updateBtn = document.getElementById('btn-update') as HTMLButtonElement;
      const exportBtn = document.getElementById('btn-export') as HTMLButtonElement;
      saveBtn.disabled   = isHOA || !selectedPropertyId;
      updateBtn.disabled = isHOA;
      exportBtn.disabled = isHOA;

      const maintenance = calcMaintenance(inputs.rentNeg);
      const maintEl = document.getElementById('inp-maintenance') as HTMLInputElement;
      if (maintEl) maintEl.value = maintenance.toFixed(2);

      const r = calcAll(inputs, ramp);
      lastResults = r;

      const staysPerMonth = r.staysPerMonth;
      const cleaningTotal = staysPerMonth * inputs.cleaning;
      setOut('out-stays',              staysPerMonth.toFixed(1));
      setOut('out-cleaning-collected', fmt(cleaningTotal));
      setOut('out-cleaning-paid',      fmt(cleaningTotal));

      const flags  = getRiskFlags(inputs, r, ramp.paybackRuleMonths);
      const riskEl = document.getElementById('risk-flags')!;
      riskEl.innerHTML = flags.length === 0
        ? '<div class="risk-flag ok"><span class="risk-flag-icon">✓</span>No risk flags triggered.</div>'
        : flags.map(f => `<div class="risk-flag ${f.type}"><span class="risk-flag-icon">${f.icon}</span>${f.text}</div>`).join('');

      const ctx: RenderContext = {
        propertiesList,
        selectedPropertyId,
        walkAway: inp('inp-walk-away'),
        driver:   inpStr('inp-demand'),
        address:  inpStr('inp-address'),
        bedrooms: inpStr('inp-bedrooms'),
        bathrooms: inpStr('inp-bathrooms'),
        propertyType: inpStr('inp-type'),
        isHOA,
        ramp,
      };
      renderVisuals(inputs, r, ctx);
    }

    const inputIds = [
      'inp-name', 'inp-address',
      'inp-rent-ask', 'inp-rent-neg', 'inp-deposit', 'inp-hoa', 'inp-walk-away',
      'inp-adr', 'inp-occ', 'inp-stay', 'inp-demand',
      'inp-ramp-enabled', 'inp-payback-rule', 'inp-make-ready', 'inp-rent-free',
      'inp-ramp1-months', 'inp-ramp1-occ', 'inp-ramp1-adr',
      'inp-ramp2-months', 'inp-ramp2-occ', 'inp-ramp2-adr',
      'inp-electricity', 'inp-water', 'inp-sewer', 'inp-garbage',
      'inp-internet', 'inp-insurance',
      'inp-supplies', 'inp-linens',
      'inp-pms', 'inp-pricing', 'inp-minut-subscription', 'inp-streaming', 'inp-airbnb-fee-type',
      'inp-has-yard', 'inp-lawn-care', 'inp-pest-control', 'inp-bulk-pickup',
      'inp-preventive-inspection', 'inp-hvac-filters', 'inp-cpa',
      'inp-cleaning',
      'inp-furniture', 'inp-photo', 'inp-lock', 'inp-legal', 'inp-misc',
      'inp-minut-hardware', 'inp-wifi-router', 'inp-welcome-kits',
      'inp-notes',
    ];
    inputIds.forEach(id => {
      document.getElementById(id)?.addEventListener('input', runCalc);
    });

    // ── Has Yard toggle ───────────────────────────────────────────────────────────

    // Keeps the lawn-care field's editability in sync with Has Yard. Must run
    // whenever inp-has-yard changes programmatically too (loading a saved
    // analysis, reset), not just on user interaction.
    function syncLawnField(setDefault: boolean) {
      const hasYard = inpStr('inp-has-yard') === 'Yes';
      const lawnEl = document.getElementById('inp-lawn-care') as HTMLInputElement;
      if (!lawnEl) return;
      lawnEl.readOnly = !hasYard;
      if (!hasYard) lawnEl.value = '0';
      else if (setDefault) lawnEl.value = '78';
    }

    document.getElementById('inp-has-yard')?.addEventListener('change', () => {
      syncLawnField(true);
      runCalc();
    });

    // ── Property picker ──────────────────────────────────────────────────────────

    async function loadProperties() {
      const { data, error } = await supabase
        .from('properties')
        .select('*, landlord:landlords(id, name)')
        .order('created_at', { ascending: false });

      propertiesList = data || [];
      const select = document.getElementById('inp-property') as HTMLSelectElement;

      if (error || !propertiesList.length) {
        select.innerHTML = '<option value="">— No properties yet —</option>';
        show('no-properties-hint');
        return;
      }

      hide('no-properties-hint');
      select.innerHTML = '<option value="">— Select a property —</option>' +
        propertiesList.map(p =>
          `<option value="${esc(p.id)}">${esc(p.address_line1)}, ${esc(p.city)}</option>`
        ).join('');

      if (selectedPropertyId) {
        select.value = selectedPropertyId;
      }
    }

    function applyPropertyMeta(prop: any | null) {
      const bedroomsEl  = document.getElementById('inp-bedrooms')  as HTMLInputElement;
      const bathroomsEl = document.getElementById('inp-bathrooms') as HTMLInputElement;
      const typeEl      = document.getElementById('inp-type')      as HTMLInputElement;
      if (!bedroomsEl || !bathroomsEl || !typeEl) return;
      if (prop) {
        bedroomsEl.value  = prop.bedrooms      != null ? String(prop.bedrooms)      : '';
        bathroomsEl.value = prop.bathrooms     != null ? String(prop.bathrooms)     : '';
        typeEl.value      = prop.property_type != null ? String(prop.property_type) : '';
      } else {
        bedroomsEl.value  = '';
        bathroomsEl.value = '';
        typeEl.value      = '';
      }
    }

    document.getElementById('inp-property')?.addEventListener('change', e => {
      const val = (e.target as HTMLSelectElement).value;
      selectedPropertyId = val || null;

      const prop = propertiesList.find(p => p.id === val);
      const addrEl = document.getElementById('inp-address') as HTMLInputElement;

      if (prop && addrEl) {
        const parts = [prop.address_line1];
        if (prop.address_line2) parts.push(prop.address_line2);
        parts.push(prop.city);
        addrEl.value = parts.join(', ');
      } else if (addrEl) {
        addrEl.value = '';
      }

      // Default label to address_line1 only if still showing the default placeholder
      const nameEl = document.getElementById('inp-name') as HTMLInputElement;
      if (prop && nameEl && nameEl.value.trim() === 'New Analysis') {
        nameEl.value = prop.address_line1;
      }

      applyPropertyMeta(prop ?? null);

      hide('orphan-warning');
      if (!selectedPropertyId) {
        show('no-property-hint');
      } else {
        hide('no-property-hint');
      }

      runCalc();
    });

    // ── Persistence ──────────────────────────────────────────────────────────────

    function gatherFormInputs() {
      const obj: Record<string, string> = {};
      inputIds.forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) obj[id] = el.value;
      });
      return obj;
    }

    function applyFormInputs(inputs: Record<string, string>) {
      // Analyses saved before ramp mode existed carry no ramp fields: default
      // them to ramp OFF so their stored numbers still reproduce.
      if (!('inp-ramp-enabled' in inputs)) {
        const rampEl = document.getElementById('inp-ramp-enabled') as HTMLSelectElement | null;
        if (rampEl) rampEl.value = 'No';
      }
      Object.entries(inputs).forEach(([id, val]) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el && !el.disabled && !el.readOnly) el.value = val;
      });
      // Lawn care is readOnly while Has Yard is No, so the loop above skipped
      // it. Sync its editability to the loaded Has Yard value, then restore the
      // saved amount.
      syncLawnField(false);
      if (inpStr('inp-has-yard') === 'Yes' && 'inp-lawn-care' in inputs) {
        const lawnEl = document.getElementById('inp-lawn-care') as HTMLInputElement | null;
        if (lawnEl) lawnEl.value = inputs['inp-lawn-care'];
      }
      runCalc();
    }

    function buildResults() {
      if (!lastResults) return {};
      const r = lastResults;
      return {
        grossRevenue: r.grossRevenue, airbnbFee: r.airbnbFee, netPlatform: r.netPlatform,
        fixed: r.fixed, maintenance: r.maintenance, staysPerMonth: r.staysPerMonth,
        netMonthly: r.netMonthly, netAnnual: r.netAnnual, breakEvenOcc: r.breakEvenOcc,
        margin: r.margin, multiple: r.multiple, totalInvest: r.totalInvest,
        payback: isFinite(r.payback) ? r.payback : null,
        roi12: r.roi12, roi24: r.roi24,
        rampEnabled: r.rampEnabled, month1Carry: r.month1Carry,
        paybackRamped: r.paybackRamped != null && isFinite(r.paybackRamped) ? r.paybackRamped : null,
      };
    }

    async function loadAnalysisById(id: string) {
      const { data, error } = await supabase
        .from('property_analyses')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return;

      currentAnalysisId = id;
      selectedPropertyId = data.property_id || null;
      applyFormInputs(data.inputs);

      const propSelect = document.getElementById('inp-property') as HTMLSelectElement;
      if (propSelect) propSelect.value = selectedPropertyId ?? '';

      const addrEl = document.getElementById('inp-address') as HTMLInputElement;
      if (addrEl && data.address) addrEl.value = data.address;

      applyPropertyMeta(propertiesList.find(p => p.id === selectedPropertyId) ?? null);

      if (!data.property_id) {
        show('orphan-warning');
        hide('no-property-hint');
      } else {
        hide('orphan-warning');
        hide('no-property-hint');
      }

      (document.getElementById('btn-save')   as HTMLElement).style.display = 'none';
      (document.getElementById('btn-update') as HTMLElement).style.display = '';
      (document.getElementById('btn-new')    as HTMLElement).style.display = '';
      history.replaceState(null, '', '/admin/analyzer');
      runCalc();
    }

    async function saveAnalysis() {
      if (!selectedPropertyId) return;
      const btn = document.getElementById('btn-save') as HTMLButtonElement;
      btn.disabled = true; btn.textContent = 'Saving…';

      const prop = propertiesList.find(p => p.id === selectedPropertyId);
      const address = prop
        ? [prop.address_line1, prop.address_line2, prop.city].filter(Boolean).join(', ')
        : inpStr('inp-address');

      const { data, error } = await supabase
        .from('property_analyses')
        .insert([{
          name:        inpStr('inp-name') || 'New Analysis',
          address,
          property_id: selectedPropertyId,
          inputs:      gatherFormInputs(),
          results:     buildResults(),
          notes:       inpStr('inp-notes'),
        }])
        .select().single();

      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Analysis`;

      if (error) { alert('Save failed: ' + error.message); return; }
      currentAnalysisId = data.id;
      (document.getElementById('btn-save')   as HTMLElement).style.display = 'none';
      (document.getElementById('btn-update') as HTMLElement).style.display = '';
      (document.getElementById('btn-new')    as HTMLElement).style.display = '';
    }

    async function updateAnalysis() {
      if (!currentAnalysisId) return;
      const btn = document.getElementById('btn-update') as HTMLButtonElement;
      btn.disabled = true; btn.textContent = 'Updating…';

      const prop = propertiesList.find(p => p.id === selectedPropertyId);
      const address = prop
        ? [prop.address_line1, prop.address_line2, prop.city].filter(Boolean).join(', ')
        : inpStr('inp-address');

      const { error } = await supabase
        .from('property_analyses')
        .update({
          name:        inpStr('inp-name') || 'New Analysis',
          address,
          property_id: selectedPropertyId,
          inputs:      gatherFormInputs(),
          results:     buildResults(),
          notes:       inpStr('inp-notes'),
          updated_at:  new Date().toISOString(),
        })
        .eq('id', currentAnalysisId);

      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Update`;
      if (error) alert('Update failed: ' + error.message);
    }

    function resetForm() {
      currentAnalysisId = null;
      selectedPropertyId = null;
      hide('orphan-warning');
      hide('no-property-hint');

      const defaults: Record<string, string> = {
        'inp-name': 'New Analysis', 'inp-address': '',
        'inp-rent-ask': '1400', 'inp-rent-neg': '1200', 'inp-deposit': '1400', 'inp-hoa': 'No',
        'inp-adr': '167', 'inp-occ': '77', 'inp-stay': '3.2', 'inp-demand': 'Military TDY',
        'inp-walk-away': '1750',
        'inp-ramp-enabled': 'Yes', 'inp-payback-rule': '9', 'inp-make-ready': 'Yes', 'inp-rent-free': 'Yes',
        'inp-ramp1-months': '3', 'inp-ramp1-occ': '0.85', 'inp-ramp1-adr': '0.90',
        'inp-ramp2-months': '3', 'inp-ramp2-occ': '0.93', 'inp-ramp2-adr': '0.96',
        'inp-electricity': '130', 'inp-water': '45', 'inp-sewer': '50', 'inp-garbage': '24',
        'inp-internet': '80', 'inp-insurance': '100',
        'inp-supplies': '120', 'inp-linens': '41',
        'inp-pms': '39', 'inp-pricing': '20',
        'inp-minut-subscription': '10', 'inp-streaming': '8', 'inp-airbnb-fee-type': '3%',
        'inp-has-yard': 'No', 'inp-lawn-care': '0', 'inp-pest-control': '51', 'inp-bulk-pickup': '8',
        'inp-preventive-inspection': '50', 'inp-hvac-filters': '10', 'inp-cpa': '42',
        'inp-cleaning': '120',
        'inp-furniture': '6500', 'inp-photo': '205', 'inp-lock': '180', 'inp-legal': '400',
        'inp-misc': '500', 'inp-minut-hardware': '100', 'inp-wifi-router': '100', 'inp-welcome-kits': '195',
        'inp-notes': '',
      };
      Object.entries(defaults).forEach(([id, val]) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) el.value = val;
      });
      syncLawnField(false);
      const propSelect = document.getElementById('inp-property') as HTMLSelectElement;
      if (propSelect) propSelect.value = '';

      applyPropertyMeta(null);

      (document.getElementById('btn-save')   as HTMLElement).style.display = '';
      (document.getElementById('btn-update') as HTMLElement).style.display = 'none';
      (document.getElementById('btn-new')    as HTMLElement).style.display = 'none';
      show('no-property-hint');
      runCalc();
    }

    // ── Button wiring ────────────────────────────────────────────────────────────

    document.getElementById('btn-save')!.addEventListener('click', saveAnalysis);
    document.getElementById('btn-update')!.addEventListener('click', updateAnalysis);
    document.getElementById('btn-export')!.addEventListener('click', () => {
      if (!lastResults) return;
      const inputs = gatherInputs();
      const ramp   = gatherRamp();
      exportMarkdown(inputs, lastResults, {
        name:         inpStr('inp-name'),
        address:      inpStr('inp-address'),
        bedrooms:     inpStr('inp-bedrooms'),
        bathrooms:    inpStr('inp-bathrooms'),
        propertyType: inpStr('inp-type'),
        notes:        inpStr('inp-notes'),
        riskFlags:    getRiskFlags(inputs, lastResults, ramp.paybackRuleMonths),
      }, ramp);
    });
    document.getElementById('btn-new')!.addEventListener('click', () => {
      resetForm();
      loadProperties();
    });

    // ── New Property Modal ────────────────────────────────────────────────────────

    initPropertyModal({
      onPropertyCreated(property) {
        propertiesList.unshift(property);
        const select = document.getElementById('inp-property') as HTMLSelectElement;
        hide('no-properties-hint');
        select.innerHTML = '<option value="">— Select a property —</option>' +
          propertiesList.map(p =>
            `<option value="${esc(p.id)}">${esc(p.address_line1)}, ${esc(p.city)}</option>`
          ).join('');
        select.value = property.id;
        selectedPropertyId = property.id;
        const addrEl = document.getElementById('inp-address') as HTMLInputElement;
        if (addrEl) {
          const parts = [property.address_line1];
          if (property.address_line2) parts.push(property.address_line2);
          parts.push(property.city);
          addrEl.value = parts.join(', ');
        }
        applyPropertyMeta(property);
        hide('orphan-warning');
        hide('no-property-hint');
        runCalc();
      },
    });

    // ── Init ─────────────────────────────────────────────────────────────────────

    (async () => {
      // Session presence is already enforced by middleware for /admin/*.
      runCalc();
      await loadProperties();

      // Check for ?load= URL param (navigated from Saved Analyses)
      const loadId = new URLSearchParams(location.search).get('load');
      if (loadId) {
        await loadAnalysisById(loadId);
      } else {
        // Check for property pre-selection from Properties page "New Analysis" shortcut
        const preselectedId   = sessionStorage.getItem('analyzer_property_id');
        const preselectedAddr = sessionStorage.getItem('analyzer_property_addr');
        if (preselectedId) {
          sessionStorage.removeItem('analyzer_property_id');
          sessionStorage.removeItem('analyzer_property_addr');
          selectedPropertyId = preselectedId;
          const propSelect = document.getElementById('inp-property') as HTMLSelectElement;
          if (propSelect) propSelect.value = preselectedId;
          const addrEl = document.getElementById('inp-address') as HTMLInputElement;
          if (addrEl && preselectedAddr) addrEl.value = preselectedAddr;
          applyPropertyMeta(propertiesList.find(p => p.id === preselectedId) ?? null);
          hide('orphan-warning');
          hide('no-property-hint');
          runCalc();
        } else {
          show('no-property-hint');
        }
      }

      pageRef.current?.classList.add('ready');
    })();
  }, []);

  return (
    <div className="page" ref={pageRef}>
      <div className="portal-content">

        <div className="section-label">Property Financial Analyzer</div>

        <div className="calc-layout">

          {/* INPUT PANEL */}
          <div className="calc-panel">
            <div className="calc-panel-title">
              Inputs
              <span id="current-analysis-id" style={{ display: 'none' }}></span>
            </div>

            {/* Property Association */}
            <div className="property-assoc">
              <div className="property-assoc-row">
                <div className="field-group" style={{ flex: 1, minWidth: 0 }}>
                  <label htmlFor="inp-property">Linked Property</label>
                  <select id="inp-property">
                    <option value="">— Select a property —</option>
                  </select>
                </div>
                <button id="btn-new-property" type="button" className="btn-add-prop" title="Add new property">
                  <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New
                </button>
              </div>
              <div id="orphan-warning" className="assoc-banner warn" style={{ display: 'none' }}>
                This analysis has no linked property. Select one above before saving.
              </div>
              <div id="no-property-hint" className="assoc-banner info" style={{ display: 'none' }}>
                Select a property above to enable saving.
              </div>
              <div id="no-properties-hint" className="assoc-banner info" style={{ display: 'none' }}>
                No properties yet. <a href="/admin/properties">Create one first →</a>
              </div>
            </div>

            {/* Section 1: Property Basics */}
            <div className="calc-section">
              <button className="calc-section-toggle open" data-target="sec-basics" type="button">
                Property Basics
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body open" id="sec-basics">
                <div className="field-row full">
                  <div className="field-group">
                    <label htmlFor="inp-name">Analysis Label</label>
                    <input type="text" id="inp-name" defaultValue="New Analysis" placeholder="e.g. 1234 Oak St — Summer" />
                  </div>
                </div>
                <div className="field-row full">
                  <div className="field-group">
                    <label htmlFor="inp-address">Property Address</label>
                    <input type="text" id="inp-address" placeholder="Auto-filled from linked property" readOnly />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-bedrooms">Bedrooms</label>
                    <input type="text" id="inp-bedrooms" disabled className="prop-auto-field" placeholder="— from property —" />
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-bathrooms">Bathrooms</label>
                    <input type="text" id="inp-bathrooms" disabled className="prop-auto-field" placeholder="— from property —" />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-type">Property Type</label>
                    <input type="text" id="inp-type" disabled className="prop-auto-field" placeholder="— from property —" />
                  </div>
                  <div className="field-group"></div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-rent-ask">Monthly Rent (Ask)</label>
                    <input type="number" id="inp-rent-ask" defaultValue="1400" min={0} step={50} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-rent-neg">Monthly Rent (Negotiated)</label>
                    <input type="number" id="inp-rent-neg" defaultValue="1200" min={0} step={50} />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-deposit">Security Deposit</label>
                    <input type="number" id="inp-deposit" defaultValue="1400" min={0} step={50} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-hoa">HOA Present?</label>
                    <select id="inp-hoa" defaultValue="No">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-walk-away">Walk-Away Threshold ($)</label>
                    <input type="number" id="inp-walk-away" defaultValue="1750" min={0} step={50} />
                    <span className="field-note">Max monthly rent R&amp;L will sign</span>
                  </div>
                  <div className="field-group"></div>
                </div>
                <div className="hoa-block" id="hoa-block">
                  <div className="hoa-block-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    HOA Detected — Property Disqualified
                  </div>
                  <p className="hoa-block-body">Vinclo Real Estate does not lease HOA properties under any circumstances.</p>
                </div>
              </div>
            </div>

            {/* Section 2: Revenue Assumptions */}
            <div className="calc-section">
              <button className="calc-section-toggle open" data-target="sec-revenue" type="button">
                Revenue Assumptions
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body open" id="sec-revenue">
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-adr">ADR — Avg Daily Rate ($)</label>
                    <input type="number" id="inp-adr" defaultValue="167" min={0} step={1} />
                    <span className="field-note">AirDNA Abilene 2BR avg</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-occ">Occupancy Rate (%)</label>
                    <input type="number" id="inp-occ" defaultValue="77" min={0} max={100} step={1} />
                    <span className="field-note">AirDNA Abilene annual avg</span>
                    <span className="field-note occ-cap-note" id="occ-cap-note" style={{ display: 'none' }}>capped at 95% — practical ceiling</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-stay">Avg Stay Length (nights)</label>
                    <input type="number" id="inp-stay" defaultValue="3.2" min={1} step={0.1} />
                    <span className="field-note">Abilene military/university profile</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-demand">Primary Demand Driver</label>
                    <select id="inp-demand" defaultValue="Military TDY">
                      <option value="Military TDY">Military TDY</option>
                      <option value="University Events">University Events</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Corporate/Contractor">Corporate / Contractor</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2b: New-Listing Ramp */}
            <div className="calc-section">
              <button className="calc-section-toggle open" data-target="sec-ramp" type="button">
                New-Listing Ramp
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body open" id="sec-ramp">
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-ramp-enabled">Ramp Mode</label>
                    <select id="inp-ramp-enabled" defaultValue="Yes">
                      <option value="Yes">On — realistic year 1</option>
                      <option value="No">Off — day-1 stabilized</option>
                    </select>
                    <span className="field-note">Models gradual occupancy/ADR ramp for a new listing</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-payback-rule">Payback Rule (months)</label>
                    <input type="number" id="inp-payback-rule" defaultValue="9" min={1} step={1} />
                    <span className="field-note">Ramped payback beyond this fires a risk flag</span>
                  </div>
                </div>
                <div id="ramp-fields">
                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="inp-make-ready">Make-Ready Month 1?</label>
                      <select id="inp-make-ready" defaultValue="Yes">
                        <option value="Yes">Yes — zero revenue</option>
                        <option value="No">No</option>
                      </select>
                      <span className="field-note">Setup, photography, listing go-live</span>
                    </div>
                    <div className="field-group">
                      <label htmlFor="inp-rent-free">Month 1 Rent-Free?</label>
                      <select id="inp-rent-free" defaultValue="Yes">
                        <option value="Yes">Yes — negotiated</option>
                        <option value="No">No — adds rent to carry</option>
                      </select>
                    </div>
                  </div>
                  <div className="calc-subsection-title">Ramp Phases (× base occ / ADR)</div>
                  <div className="field-row ramp-phase-row">
                    <div className="field-group">
                      <label htmlFor="inp-ramp1-months">Phase 1 — Months</label>
                      <input type="number" id="inp-ramp1-months" defaultValue="3" min={0} step={1} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="inp-ramp1-occ">Occ Factor</label>
                      <input type="number" id="inp-ramp1-occ" defaultValue="0.85" min={0} max={1.5} step={0.01} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="inp-ramp1-adr">ADR Factor</label>
                      <input type="number" id="inp-ramp1-adr" defaultValue="0.90" min={0} max={1.5} step={0.01} />
                    </div>
                  </div>
                  <div className="field-row ramp-phase-row">
                    <div className="field-group">
                      <label htmlFor="inp-ramp2-months">Phase 2 — Months</label>
                      <input type="number" id="inp-ramp2-months" defaultValue="3" min={0} step={1} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="inp-ramp2-occ">Occ Factor</label>
                      <input type="number" id="inp-ramp2-occ" defaultValue="0.93" min={0} max={1.5} step={0.01} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="inp-ramp2-adr">ADR Factor</label>
                      <input type="number" id="inp-ramp2-adr" defaultValue="0.96" min={0} max={1.5} step={0.01} />
                    </div>
                  </div>
                  <span className="field-note">Final phase: stabilized at 1.00 / 1.00. Occupancy is capped at 95% after factors.</span>
                </div>
              </div>
            </div>

            {/* Section 3: Fixed Monthly Costs */}
            <div className="calc-section">
              <button className="calc-section-toggle open" data-target="sec-fixed" type="button">
                Fixed Monthly Costs
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body open" id="sec-fixed">

                <div className="calc-subsection-title">Utilities</div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-electricity">Electricity (AEP Texas)</label>
                    <input type="number" id="inp-electricity" defaultValue="130" min={0} step={1} />
                    <span className="field-note">$120–$140 (2BR) · $145–$170 (3BR)</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-water">Water</label>
                    <input type="number" id="inp-water" defaultValue="45" min={0} step={1} />
                    <span className="field-note">$40–$50 (2BR) · $50–$60 (3BR) · confirm if landlord-included</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-sewer">Sewer</label>
                    <input type="number" id="inp-sewer" defaultValue="50" min={0} step={1} />
                    <span className="field-note">$45–$55 (2BR) · $55–$65 (3BR) · confirm if landlord-included</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-garbage">Garbage (City of Abilene)</label>
                    <input type="number" id="inp-garbage" defaultValue="24" min={0} step={1} />
                    <span className="field-note">$24 flat · confirm if landlord-included</span>
                  </div>
                </div>

                <div className="calc-subsection-title">Internet &amp; Insurance</div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-internet">Internet (fiber)</label>
                    <input type="number" id="inp-internet" defaultValue="80" min={0} step={1} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-insurance">STR Insurance (Proper)</label>
                    <input type="number" id="inp-insurance" defaultValue="100" min={0} step={1} />
                    <span className="field-note">Quote in hand: $98–103/mo</span>
                  </div>
                </div>

                <div className="calc-subsection-title">Supplies</div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-supplies">Supplies &amp; Amenities</label>
                    <input type="number" id="inp-supplies" defaultValue="120" min={0} step={5} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-linens">Linens &amp; Towels (reserve)</label>
                    <input type="number" id="inp-linens" defaultValue="41" min={0} step={1} />
                    <span className="field-note">$35 (2BR) · $48 (3BR)</span>
                  </div>
                </div>

                <div className="calc-subsection-title">Tech &amp; Platforms</div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-pms">PMS Software (Hospitable)</label>
                    <input type="number" id="inp-pms" defaultValue="39" min={0} step={1} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-pricing">Dynamic Pricing (PriceLabs)</label>
                    <input type="number" id="inp-pricing" defaultValue="20" min={0} step={1} />
                    <span className="field-note">$19.99/listing/mo after trial</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-minut-subscription">Minut (noise sensor)</label>
                    <input type="number" id="inp-minut-subscription" defaultValue="10" min={0} step={1} />
                    <span className="field-note">$10 flat</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-streaming">Streaming (Netflix/Hulu)</label>
                    <input type="number" id="inp-streaming" defaultValue="8" min={0} step={1} />
                    <span className="field-note">$8 flat · guest profile</span>
                  </div>
                </div>

                <div className="calc-subsection-title">Maintenance &amp; Admin</div>
                <div className="field-row">
                  <div className="field-group">
                    <label>Maintenance Reserve</label>
                    <input type="number" id="inp-maintenance" readOnly />
                    <span className="field-note">Auto: 1.5% of negotiated rent (min $75, max $150)</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-preventive-inspection">Preventive Inspection</label>
                    <input type="number" id="inp-preventive-inspection" defaultValue="50" min={0} step={1} />
                    <span className="field-note">$50 · handyman · every 2 mo (6x/yr) · prorated</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-hvac-filters">HVAC Filters</label>
                    <input type="number" id="inp-hvac-filters" defaultValue="10" min={0} step={1} />
                    <span className="field-note">$8 (2BR) · $12 (3BR) · every 45–60 days · prorated</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-cpa">CPA / Taxes</label>
                    <input type="number" id="inp-cpa" defaultValue="42" min={0} step={1} />
                    <span className="field-note">~$500/yr billed Q1 · prorated</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label>STR Permit</label>
                    <input type="number" defaultValue="0" readOnly disabled />
                    <span className="field-note"><span className="field-badge">No permit required — City of Abilene (2026)</span></span>
                  </div>
                  <div className="field-group"></div>
                </div>
              </div>
            </div>

            {/* Section 3b: Property Services */}
            <div className="calc-section">
              <button className="calc-section-toggle" data-target="sec-property-services" type="button">
                Property Services
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body" id="sec-property-services">
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-has-yard">Has Yard?</label>
                    <select id="inp-has-yard" defaultValue="No">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    <span className="field-note">Enables lawn care cost when Yes</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-lawn-care">Lawn Care</label>
                    <input type="number" id="inp-lawn-care" defaultValue="0" min={0} step={1} readOnly />
                    <span className="field-note">$75 (2BR) · $82 (3BR) · Apr–Oct 2x/mo, Nov–Mar 1x/mo · prorated</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-pest-control">Pest Control</label>
                    <input type="number" id="inp-pest-control" defaultValue="51" min={0} step={1} />
                    <span className="field-note">$50 (2BR) · $53 (3BR) · quarterly · prorated</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-bulk-pickup">Bulk Pickup</label>
                    <input type="number" id="inp-bulk-pickup" defaultValue="8" min={0} step={1} />
                    <span className="field-note">~2x/yr · prorated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Per-Stay Variable Costs */}
            <div className="calc-section">
              <button className="calc-section-toggle" data-target="sec-variable" type="button">
                Per-Stay Variable Costs
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body" id="sec-variable">
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-cleaning">Cleaning Fee per Stay ($)</label>
                    <input type="number" id="inp-cleaning" defaultValue="120" min={0} step={5} />
                    <span className="field-note">Pass-through: charged to guest = paid to cleaner. Net P&amp;L impact = $0.</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-airbnb-fee-type">Airbnb Host Fee</label>
                    <select id="inp-airbnb-fee-type" defaultValue="3%">
                      <option value="3%">3% — Direct (no API)</option>
                      <option value="15.5%">15.5% — Hospitable API</option>
                    </select>
                    <span className="field-note">Verify in Airbnb → Payments &amp; Payouts. API-connected = 15.5%.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Setup & One-Time Costs */}
            <div className="calc-section">
              <button className="calc-section-toggle" data-target="sec-setup" type="button">
                Setup &amp; One-Time Costs
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body" id="sec-setup">
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-furniture">Furniture &amp; Décor</label>
                    <input type="number" id="inp-furniture" defaultValue="6500" min={0} step={100} />
                    <span className="field-note">2BR standard</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-photo">Photography</label>
                    <input type="number" id="inp-photo" defaultValue="205" min={0} step={50} />
                    <span className="field-note">$180–$230 (2BR)</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-lock">Smart Lock</label>
                    <input type="number" id="inp-lock" defaultValue="180" min={0} step={10} />
                    <span className="field-note">Schlage/Yale</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-minut-hardware">Minut Hardware</label>
                    <input type="number" id="inp-minut-hardware" defaultValue="100" min={0} step={10} />
                    <span className="field-note">$100 flat</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-wifi-router">WiFi Router (premium)</label>
                    <input type="number" id="inp-wifi-router" defaultValue="100" min={0} step={10} />
                    <span className="field-note">$80 (2BR) · $120 (3BR)</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-welcome-kits">Welcome Kits (2-mo supply)</label>
                    <input type="number" id="inp-welcome-kits" defaultValue="195" min={0} step={5} />
                    <span className="field-note">$170 (2BR) · $220 (3BR)</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label>LLC Formation</label>
                    <input type="number" defaultValue="0" readOnly disabled />
                    <span className="field-note">Already registered — locked at $0</span>
                  </div>
                  <div className="field-group">
                    <label htmlFor="inp-legal">Legal (Sublease Addendum)</label>
                    <input type="number" id="inp-legal" defaultValue="400" min={0} step={50} />
                    <span className="field-note">TX attorney quote</span>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label htmlFor="inp-misc">Miscellaneous Buffer</label>
                    <input type="number" id="inp-misc" defaultValue="500" min={0} step={50} />
                  </div>
                  <div className="field-group"></div>
                </div>
              </div>
            </div>

            {/* Section 6: HOT Tax Info */}
            <div className="calc-section">
              <button className="calc-section-toggle" data-target="sec-hot" type="button">
                HOT Tax (Abilene)
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body" id="sec-hot">
                <div className="hot-info">
                  <p><strong>Hotel Occupancy Tax (HOT) — Abilene, TX</strong><br />
                  HOT tax is collected and remitted directly by Airbnb on behalf of the host.
                  It does not appear as a cost to the operator and does not impact the P&amp;L model.
                  No action required.</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="calc-section">
              <button className="calc-section-toggle" data-target="sec-notes" type="button">
                Notes
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="calc-section-body" id="sec-notes">
                <div className="field-row full">
                  <div className="field-group">
                    <label htmlFor="inp-notes">Notes</label>
                    <textarea id="inp-notes" placeholder="Landlord contact, property condition, negotiation notes…"></textarea>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* /calc-panel */}

          {/* OUTPUT PANEL */}
          <div className="output-panel" id="output-panel">

            <div className="hoa-block" id="hoa-save-block">
              <div className="hoa-block-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                HOA Detected — Property Disqualified
              </div>
              <p className="hoa-block-body">Saving and export are disabled. Vinclo Real Estate does not lease HOA properties.</p>
            </div>

            {/* Section 1: Property header */}
            <div className="res-header">
              <div className="res-header-main">
                <div className="res-address" id="res-address">—</div>
                <div className="res-subline" id="res-subline">Select a property to begin</div>
              </div>
              <div className="res-header-side">
                <div className="res-buffer-label">Break-even buffer</div>
                <div className="res-buffer-val" id="res-buffer">—</div>
              </div>
            </div>
            <div id="res-badge" className="res-badge" style={{ display: 'none' }}></div>

            {/* Section 2: Metric cards */}
            <div className="res-metrics">
              <div className="res-metric" id="rmc-net-monthly">
                <div className="rmc-val" id="res-net-monthly">—</div>
                <div className="rmc-label">Net / month</div>
                <div className="rmc-sub" id="res-margin-sub">— margin</div>
              </div>
              <div className="res-metric" id="rmc-net-annual">
                <div className="rmc-val" id="res-net-annual">—</div>
                <div className="rmc-label">Net / year</div>
                <div className="rmc-sub">base case</div>
              </div>
              <div className="res-metric">
                <div className="rmc-val" id="res-roi12">—</div>
                <div className="rmc-label">12-mo ROI</div>
                <div className="rmc-sub" id="res-roi-sub">—</div>
              </div>
              <div className="res-metric">
                <div className="rmc-val" id="res-payback">—</div>
                <div className="rmc-label">Payback</div>
                <div className="rmc-sub" id="res-mult-sub">—</div>
              </div>
            </div>

            {/* 1/3 Rule Validator */}
            <div className="res-chart-card rule-card">
              <div className="rule-card-hd">
                <span className="rcc-title" style={{ marginBottom: 0 }}>1/3 Rule Validator</span>
                <span className="rule-target">target: each bucket ≈ 33% of gross</span>
              </div>
              <div className="rule-legend">
                <div className="rule-legend-item">
                  <span className="rule-swatch" id="rule-swatch-rent"></span>
                  <span className="rule-legend-label">Rent</span>
                  <span className="rule-legend-pct" id="rule-rent-pct">—</span>
                </div>
                <div className="rule-legend-item">
                  <span className="rule-swatch" id="rule-swatch-ops"></span>
                  <span className="rule-legend-label">Operating</span>
                  <span className="rule-legend-pct" id="rule-ops-pct">—</span>
                </div>
                <div className="rule-legend-item">
                  <span className="rule-swatch" id="rule-swatch-net"></span>
                  <span className="rule-legend-label">Net</span>
                  <span className="rule-legend-pct" id="rule-net-pct">—</span>
                </div>
              </div>
              <div className="rule-bar">
                <div className="rule-segment" id="rule-seg-rent"></div>
                <div className="rule-segment" id="rule-seg-ops"></div>
                <div className="rule-segment" id="rule-seg-net"></div>
              </div>
              <div className="rule-verdict-row">
                <span className="rule-verdict" id="rule-verdict">—</span>
              </div>
            </div>

            {/* Section 3: Two-column chart row */}
            <div className="res-chart-row">
              <div className="res-chart-card">
                <div className="rcc-title">Revenue waterfall</div>
                <div style={{ position: 'relative', height: 220 }}>
                  <canvas id="chart-waterfall"></canvas>
                </div>
              </div>
              <div className="res-chart-card">
                <div className="rcc-title">Break-even vs actual occupancy</div>
                <div className="gauge-wrap">
                  <canvas id="chart-gauge" width={220} height={130}></canvas>
                </div>
                <div className="gauge-legend" id="gauge-legend"></div>
                <div className="rcc-title" style={{ marginTop: 14 }}>Scenario outcomes</div>
                <div style={{ position: 'relative', height: 80 }}>
                  <canvas id="chart-scenarios"></canvas>
                </div>
              </div>
            </div>

            {/* Section 4: Monthly cash flow */}
            <div className="res-chart-card">
              <div className="rcc-title">Estimated monthly cash flow</div>
              <div style={{ position: 'relative', height: 140 }}>
                <canvas id="chart-monthly"></canvas>
              </div>
              <div className="rcc-footnote" id="monthly-footnote"></div>
              <div className="rcc-market-note" id="market-note"></div>
            </div>

            {/* Section 5: ROI curve */}
            <div className="res-chart-card">
              <div className="rcc-title">Cumulative ROI — 24-month payback curve</div>
              <div style={{ position: 'relative', height: 140 }}>
                <canvas id="chart-roi"></canvas>
              </div>
              <div className="rcc-footnote" id="roi-footnote"></div>
            </div>

            {/* P&L Statement */}
            <div className="res-chart-card">
              <div className="rcc-title">Monthly P&amp;L Statement — Base Case</div>
              <table className="pl-table">
                <tbody>
                  <tr className="pl-section-hd"><td colSpan={2}>Revenue</td></tr>
                  <tr><td>Gross Revenue (ADR × Occ × 30 nights)</td><td id="pl-gross-revenue" className="pl-amount"></td></tr>
                  <tr className="pl-section-hd"><td colSpan={2}>Cost of Revenue</td></tr>
                  <tr><td id="pl-airbnb-label">Airbnb Host Fee (3%)</td><td id="pl-airbnb-fee" className="pl-amount pl-cost"></td></tr>
                  <tr className="pl-divider"><td colSpan={2}></td></tr>
                  <tr className="pl-subtotal"><td>Net Platform Revenue</td><td id="pl-net-platform" className="pl-amount"></td></tr>
                  <tr className="pl-section-hd"><td colSpan={2}>Fixed Costs</td></tr>
                  <tr><td>Rent</td><td id="pl-rent" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Electricity</td><td id="pl-electricity" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Water</td><td id="pl-water" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Sewer</td><td id="pl-sewer" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Garbage</td><td id="pl-garbage" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Internet</td><td id="pl-internet" className="pl-amount pl-cost"></td></tr>
                  <tr><td>STR Insurance (Proper)</td><td id="pl-insurance" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Supplies &amp; Amenities</td><td id="pl-supplies" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Linens &amp; Towels</td><td id="pl-linens" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Hospitable PMS</td><td id="pl-pms" className="pl-amount pl-cost"></td></tr>
                  <tr><td>PriceLabs</td><td id="pl-pricing" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Minut Subscription</td><td id="pl-minut" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Streaming</td><td id="pl-streaming" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Lawn Care</td><td id="pl-lawn-care" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Pest Control</td><td id="pl-pest-control" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Bulk Pickup</td><td id="pl-bulk-pickup" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Maintenance Reserve</td><td id="pl-maintenance" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Preventive Inspection</td><td id="pl-preventive-inspection" className="pl-amount pl-cost"></td></tr>
                  <tr><td>HVAC Filters</td><td id="pl-hvac-filters" className="pl-amount pl-cost"></td></tr>
                  <tr><td>CPA / Taxes</td><td id="pl-cpa" className="pl-amount pl-cost"></td></tr>
                  <tr className="pl-divider"><td colSpan={2}></td></tr>
                  <tr className="pl-subtotal"><td>Total Monthly Costs</td><td id="pl-total-costs" className="pl-amount pl-cost"></td></tr>
                  <tr className="pl-divider pl-divider--thick"><td colSpan={2}></td></tr>
                  <tr className="pl-net"><td>Net Monthly Profit</td><td id="pl-net-monthly" className="pl-amount"></td></tr>
                  <tr className="pl-net"><td>Net Annual Profit</td><td id="pl-net-annual" className="pl-amount"></td></tr>
                  <tr className="pl-divider"><td colSpan={2}></td></tr>
                  <tr className="pl-kpi"><td>Break-Even Occupancy</td><td id="pl-breakeven" className="pl-amount"></td></tr>
                  <tr className="pl-kpi"><td>Profit Margin</td><td id="pl-margin" className="pl-amount"></td></tr>
                </tbody>
              </table>
            </div>

            {/* Initial Investment */}
            <div className="res-chart-card">
              <div className="rcc-title">Initial Investment</div>
              <table className="pl-table">
                <tbody>
                  <tr className="pl-section-hd"><td colSpan={2}>Capital Required</td></tr>
                  <tr><td>Security Deposit</td><td id="ii-deposit" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Furniture &amp; Décor</td><td id="ii-furniture" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Photography</td><td id="ii-photo" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Smart Lock</td><td id="ii-lock" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Minut Hardware</td><td id="ii-minut-hardware" className="pl-amount pl-cost"></td></tr>
                  <tr><td>WiFi Router</td><td id="ii-wifi-router" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Welcome Kits</td><td id="ii-welcome-kits" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Legal</td><td id="ii-legal" className="pl-amount pl-cost"></td></tr>
                  <tr><td>Miscellaneous</td><td id="ii-misc" className="pl-amount pl-cost"></td></tr>
                  <tr id="ii-carry-row" style={{ display: 'none' }}><td>Month-1 Carry (auto — hover for breakdown)</td><td id="ii-carry" className="pl-amount pl-cost"></td></tr>
                  <tr className="pl-divider pl-divider--thick"><td colSpan={2}></td></tr>
                  <tr className="pl-subtotal"><td>Total Initial Investment</td><td id="ii-total" className="pl-amount pl-cost"></td></tr>
                </tbody>
              </table>
              <div className="ii-metrics">
                <div className="res-metric">
                  <div className="rmc-val" id="ii-payback">—</div>
                  <div className="rmc-label" id="ii-payback-label">Payback Period</div>
                  <div className="rmc-sub" id="ii-payback-flat" style={{ display: 'none' }} title=""></div>
                </div>
                <div className="res-metric">
                  <div className="rmc-val" id="ii-roi12">—</div>
                  <div className="rmc-label">12-Month ROI</div>
                </div>
                <div className="res-metric">
                  <div className="rmc-val" id="ii-roi24">—</div>
                  <div className="rmc-label">24-Month ROI</div>
                </div>
              </div>
            </div>

            {/* Risk flags (collapsible) */}
            <details className="res-collapsible">
              <summary className="res-coll-hd">
                <span>Risk Assessment</span>
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div className="res-coll-body">
                <div className="risk-flags" id="risk-flags">
                  <div className="risk-flag ok"><span className="risk-flag-icon">✓</span>No risk flags triggered.</div>
                </div>
              </div>
            </details>

            {/* Cleaning pass-through (collapsible) */}
            <details className="res-collapsible">
              <summary className="res-coll-hd">
                <span>Cleaning — Pass-Through</span>
                <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div className="res-coll-body">
                <div className="passthrough-note">Revenue collected from guest = cost paid to cleaner. Net P&amp;L impact = $0.</div>
                <div className="metric-row"><span className="metric-label">Stays / Month</span><span className="metric-value" id="out-stays">—</span></div>
                <div className="metric-row"><span className="metric-label">Cleaning Collected</span><span className="metric-value" id="out-cleaning-collected">—</span></div>
                <div className="metric-row"><span className="metric-label">Cleaning Paid</span><span className="metric-value" id="out-cleaning-paid">—</span></div>
                <div className="metric-row"><span className="metric-label">Net P&amp;L Impact</span><span className="metric-value green">$0</span></div>
              </div>
            </details>

            {/* Actions */}
            <div className="calc-actions">
              <button className="btn btn-primary" id="btn-save" type="button" disabled>
                <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Analysis
              </button>
              <button className="btn btn-ghost" id="btn-update" type="button" style={{ display: 'none' }}>
                <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Update
              </button>
              <button className="btn btn-ghost" id="btn-new" type="button" style={{ display: 'none' }}>New Analysis</button>
              <button className="btn btn-ghost" id="btn-export" type="button">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export .md
              </button>
            </div>

            <div className="view-saved-link">
              <a href="/admin/analyses">View all saved analyses →</a>
            </div>

          </div>{/* /output-panel */}
        </div>{/* /calc-layout */}

      </div>{/* /portal-content */}

      <footer>
        <div className="footer-brand">Vinclo Real Estate</div>
        <div className="footer-meta">&copy; 2026 &middot; Abilene, TX &middot; Owner Portal</div>
      </footer>

      {/* New Property Modal */}
      <div className="modal-backdrop" id="modal-backdrop" style={{ display: 'none' }}></div>
      <div className="modal" id="modal-new-property" style={{ display: 'none' }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title">Add Property</div>
          <button className="modal-close" id="modal-close" type="button" aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="modal-error" id="modal-error" style={{ display: 'none' }}></div>
          <div className="field-row full">
            <div className="field-group">
              <label htmlFor="np-addr1">Address Line 1 <span className="req">*</span></label>
              <input type="text" id="np-addr1" placeholder="123 Main St" />
            </div>
          </div>
          <div className="field-row full">
            <div className="field-group">
              <label htmlFor="np-addr2">Address Line 2</label>
              <input type="text" id="np-addr2" placeholder="Apt 2B, Unit 4…" />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="np-city">City <span className="req">*</span></label>
              <input type="text" id="np-city" placeholder="Abilene" />
            </div>
            <div className="field-group">
              <label htmlFor="np-zip">Zip Code <span className="req">*</span></label>
              <input type="text" id="np-zip" placeholder="79601" />
            </div>
          </div>
          <div className="field-row full">
            <div className="field-group">
              <label htmlFor="np-neighborhood">Neighborhood</label>
              <input type="text" id="np-neighborhood" placeholder="Optional" />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="np-bedrooms">Bedrooms</label>
              <select id="np-bedrooms" defaultValue="">
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
              <label htmlFor="np-bathrooms">Bathrooms</label>
              <select id="np-bathrooms" defaultValue="">
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
              <label htmlFor="np-type">Property Type</label>
              <select id="np-type" defaultValue="">
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
          <div className="field-row full">
            <div className="field-group">
              <label htmlFor="np-landlord">Landlord <span className="req">*</span></label>
              <select id="np-landlord" defaultValue="">
                <option value="">— Select landlord —</option>
              </select>
            </div>
          </div>
          <div id="no-landlords-msg" className="assoc-banner warn" style={{ display: 'none' }}>
            No landlords yet. <a href="/admin/landlords">Create one first →</a>
          </div>

          {/* Quick-create landlord toggle */}
          <div className="quick-landlord-toggle">
            <button type="button" id="btn-toggle-ql" className="link-btn">
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Quick-create landlord
            </button>
          </div>
          <div id="quick-landlord-form" className="quick-landlord-form" style={{ display: 'none' }}>
            <div className="ql-title">New Landlord</div>
            <div className="field-row full">
              <div className="field-group">
                <label htmlFor="ql-name">Name <span className="req">*</span></label>
                <input type="text" id="ql-name" placeholder="Acme Property Mgmt" />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label htmlFor="ql-phone">Phone <span className="req">*</span></label>
                <input type="text" id="ql-phone" placeholder="(555) 000-0000" />
              </div>
              <div className="field-group">
                <label htmlFor="ql-email">Email <span className="req">*</span></label>
                <input type="email" id="ql-email" placeholder="contact@example.com" />
              </div>
            </div>
            <div className="field-row full">
              <div className="field-group">
                <label htmlFor="ql-type">Type <span className="req">*</span></label>
                <select id="ql-type" defaultValue="">
                  <option value="">— Select type —</option>
                  <option>Property Management Company</option>
                  <option>Individual Investor&apos;s LLC</option>
                  <option>Small Local RE Company</option>
                  <option>Regional Portfolio Operator</option>
                  <option>Institutional Landlord</option>
                  <option>Real Estate Agent</option>
                  <option>Turnkey Rental Company</option>
                  <option>Relocation/Corporate Housing Company</option>
                </select>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" id="btn-create-landlord">Create Landlord</button>
          </div>

          <div className="field-row full" style={{ marginTop: 12 }}>
            <div className="field-group">
              <label htmlFor="np-notes">Notes</label>
              <textarea id="np-notes" placeholder="Optional"></textarea>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" id="btn-modal-cancel">Cancel</button>
            <button type="button" className="btn btn-primary" id="btn-modal-save">Create Property</button>
          </div>
        </div>
      </div>
    </div>
  );
}
