import os
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError

from models import Book, Loan, LoanStatusEnum, SessionLocal, User, init_db

app = Flask(__name__)
CORS(app)

# Inicializa o banco se necessário
init_db()


def get_db_session():
    return SessionLocal()


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_librarian": user.is_librarian,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def serialize_book(book: Book) -> dict:
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "year": book.year,
        "quantity_available": book.quantity_available,
        "created_at": book.created_at.isoformat() if book.created_at else None,
    }


def serialize_loan(loan: Loan) -> dict:
    return {
        "id": loan.id,
        "user_id": loan.user_id,
        "book_id": loan.book_id,
        "loan_date": loan.loan_date.isoformat() if loan.loan_date else None,
        "return_date": loan.return_date.isoformat() if loan.return_date else None,
        "status": loan.status,
    }


def get_librarian_user(session, user_id):
    if not user_id:
        return None

    librarian = session.query(User).filter(User.id == user_id).first()
    return librarian if librarian and librarian.is_librarian else None


def get_user_id_from_request():
    header_value = request.headers.get("X-User-Id")
    if header_value:
        try:
            return int(header_value)
        except ValueError:
            return None
    json_body = request.get_json(silent=True) or {}
    if isinstance(json_body, dict):
        user_id = json_body.get("user_id")
        if user_id is not None:
            try:
                return int(user_id)
            except (TypeError, ValueError):
                return None
    return None


@app.route("/users", methods=["GET"])
def list_users():
    session = get_db_session()
    try:
        users = session.query(User).all()
        return jsonify([serialize_user(u) for u in users]), 200
    finally:
        session.close()
