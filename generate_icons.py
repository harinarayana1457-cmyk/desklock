import os
import sys

# Ensure pillow is installed
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not found. Installing pillow...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
    from PIL import Image, ImageDraw

# Create icons directory
os.makedirs("icons", exist_ok=True)

def create_lock_icon(size):
    # Transparent background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions relative to size
    padding = max(1, size // 12)
    center = size // 2
    
    # 1. Draw background circle (deep space color with cyan border)
    border_width = max(1, size // 16)
    draw.ellipse(
        [padding, padding, size - padding, size - padding], 
        fill=(17, 20, 36, 255), 
        outline=(6, 182, 212, 255), 
        width=border_width
    )
    
    # 2. Draw lock body (cyan rectangle)
    # Positioning in the bottom half of the circle
    body_width = int(size * 0.44)
    body_height = int(size * 0.3)
    body_left = center - (body_width // 2)
    body_top = int(size * 0.48)
    body_right = body_left + body_width
    body_bottom = body_top + body_height
    
    # Draw body
    draw.rectangle(
        [body_left, body_top, body_right, body_bottom],
        fill=(6, 182, 212, 255)
    )
    
    # 3. Draw shackle (cyan arc in top half)
    shackle_radius = int(size * 0.16)
    shackle_width = max(1, size // 20)
    
    shackle_left = center - shackle_radius
    shackle_top = int(size * 0.28)
    shackle_right = center + shackle_radius
    shackle_bottom = body_top + shackle_width # Connects into body
    
    # Drawing arc (upper half of ellipse)
    draw.arc(
        [shackle_left, shackle_top, shackle_right, shackle_bottom],
        start=180,
        end=360,
        fill=(6, 182, 212, 255),
        width=shackle_width
    )
    
    # Draw shackle legs extending down into body for a realistic look
    draw.rectangle([shackle_left, shackle_bottom - shackle_width, shackle_left + shackle_width, body_top], fill=(6, 182, 212, 255))
    draw.rectangle([shackle_right - shackle_width, shackle_bottom - shackle_width, shackle_right, body_top], fill=(6, 182, 212, 255))

    # Save to file
    img.save(f"icons/lock{size}.png")
    print(f"Successfully generated icons/lock{size}.png")

if __name__ == "__main__":
    create_lock_icon(16)
    create_lock_icon(48)
    create_lock_icon(128)
    print("All icons generated successfully.")
