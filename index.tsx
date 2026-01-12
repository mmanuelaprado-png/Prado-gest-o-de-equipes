
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Prado Gestão: Iniciando aplicação...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Prado Gestão: Elemento root não encontrado!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Prado Gestão: Renderização inicial concluída.");
} catch (error) {
  console.error("Prado Gestão: Erro fatal na renderização:", error);
}
