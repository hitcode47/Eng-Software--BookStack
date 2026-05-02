import { useState } from "react";

export default function AdminBooks({ apiUrl, librarianId }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [stockBooks, setStockBooks] = useState([]);
  const [loanedBooks, setLoanedBooks] = useState([
    {
      id: 101,
      title: "Dom Casmurro",
      author: "Machado de Assis",
      year: 1899,
      borrowerName: "João Silva",
      loanDate: "2026-04-10",
      returnDate: "2026-04-24",
    },
  ]);
  const [loanDetails, setLoanDetails] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!title || !author || !year) {
      setError("Preencha todos os campos do formulário.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(librarianId),
        },
        body: JSON.stringify({
          title,
          author,
          year: Number(year),
          quantity_available: Number(quantity),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Não foi possível cadastrar o livro.");
        return;
      }

      const newBook = {
        id: result.id || Date.now(),
        title: result.title || title,
        author: result.author || author,
        year: result.year || Number(year),
        quantity: result.quantity_available || Number(quantity),
      };

      setStockBooks((prev) => [...prev, newBook]);
      setTitle("");
      setAuthor("");
      setYear("");
      setQuantity(1);
      setMessage(`Livro "${newBook.title}" cadastrado com sucesso.`);
    } catch (err) {
      setError("Erro ao enviar dados para o servidor.");
    }
  }

  function handleLoanInputChange(bookId, field, value) {
    setLoanDetails((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        [field]: value,
      },
    }));
  }

  function handleLoan(bookId) {
    const details = loanDetails[bookId] || {};
    if (!details.borrowerName || !details.loanDate || !details.returnDate) {
      setError("Preencha os dados do empréstimo antes de emprestar.");
      setMessage(null);
      return;
    }

    const book = stockBooks.find((item) => item.id === bookId);
    if (!book || book.quantity <= 0) {
      setError("Livro não encontrado ou sem estoque.");
      return;
    }

    setLoanedBooks((prev) => [
      ...prev,
      {
        id: book.id,
        title: book.title,
        author: book.author,
        year: book.year,
        borrowerName: details.borrowerName,
        loanDate: details.loanDate,
        returnDate: details.returnDate,
      },
    ]);

    setStockBooks((prev) => prev.map((item) =>
      item.id === bookId ? { ...item, quantity: item.quantity - 1 } : item
    ).filter((item) => item.quantity > 0));
    setLoanDetails((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
    setError(null);
    setMessage(`Livro "${book.title}" emprestado para ${details.borrowerName}.`);
  }

  function handleReturn(bookId) {
    const loanedBook = loanedBooks.find((item) => item.id === bookId);
    if (!loanedBook) {
      setError("Livro emprestado não encontrado.");
      return;
    }

    setLoanedBooks((prev) => prev.filter((item) => item.id !== bookId));
    setStockBooks((prev) => {
      const existing = prev.find((item) => item.id === loanedBook.id);
      if (existing) {
        return prev.map((item) =>
          item.id === loanedBook.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, {
          id: loanedBook.id,
          title: loanedBook.title,
          author: loanedBook.author,
          year: loanedBook.year,
          quantity: 1,
        }];
      }
    });
    setError(null);
    setMessage(`Livro "${loanedBook.title}" devolvido e voltou ao estoque.`);
  }

  return (
    <section>
      <div className="card">
        <h1 className="section-heading">Livros Emprestados</h1>
        <p className="page-subtitle">
          Adicione um novo livro ao acervo usando o formulário abaixo.
        </p>
      </div>

      {message && <div className="message">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <div className="card" style={{ marginTop: "24px" }}>
        <form onSubmit={handleSubmit}>
          <label>
            Título
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nome do livro"
            />
          </label>

          <label style={{ marginTop: "16px", display: "block" }}>
            Autor
            <input
              className="input"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Nome do autor"
            />
          </label>

          <div style={{ display: "grid", gap: "16px", marginTop: "16px", gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Ano
              <input
                className="input"
                type="number"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="2025"
              />
            </label>
            <label>
              Quantidade disponível
              <input
                className="input"
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
          </div>

          <button type="submit" className="button" style={{ marginTop: "20px" }}>
            Adicionar livro
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h2>Em estoque</h2>
        {stockBooks.length === 0 ? (
          <p>Nenhum livro em estoque.</p>
        ) : (
          stockBooks.map((book) => {
            const details = loanDetails[book.id] || {
              borrowerName: "",
              loanDate: "",
              returnDate: "",
            };
            return (
              <div key={book.id} className="card" style={{ marginBottom: "16px" }}>
                <p><strong>ID:</strong> {book.id}</p>
                <p><strong>Nome do livro:</strong> {book.title}</p>
                <p><strong>Autor:</strong> {book.author}</p>
                <p><strong>Ano:</strong> {book.year}</p>
                <p><strong>Quantidade:</strong> {book.quantity}</p>

                <div style={{ display: "grid", gap: "12px", marginTop: "12px", gridTemplateColumns: "1fr" }}>
                  <label>
                    Quem pegou
                    <input
                      className="input"
                      value={details.borrowerName}
                      onChange={(event) => handleLoanInputChange(book.id, "borrowerName", event.target.value)}
                      placeholder="Nome do leitor"
                    />
                  </label>
                  <label>
                    Data de empréstimo
                    <input
                      className="input"
                      type="date"
                      value={details.loanDate}
                      onChange={(event) => handleLoanInputChange(book.id, "loanDate", event.target.value)}
                    />
                  </label>
                  <label>
                    Data de devolução
                    <input
                      className="input"
                      type="date"
                      value={details.returnDate}
                      onChange={(event) => handleLoanInputChange(book.id, "returnDate", event.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="button"
                  style={{ marginTop: "12px" }}
                  onClick={() => handleLoan(book.id)}
                >
                  Emprestar
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h2>Emprestados</h2>
        {loanedBooks.length === 0 ? (
          <p>Nenhum livro emprestado.</p>
        ) : (
          loanedBooks.map((item) => (
            <div key={item.id} className="card" style={{ marginBottom: "16px" }}>
              <p><strong>ID:</strong> {item.id}</p>
              <p><strong>Nome do livro:</strong> {item.title}</p>
              <p><strong>Quem pegou:</strong> {item.borrowerName}</p>
              <p><strong>Data de empréstimo:</strong> {item.loanDate}</p>
              <p><strong>Data de devolução:</strong> {item.returnDate}</p>
              <button
                type="button"
                className="button"
                style={{ marginTop: "12px" }}
                onClick={() => handleReturn(item.id)}
              >
                Marcar como devolvido
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}