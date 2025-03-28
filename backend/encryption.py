from cryptography.fernet import Fernet

# Generate a new key and save it
key = Fernet.generate_key()
cipher = Fernet(key)

def encrypt_file(input_file, output_file):
    with open(input_file, "rb") as f:
        data = f.read()
    encrypted_data = cipher.encrypt(data)
    with open(output_file, "wb") as f:
        f.write(encrypted_data)

def decrypt_file(input_file, output_file):
    with open(input_file, "rb") as f:
        encrypted_data = f.read()
    decrypted_data = cipher.decrypt(encrypted_data)
    with open(output_file, "wb") as f:
        f.write(decrypted_data)
