import React, { useState } from 'react';
import './AdmRegister.css';

function AdmRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de registro aqui, verificar chave
  };

  return (
    <div className="adm-register-container">
      <div className="adm-register-card">
        <h2 className="adm-register-title">Registro de Administrador</h2>
        <form className="adm-register-form" onSubmit={handleSubmit}>
          <input
            className="adm-register-input"
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="adm-register-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="adm-register-input"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="adm-register-input"
            type="password"
            placeholder="Chave de Registro"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <button className="adm-register-button" type="submit">Registrar</button>
        </form>
        <div className="adm-register-link">
          <a href="/login-adm">Já tem uma conta? Faça login</a>
        </div>
      </div>
    </div>
  );
}

export default AdmRegister;