INSERT INTO users (id_user, name, email, password, status) VALUES
(1, 'Bruno', 'bruno@email.com', 'bruno02', 'ativo'),
(2, 'Marcos', 'marcos@email.com', 'marcos03', 'suspenso');

INSERT INTO librarian (name, email) VALUES
('Ana Carolina', 'anacarolina@ufmg.com'),
('Paulo', 'paulo@ufmg.com');

INSERT INTO work (id_work, title, genre, type, year, edition, author) VALUES
(1, 'Dom Casmurro', 'Romance', 'Livro', 1889, 5, 'Machado de Assis'),
(2, 'O Pequeno Príncipe', 'Fantasia', 'Livro', 1943, 25, 'Antoine de Saint-Exupéry'),
(3, 'Cálculo I', 'Acadêmico', 'Livro', 2006, 5, 'James Stewart');

INSERT INTO copy (id_copy, id_work, status) VALUES
(1, 1, 'disponivel'),
(2, 1, 'emprestado'),
(3, 2, 'disponivel'),
(4, 3, 'disponivel'),
(5, 3, 'disponivel');

INSERT INTO loan (
    id_user,
    id_copy,
    date_loan,
    date_return_expected,
    date_return,
    status
) VALUES
(1, 2, '2026-04-01', '2026-04-10', NULL, 'ativo'),
(2, 1, '2026-03-20', '2026-03-30', '2026-03-29', 'devolvido');

INSERT INTO reservation (id_user, id_work, date_reservation, status) VALUES
(1, 2, '2026-04-10', 'ativa'),
(2, 1, '2026-04-09', 'atendida');
