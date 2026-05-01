--PostgreSQL consultas database biblioteca

-- cadastro de usuário

INSERT INTO user (name, email, password, status)
VALUES ('João Silva', 'jsilva@ufmg.com', 'joao_silva03', 'ativo');

--exclusão (desativar) conta

DELETE FROM user
WHERE id_user = 1;

UPDATE user
SET status = 'inativo'
WHERE id_user = 1;

--suspender conta

UPDATE user
SET status = 'suspenso'
WHERE id_user = 1;

--cadastrar obras e exemplares

INSERT INTO work (title, genre, type, year, edition, author)
VALUES ('Engenharia de Software Moderna', 'Tecnologia', 'Livro', 2020, 2, 'Marco Tulio Valente');

INSERT INTO copy (id_work, status)
VALUES (1, 'disponivel'), (2, 'disponivel'), (3, 'disponivel');

--deletar obras

DELETE FROM work
WHERE id_work = 1;

--pesquisar obras:

--por título:

SELECT * FROM work
WHERE title ILIKE '%casmurro%';

--por autor
SELECT * FROM work
WHERE author ILIKE '%machado%';

--por disponibilidade
SELECT w.title, COUNT(c.id_copy) AS disponiveis
FROM work w
JOIN copy c ON w.id_work = c.id_work
WHERE c.status = 'disponivel'
GROUP BY w.titulo;

--pegar livro emprestado

INSERT INTO loan (
    id_user,
    id_copy,
    date_loan,
    date_return_expected,
    status
)
VALUES (1, 3, '2026-06-20', '2026-06-20' + INTERVAL '15 days', 'ativo');

UPDATE copy
SET status = 'emprestado'
WHERE id_copy = 3;

--devolver livro

UPDATE loan
SET date_return = CURRENT_DATE,
    status = 'devolvido'
WHERE id_loan = 1;

UPDATE copy
SET status = 'disponivel'
WHERE id_copy = 3;

--visualizar empréstimos

SELECT 
    u.name,
    w.title,
    l.date_loan,
    l.date_return_expected
FROM loan l
JOIN user u ON l.id_user = u.id_user
JOIN copy c ON l.id_copy = c.id_copy
JOIN work w ON c.id_work = w.id_work
WHERE l.status = 'ativo'
AND u.id_user = 1;

--consultar atrasos

SELECT 
    u.name,
    w.title,
    l.date_return_expected
FROM loan l
JOIN user u ON l.id_user = u.id_user
JOIN copy c ON l.id_copy = c.id_copy
JOIN work w ON c.id_work = w.id_work
WHERE l.status = 'ativo'
AND l.date_return_expected < CURRENT_DATE;

--criar reserva

INSERT INTO reservation (id_user, id_work, status)
VALUES (1, 2, 'ativa');


