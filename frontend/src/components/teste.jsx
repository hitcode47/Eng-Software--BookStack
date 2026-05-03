import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCoverUrl(book) {
  return book.cover || book.cover_url || book.image || book.coverImage || null;
}

export default function Dashboard({ userId }) {
  const navigate = useNavigate();
  const apiUrl = 'http://localhost:5000/api';
  const [loanBooks, setLoanBooks] = useState([]);
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login-user');
          return;
        }

        const userResponse = await fetch('http://localhost:5000/api/auth/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Falha ao buscar dados do usuário');
        }

        const userData = await userResponse.json();
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));

        await loadLoanBooks(userData.id);
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
        setError('Erro ao carregar dados do usuário.');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        navigate('/login-user');
      }
    }

    async function loadLoanBooks(currentUserId) {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const loansResponse = await fetch(`${apiUrl}/users/${currentUserId}/loans`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!loansResponse.ok) {
          throw new Error('Erro ao carregar empréstimos');
        }
        
        const loansData = await loansResponse.json();
        const loans = Array.isArray(loansData) ? loansData : [];
        const loanBooksPromises = loans.map(async (loan) => {
          const bookResponse = await fetch(`${apiUrl}/books/${loan.book_id}`);
          const book = await bookResponse.json();
          return { ...loan, book };
        });
        const loanBooksData = await Promise.all(loanBooksPromises);
        setLoanBooks(loanBooksData);
      } catch (err) {
        console.error("Erro ao carregar empréstimos:", err);
        setError("Erro ao carregar seus empréstimos.");
      } finally {
        setLoading(false);
      }
    }

    async function loadBooks() {
      try {
        const response = await fetch(`${apiUrl}/books`);
        const data = await response.json();
        setBooks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar livros:", err);
      }
    }

    fetchUserData();
    loadBooks();
  }, [navigate]);

  const filteredBooks = books.filter((book) => {
    const term = query.toLowerCase();
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      String(book.year).includes(term)
    );
  });

  async function handleLoan(bookId) {
    setError(null);
    setMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Você precisa estar logado para pegar um livro emprestado.");
      navigate('/login-user');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/loans`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, book_id: bookId }),
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
        setError(result.error || "Não foi possível efetuar o empréstimo.");
        return;
      }

      setMessage(`Livro emprestado com sucesso! Empréstimo #${result.id}`);
      setBooks((prev) =>
        prev.map((book) =>
          book.id === bookId
            ? { ...book, quantity_available: book.quantity_available - 1 }
            : book
        )
      );
      setLoanBooks((prev) => [...prev, { ...result, book: books.find(b => b.id === bookId) }]);
    } catch (err) {
      console.error("Erro ao emprestar livro:", err);
      setError("Erro na comunicação com o servidor.");
    }
  }

  async function handleReturn(loanId) {
    setError(null);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/loans/${loanId}/return`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Falha ao devolver o livro.");
        return;
      }
      setMessage("Livro devolvido com sucesso.");
      setLoanBooks((prev) => prev.filter((loanBook) => loanBook.id !== loanId));
    } catch (err) {
      console.error("Erro ao devolver livro:", err);
      setError("Erro na comunicação com o servidor.");
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/');
  }

  const activeLoanBooks = loanBooks.map((loanBook) => {
    const loanDate = new Date(loanBook.loan_date);
    const dueDate = new Date(loanDate);
    dueDate.setDate(dueDate.getDate() + 14);
    return {
      ...loanBook,
      dueDate: dueDate.toISOString(),
    };
  });

  return (
    <section>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="section-heading">Bem-vindo, {currentUser?.name}!</h1>
            <p className="page-subtitle">
              Veja seus empréstimos ativos, devolva livros e busque novos títulos.
            </p>
          </div>
          <button className="button button-secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>

      {message && <div className="message">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <div className="card" style={{ marginTop: "24px" }}>
        <h2 className="section-heading">Buscar obras</h2>
        <p className="page-subtitle">Pesquise por título, autor ou ano.</p>
        <input
          className="input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar livros..."
        />
      </div>

      <div className="grid grid-3" style={{ marginTop: "24px" }}>
        {filteredBooks.length === 0 ? (
          <div className="card">Nenhum livro encontrado.</div>
        ) : (
          filteredBooks.map((book) => {
            const coverUrl = getCoverUrl(book);
            return (
              <div
                key={book.id}
                className="card"
                style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`Capa de ${book.title}`}
                    style={{
                      width: "120px",
                      height: "160px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "120px",
                      height: "160px",
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
                  <p className="small-text">Disponíveis: {book.quantity_available}</p>
                  <button
                    className="button"
                    disabled={book.quantity_available <= 0}
                    onClick={() => handleLoan(book.id)}
                    style={{ marginTop: "18px" }}
                  >
                    Pegar Emprestado
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h2 className="section-heading">Seus empréstimos ativos</h2>
      </div>

      {loading ? (
        <div className="card">Carregando seus empréstimos...</div>
      ) : activeLoanBooks.length === 0 ? (
        <div className="card">Nenhum empréstimo ativo encontrado.</div>
      ) : (
        activeLoanBooks.map((loanBook) => {
          const coverUrl = getCoverUrl(loanBook.book);
          return (
            <div key={loanBook.id} className="loan-item">
              <div>
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`Capa de ${loanBook.book.title}`}
                    style={{
                      width: "100%",
                      height: "auto",
                      objectFit: "cover",
                      marginBottom: "12px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      minHeight: "180px",
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                      marginBottom: "12px",
                    }}
                  >
                    Sem capa
                  </div>
                )}
                <p>
                  <strong>{loanBook.book.title}</strong>
                </p>
                <p className="small-text">Autor: {loanBook.book.author}</p>
                <p className="small-text">Ano: {loanBook.book.year}</p>
                <p className="small-text">Emprestado em: {formatDate(loanBook.loan_date)}</p>
                <p className="small-text">Prazo previsto: {formatDate(loanBook.dueDate)}</p>
              </div>
              <button className="button button-secondary" onClick={() => handleReturn(loanBook.id)}>
                Devolver
              </button>
            </div>
          );
        })
      )}
    </section>
  );
}
