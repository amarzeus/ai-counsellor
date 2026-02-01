from PIL import Image
import os

input_path = "/home/amar/Documents/Developer/ai-counsellor/frontend/public/logo.png"
output_path = "/home/amar/Documents/Developer/ai-counsellor/backend/static/logo_email.png"

def crop_logo(img_path, target_path):
    img = Image.open(img_path)
    if img.mode != 'RGBA':
        img = img.convert("RGBA")
    
    # Get bounding box of non-transparent part
    bbox = img.getbbox()
    if bbox:
        # Add a small padding (10px) around the logo to avoid being too tight
        padding = 10
        bbox = (
            max(0, bbox[0] - padding),
            max(0, bbox[1] - padding),
            min(img.width, bbox[2] + padding),
            min(img.height, bbox[3] + padding)
        )
        img = img.crop(bbox)
        
    img.save(target_path, "PNG")
    print(f"Successfully cropped {img_path} and saved to {target_path}")

if __name__ == "__main__":
    if not os.path.exists(os.path.dirname(output_path)):
        os.makedirs(os.path.dirname(output_path))
    crop_logo(input_path, output_path)
