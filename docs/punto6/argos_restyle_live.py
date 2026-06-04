#!/usr/bin/env python3
"""
ARGOS · Restyle del punto 6 SOBRE EL GOOGLE DOC EN VIVO (sin modificar datos).

Aplica, vía Google Docs API (updateTableCellStyle), exactamente el mismo estilo
que el .docx restilizado: zebra en la tabla de tareas e hitos, columna ID en
esmeralda, barras de Gantt continuas (bordes verticales blancos) y centrado
vertical. NO toca ni un solo texto/dato de las tablas.

REQUISITOS (una sola vez):
  1) pip install google-auth google-auth-oauthlib google-api-python-client
  2) En https://console.cloud.google.com :
       - Crea/elige un proyecto y habilita la "Google Docs API".
       - APIs y servicios > Credenciales > Crear credenciales > ID de cliente OAuth
         > Tipo "App de escritorio". Descarga el JSON como  client_secret.json
         (en esta misma carpeta).
       - En "Pantalla de consentimiento OAuth" añade tu correo como usuario de prueba.
  3) Ejecuta:  python3 argos_restyle_live.py
     Se abrirá el navegador para que inicies sesión con la cuenta DUEÑA del doc.

El token se cachea en token.json para reejecuciones.
"""
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

DOC_ID = "1MEhv-wxoe9D-zsA1mwTUrO1Ex25Hg-KD"
SCOPES = ["https://www.googleapis.com/auth/documents"]
HERE = os.path.dirname(os.path.abspath(__file__))

# ---- paleta (igual que el .docx) ----
def rgb(hexs):
    h = hexs.lstrip("#")
    return {"red": int(h[0:2], 16) / 255, "green": int(h[2:4], 16) / 255, "blue": int(h[4:6], 16) / 255}

BAND   = rgb("f9fafb"); WHITE = rgb("ffffff"); REF = rgb("f3f4f6")
EMER_L = rgb("d1fae5"); HLINE = rgb("e5e7eb")

def bg(color):
    return {"backgroundColor": {"color": {"rgbColor": color}}}

def border(color, pt=1):
    return {"color": {"color": {"rgbColor": color}}, "width": {"magnitude": pt, "unit": "PT"}, "dashStyle": "SOLID"}

# ---------- auth ----------
def get_service():
    creds = None
    tok = os.path.join(HERE, "token.json")
    if os.path.exists(tok):
        creds = Credentials.from_authorized_user_file(tok, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            cs = os.path.join(HERE, "client_secret.json")
            if not os.path.exists(cs):
                raise SystemExit("Falta client_secret.json — sigue los REQUISITOS del encabezado.")
            creds = InstalledAppFlow.from_client_secrets_file(cs, SCOPES).run_local_server(port=0)
        with open(tok, "w") as f:
            f.write(creds.to_json())
    return build("docs", "v1", credentials=creds)

# ---------- localizar las 4 tablas del punto 6 por la firma de su cabecera ----------
def cell_text(cell):
    out = ""
    for el in cell.get("content", []):
        for pe in el.get("paragraph", {}).get("elements", []):
            out += pe.get("textRun", {}).get("content", "")
    return out.strip()

def header_sig(table):
    row0 = table["tableRows"][0]["tableCells"]
    return [cell_text(c) for c in row0]

def find_tables(doc):
    found = {}
    for el in doc["body"]["content"]:
        if "table" not in el:
            continue
        t = el["table"]
        sig = header_sig(t)
        start = el["startIndex"]
        if sig[:3] == ["Ref.", "Tarea", "Duración"]:
            found["task"] = (start, t)
        elif sig[:2] == ["Ref.", "Tarea"] and "S1" in sig:
            found["gantt"] = (start, t)
        elif sig[:4] == ["ID", "Semana", "Hito", "Entregable"]:
            found["miles"] = (start, t)
    return found

def cell_loc(start, r, c):
    return {"tableCellLocation": {"tableStartLocation": {"index": start},
                                  "rowIndex": r, "columnIndex": c},
            "rowSpan": 1, "columnSpan": 1}

def style_req(start, r, c, style, fields):
    return {"updateTableCellStyle": {"tableRange": cell_loc(start, r, c),
                                     "tableCellStyle": style, "fields": fields}}

def build_requests(tables):
    reqs = []
    # --- TASK: zebra cols 1+, columna ref intacta, centrado vertical ---
    if "task" in tables:
        start, t = tables["task"]
        for ri, row in enumerate(t["tableRows"]):
            ncols = len(row["tableCells"])
            for c in range(ncols):
                if ri == 0:
                    reqs.append(style_req(start, ri, c, {"contentAlignment": "MIDDLE"}, "contentAlignment"))
                    continue
                style = {"contentAlignment": "MIDDLE"}
                fields = "contentAlignment"
                if c == 0:
                    pass  # mantiene acento ref existente
                else:
                    style.update(bg(BAND if (ri % 2 == 0) else WHITE)); fields += ",backgroundColor"
                reqs.append(style_req(start, ri, c, style, fields))
    # --- MILES: zebra + columna ID esmeralda ---
    if "miles" in tables:
        start, t = tables["miles"]
        for ri, row in enumerate(t["tableRows"]):
            ncols = len(row["tableCells"])
            for c in range(ncols):
                if ri == 0:
                    reqs.append(style_req(start, ri, c, {"contentAlignment": "MIDDLE"}, "contentAlignment"))
                    continue
                style = {"contentAlignment": "MIDDLE"}
                if c == 0:
                    style.update(bg(EMER_L))
                else:
                    style.update(bg(BAND if (ri % 2 == 0) else WHITE))
                reqs.append(style_req(start, ri, c, style, "contentAlignment,backgroundColor"))
    # --- GANTT: barras continuas (bordes verticales blancos) + centrado, sin tocar colores de barra ---
    if "gantt" in tables:
        start, t = tables["gantt"]
        for ri, row in enumerate(t["tableRows"]):
            ncols = len(row["tableCells"])
            for c in range(ncols):
                if ri >= 2 and c >= 2:
                    style = {"contentAlignment": "MIDDLE",
                             "borderLeft": border(WHITE, 0.5), "borderRight": border(WHITE, 0.5),
                             "borderTop": border(HLINE, 0.5), "borderBottom": border(HLINE, 0.5)}
                    reqs.append(style_req(start, ri, c, style,
                                          "contentAlignment,borderLeft,borderRight,borderTop,borderBottom"))
                else:
                    reqs.append(style_req(start, ri, c, {"contentAlignment": "MIDDLE"}, "contentAlignment"))
    return reqs

def main():
    svc = get_service()
    doc = svc.documents().get(documentId=DOC_ID).execute()
    tables = find_tables(doc)
    missing = {"task", "gantt", "miles"} - set(tables)
    if missing:
        raise SystemExit(f"No encontré estas tablas del punto 6: {missing}")
    reqs = build_requests(tables)
    print(f"Aplicando {len(reqs)} cambios de estilo (sin tocar datos)...")
    svc.documents().batchUpdate(documentId=DOC_ID, body={"requests": reqs}).execute()
    print("✅ Punto 6 reestilizado en el documento en vivo.")

if __name__ == "__main__":
    main()
