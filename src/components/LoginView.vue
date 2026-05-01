<template>
  <div class="login">
    <div class="card">
      <div class="logo">ITERO</div>
      <h1>Bienvenue</h1>
      <p>Connecte-toi pour créer ou rejoindre une session de rétrospective collaborative.</p>

      <div class="btns">
        <button class="btn-google" @click="auth.loginWithGoogle()">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <button class="btn-github" @click="auth.loginWithGithub()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          Continuer avec GitHub
        </button>
      </div>

      <p v-if="auth.error" class="err">{{ auth.error }}</p>

      <p class="legal">En te connectant, tu acceptes que tes informations de profil soient utilisées pour identifier ta participation dans les sessions.</p>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(167,139,250,.09) 0%, transparent 60%);
}
.card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 40px 36px;
  text-align: center;
}
.logo {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .2em;
  color: var(--accent);
  margin-bottom: 28px;
}
h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
p  { font-size: 13px; color: var(--muted2); line-height: 1.6; margin-bottom: 28px; }
.btns { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--rs);
  border: none;
  cursor: pointer;
  transition: all .2s;
}
.btn-google {
  background: #fff;
  color: #1a1a1a;
  border: 1px solid #e0e0e0;
}
.btn-google:hover { background: #f5f5f5; transform: translateY(-1px); }
.btn-github {
  background: #24292e;
  color: #fff;
  border: 1px solid rgba(255,255,255,.1);
}
.btn-github:hover { background: #2f363d; transform: translateY(-1px); }
.err { font-size: 12px; color: var(--stop); margin-top: 8px; margin-bottom: 0; }
.legal { font-size: 11px; color: var(--muted); margin-top: 20px; margin-bottom: 0; line-height: 1.5; }
</style>
