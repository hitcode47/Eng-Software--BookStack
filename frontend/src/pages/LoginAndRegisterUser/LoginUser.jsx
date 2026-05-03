import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginUser.css';

function LoginUser() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isRegistering ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/login';
      const payload = isRegistering ? { name, email, password } : { email, password };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Erro na requisição');
        return;
      }

      if (isRegistering) {
        console.log('Cadastro realizado com sucesso', data);
        setIsRegistering(false);
      } else {
        console.log('Login realizado com sucesso', data);
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        setCurrentUser({ name: data.name || email, email });
        navigate('/dashboard');
      }

      clearForm();
    } catch (err) {
      setError('Erro ao conectar com o servidor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    clearForm();
    setError('');
  };

  return (
    <div className="login-user-page">
      <div className="login-user-card">
        <h1>{isRegistering ? 'Registrar Novo Usuário' : 'Login do Usuário'}</h1>
        <p>Entre com suas credenciais para acessar sua conta.</p>

        {error && <div className="error-message">{error}</div>}
        {isLoggedIn && <div className="success-message">Usuário {currentUser?.name} logado com sucesso!</div>}

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

          <button type="submit" disabled={loading}>
            {loading ? 'Carregando...' : (isRegistering ? 'Registrar' : 'Entrar')}
          </button>
        </form>

        <button
          type="button"
          onClick={handleToggleMode}
        >
          {isRegistering ? 'Voltar ao login' : 'Cadastre-se'}
        </button>
      </div>
    </div>
  );
}

export default LoginUser;
