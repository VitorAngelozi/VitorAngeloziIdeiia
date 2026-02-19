"""
Script de teste para a autenticação do sistema.

Execute: python test_auth.py
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"


def test_registro():
    """Testa o registro de um novo usuário."""
    print("\n" + "="*60)
    print("1. TESTANDO REGISTRO DE USUÁRIO")
    print("="*60)
    
    dados = {
        "username": "joao",
        "password": "senha123",
        "email": "joao@exemplo.com"
    }
    
    response = requests.post(f"{BASE_URL}/auth/registro", json=dados)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.json() if response.status_code == 201 else None


def test_login(username="admin", password="admin123"):
    """Testa o login e retorna o token."""
    print("\n" + "="*60)
    print(f"2. TESTANDO LOGIN (username: {username})")
    print("="*60)
    
    dados = {
        "username": username,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=dados)
    print(f"Status: {response.status_code}")
    resultado = response.json()
    
    if response.status_code == 200:
        # Não mostra o token completo, apenas os primeiros caracteres
        token = resultado["access_token"]
        print(f"Access Token: {token[:20]}...")
        print(f"Token Type: {resultado['token_type']}")
        print(f"Usuário: {resultado['usuario']}")
        return token
    else:
        print(f"Erro: {resultado}")
        return None


def test_obter_usuario_atual(token):
    """Testa obter dados do usuário logado."""
    print("\n" + "="*60)
    print("3. TESTANDO OBTER USUÁRIO ATUAL (/auth/me)")
    print("="*60)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    return response.json() if response.status_code == 200 else None


def test_listar_usuarios(token):
    """Testa listar todos os usuários (admin only)."""
    print("\n" + "="*60)
    print("4. TESTANDO LISTAR USUÁRIOS (/auth/usuarios)")
    print("="*60)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/auth/usuarios", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")


def test_promover_admin(token, user_id):
    """Testa promover um usuário a admin."""
    print("\n" + "="*60)
    print(f"5. TESTANDO PROMOVER USUÁRIO {user_id} A ADMIN")
    print("="*60)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(f"{BASE_URL}/auth/usuarios/{user_id}/promote", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Resposta: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")


def test_sem_autenticacao():
    """Testa requisição sem autenticação."""
    print("\n" + "="*60)
    print("6. TESTANDO REQUISIÇÃO SEM AUTENTICAÇÃO")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/auth/usuarios")
    print(f"Status: {response.status_code}")
    print(f"Erro Esperado: {response.json()}")


def main():
    print("\n")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║            TESTE DE AUTENTICAÇÃO DO SISTEMA                ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    # 1. Testar registro
    usuario = test_registro()
    
    # 2. Fazer login com admin
    token_admin = test_login("admin", "admin123")
    
    if token_admin:
        # 3. Obter dados do usuário logado
        test_obter_usuario_atual(token_admin)
        
        # 4. Listar todos os usuários
        test_listar_usuarios(token_admin)
        
        # 5. Se criou usuário novo, promover a admin
        if usuario:
            test_promover_admin(token_admin, usuario["id"])
        
        # 6. Tentar acessar sem autenticação
        test_sem_autenticacao()
    
    print("\n" + "="*60)
    print("TESTES CONCLUÍDOS!")
    print("="*60)
    print("\nDica: Use `uvicorn main:app --reload` para iniciar o servidor")
    print("      Depois acesse http://127.0.0.1:8000/docs para o Swagger")


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERRO: Não conseguiu conectar ao servidor!")
        print("   Execute: uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
