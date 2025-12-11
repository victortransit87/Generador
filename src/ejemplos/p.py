# lote_pdf_a_texto_log.py
import os
import io
import csv
import time
import argparse
from glob import glob
from datetime import datetime
from collections import Counter

import pdfplumber
from PIL import Image
import pytesseract

def limpiar_texto(texto: str) -> str:
    lineas = [l.strip() for l in (texto or "").splitlines() if l.strip()]
    return "\n".join(lineas)

def detectar_repetidos(lista_textos, umbral=0.5):
    c = Counter(lista_textos)
    return {t for t, n in c.items() if t and t.strip() and n > len(lista_textos) * umbral}

def extraer_texto_pdf(pdf_path: str, use_ocr: bool, lang_ocr: str = "spa"):
    paginas_texto = []
    total_paginas = 0
    ocr_paginas = 0

    with pdfplumber.open(pdf_path) as pdf:
        total_paginas = len(pdf.pages)
        for i, pagina in enumerate(pdf.pages, start=1):
            texto = pagina.extract_text()
            if not texto or not texto.strip():
                if use_ocr:
                    img = pagina.to_image(resolution=300).original
                    b = io.BytesIO()
                    img.save(b, format="PNG")
                    texto = pytesseract.image_to_string(Image.open(b), lang=lang_ocr)
                    ocr_paginas += 1
                else:
                    texto = ""
            texto = limpiar_texto(texto)
            paginas_texto.append((i, texto))

    # Detectar cabeceras/pies repetidos
    primeras = [p[1].split("\n")[0] if "\n" in p[1] and p[1] else p[1] for p in paginas_texto]
    ultimas  = [p[1].split("\n")[-1] if "\n" in p[1] and p[1] else p[1] for p in paginas_texto]
    cabeceras = detectar_repetidos(primeras)
    pies = detectar_repetidos(ultimas)

    # Quitar cabeceras/pies y añadir etiquetas de página
    texto_final = []
    for num, t in paginas_texto:
        lns = t.split("\n") if t else []
        if lns and lns[0] in cabeceras: lns.pop(0)
        if lns and lns[-1] in pies:    lns.pop(-1)
        cuerpo = "\n".join(lns)
        texto_final.append(f"--- Página {num} ---\n{cuerpo.strip()}\n")

    texto_final = "\n".join(texto_final).strip()

    return {
        "texto": texto_final,
        "paginas": total_paginas,
        "ocr_paginas": ocr_paginas,
        "chars": len(texto_final)
    }


def procesar_carpeta(origen: str, destino: str, recursivo: bool, use_ocr: bool, lang_ocr: str, logbase: str):
    os.makedirs(destino, exist_ok=True)
    os.makedirs(os.path.dirname(logbase) or ".", exist_ok=True)

    csv_path = f"{logbase}.csv"
    log_path = f"{logbase}.log"

    # CSV: encabezado si no existe
    escribir_header = not os.path.exists(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as csvf, open(log_path, "a", encoding="utf-8") as logf:
        writer = csv.writer(csvf)
        if escribir_header:
            writer.writerow(["timestamp","pdf","txt","status","pages","ocr_pages","chars","seconds","error"])

        patron = "**/*.pdf" if recursivo else "*.pdf"
        rutas = glob(os.path.join(origen, patron), recursive=recursivo)
        if not rutas:
            msg = "No se encontraron PDFs."
            print(msg)
            logf.write(f"[{datetime.now().isoformat()}] {msg}\n")
            return

        for pdf_path in rutas:
            inicio = time.time()
            nombre = os.path.splitext(os.path.basename(pdf_path))[0] + ".txt"
            txt_path = os.path.join(destino, nombre)
            status = "OK"
            error = ""
            pages = ocr_pages = chars = 0

            try:
                res = extraer_texto_pdf(pdf_path, use_ocr=use_ocr, lang_ocr=lang_ocr)
                pages = res["paginas"]; ocr_pages = res["ocr_paginas"]; chars = res["chars"]
                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(res["texto"])
                print(f"OK: {pdf_path} -> {txt_path}  ({pages} págs, {ocr_pages} OCR, {chars} chars)")
            except Exception as e:
                status = "ERROR"
                error = str(e)
                print(f"ERROR: {pdf_path} -> {error}")

            dur = round(time.time() - inicio, 3)
            ts = datetime.now().isoformat()

            # CSV row
            writer.writerow([ts, pdf_path, txt_path, status, pages, ocr_pages, chars, dur, error])

            # LOG line
            logf.write(f"[{ts}] {status} {pdf_path} -> {txt_path} | pages={pages} ocr={ocr_pages} chars={chars} sec={dur} err={error}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extrae texto de PDFs por lotes, limpia cabeceras/pies y registra tiempos/errores.")
    parser.add_argument("origen", help="Carpeta con PDFs de entrada")
    parser.add_argument("destino", help="Carpeta de salida para los .txt")
    parser.add_argument("--recursivo", action="store_true", help="Buscar PDFs en subcarpetas")
    parser.add_argument("--ocr", action="store_true", help="Activar OCR cuando no haya texto embebido")
    parser.add_argument("--lang-ocr", default="spa", help="Idioma Tesseract (ej. 'spa', 'eng', 'spa+eng')")
    parser.add_argument("--logbase", default="conversion_log", help="Ruta base para logs (sin extensión). Genera .csv y .log")
    args = parser.parse_args()

    procesar_carpeta(
        origen=args.origen,
        destino=args.destino,
        recursivo=args.recursivo,
        use_ocr=args.ocr,
        lang_ocr=args.lang_ocr,
        logbase=args.logbase,
    )
