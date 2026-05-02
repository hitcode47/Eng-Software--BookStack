import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginAdm.css';
function LoginAdm() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [chave, setChave] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!login || !senha || !chave) {
      setMensagem('Por favor preencha todos os campos.');
      return;
    }

    // Aqui você pode adicionar validação real ou chamada à API
    setMensagem('Tentando autenticar...');
    setTimeout(() => {
      setMensagem('Login de administrador realizado com sucesso.');
    }, 500);
  };

  return (
    <div className="login-adm-page">
      <div className="login-adm-card">
        <h1>Login Administrador</h1>
        <p>Entre com seus dados para acessar a administração da biblioteca.</p>

        <form onSubmit={handleSubmit} className="login-adm-form">
          <label htmlFor="login">Login</label>
          <input
            id="login"
            type="text"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="Digite seu login"
          />

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Digite sua senha"
          />

          <label htmlFor="chave">Chave da Biblioteca</label>
          <input
            id="chave"
            type="text"
            value={chave}
            onChange={(event) => setChave(event.target.value)}
            placeholder="Digite a chave da biblioteca"
          />

          <button type="submit">Entrar</button>
        </form>

        <button onClick={() => navigate('/register-adm')}>Registrar</button>

        {mensagem && <div className="login-adm-message">{mensagem}</div>}
      </div>
    </div>
  );
}

export default LoginAdm;
