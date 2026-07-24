'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase/client';
import './CallbackHandler.css';

export default function CallbackHandler() {
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    const views = {
      loading: document.getElementById('view-loading')!,
      reset:   document.getElementById('view-reset')!,
      invalid: document.getElementById('view-invalid')!,
    };

    function showView(name: 'loading' | 'reset' | 'invalid') {
      Object.values(views).forEach(v => v.classList.remove('active'));
      views[name].classList.add('active');
    }

    const resetError = document.getElementById('reset-error')!;
    const resetBtn   = document.getElementById('reset-btn') as HTMLButtonElement;

    function setLoading(on: boolean) {
      resetBtn.disabled = on;
      resetBtn.classList.toggle('loading', on);
    }

    const newPwInput     = document.getElementById('new-password') as HTMLInputElement;
    const confirmPwInput = document.getElementById('confirm-password') as HTMLInputElement;
    const mismatchHint   = document.getElementById('mismatch-hint')!;

    function checkMatch() {
      if (confirmPwInput.value.length === 0) { mismatchHint.style.display = 'none'; return; }
      mismatchHint.style.display = newPwInput.value !== confirmPwInput.value ? '' : 'none';
    }

    newPwInput.addEventListener('input', checkMatch);
    confirmPwInput.addEventListener('input', checkMatch);

    document.querySelectorAll<HTMLButtonElement>('.toggle-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target!) as HTMLInputElement;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.classList.toggle('shown');
      });
    });

    const timeout = setTimeout(() => showView('invalid'), 4000);

    supabase.auth.onAuthStateChange(async (event) => {
      clearTimeout(timeout);
      if (event === 'PASSWORD_RECOVERY') {
        showView('reset');
      } else if (event === 'SIGNED_IN') {
        window.location.replace('/admin');
      }
    });

    document.getElementById('reset-form')!.addEventListener('submit', async e => {
      e.preventDefault();
      resetError.classList.remove('show');
      const password = newPwInput.value;
      const confirm  = confirmPwInput.value;
      if (password.length < 8) {
        resetError.textContent = 'Password must be at least 8 characters.';
        resetError.classList.add('show');
        return;
      }
      if (password !== confirm) {
        resetError.textContent = 'Passwords do not match.';
        resetError.classList.add('show');
        return;
      }
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) {
        resetError.textContent = 'Could not update your password. Please request a new reset link.';
        resetError.classList.add('show');
      } else {
        window.location.replace('/admin');
      }
    });
  }, []);

  return (
    <div className="auth-page">
      <div className="page-bg"></div>
      <div className="grid-lines"></div>

      <header className="site-header">
        <a href="/" className="wordmark">
          <span>Vinclo <span className="wordmark-accent">Real Estate</span></span>
        </a>
      </header>

      <main>
        <div className="card">

          {/* VIEW: Loading */}
          <div className="view active" id="view-loading">
            <div className="card-eyebrow">Please wait</div>
            <h1 className="card-title">Verifying<br /><em>your link</em></h1>
            <p style={{ fontSize: '.9rem', color: '#7a6e65' }}>Validating your reset link&hellip;</p>
          </div>

          {/* VIEW: Set new password */}
          <div className="view" id="view-reset">
            <div className="card-eyebrow">Owner Portal</div>
            <h1 className="card-title">Set new<br /><em>password</em></h1>

            <div className="alert alert-error" id="reset-error" role="alert"></div>

            <form id="reset-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <div className="input-wrap">
                  <input id="new-password" name="password" type="password" className="form-input" placeholder="••••••••" autoComplete="new-password" required />
                  <button type="button" className="toggle-pw" aria-label="Toggle password visibility" data-target="new-password">
                    <svg className="eye-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg className="eye-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
                <span className="password-hint">Minimum 8 characters</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="input-wrap">
                  <input id="confirm-password" name="confirm" type="password" className="form-input" placeholder="••••••••" autoComplete="new-password" required />
                  <button type="button" className="toggle-pw" aria-label="Toggle password visibility" data-target="confirm-password">
                    <svg className="eye-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg className="eye-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
                <span className="password-hint" id="mismatch-hint" style={{ display: 'none', color: '#c0392b' }}>Passwords do not match</span>
              </div>
              <button type="submit" className="btn-submit" id="reset-btn">
                <div className="btn-spinner"></div>
                <span className="btn-text">Update Password</span>
              </button>
            </form>
          </div>

          {/* VIEW: Invalid/expired link */}
          <div className="view" id="view-invalid">
            <div className="card-eyebrow">Link Expired</div>
            <h1 className="card-title">This link has<br /><em>expired</em></h1>
            <p style={{ fontSize: '.88rem', color: '#7a6e65', marginBottom: 28, lineHeight: 1.65 }}>
              Password reset links are valid for one hour. Please request a new one.
            </p>
            <a href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#254a34', color: '#faf8f4', fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: '.78rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 2, transition: 'background .35s' }}>
              Back to sign in &rarr;
            </a>
          </div>

        </div>
      </main>

      <footer className="site-footer">
        <a href="/">vinclorealestate.com</a> &nbsp;&middot;&nbsp; &copy; 2026 Vinclo Real Estate
      </footer>
    </div>
  );
}
