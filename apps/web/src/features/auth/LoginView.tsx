import * as React from "react";
import { WabrixIcon } from "../../components/layout/AppSidebar.js";

export function LoginView() {
  return (
    <div className="login-wrap">
      <div className="glass-card login-card">
        <div className="login-icon" style={{ background: "transparent", border: "none" }}>
          <WabrixIcon size={40} />
        </div>
        <h1 className="login-title">Wabrix AI</h1>
        <p className="login-subtitle">AI-first customer operations platform</p>
        <a
          href="/api/v1/auth/login"
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          id="login-button"
        >
          Sign in with SSO / OIDC
        </a>
      </div>
    </div>
  );
}
