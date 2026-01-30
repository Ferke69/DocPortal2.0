from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from auth import get_current_user
from database import (
    invoices_collection, appointments_collection, users_collection,
    provider_settings_collection, log_audit
)
from datetime import datetime, timezone
import io

# PDF Generation
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
    import base64
    PDF_ENABLED = True
except ImportError:
    PDF_ENABLED = False

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def decode_base64_image(data_url: str) -> bytes:
    """Decode base64 data URL to bytes"""
    if data_url and data_url.startswith('data:'):
        # Remove the data URL prefix
        header, base64_data = data_url.split(',', 1)
        return base64.b64decode(base64_data)
    return None

@router.get("/{invoice_id}/pdf")
async def generate_invoice_pdf(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a PDF invoice compliant with EU/Slovenian requirements.
    
    Required fields for Slovenian invoices:
    - Issuer details (name, address, tax number/davčna številka)
    - Recipient details
    - Invoice number and date
    - Description of services
    - Net amount, VAT amount, gross amount
    - Payment terms and bank details
    """
    if not PDF_ENABLED:
        raise HTTPException(
            status_code=501, 
            detail="PDF generation not available. Please install reportlab."
        )
    
    user_id = current_user["userId"]
    
    # Get invoice
    invoice = await invoices_collection.find_one({"_id": invoice_id})
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Verify access
    if invoice["clientId"] != user_id and invoice["providerId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this invoice")
    
    # Get provider info and settings
    provider = await users_collection.find_one(
        {"user_id": invoice["providerId"]},
        {"_id": 0, "password": 0}
    )
    
    provider_settings = await provider_settings_collection.find_one(
        {"providerId": invoice["providerId"]},
        {"_id": 0, "providerId": 0}
    )
    
    # Get client info
    client = await users_collection.find_one(
        {"user_id": invoice["clientId"]},
        {"_id": 0, "password": 0}
    )
    
    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=10,
        textColor=colors.HexColor('#1e40af')
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=5,
        textColor=colors.HexColor('#374151')
    )
    
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=3
    )
    
    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280')
    )
    
    # Settings with defaults
    settings = provider_settings or {}
    vat_rate = settings.get('vatRate', 22.0)  # Slovenia standard VAT
    
    # Calculate amounts
    gross_amount = invoice.get('amount', 0)
    net_amount = gross_amount / (1 + vat_rate / 100)
    vat_amount = gross_amount - net_amount
    
    # ===== HEADER WITH LOGO =====
    header_data = []
    
    # Logo (if exists)
    if settings.get('logoUrl'):
        try:
            logo_bytes = decode_base64_image(settings['logoUrl'])
            if logo_bytes:
                logo_io = io.BytesIO(logo_bytes)
                logo = Image(logo_io, width=50*mm, height=25*mm)
                header_data.append([logo, ''])
        except Exception:
            pass  # Skip logo if error
    
    # Invoice title
    elements.append(Paragraph("RAČUN / INVOICE", title_style))
    elements.append(Spacer(1, 5*mm))
    
    # ===== INVOICE INFO =====
    invoice_number = invoice.get('invoiceNumber', f"INV-{invoice_id[:8].upper()}")
    invoice_date = invoice.get('invoiceDate', invoice.get('createdAt', datetime.now()).strftime('%Y-%m-%d') if isinstance(invoice.get('createdAt'), datetime) else str(invoice.get('createdAt', '')))
    due_date = invoice.get('dueDate', '')
    
    invoice_info = f"""
    <b>Številka računa / Invoice No:</b> {invoice_number}<br/>
    <b>Datum izdaje / Issue Date:</b> {invoice_date}<br/>
    <b>Datum zapadlosti / Due Date:</b> {due_date}<br/>
    <b>Kraj izdaje / Place:</b> {settings.get('city', 'Slovenia')}
    """
    elements.append(Paragraph(invoice_info, normal_style))
    elements.append(Spacer(1, 10*mm))
    
    # ===== PROVIDER (ISSUER) INFO =====
    elements.append(Paragraph("IZDAJATELJ / ISSUER", header_style))
    
    provider_name = settings.get('businessName') or provider.get('name', 'Provider')
    provider_info = f"""
    <b>{provider_name}</b><br/>
    {settings.get('businessAddress', '')}<br/>
    {settings.get('postalCode', '')} {settings.get('city', '')}<br/>
    {settings.get('country', 'Slovenia')}<br/><br/>
    <b>Davčna št. / Tax No:</b> {settings.get('taxNumber', 'N/A')}<br/>
    <b>ID za DDV / VAT ID:</b> {settings.get('vatNumber', 'N/A')}<br/>
    <b>Matična št. / Reg. No:</b> {settings.get('registrationNumber', 'N/A')}<br/>
    <b>Email:</b> {settings.get('businessEmail', provider.get('email', ''))}<br/>
    <b>Tel:</b> {settings.get('businessPhone', provider.get('phone', ''))}
    """
    elements.append(Paragraph(provider_info, normal_style))
    elements.append(Spacer(1, 10*mm))
    
    # ===== CLIENT (RECIPIENT) INFO =====
    elements.append(Paragraph("PREJEMNIK / RECIPIENT", header_style))
    
    client_name = client.get('name', 'Client') if client else 'Client'
    client_info = f"""
    <b>{client_name}</b><br/>
    {client.get('address', '') if client else ''}<br/>
    <b>Email:</b> {client.get('email', '') if client else ''}
    """
    elements.append(Paragraph(client_info, normal_style))
    elements.append(Spacer(1, 10*mm))
    
    # ===== SERVICE TABLE =====
    elements.append(Paragraph("STORITVE / SERVICES", header_style))
    elements.append(Spacer(1, 3*mm))
    
    # Table header
    table_data = [
        ['Opis / Description', 'Kol. / Qty', 'Cena / Price', 'Znesek / Amount']
    ]
    
    # Service row
    description = invoice.get('description', 'Healthcare Service')
    table_data.append([
        description,
        '1',
        f'€{net_amount:.2f}',
        f'€{net_amount:.2f}'
    ])
    
    # Subtotal, VAT, Total
    table_data.append(['', '', 'Osnova za DDV / Net:', f'€{net_amount:.2f}'])
    table_data.append(['', '', f'DDV / VAT ({vat_rate}%):', f'€{vat_amount:.2f}'])
    table_data.append(['', '', 'SKUPAJ / TOTAL:', f'€{gross_amount:.2f}'])
    
    # Create table
    table = Table(table_data, colWidths=[90*mm, 20*mm, 35*mm, 35*mm])
    table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        
        # Totals styling
        ('FONTNAME', (2, -3), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (2, -1), (-1, -1), colors.HexColor('#dbeafe')),
        
        # Grid
        ('GRID', (0, 0), (-1, 1), 0.5, colors.HexColor('#d1d5db')),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#1e40af')),
        
        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 15*mm))
    
    # ===== PAYMENT DETAILS =====
    elements.append(Paragraph("PLAČILNI PODATKI / PAYMENT DETAILS", header_style))
    
    payment_info = f"""
    <b>Banka / Bank:</b> {settings.get('bankName', 'N/A')}<br/>
    <b>IBAN:</b> {settings.get('iban', 'N/A')}<br/>
    <b>BIC/SWIFT:</b> {settings.get('bic', 'N/A')}<br/>
    <b>Sklic / Reference:</b> {invoice_number}<br/><br/>
    <b>Rok plačila / Payment terms:</b> {settings.get('defaultPaymentTermDays', 15)} dni / days
    """
    elements.append(Paragraph(payment_info, normal_style))
    elements.append(Spacer(1, 10*mm))
    
    # ===== STATUS =====
    status = invoice.get('status', 'pending')
    status_color = colors.HexColor('#16a34a') if status == 'paid' else colors.HexColor('#dc2626')
    status_text = 'PLAČANO / PAID' if status == 'paid' else 'NEPLAČANO / UNPAID'
    
    status_style = ParagraphStyle(
        'Status',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=status_color,
        alignment=TA_CENTER
    )
    elements.append(Paragraph(status_text, status_style))
    elements.append(Spacer(1, 10*mm))
    
    # ===== FOOTER =====
    footer_text = """
    Ta račun je izdan v skladu z Zakonom o davku na dodano vrednost (ZDDV-1).
    This invoice is issued in accordance with Slovenian VAT legislation.
    """
    elements.append(Paragraph(footer_text, small_style))
    
    if settings.get('website'):
        elements.append(Paragraph(f"Web: {settings['website']}", small_style))
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    await log_audit(user_id, "view", "invoice_pdf", invoice_id)
    
    # Return PDF
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="invoice_{invoice_number}.pdf"'
        }
    )

@router.get("/{invoice_id}/preview")
async def preview_invoice_data(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get invoice data for preview (without generating PDF)"""
    user_id = current_user["userId"]
    
    invoice = await invoices_collection.find_one({"_id": invoice_id})
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice["clientId"] != user_id and invoice["providerId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get related data
    provider = await users_collection.find_one(
        {"user_id": invoice["providerId"]},
        {"_id": 0, "password": 0}
    )
    
    provider_settings = await provider_settings_collection.find_one(
        {"providerId": invoice["providerId"]},
        {"_id": 0, "providerId": 0}
    )
    
    client = await users_collection.find_one(
        {"user_id": invoice["clientId"]},
        {"_id": 0, "password": 0}
    )
    
    settings = provider_settings or {}
    vat_rate = settings.get('vatRate', 22.0)
    gross_amount = invoice.get('amount', 0)
    net_amount = gross_amount / (1 + vat_rate / 100)
    vat_amount = gross_amount - net_amount
    
    return {
        "invoice": {
            "id": invoice_id,
            "number": invoice.get('invoiceNumber', f"INV-{invoice_id[:8].upper()}"),
            "date": invoice.get('invoiceDate'),
            "dueDate": invoice.get('dueDate'),
            "description": invoice.get('description'),
            "status": invoice.get('status'),
            "netAmount": round(net_amount, 2),
            "vatAmount": round(vat_amount, 2),
            "vatRate": vat_rate,
            "grossAmount": gross_amount
        },
        "provider": {
            "name": settings.get('businessName') or provider.get('name'),
            "address": settings.get('businessAddress'),
            "city": settings.get('city'),
            "postalCode": settings.get('postalCode'),
            "country": settings.get('country', 'Slovenia'),
            "taxNumber": settings.get('taxNumber'),
            "vatNumber": settings.get('vatNumber'),
            "email": settings.get('businessEmail') or provider.get('email'),
            "phone": settings.get('businessPhone') or provider.get('phone'),
            "logoUrl": settings.get('logoUrl'),
            "iban": settings.get('iban'),
            "bankName": settings.get('bankName')
        },
        "client": {
            "name": client.get('name') if client else None,
            "email": client.get('email') if client else None,
            "address": client.get('address') if client else None
        }
    }
