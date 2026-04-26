--PostgreSQL consultas database biblioteca

-- cadastro de usuário

INSERT INTO usuario (nome, email, senha, status)
VALUES ('João Silva', 'jsilva@ufmg.com', 'joao_silva03', 'ativo');

--exclusão (desativar) conta

DELETE FROM usuario
WHERE id_usuario = 1;

UPDATE usuario
SET status = 'inativo'
WHERE id_usuario = 1;

--suspender conta

UPDATE usuario
SET status = 'suspenso'
WHERE id_usuario = 1;

--cadastrar obras e exemplares

INSERT INTO obra (titulo, genero, tipo, ano, edicao, autor)
VALUES ('Engenharia de Software Moderna', 'Tecnologia', 'Livro', 2020, 2, 'Marco Tulio Valente');

INSERT INTO exemplar (id_obra, status)
VALUES (1, 'disponivel'), (2, 'disponivel'), (3, 'disponivel');

--deletar obras

DELETE FROM obra
WHERE id_obra = 1;

--pesquisar obras:

--por título:

SELECT * FROM obra
WHERE titulo ILIKE '%casmurro%';

--por autor
SELECT * FROM obra
WHERE autor ILIKE '%machado%';

--por disponibilidade
SELECT o.titulo, COUNT(e.id_exemplar) AS disponiveis
FROM obra o
JOIN exemplar e ON o.id_obra = e.id_obra
WHERE e.status = 'disponivel'
GROUP BY o.titulo;

--pegar livro emprestado

INSERT INTO emprestimo (
    id_usuario,
    id_exemplar,
    data_emprestimo,
    data_prevista_devolucao,
    status
)
VALUES (1, 3, '2026-06-20', '2026-06-20' + INTERVAL '15 days', 'ativo');

UPDATE exemplar
SET status = 'emprestado'
WHERE id_exemplar = 3;

--devolver livro

UPDATE emprestimo
SET data_devolucao = CURRENT_DATE,
    status = 'devolvido'
WHERE id_emprestimo = 1;

UPDATE exemplar
SET status = 'disponivel'
WHERE id_exemplar = 3;

--visualizar empréstimos

SELECT 
    u.nome,
    o.titulo,
    e.data_emprestimo,
    e.data_prevista_devolucao
FROM emprestimo e
JOIN usuario u ON e.id_usuario = u.id_usuario
JOIN exemplar ex ON e.id_exemplar = ex.id_exemplar
JOIN obra o ON ex.id_obra = o.id_obra
WHERE e.status = 'ativo'
AND u.id_usuario = 1;

--consultar atrasos

SELECT 
    u.nome,
    o.titulo,
    e.data_prevista_devolucao
FROM emprestimo e
JOIN usuario u ON e.id_usuario = u.id_usuario
JOIN exemplar ex ON e.id_exemplar = ex.id_exemplar
JOIN obra o ON ex.id_obra = o.id_obra
WHERE e.status = 'ativo'
AND e.data_prevista_devolucao < CURRENT_DATE;

--criar reserva

INSERT INTO reserva (id_usuario, id_obra, status)
VALUES (1, 2, 'ativa');


