import json
import sys

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def generate_pdf(json_file, pdf_file):
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        sys.exit(1)

    try:
        c = canvas.Canvas(pdf_file, pagesize=letter)
        width, height = letter

        x_offset = 40
        y_offset = 750
        padding = 15

        c.setFont("Helvetica-Bold", 16)
        c.drawString(x_offset, y_offset, "Resultados de Scraping")
        y_offset -= 2 * padding

        c.setFont("Helvetica", 12)
        for item in data:
            titulo = item.get('titulo', [''])[0]
            descripcion = item.get('descripcion', [''])[0]
            precio = item.get('precio', [''])[0]

            c.drawString(x_offset, y_offset, f"Titulo: {titulo}")
            y_offset -= padding
            c.drawString(x_offset, y_offset, f"Descripcion: {descripcion}")
            y_offset -= padding
            c.drawString(x_offset, y_offset, f"Precio: {precio}")
            y_offset -= 2 * padding

            if y_offset < 40:
                c.showPage()
                y_offset = 750

        c.save()
    except Exception as e:
        print(f"Error generating PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python generate_pdf.py <json_file> <pdf_file>")
        sys.exit(1)
        
    json_file = sys.argv[1]
    pdf_file = sys.argv[2]
    generate_pdf(json_file, pdf_file)
