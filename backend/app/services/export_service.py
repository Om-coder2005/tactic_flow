import os
import base64
import uuid
from io import BytesIO
from PIL import Image
from fpdf import FPDF
from app.schemas.exports import ExportRequest

EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

PRESETS = {
    "instagram": (1080, 1350),
    "youtube": (1280, 720),
    "slide": (1920, 1080),
    "a4": (2480, 3508)
}

def decode_image(base64_str: str) -> Image.Image:
    # Strip the header if it exists
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_data = base64.b64decode(base64_str)
    return Image.open(BytesIO(img_data)).convert("RGB")

def fit_image_to_preset(img: Image.Image, preset: str) -> Image.Image:
    if preset not in PRESETS:
        return img  # fallback for custom or untracked
    
    target_w, target_h = PRESETS[preset]
    # Simple resize with padding (letterboxing) to maintain aspect ratio perfectly
    img.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)
    
    new_img = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    paste_x = (target_w - img.width) // 2
    paste_y = (target_h - img.height) // 2
    new_img.paste(img, (paste_x, paste_y))
    return new_img

def generate_pdf(request: ExportRequest, job_id: str = None) -> str:
    job_id = job_id or str(uuid.uuid4())
    filename = f"{job_id}.pdf"
    file_path = os.path.join(EXPORT_DIR, filename)
    
    # Map presets to standard physical sizing (millimeters) loosely for PDF context
    # A4 is standard. Youtube/Slide is landscape format.
    pdf_format = "A4"
    orientation = "P"
    if request.preset in ["youtube", "slide"]:
        orientation = "L"
        pdf_format = "A4" # Standard standard presentation sheet
        
    pdf = FPDF(orientation=orientation, format=pdf_format)
    
    for frame in request.frames:
        pdf.add_page()
        img = decode_image(frame.base64_image)
        processed_img = fit_image_to_preset(img, request.preset)
        
        # Save temp image for FPDF insertion
        tmp_img_path = os.path.join(EXPORT_DIR, f"tmp_{job_id}_{frame.frame_id}.jpg")
        processed_img.save(tmp_img_path, "JPEG", quality=90)
        
        # Draw image bounding to page margins smoothly
        # FPDF auto scales if w or h is 0. 
        # A4 dims: 210x297mm
        if orientation == "P":
            pdf.image(tmp_img_path, x=10, y=10, w=190)
        else:
            pdf.image(tmp_img_path, x=10, y=10, w=277)
            
        os.remove(tmp_img_path) # Cleanup
        
    pdf.output(file_path)
    return filename

def generate_png(request: ExportRequest, job_id: str = None) -> str:
    job_id = job_id or str(uuid.uuid4())
    filename = f"{job_id}.png"
    file_path = os.path.join(EXPORT_DIR, filename)

    # For PNG logic, if multiple frames are sent, we just horizontally stack them 
    # (or simply just return the primary one if that's easier for the MVP)
    # The specification focuses heavily on multi-frame PDF or single-frame PNG
    
    primary_img = decode_image(request.frames[0].base64_image)
    processed_img = fit_image_to_preset(primary_img, request.preset)
    processed_img.save(file_path, "PNG")
    
    return filename
