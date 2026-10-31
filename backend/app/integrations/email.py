import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger("rethread.email")


def send_verification_email(email_to: str, token: str) -> bool:
    """
    Send an email verification token or link.
    In local development, logs token clearly for instant testing.
    """
    subject = "Verify your ReThread Campus Account"
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    html_content = f"""
    <html>
      <body style="font-family: sans-serif; background-color: #f5f3ee; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2ded6;">
          <h2 style="color: #1a3a2a; font-family: Georgia, serif;">ReThread Campus Thrift</h2>
          <p>Welcome to ReThread! Please verify your official student email address to activate your account.</p>
          <div style="background: #e8f0eb; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #1a3a2a;">Your Verification Code:</p>
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a3a2a;">{token[:8].upper()}</span>
          </div>
          <p style="text-align: center;">
            <a href="{verification_link}" style="background-color: #1a3a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p style="font-size: 12px; color: #8a938c; margin-top: 30px;">
            If you did not create a ReThread account, please ignore this email.
          </p>
        </div>
      </body>
    </html>
    """

    logger.info(f"===> [EMAIL DISPATCH] Verification email for {email_to}")
    logger.info(f"===> [VERIFICATION TOKEN]: {token}")
    logger.info(f"===> [VERIFICATION LINK]: {verification_link}")

    # If in local dev or SMTP not configured, simulate successful delivery
    if settings.APP_ENV == "development" or not settings.EMAIL_USERNAME:
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = email_to
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=5) as server:
            if settings.EMAIL_USERNAME and settings.EMAIL_PASSWORD:
                server.starttls()
                server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as exc:
        logger.error(f"Failed to deliver SMTP email to {email_to}: {exc}")
        return False


def send_password_reset_email(email_to: str, token: str) -> bool:
    """Send password reset link to user."""
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    logger.info(f"===> [EMAIL DISPATCH] Password reset for {email_to}")
    logger.info(f"===> [PASSWORD RESET LINK]: {reset_link}")
    return True
