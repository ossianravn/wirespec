import * as React from "react";

type LoginCardProps = {
  onSubmit?: () => void;
  error?: boolean;
};

export function LoginCard({ onSubmit, error = true }: LoginCardProps) {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title">Welcome back</h1>
        <form className="login-form" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" />
          {error ? (
            <p className="form-error" role="alert">
              Incorrect email or password.
            </p>
          ) : null}
          <div className="primary-actions">
            <button type="submit">Sign in</button>
          </div>
        </form>
      </section>
    </main>
  );
}
