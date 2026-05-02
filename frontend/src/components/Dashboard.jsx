import { useEffect, useState } from "react";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Dashboard({ apiUrl, userId }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLoans() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/users/${userId}/loans`);
        const data = await response.json();
        setLoans(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Erro ao carregar seus empréstimos.");
      } finally {
        setLoading(false);
      }
    }

    loadLoans();
  }, [apiUrl, userId]);

  async function handleReturn(loanId) {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/loans/${loanId}/return`, {
        method: "PUT",
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Falha ao devolver o livro.");
        return;
      }
      setMessage("Livro devolvido com sucesso.");
      setLoans((prev) => prev.filter((loan) => loan.id !== loanId));
    } catch (err) {
      setError("Erro na comunicação com o servidor.");
    }
  }

  const activeLoans = loans.map((loan) => {
    const loanDate = new Date(loan.loan_date);
    const dueDate = new Date(loanDate);
    dueDate.setDate(dueDate.getDate() + 14);
    return {
      ...loan,
      dueDate: dueDate.toISOString(),
    };
  });

  return (
    <section>
      <div className="card">
        <h1 className="section-heading">Meus Empréstimos</h1>
        <p className="page-subtitle">
          Veja seus empréstimos ativos e devolva diretamente por aqui.
        </p>
      </div>

      {message && <div className="message">{message}</div>}
      {error && <div className="alert">{error}</div>}

      {loading ? (
        <div className="card">Carregando seus empréstimos...</div>
      ) : activeLoans.length === 0 ? (
        <div className="card">Nenhum empréstimo ativo encontrado.</div>
      ) : (
        activeLoans.map((loan) => (
          <div key={loan.id} className="loan-item">
            <div>
              <p>
                <strong>Empréstimo #{loan.id}</strong>
              </p>
              <p className="small-text">Livro ID: {loan.book_id}</p>
              <p className="small-text">Emprestado em: {formatDate(loan.loan_date)}</p>
              <p className="small-text">Prazo previsto: {formatDate(loan.dueDate)}</p>
            </div>
            <button className="button button-secondary" onClick={() => handleReturn(loan.id)}>
              Devolver
            </button>
          </div>
        ))
      )}
    </section>
  );
}
