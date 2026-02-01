import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_reset_email(email: str, token: str):
    """
    Real email service using SMTP to send password reset emails.
    Configured via environment variables in .env.
    """
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    try:
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    except ValueError:
        smtp_port = 587
        
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    mail_from = os.environ.get("MAIL_FROM", smtp_user)
    mail_from_name = os.environ.get("MAIL_FROM_NAME", "AI Counsellor")
    
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    if not smtp_user or not smtp_password:
        print("CRITICAL: SMTP credentials missing in environment variables.")
        # Fallback to mock behavior for visibility but this is a configuration error
        print(f"DEBUG: Reset Link for {email}: {reset_link}")
        return False

    # Create the email content
    msg = MIMEMultipart()
    msg['From'] = f"{mail_from_name} <{mail_from}>"
    msg['To'] = email
    msg['Subject'] = "Reset Your AI Counsellor Password"

    body = f"""
    Hello,

    We received a request to reset your password for your AI Counsellor account.
    Click the link below to set a new password:

    {reset_link}

    This link will expire in 30 minutes. If you did not request this, please ignore this email.

    Best regards,
    The AI Counsellor Team
    """
    
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect and send
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()  # Secure the connection
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"SUCCESS: Reset email sent to {email}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send email to {email}: {e}")
        return False
