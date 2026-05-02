import { useState } from "react";

export default function AdminBooks({ apiUrl, librarianId }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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

      setTitle("");
      setAuthor("");
      setYear("");
      setQuantity(1);
      setMessage(`Livro "${result.title}" cadastrado com sucesso.`);
    } catch (err) {
      setError("Erro ao enviar dados para o servidor.");
    }
  }

  return (
    <section>
      <div className="card">
        <h1 className="section-heading">Administração de livros</h1>
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
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="button" style={{ marginTop: "20px" }}>
            Adicionar livro
          </button>
        </form>
      </div>
    </section>
  );
}
