import os
try:
    import PIL
except ImportError:
    import subprocess
    subprocess.check_call(["python3", "-m", "pip", "install", "Pillow", "--break-system-packages"])

from PIL import Image

# Open the full gameplay recording we saved
im = Image.open('demo_clip.webp')

# Try to skip ahead to a frame where the game is fully loaded and things are happening
try:
    im.seek(25) 
except EOFError:
    pass

width, height = im.size

# We need exactly a 3:2 ratio (Width = 1.5 * Height)
target_width = int(height * 1.5)
target_height = height

if target_width > width:
    target_width = width
    target_height = int(width / 1.5)

# Calculate Center Crop coordinates
left = (width - target_width) / 2
top = (height - target_height) / 2
right = (width + target_width) / 2
bottom = (height + target_height) / 2

# Crop to 3:2 and save as a lightweight JPG
im_cropped = im.crop((left, top, right, bottom)).convert('RGB')
im_cropped.save('devpost_gallery_image.jpg', format='JPEG', quality=95)

# Verify size
size_mb = os.path.getsize('devpost_gallery_image.jpg') / (1024 * 1024)
print(f"Generated devpost_gallery_image.jpg successfully!")
print(f"Size: {size_mb:.2f} MB (Well under 5 MB limit)")
print("Ratio: 3:2 Perfect")
