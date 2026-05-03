import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home({ apiUrl, userId }) {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  function getCoverUrl(book) {
    return book.cover || book.cover_url || book.image || book.coverImage || null;
  }

  useEffect(() => {
    async function loadBooks() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/books`);
        const data = await response.json();
        setBooks(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Erro ao carregar livros.");
      } finally {
        setLoading(false);
      }
    }

    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    async function loadCurrentUser() {
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
          return;
        } catch (err) {
          localStorage.removeItem('currentUser');
        }
      }

      if (!token) {
        
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/auth/user`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          return;
        }

        const userData = await response.json();
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      }
    }

    loadCurrentUser();
    loadBooks();
  }, [apiUrl]);

  const filteredBooks = books.filter((book) => {
    const term = query.toLowerCase();
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      String(book.year).includes(term)
    );
  });

  const isLoggedIn = Boolean(localStorage.getItem('token') && currentUser);

  async function handleLoan(bookId) {
    setError(null);
    setMessage(null);

    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      setError("Você precisa estar logado para pegar um livro emprestado.");
      navigate('/login-user');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/loan-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ book_id: bookId }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setError("Sua sessão expirou. Faça login novamente.");
          navigate('/login-user');
          return;
        }
        setError(result.error || "Não foi possível enviar a solicitação de empréstimo.");
        return;
      }

      setMessage("Solicitação enviada com sucesso. Aguarde aprovação do administrador.");
      setBooks((prev) =>
        prev.map((book) =>
          book.id === bookId
            ? { ...book, quantity_available: book.quantity_available - 1 }
            : book
        )
      );
    } catch (err) {
      setError("Erro na comunicação com o servidor.");
    }
  }

  return (
    <section>
      <div className="card">
        <h1 className="section-heading">Buscar obras</h1>
        <p className="page-subtitle">Pesquise por título, autor ou ano.</p>
        <input
          className="input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar livros..."
        />
      </div>

      {message && <div className="message">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <div className="grid grid-3" style={{ marginTop: "24px" }}>
        {loading ? (
          <div className="card">Carregando livros...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="card">Nenhum livro encontrado.</div>
        ) : (
          filteredBooks.map((book) => {
            const coverUrl = getCoverUrl(book);
            return (
              <div key={book.id} className="card">
                <div
                  style={{
                    display: "flex",
                    gap: "18px",
                    alignItems: "flex-start",
                  }}
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={`Capa de ${book.title}`}
                      style={{
                        width: "120px",
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "120px",
                        height: "180px",
                        background: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      Sem capa
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h2>{book.title}</h2>
                    <p className="small-text">Autor: {book.author}</p>
                    <p className="small-text">Ano: {book.year}</p>
                    <p className="small-text">Disponíveis: {book.quantity}</p>
                    <button
                      className={`button ${book.quantity <= 0 ? "button-disabled" : ""}`}
                      disabled={book.quantity <= 0}
                      onClick={() => handleLoan(book.id)}
                      style={{ marginTop: "18px" }}
                    >
                      {book.quantity <= 0
                        ? "Indisponível"
                        : !isLoggedIn
                        ? "Faça login para pegar emprestado"
                        : "Pegar Emprestado"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
