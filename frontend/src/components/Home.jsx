import { useEffect, useState } from "react";

export default function Home({ apiUrl, userId }) {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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

  async function handleLoan(bookId) {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, book_id: bookId }),
      });
      const result = await response.json();
      if (!response.ok) {
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
          filteredBooks.map((book) => (
            <div key={book.id} className="card">
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
          ))
        )}
      </div>
    </section>
  );
}
