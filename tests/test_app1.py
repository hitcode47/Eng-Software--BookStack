import os
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta

import app1


class BookStackApiTestCase(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.old_paths = (app1.USERS_DB, app1.ADMINS_DB, app1.BOOKS_DB)
        self.old_sessions = dict(app1.SESSIONS)
        self.old_admin_sessions = dict(app1.ADMIN_SESSIONS)
        self.old_token_expiry = dict(app1.TOKEN_EXPIRY)

        app1.USERS_DB = os.path.join(self.tmpdir.name, "users.db")
        app1.ADMINS_DB = os.path.join(self.tmpdir.name, "admins.db")
        app1.BOOKS_DB = os.path.join(self.tmpdir.name, "books.db")
        app1.SESSIONS.clear()
        app1.ADMIN_SESSIONS.clear()
        app1.TOKEN_EXPIRY.clear()
        app1.init_db()

        app1.app.config.update(TESTING=True)
        self.client = app1.app.test_client()

    def tearDown(self):
        app1.USERS_DB, app1.ADMINS_DB, app1.BOOKS_DB = self.old_paths
        app1.SESSIONS.clear()
        app1.SESSIONS.update(self.old_sessions)
        app1.ADMIN_SESSIONS.clear()
        app1.ADMIN_SESSIONS.update(self.old_admin_sessions)
        app1.TOKEN_EXPIRY.clear()
        app1.TOKEN_EXPIRY.update(self.old_token_expiry)
        self.tmpdir.cleanup()

    def register_user(self, email="ana@example.com"):
        return self.client.post(
            "/api/auth/register",
            json={"name": "Ana Silva", "email": email, "password": "secret123"},
        )

    def login_user(self, email="ana@example.com"):
        response = self.client.post(
            "/api/auth/login",
            json={"email": email, "password": "secret123"},
        )
        return response.get_json()["token"]

    def register_admin(self):
        return self.client.post(
            "/api/admin/register",
            json={
                "name": "Admin User",
                "email": "admin@example.com",
                "senha": "admin123",
                "chave": "library-key",
            },
        )

    def login_admin(self):
        response = self.client.post(
            "/api/admin/login",
            json={"login": "adminuser", "senha": "admin123", "chave": "library-key"},
        )
        return response.get_json()["token"]

    def create_book(self, quantity=2):
        response = self.client.post(
            "/books",
            json={
                "title": "Clean Code",
                "author": "Robert C. Martin",
                "year": 2008,
                "quantity_available": quantity,
            },
        )
        return response.get_json()["id"]

    def set_book_quantity(self, book_id, quantity):
        conn = sqlite3.connect(app1.BOOKS_DB)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE books SET quantity_available = ? WHERE id = ?",
            (quantity, book_id),
        )
        conn.commit()
        conn.close()

    def set_loan_renewals(self, loan_id, renewals):
        conn = sqlite3.connect(app1.USERS_DB)
        cursor = conn.cursor()
        cursor.execute("UPDATE loans SET renewals = ? WHERE id = ?", (renewals, loan_id))
        conn.commit()
        conn.close()

    def create_approved_loan(self, quantity=2):
        self.register_user()
        user_token = self.login_user()
        self.register_admin()
        admin_token = self.login_admin()
        book_id = self.create_book(quantity=quantity)

        request_response = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        request_id = request_response.get_json()["id"]

        approve_response = self.client.put(
            f"/api/admin/loan-requests/{request_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(approve_response.status_code, 200)

        loans_response = self.client.get(
            "/api/users/me/loans",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        loan_id = loans_response.get_json()[0]["id"]

        return user_token, admin_token, book_id, loan_id

    def test_health_check(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "OK"})

    def test_user_register_login_profile_and_logout(self):
        register_response = self.register_user()
        self.assertEqual(register_response.status_code, 201)

        duplicate_response = self.register_user()
        self.assertEqual(duplicate_response.status_code, 409)

        login_response = self.client.post(
            "/api/auth/login",
            json={"email": "ana@example.com", "password": "secret123"},
        )
        self.assertEqual(login_response.status_code, 200)
        token = login_response.get_json()["token"]

        profile_response = self.client.get(
            "/api/auth/user",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(profile_response.status_code, 200)
        self.assertEqual(profile_response.get_json()["email"], "ana@example.com")

        verify_response = self.client.post("/api/auth/verify", json={"token": token})
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.get_json()["valid"])

        logout_response = self.client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(logout_response.status_code, 200)

        expired_profile_response = self.client.get(
            "/api/auth/user",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(expired_profile_response.status_code, 401)

    def test_user_validation_errors(self):
        missing_payload = self.client.post("/api/auth/register", json={})
        self.assertEqual(missing_payload.status_code, 400)

        empty_name = self.client.post(
            "/api/auth/register",
            json={"name": "   ", "email": "ana@example.com", "password": "secret123"},
        )
        self.assertEqual(empty_name.status_code, 400)

        short_password = self.client.post(
            "/api/auth/register",
            json={"name": "Ana", "email": "ana@example.com", "password": "123"},
        )
        self.assertEqual(short_password.status_code, 400)

        bad_login = self.client.post(
            "/api/auth/login",
            json={"email": "missing@example.com", "password": "secret123"},
        )
        self.assertEqual(bad_login.status_code, 401)

        self.register_user()
        wrong_password = self.client.post(
            "/api/auth/login",
            json={"email": "ana@example.com", "password": "wrong123"},
        )
        self.assertEqual(wrong_password.status_code, 401)

        malformed_logout = self.client.post(
            "/api/auth/logout",
            headers={"Authorization": "Bearer"},
        )
        self.assertEqual(malformed_logout.status_code, 401)

        missing_logout_token = self.client.post("/api/auth/logout")
        self.assertEqual(missing_logout_token.status_code, 400)

        no_token = self.client.get("/api/auth/user")
        self.assertEqual(no_token.status_code, 401)

        malformed_auth = self.client.get(
            "/api/auth/user",
            headers={"Authorization": "Bearer"},
        )
        self.assertEqual(malformed_auth.status_code, 401)

    def test_user_token_expiration_paths(self):
        self.register_user()
        token = self.login_user()
        app1.SESSIONS[token]["expires"] = datetime.now() - timedelta(seconds=1)

        expired_profile = self.client.get(
            "/api/auth/user",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(expired_profile.status_code, 401)
        self.assertNotIn(token, app1.SESSIONS)

        fresh_token = self.login_user()
        app1.SESSIONS[fresh_token]["expires"] = datetime.now() - timedelta(seconds=1)

        verify_expired = self.client.post("/api/auth/verify", json={"token": fresh_token})
        self.assertEqual(verify_expired.status_code, 401)
        self.assertFalse(verify_expired.get_json()["valid"])

        verify_missing = self.client.post("/api/auth/verify", json={})
        self.assertEqual(verify_missing.status_code, 400)

    def test_admin_register_login_profile_and_logout(self):
        register_response = self.register_admin()
        self.assertEqual(register_response.status_code, 201)
        self.assertEqual(register_response.get_json()["login"], "adminuser")

        duplicate_response = self.register_admin()
        self.assertEqual(duplicate_response.status_code, 409)

        same_login_response = self.client.post(
            "/api/admin/register",
            json={
                "name": "Admin-User",
                "email": "admin2@example.com",
                "senha": "admin123",
                "chave": "library-key",
            },
        )
        self.assertEqual(same_login_response.status_code, 201)
        self.assertEqual(same_login_response.get_json()["login"], "adminuser1")

        token = self.login_admin()

        profile_response = self.client.get(
            "/api/admin/perfil",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(profile_response.status_code, 200)
        self.assertEqual(profile_response.get_json()["email"], "admin@example.com")

        logout_response = self.client.post(
            "/api/admin/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(logout_response.status_code, 200)

        invalid_profile_response = self.client.get(
            "/api/admin/perfil",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(invalid_profile_response.status_code, 401)

    def test_admin_validation_errors(self):
        missing_payload = self.client.post("/api/admin/register", json={})
        self.assertEqual(missing_payload.status_code, 400)

        invalid_fields = self.client.post(
            "/api/admin/register",
            json={"name": "A", "email": "bad-email", "senha": "123", "chave": "x"},
        )
        self.assertEqual(invalid_fields.status_code, 400)

        bad_login = self.client.post(
            "/api/admin/login",
            json={"login": "missing", "senha": "admin123", "chave": "library-key"},
        )
        self.assertEqual(bad_login.status_code, 401)

        missing_login_fields = self.client.post(
            "/api/admin/login",
            json={"login": "", "senha": "admin123", "chave": "library-key"},
        )
        self.assertEqual(missing_login_fields.status_code, 400)

        self.register_admin()
        wrong_password = self.client.post(
            "/api/admin/login",
            json={"login": "adminuser", "senha": "wrong123", "chave": "library-key"},
        )
        self.assertEqual(wrong_password.status_code, 401)

        wrong_key = self.client.post(
            "/api/admin/login",
            json={"login": "adminuser", "senha": "admin123", "chave": "wrong-key"},
        )
        self.assertEqual(wrong_key.status_code, 401)

        no_token = self.client.get("/api/admin/perfil")
        self.assertEqual(no_token.status_code, 401)

    def test_admin_expired_token_is_rejected(self):
        self.register_admin()
        token = self.login_admin()
        app1.TOKEN_EXPIRY[token] = datetime.utcnow() - timedelta(seconds=1)

        expired_profile = self.client.get(
            "/api/admin/perfil",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(expired_profile.status_code, 401)
        self.assertNotIn(token, app1.ADMIN_SESSIONS)
        self.assertNotIn(token, app1.TOKEN_EXPIRY)

    def test_books_can_be_created_listed_and_fetched(self):
        missing_fields = self.client.post("/books", json={"title": "No Author"})
        self.assertEqual(missing_fields.status_code, 400)

        book_id = self.create_book()

        list_response = self.client.get("/books")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.get_json()[0]["title"], "Clean Code")

        detail_response = self.client.get(f"/api/books/{book_id}")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.get_json()["author"], "Robert C. Martin")

        missing_response = self.client.get("/api/books/9999")
        self.assertEqual(missing_response.status_code, 404)

    def test_loan_request_approval_renewal_and_return_flow(self):
        self.register_user()
        user_token = self.login_user()
        self.register_admin()
        admin_token = self.login_admin()
        book_id = self.create_book(quantity=1)

        request_response = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(request_response.status_code, 201)
        request_id = request_response.get_json()["id"]

        duplicate_request = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(duplicate_request.status_code, 400)

        pending_response = self.client.get(
            "/api/admin/loan-requests",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(pending_response.status_code, 200)
        self.assertEqual(pending_response.get_json()[0]["request_id"], request_id)

        approve_response = self.client.put(
            f"/api/admin/loan-requests/{request_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(approve_response.status_code, 200)

        unavailable_request = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(unavailable_request.status_code, 400)

        loans_response = self.client.get(
            "/api/users/me/loans",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(loans_response.status_code, 200)
        loan_id = loans_response.get_json()[0]["id"]

        renew_response = self.client.put(
            f"/api/loans/{loan_id}/renew",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(renew_response.status_code, 200)
        self.assertIn("new_due_date", renew_response.get_json())

        return_response = self.client.put(
            f"/api/loans/{loan_id}/return",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(return_response.status_code, 200)

        returned_loans_response = self.client.get(
            "/api/users/me/loans",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(returned_loans_response.status_code, 200)
        self.assertEqual(returned_loans_response.get_json(), [])

    def test_existing_active_loan_blocks_new_request_when_stock_remains(self):
        user_token, _, book_id, _ = self.create_approved_loan(quantity=2)

        request_again = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(request_again.status_code, 400)
        self.assertIn("este livro", request_again.get_json()["error"])

    def test_loan_request_input_and_no_stock_errors(self):
        self.register_user()
        user_token = self.login_user()
        no_stock_book_id = self.create_book(quantity=0)

        missing_payload = self.client.post(
            "/api/loan-requests",
            json={},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(missing_payload.status_code, 400)

        missing_book_id = self.client.post(
            "/api/loan-requests",
            json={"book_id": None},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(missing_book_id.status_code, 400)

        no_stock = self.client.post(
            "/api/loan-requests",
            json={"book_id": no_stock_book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(no_stock.status_code, 400)

    def test_user_request_shows_removed_book_title_fallback(self):
        self.register_user()
        user_token = self.login_user()
        book_id = self.create_book()

        request_response = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(request_response.status_code, 201)

        conn = sqlite3.connect(app1.BOOKS_DB)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
        conn.commit()
        conn.close()

        requests_response = self.client.get(
            "/api/users/me/loan-requests",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(requests_response.status_code, 200)
        self.assertEqual(requests_response.get_json()[0]["book_title"], "Livro removido")

    def test_rejecting_pending_loan_request(self):
        self.register_user()
        user_token = self.login_user()
        self.register_admin()
        admin_token = self.login_admin()
        book_id = self.create_book()

        request_response = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        request_id = request_response.get_json()["id"]

        reject_response = self.client.put(
            f"/api/admin/loan-requests/{request_id}/reject",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(reject_response.status_code, 200)

        user_requests = self.client.get(
            "/api/users/me/loan-requests",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(user_requests.status_code, 200)
        self.assertEqual(user_requests.get_json()[0]["status"], "rejected")

        second_reject = self.client.put(
            f"/api/admin/loan-requests/{request_id}/reject",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(second_reject.status_code, 400)

        approve_rejected = self.client.put(
            f"/api/admin/loan-requests/{request_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(approve_rejected.status_code, 400)

    def test_approving_request_fails_when_stock_was_depleted(self):
        self.register_user()
        user_token = self.login_user()
        self.register_admin()
        admin_token = self.login_admin()
        book_id = self.create_book(quantity=1)

        request_response = self.client.post(
            "/api/loan-requests",
            json={"book_id": book_id},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        request_id = request_response.get_json()["id"]
        self.set_book_quantity(book_id, 0)

        approve_response = self.client.put(
            f"/api/admin/loan-requests/{request_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(approve_response.status_code, 400)

    def test_admin_can_list_and_return_active_user_loans(self):
        _, admin_token, _, loan_id = self.create_approved_loan(quantity=1)

        loans_response = self.client.get("/loans")
        self.assertEqual(loans_response.status_code, 200)
        self.assertEqual(loans_response.get_json()[0]["id"], loan_id)

        return_response = self.client.put(
            f"/api/admin/loans/{loan_id}/return",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(return_response.status_code, 200)

        missing_return = self.client.put(
            f"/api/admin/loans/{loan_id}/return",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(missing_return.status_code, 404)

    def test_legacy_loan_routes_and_stats(self):
        book_id = self.create_book(quantity=3)

        loan_response = self.client.post(
            "/loans",
            json={
                "book_id": book_id,
                "borrower_name": "Ana Silva",
                "loan_date": "2026-05-04",
                "return_date": "2026-05-19",
            },
        )
        self.assertEqual(loan_response.status_code, 201)
        loan_id = loan_response.get_json()["id"]

        stats_response = self.client.get("/stats")
        self.assertEqual(stats_response.status_code, 200)
        self.assertEqual(stats_response.get_json()["total_books"], 1)
        self.assertEqual(stats_response.get_json()["total_loaned"], 1)

        return_response = self.client.delete(f"/loans/{loan_id}")
        self.assertEqual(return_response.status_code, 200)

        second_return_response = self.client.delete(f"/loans/{loan_id}")
        self.assertEqual(second_return_response.status_code, 404)

    def test_legacy_loan_validation_and_inventory_errors(self):
        missing_fields = self.client.post("/loans", json={"book_id": 1})
        self.assertEqual(missing_fields.status_code, 400)

        missing_book = self.client.post(
            "/loans",
            json={
                "book_id": 9999,
                "borrower_name": "Ana Silva",
                "loan_date": "2026-05-04",
                "return_date": "2026-05-19",
            },
        )
        self.assertEqual(missing_book.status_code, 404)

        no_stock_book_id = self.create_book(quantity=0)
        no_stock = self.client.post(
            "/loans",
            json={
                "book_id": no_stock_book_id,
                "borrower_name": "Ana Silva",
                "loan_date": "2026-05-04",
                "return_date": "2026-05-19",
            },
        )
        self.assertEqual(no_stock.status_code, 400)

    def test_renewal_limit_and_ownership_errors(self):
        user_token, _, _, loan_id = self.create_approved_loan(quantity=1)

        self.register_user(email="bruno@example.com")
        other_user_token = self.login_user(email="bruno@example.com")

        forbidden_renewal = self.client.put(
            f"/api/loans/{loan_id}/renew",
            headers={"Authorization": f"Bearer {other_user_token}"},
        )
        self.assertEqual(forbidden_renewal.status_code, 403)

        self.set_loan_renewals(loan_id, 5)
        limit_response = self.client.put(
            f"/api/loans/{loan_id}/renew",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(limit_response.status_code, 400)

        forbidden_return = self.client.put(
            f"/api/loans/{loan_id}/return",
            headers={"Authorization": f"Bearer {other_user_token}"},
        )
        self.assertEqual(forbidden_return.status_code, 403)

        missing_return = self.client.put(
            "/api/loans/9999/return",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(missing_return.status_code, 404)

    def test_route_error_cases_for_missing_resources(self):
        self.register_user()
        user_token = self.login_user()
        self.register_admin()
        admin_token = self.login_admin()

        missing_book_request = self.client.post(
            "/api/loan-requests",
            json={"book_id": 9999},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(missing_book_request.status_code, 404)

        missing_request_approval = self.client.put(
            "/api/admin/loan-requests/9999/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(missing_request_approval.status_code, 404)

        missing_request_reject = self.client.put(
            "/api/admin/loan-requests/9999/reject",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(missing_request_reject.status_code, 404)

        missing_renewal = self.client.put(
            "/api/loans/9999/renew",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(missing_renewal.status_code, 404)


if __name__ == "__main__":
    unittest.main()
