import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

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
    
    print(f"[DEBUG] Attempting to send reset email to {email}")
    
    if not smtp_user or not smtp_password:
        print("CRITICAL: SMTP credentials missing in environment variables.")
        print(f"DEBUG: Reset Link for {email}: {reset_link}")
        return False

    # Create the email content
    msg = MIMEMultipart('related')
    msg['From'] = f"{mail_from_name} <{mail_from}>"
    msg['To'] = email
    msg['Subject'] = "Reset Your AI Counsellor Password"

    # HTML Body
    html_body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 20px auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; }}
            .header {{ text-align: center; margin-bottom: 32px; }}
            .logo {{ width: 120px; height: auto; }}
            .content {{ text-align: left; }}
            .footer {{ margin-top: 32px; text-align: center; color: #6b7280; font-size: 14px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" alt="AI Counsellor Logo" class="logo">
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password for your AI Counsellor account. Click the button below to set a new password:</p>
                <div style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </div>
                <p style="margin-top: 32px;">If you're having trouble clicking the button, copy and paste the link below into your web browser:</p>
                <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">{reset_link}</p>
                <p>This link will expire in 30 minutes. If you did not request this, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The AI Counsellor Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg_alternative = MIMEMultipart('alternative')
    msg.attach(msg_alternative)

    # Plain text version for safety
    text_body = f"Hello,\n\nReset your password here: {reset_link}\n\nThis link expires in 30 minutes."
    msg_alternative.attach(MIMEText(text_body, 'plain'))
    msg_alternative.attach(MIMEText(html_body, 'html'))

    # Embed Logo
    try:
        static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
        logo_path = os.path.join(static_dir, "logo_email.png")
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo_img = MIMEImage(f.read())
                logo_img.add_header('Content-ID', '<logo>')
                msg.attach(logo_img)
    except Exception as e:
        print(f"Warning: Failed to embed logo: {e}")

    try:
        # Connect and send
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()  # Secure the connection
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"SUCCESS: Premium reset email sent to {email}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send email to {email}: {e}")
        print(f"[DEBUG_FALLBACK] Reset Link for {email}: {reset_link}")
        return False
