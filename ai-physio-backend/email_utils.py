import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()  # Load .env file

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
EMAIL = os.getenv("EMAIL_USER")
PASSWORD = os.getenv("EMAIL_PASSWORD")

def send_reset_email(to_email: str, token: str):

    reset_link = f"http://localhost:5173/reset-password/{token}"

    body = f"""
    Click the link below to reset your password:

    {reset_link}

    This link expires in 15 minutes.
    """

    msg = MIMEText(body)
    msg["Subject"] = "Password Reset Request"
    msg["From"] = EMAIL
    msg["To"] = to_email

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(EMAIL, PASSWORD)
    server.sendmail(EMAIL, to_email, msg.as_string())
    server.quit()

def send_verification_email(to_email: str, code: str):
    body = f"""
    Your verification code is: {code}

    This code will expire in 15 minutes.
    """
    msg = MIMEText(body)
    msg["Subject"] = "Email Verification Code"
    msg["From"] = EMAIL
    msg["To"] = to_email

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(EMAIL, PASSWORD)
    server.sendmail(EMAIL, to_email, msg.as_string())
    server.quit()