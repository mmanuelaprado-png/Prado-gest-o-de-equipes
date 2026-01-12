
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Prado: Aplicação montada com sucesso.");
  } catch (error) {
    console.error("Erro fatal na renderização:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; color: white; background: #0F172A; height: 100vh; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <h1 style="color: #D4AF37;">Erro de Inicialização</h1>
        <p style="opacity: 0.7;">Não foi possível carregar o sistema.</p>
        <button onclick="window.location.reload()" style="background: #D4AF37; color: #0F172A; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; margin-top: 20px; cursor: pointer;">Tentar Novamente</button>
        <pre style="font-size: 10px; color: #D4AF37; margin-top: 40px; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; max-width: 80%; overflow: auto;">${error instanceof Error ? error.stack : 'Erro desconhecido'}</pre>
      </div>
    `;
  }
};

// Garante que o script rode apenas quando o DOM estiver pronto
if (document.readyState === 'complete') {
  startApp();
} else {
  window.addEventListener('load', startApp);
}
