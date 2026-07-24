'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase/client';
import './LoginForm.css';

export default function LoginForm() {
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    const views = {
      login:  document.getElementById('view-login')!,
      forgot: document.getElementById('view-forgot')!,
    };
    const loginError    = document.getElementById('login-error')!;
    const loginBtn      = document.getElementById('login-btn') as HTMLButtonElement;
    const forgotError   = document.getElementById('forgot-error')!;
    const forgotSuccess = document.getElementById('forgot-success')!;
    const forgotBtn     = document.getElementById('forgot-btn') as HTMLButtonElement;

    function showView(name: 'login' | 'forgot') {
      Object.values(views).forEach(v => v.classList.remove('active'));
      views[name].classList.add('active');
      loginError.classList.remove('show');
      forgotError.classList.remove('show');
      forgotSuccess.classList.remove('show');
    }

    function setLoading(btn: HTMLButtonElement, on: boolean) {
      btn.disabled = on;
      btn.classList.toggle('loading', on);
    }

    function showError(el: HTMLElement, msg: string) {
      el.textContent = msg;
      el.classList.add('show');
    }

    document.querySelectorAll<HTMLButtonElement>('.toggle-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target!) as HTMLInputElement;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.classList.toggle('shown');
      });
    });

    document.getElementById('goto-forgot')!.addEventListener('click', () => showView('forgot'));
    document.getElementById('goto-login')!.addEventListener('click',  () => showView('login'));

    document.getElementById('login-form')!.addEventListener('submit', async e => {
      e.preventDefault();
      loginError.classList.remove('show');
      const email    = (document.getElementById('login-email') as HTMLInputElement).value.trim();
      const password = (document.getElementById('login-password') as HTMLInputElement).value;
      if (!email || !password) { showError(loginError, 'Please enter your email and password.'); return; }
      setLoading(loginBtn, true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(loginBtn, false);
        if (error) { showError(loginError, 'Invalid email or password. Please try again.'); }
        else { window.location.replace('/admin'); }
      } catch (err) {
        setLoading(loginBtn, false);
        showError(loginError, 'Service unavailable. Please try again later.');
      }
    });

    document.getElementById('forgot-form')!.addEventListener('submit', async e => {
      e.preventDefault();
      forgotError.classList.remove('show');
      forgotSuccess.classList.remove('show');
      const email = (document.getElementById('forgot-email') as HTMLInputElement).value.trim();
      if (!email) { showError(forgotError, 'Please enter your email address.'); return; }
      setLoading(forgotBtn, true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/callback',
      });
      setLoading(forgotBtn, false);
      if (error) { showError(forgotError, 'Reset link could not be sent. Check your email address and try again.'); }
      else {
        forgotSuccess.textContent = 'Check your inbox. A reset link is on its way.';
        forgotSuccess.classList.add('show');
        (document.getElementById('forgot-form') as HTMLFormElement).reset();
      }
    });
  }, []);

  return (
    <div className="auth-page">
      <div className="page-bg"></div>
      <div className="grid-lines"></div>
      <div className="geo"></div>

      <header className="site-header">
        <a href="/" className="wordmark">
          <span>Vinclo <span className="wordmark-accent">Real Estate</span></span>
        </a>
      </header>

      <main>
        <div className="card">

          {/* VIEW: LOGIN */}
          <div className="view active" id="view-login">
            <div className="card-eyebrow">Secure Access</div>
            <h1 className="card-title">Welcome <em>back</em></h1>

            <div className="alert alert-error" id="login-error" role="alert"></div>

            <form id="login-form" method="post" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email</label>
                <input id="login-email" name="email" type="email" className="form-input" placeholder="you@vinclorealestate.com" autoComplete="email" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="input-wrap">
                  <input id="login-password" name="password" type="password" className="form-input" placeholder="••••••••" autoComplete="current-password" required />
                  <button type="button" className="toggle-pw" aria-label="Toggle password visibility" data-target="login-password">
                    <svg className="eye-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg className="eye-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-submit" id="login-btn">
                <div className="btn-spinner"></div>
                <span className="btn-text">Sign In</span>
              </button>
            </form>

            <div className="form-footer">
              <button className="text-link" id="goto-forgot">Forgot your password?</button>
            </div>
          </div>

          {/* VIEW: FORGOT PASSWORD */}
          <div className="view" id="view-forgot">
            <div className="card-eyebrow">Password Reset</div>
            <h1 className="card-title">Reset your<br /><em>password</em></h1>

            <div className="alert alert-error" id="forgot-error" role="alert"></div>
            <div className="alert alert-success" id="forgot-success" role="alert"></div>

            <form id="forgot-form" method="post" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email</label>
                <input id="forgot-email" name="email" type="email" className="form-input" placeholder="you@vinclorealestate.com" autoComplete="email" required />
              </div>
              <button type="submit" className="btn-submit" id="forgot-btn">
                <div className="btn-spinner"></div>
                <span className="btn-text">Send Reset Link</span>
              </button>
            </form>

            <div className="form-footer">
              <button className="text-link" id="goto-login">Back to sign in</button>
            </div>
          </div>

        </div>
      </main>

      <footer className="site-footer">
        <a href="/">vinclorealestate.com</a> &nbsp;&middot;&nbsp; &copy; 2026 Vinclo Real Estate
      </footer>
    </div>
  );
}
