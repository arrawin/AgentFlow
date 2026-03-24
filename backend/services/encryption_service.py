from cryptography.fernet import Fernet
import os


class EncryptionService:
    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        self.cipher = Fernet(key)

    def encrypt(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt(self, token: str) -> str:
        return self.cipher.decrypt(token.encode()).decode()