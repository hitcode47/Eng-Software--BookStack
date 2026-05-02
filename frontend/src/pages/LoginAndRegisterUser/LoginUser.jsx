import React, { useState } from 'react';
import './LoginUser.css';

function LoginUser() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      console.log('Cadastre-se', { name, email, password });
    } else {
      console.log('Login do Usuário', { email, password });
    }
  };

  return (
    <div className="login-user-page">
      <div className="login-user-card">
        <h1>{isRegistering ? 'Registrar Novo Usuário' : 'Login do Usuário'}</h1>
        <p>Entre com suas credenciais para acessar sua conta.</p>

        <form className="login-user-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <label htmlFor="name">Nome:</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Senha:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {isRegistering ? 'Registrar' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Voltar ao login' : 'Cadastre-se'}
        </button>
      </div>
    </div>
  );
}

export default LoginUser;