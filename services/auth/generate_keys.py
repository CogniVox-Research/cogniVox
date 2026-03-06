#!/usr/bin/env python
"""
One-time helper script to generate the RSA-2048 key pair used for RS256 JWT signing.

Run from the auth_service directory:
    python generate_keys.py

This creates:
    keys/private.pem  (keep secret, never commit)
    keys/public.pem   (safe to share with other services)
"""
import os

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

KEY_DIR = os.path.join(os.path.dirname(__file__), "keys")
PRIVATE_KEY_PATH = os.path.join(KEY_DIR, "private.pem")
PUBLIC_KEY_PATH = os.path.join(KEY_DIR, "public.pem")


def generate_keys() -> None:
    os.makedirs(KEY_DIR, exist_ok=True)

    # Check if keys already exist to avoid accidentally overwriting them
    if os.path.exists(PRIVATE_KEY_PATH) or os.path.exists(PUBLIC_KEY_PATH):
        print("Keys already exist. Delete them manually if you want to regenerate.")
        return

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    # Write private key (PEM, no passphrase for simplicity in dev; add one for production)
    with open(PRIVATE_KEY_PATH, "wb") as f:
        f.write(
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )

    # Write public key
    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(
            private_key.public_key().public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
        )

    print(f"RSA-2048 key pair generated:")
    print(f"  Private key: {PRIVATE_KEY_PATH}")
    print(f"  Public key:  {PUBLIC_KEY_PATH}")
    print("IMPORTANT: Never commit keys/private.pem to source control!")


if __name__ == "__main__":
    generate_keys()
