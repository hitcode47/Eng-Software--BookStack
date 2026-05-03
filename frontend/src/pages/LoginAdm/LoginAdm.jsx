import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginAdm.css';

const API_URL = 'http://localhost:5000/api';

function LoginAdm() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [chave, setChave] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const limparFormularios = () => {
    setLogin('');
    setSenha('');
    setChave('');
    setName('');
    setEmail('');
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!login || !senha || !chave) {
      setMensagem('Por favor preencha todos os campos.');
      return;
    }

    setCarregando(true);
    setMensagem('Tentando autenticar...');

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: login,
          senha: senha,
          chave: chave,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem('Login de administrador realizado com sucesso.');
        localStorage.setItem('adminToken', data.token);
        limparFormularios();
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      } else {
        setMensagem(data.mensagem || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } catch (error) {
      setMensagem('Erro de conexão com o servidor. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    if (!name || !email || !senha || !chave) {
      setMensagem('Por favor preencha todos os campos.');
      return;
    }

    setCarregando(true);
    setMensagem('Registrando administrador...');

    try {
      const response = await fetch(`${API_URL}/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          senha: senha,
          chave: chave,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem('Registro realizado com sucesso!');
        limparFormularios();
        setTimeout(() => {
          setIsLogin(true);
          setMensagem('');
        }, 1500);
      } else {
        setMensagem(data.mensagem || 'Erro ao registrar. Tente novamente.');
      }
    } catch (error) {
      setMensagem('Erro de conexão com o servidor. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-adm-page">
      <div className="login-adm-card">
        {isLogin ? (
          <>
            <h1>Login Administrador</h1>
            <p>Entre com seus dados para acessar a administração da biblioteca.</p>

            <form onSubmit={handleLoginSubmit} className="login-adm-form">
              <label htmlFor="login">Login</label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder="Digite seu login"
                disabled={carregando}
              />

              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                disabled={carregando}
              />

              <label htmlFor="chave">Chave da Biblioteca</label>
              <input
                id="chave"
                type="text"
                value={chave}
                onChange={(event) => setChave(event.target.value)}
                placeholder="Digite a chave da biblioteca"
                disabled={carregando}
              />

              <button type="submit" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
            </form>

            <button onClick={() => { setIsLogin(false); setMensagem(''); }} disabled={carregando}>Registrar</button>

            {mensagem && <div className="login-adm-message">{mensagem}</div>}
          </>
        ) : (
          <>
            <h2 className="adm-register-title">Registro de Administrador</h2>
            <form className="adm-register-form" onSubmit={handleRegisterSubmit}>
              <input
                className="adm-register-input"
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={carregando}
                required
              />
              <input
                className="adm-register-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={carregando}
                required
              />
              <input
                className="adm-register-input"
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={carregando}
                required
              />
              <input
                className="adm-register-input"
                type="password"
                placeholder="Chave de Registro"
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                disabled={carregando}
                required
              />
              <button className="adm-register-button" type="submit" disabled={carregando}>{carregando ? 'Registrando...' : 'Registrar'}</button>
            </form>
            <div className="adm-register-link">
              <button onClick={() => { setIsLogin(true); setMensagem(''); limparFormularios(); }} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }} disabled={carregando}>
                Já tem uma conta? Faça login
              </button>
            </div>

            {mensagem && <div className="login-adm-message">{mensagem}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default LoginAdm;
