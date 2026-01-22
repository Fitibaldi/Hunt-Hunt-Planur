"""
Generate self-signed SSL certificate for HTTPS support
This is required for Geolocation API to work on non-localhost connections
"""

from OpenSSL import crypto
import os
import socket

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Create a socket to determine the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def generate_self_signed_cert(cert_file="cert.pem", key_file="key.pem"):
    """Generate a self-signed SSL certificate"""
    
    # Get current local IP
    local_ip = get_local_ip()
    print(f"Detected local IP: {local_ip}")
    
    # Create a key pair
    k = crypto.PKey()
    k.generate_key(crypto.TYPE_RSA, 2048)
    
    # Create a self-signed cert
    cert = crypto.X509()
    cert.get_subject().C = "BG"
    cert.get_subject().ST = "Sofia"
    cert.get_subject().L = "Sofia"
    cert.get_subject().O = "Hunt-Hunt-Planur"
    cert.get_subject().OU = "Development"
    cert.get_subject().CN = local_ip
    
    # Add Subject Alternative Names for both IP and localhost
    san_list = f"DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:{local_ip}".encode()
    cert.add_extensions([
        crypto.X509Extension(
            b"subjectAltName",
            False,
            san_list
        )
    ])
    
    cert.set_serial_number(1000)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(365*24*60*60)  # Valid for 1 year
    cert.set_issuer(cert.get_subject())
    cert.set_pubkey(k)
    cert.sign(k, 'sha256')
    
    # Write certificate and key to files
    with open(cert_file, "wb") as f:
        f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))
    
    with open(key_file, "wb") as f:
        f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, k))
    
    print(f"[OK] Certificate generated: {cert_file}")
    print(f"[OK] Private key generated: {key_file}")
    print(f"[OK] Certificate is valid for IP: {local_ip}")
    print("\nIMPORTANT:")
    print("1. This is a self-signed certificate for development only")
    print("2. Browsers will show a security warning - you need to accept it")
    print("3. On mobile devices, you may need to manually trust the certificate")
    print("4. For production, use a proper SSL certificate from Let's Encrypt or similar")
    print(f"\nNext steps:")
    print(f"1. Restart the Flask server: python app.py")
    print(f"2. Access via: https://{local_ip}:5000/")
    print(f"3. Accept the certificate warning in your browser")

if __name__ == "__main__":
    generate_self_signed_cert()
