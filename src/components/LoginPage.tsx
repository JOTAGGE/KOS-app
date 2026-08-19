import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, LogIn, UserPlus, Shield, AlertCircle, CheckCircle2, ArrowRight, Info } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "../firebase/authContext";

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loginAnonymously } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const mapAuthError = (err: any): string => {
    const code = err?.code || "";
    const message = (err?.message || "").toLowerCase();
    
    if (
      code === "auth/missing-initial-state" ||
      message.includes("missing initial state") ||
      message.includes("sessionstorage") ||
      message.includes("storage-partitioned")
    ) {
      return "No aplicativo móvel, o login via Google é restrito pelo WebView. Recomendamos criar uma conta com seu E-mail e Senha (leva 10 segundos) ou entrar como Visitante!";
    }

    switch (code) {
      case "auth/invalid-email":
        return "O endereço de e-mail inserido é inválido.";
      case "auth/user-disabled":
        return "Esta conta de usuário foi desativada.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "E-mail ou senha incorretos. Verifique suas credenciais.";
      case "auth/email-already-in-use":
        return "Este e-mail já está cadastrado. Faça login com ele ou use outro e-mail.";
      case "auth/weak-password":
        return "A senha deve ter pelo menos 6 caracteres.";
      case "auth/too-many-requests":
        return "Muitas tentativas malsucedidas. Por segurança, aguarde alguns instantes.";
      case "auth/network-request-failed":
        return "Falha de conexão com a rede. Verifique sua internet.";
      case "auth/popup-closed-by-user":
        return "A janela de login com Google foi fechada antes de concluir.";
      case "auth/popup-blocked":
        return "A janela de autenticação foi bloqueada pelo dispositivo. Utilize o login por E-mail e Senha.";
      case "auth/unauthorized-domain":
        return "Domínio não autorizado nas configurações do Firebase Auth.";
      default:
        return err?.message || "Ocorreu um erro durante a autenticação. Tente novamente.";
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Por favor, insira seu nome.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Por favor, insira seu e-mail.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("A senha deve conter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem. Verifique a digitação.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await signUpWithEmail(email, password, name);
      setSuccessMsg("Conta criada com sucesso! Redirecionando...");
    } catch (err: any) {
      console.error("Register error:", err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAnonLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await loginAnonymously();
    } catch (err: any) {
      console.error("Anon Auth error:", err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-overlay">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-head">
          <div className="login-brand-logo">
            <img src="./kos.png" alt="Knowledge OS" className="brand-logo-img" />
          </div>
          <h1>Knowledge OS</h1>
          <p>Seu sistema de conhecimento, retenção no ciclo KOS e estudo ativo.</p>
        </div>

        {/* Tab Switcher: Login / Cadastro */}
        <div className="login-tabs-segmented">
          <button
            type="button"
            className={activeTab === "login" ? "active" : ""}
            onClick={() => { setActiveTab("login"); setErrorMsg(""); setSuccessMsg(""); }}
          >
            <LogIn size={14} />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            className={activeTab === "register" ? "active" : ""}
            onClick={() => { setActiveTab("register"); setErrorMsg(""); setSuccessMsg(""); }}
          >
            <UserPlus size={14} />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMsg && (
          <div className="login-error-banner">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-success-banner">
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Container */}
        {activeTab === "login" ? (
          /* LOGIN FORM */
          <form className="login-email-form" onSubmit={handleLoginSubmit}>
            <div className="login-input-group">
              <label>E-mail</label>
              <div className="input-with-icon">
                <Mail size={15} />
                <input
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Senha</label>
              <div className="input-with-icon">
                <Lock size={15} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Entrar no KOS</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form className="login-email-form" onSubmit={handleRegisterSubmit}>
            <div className="login-input-group">
              <label>Nome Completo</label>
              <div className="input-with-icon">
                <User size={15} />
                <input
                  type="text"
                  placeholder="Como quer ser chamado?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>E-mail</label>
              <div className="input-with-icon">
                <Mail size={15} />
                <input
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Senha (mínimo 6 caracteres)</label>
              <div className="input-with-icon">
                <Lock size={15} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Confirmar Senha</label>
              <div className="input-with-icon">
                <Lock size={15} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? (
                <span>Criando conta...</span>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Cadastrar e Criar Conta</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="login-divider-row" style={{ margin: "18px 0 14px" }}>
          <span className="divider-line" />
          <span className="divider-text">outras opções</span>
          <span className="divider-line" />
        </div>

        {/* Alternative Auth Buttons */}
        <div className="login-auth-buttons-stack">
          <button
            type="button"
            className="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continuar com Google</span>
          </button>

          <button
            type="button"
            className="btn-anon-login"
            onClick={handleAnonLogin}
            disabled={loading}
          >
            <Shield size={14} />
            <span>Acessar como Visitante (Teste Rápido)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
