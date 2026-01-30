import os
import asyncio
import logging
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Check if Resend is configured
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Only import resend if configured
if RESEND_API_KEY:
    import resend
    resend.api_key = RESEND_API_KEY
    EMAIL_CONFIGURED = True
else:
    EMAIL_CONFIGURED = False
    logger.warning("RESEND_API_KEY not configured. Email notifications will be disabled.")


async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """
    Send an email using Resend API.
    Returns a dict with status and message.
    """
    if not EMAIL_CONFIGURED:
        logger.info(f"Email not sent (not configured): {subject} -> {to_email}")
        return {
            "status": "skipped",
            "message": "Email service not configured",
            "configured": False
        }
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return {
            "status": "success",
            "message": f"Email sent to {to_email}",
            "email_id": email.get("id"),
            "configured": True
        }
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "configured": True
        }


async def send_new_message_notification(
    provider_email: str,
    provider_name: str,
    client_name: str,
    message_preview: str
) -> dict:
    """
    Send notification to provider when a client sends a new message.
    """
    subject = f"New Message from {client_name} - DocPortal"
    
    # Truncate message preview if too long
    if len(message_preview) > 150:
        message_preview = message_preview[:147] + "..."
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <tr>
                <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 24px; border-bottom: 1px solid #e4e4e7;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">DocPortal</h1>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Content -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 24px;">
                                <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46;">
                                    Hi {provider_name.split()[0] if provider_name else 'there'},
                                </p>
                                <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46;">
                                    You have received a new message from <strong style="color: #18181b;">{client_name}</strong>:
                                </p>
                                
                                <!-- Message Box -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; border-left: 4px solid #2563eb;">
                                            <p style="margin: 0; font-size: 15px; color: #52525b; font-style: italic;">
                                                "{message_preview}"
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- CTA Button -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding-top: 32px; text-align: center;">
                                            <p style="margin: 0; font-size: 14px; color: #71717a;">
                                                Log in to DocPortal to view and respond to this message.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 32px; border-top: 1px solid #e4e4e7; margin-top: 32px;">
                                <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                    This is an automated notification from DocPortal.<br>
                                    Please do not reply directly to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return await send_email(provider_email, subject, html_content)


def is_email_configured() -> bool:
    """Check if email service is configured."""
    return EMAIL_CONFIGURED


async def send_refund_requested_notification(
    provider_email: str,
    provider_name: str,
    client_name: str,
    appointment_type: str,
    appointment_date: str,
    appointment_time: str,
    amount: float,
    reason: str
) -> dict:
    """
    Send notification to provider when a client requests a refund.
    """
    subject = f"New Refund Request from {client_name} - DocPortal"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <tr>
                <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 24px; border-bottom: 1px solid #e4e4e7;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">DocPortal</h1>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Content -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 24px;">
                                <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46;">
                                    Hi {provider_name.split()[0] if provider_name else 'there'},
                                </p>
                                <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46;">
                                    <strong style="color: #18181b;">{client_name}</strong> has requested a refund for their appointment.
                                </p>
                                
                                <!-- Appointment Details Box -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="background-color: #fef3c7; border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;">
                                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e;"><strong>Appointment Details:</strong></p>
                                            <p style="margin: 0 0 4px 0; font-size: 14px; color: #78350f;">Type: {appointment_type}</p>
                                            <p style="margin: 0 0 4px 0; font-size: 14px; color: #78350f;">Date: {appointment_date} at {appointment_time}</p>
                                            <p style="margin: 0; font-size: 16px; color: #78350f;"><strong>Amount: €{amount:.2f}</strong></p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Reason Box -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                                    <tr>
                                        <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px;">
                                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;"><strong>Patient's Reason:</strong></p>
                                            <p style="margin: 0; font-size: 15px; color: #3f3f46; font-style: italic;">
                                                "{reason}"
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- CTA -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding-top: 32px; text-align: center;">
                                            <p style="margin: 0; font-size: 14px; color: #71717a;">
                                                Please log in to DocPortal to review and process this refund request.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 32px; border-top: 1px solid #e4e4e7; margin-top: 32px;">
                                <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                    This is an automated notification from DocPortal.<br>
                                    Please do not reply directly to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    result = await send_email(provider_email, subject, html_content)
    
    # Log for demo mode
    if not EMAIL_CONFIGURED:
        logger.info(f"[DEMO] Refund request notification would be sent to provider: {provider_email}")
        logger.info(f"[DEMO] Client: {client_name}, Amount: €{amount:.2f}, Reason: {reason[:50]}...")
    
    return result


async def send_refund_approved_notification(
    client_email: str,
    client_name: str,
    appointment_type: str,
    appointment_date: str,
    amount: float,
    provider_response: str = None
) -> dict:
    """
    Send notification to client when their refund is approved.
    """
    subject = "Your Refund Has Been Approved - DocPortal"
    
    response_html = ""
    if provider_response:
        response_html = f"""
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
            <tr>
                <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;"><strong>Provider's Note:</strong></p>
                    <p style="margin: 0; font-size: 15px; color: #3f3f46; font-style: italic;">
                        "{provider_response}"
                    </p>
                </td>
            </tr>
        </table>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <tr>
                <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 24px; border-bottom: 1px solid #e4e4e7;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">DocPortal</h1>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Content -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 24px;">
                                <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46;">
                                    Hi {client_name.split()[0] if client_name else 'there'},
                                </p>
                                <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46;">
                                    Good news! Your refund request has been <strong style="color: #16a34a;">approved</strong>.
                                </p>
                                
                                <!-- Refund Details Box -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="background-color: #dcfce7; border-radius: 8px; padding: 20px; border-left: 4px solid #16a34a;">
                                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;"><strong>Refund Details:</strong></p>
                                            <p style="margin: 0 0 4px 0; font-size: 14px; color: #15803d;">Appointment: {appointment_type}</p>
                                            <p style="margin: 0 0 4px 0; font-size: 14px; color: #15803d;">Date: {appointment_date}</p>
                                            <p style="margin: 0; font-size: 18px; color: #166534;"><strong>Refund Amount: €{amount:.2f}</strong></p>
                                        </td>
                                    </tr>
                                </table>
                                
                                {response_html}
                                
                                <!-- Info -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding-top: 24px;">
                                            <p style="margin: 0; font-size: 14px; color: #71717a;">
                                                The refund will be processed to your original payment method within 5-10 business days.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 32px; border-top: 1px solid #e4e4e7; margin-top: 32px;">
                                <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                    Thank you for using DocPortal.<br>
                                    This is an automated notification.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    result = await send_email(client_email, subject, html_content)
    
    # Log for demo mode
    if not EMAIL_CONFIGURED:
        logger.info(f"[DEMO] Refund approved notification would be sent to client: {client_email}")
        logger.info(f"[DEMO] Appointment: {appointment_type}, Amount: €{amount:.2f}")
    
    return result


async def send_refund_rejected_notification(
    client_email: str,
    client_name: str,
    appointment_type: str,
    appointment_date: str,
    amount: float,
    provider_response: str
) -> dict:
    """
    Send notification to client when their refund is rejected.
    """
    subject = "Update on Your Refund Request - DocPortal"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <tr>
                <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 24px; border-bottom: 1px solid #e4e4e7;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #2563eb;">DocPortal</h1>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Content -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 24px;">
                                <p style="margin: 0 0 16px 0; font-size: 16px; color: #3f3f46;">
                                    Hi {client_name.split()[0] if client_name else 'there'},
                                </p>
                                <p style="margin: 0 0 24px 0; font-size: 16px; color: #3f3f46;">
                                    We regret to inform you that your refund request has been <strong style="color: #dc2626;">declined</strong>.
                                </p>
                                
                                <!-- Refund Details Box -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="background-color: #fef2f2; border-radius: 8px; padding: 20px; border-left: 4px solid #dc2626;">
                                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;"><strong>Request Details:</strong></p>
                                            <p style="margin: 0 0 4px 0; font-size: 14px; color: #b91c1c;">Appointment: {appointment_type}</p>
                                            <p style="margin: 0 0 4px 0; font-size: 14px; color: #b91c1c;">Date: {appointment_date}</p>
                                            <p style="margin: 0; font-size: 16px; color: #991b1b;"><strong>Amount: €{amount:.2f}</strong></p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Provider Response -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                                    <tr>
                                        <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px;">
                                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;"><strong>Provider's Response:</strong></p>
                                            <p style="margin: 0; font-size: 15px; color: #3f3f46; font-style: italic;">
                                                "{provider_response or 'No additional information provided.'}"
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Info -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding-top: 24px;">
                                            <p style="margin: 0; font-size: 14px; color: #71717a;">
                                                If you have questions about this decision, please contact your healthcare provider directly through DocPortal messaging.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-top: 32px; border-top: 1px solid #e4e4e7; margin-top: 32px;">
                                <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                    This is an automated notification from DocPortal.<br>
                                    Please do not reply directly to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    result = await send_email(client_email, subject, html_content)
    
    # Log for demo mode
    if not EMAIL_CONFIGURED:
        logger.info(f"[DEMO] Refund rejected notification would be sent to client: {client_email}")
        logger.info(f"[DEMO] Appointment: {appointment_type}, Amount: €{amount:.2f}")
    
    return result
