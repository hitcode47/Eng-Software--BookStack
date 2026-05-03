--PostgreSQL database dump biblioteca

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';

-- drop tables
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS loan CASCADE;
DROP TABLE IF EXISTS copy CASCADE;
DROP TABLE IF EXISTS work CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS librarian CASCADE;

-- tabela usuario
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo'
);


-- tabela bibliotecario
CREATE TABLE librarian (
    id_librarian SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email = LOWER(email))
);

-- tabela obra
CREATE TABLE work (
    id_work SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    genre VARCHAR(50),
    type VARCHAR(50),
    year INTEGER,
    edition INTEGER,
	author VARCHAR(50)
);

-- tabela exemplar
CREATE TABLE copy (
    id_copy SERIAL PRIMARY KEY,
    id_work INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'disponivel',
        CHECK (status IN ('disponivel','emprestado')),

    CONSTRAINT fk_work
        FOREIGN KEY (id_work)
        REFERENCES work(id_work)
        ON DELETE CASCADE
);

-- tabela emprestimo
CREATE TABLE loan (
    id_loan SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_copy INTEGER NOT NULL,
    date_loan DATE NOT NULL,
    date_return_expected DATE NOT NULL,
    date_return DATE,
    status VARCHAR(20) DEFAULT 'ativo',
        CHECK (status IN ('ativo','devolvido','atrasado')),

    CONSTRAINT fk_user
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_copy
        FOREIGN KEY (id_copy)
        REFERENCES copy(id_copy)
        ON DELETE CASCADE
);

-- tabela reserva
CREATE TABLE reservation (
    id_reservation SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_work INTEGER NOT NULL,
    date_reservation DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ativa',
        CHECK (status IN ('ativa','cancelada', 'atendida' )),

    CONSTRAINT fk_reservation_usuer
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_reservation_work
        FOREIGN KEY (id_work)
        REFERENCES work(id_work)
        ON DELETE CASCADE
);

CREATE INDEX idx_work_title ON work(title);

CREATE INDEX idx_work_author ON work(author);

CREATE UNIQUE INDEX unique_loan_active
ON loan (id_copy)
WHERE status = 'ativo';
