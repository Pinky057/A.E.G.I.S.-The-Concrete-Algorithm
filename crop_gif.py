import os
from PIL import Image

print("Loading original Demo Clip...")
im = Image.open('demo_clip.webp')

frames = []
try:
    while True:
        frames.append(im.copy())
        im.seek(len(frames))
except EOFError:
    pass

width, height = frames[0].size

# 1. Math for the 3:2 center crop
target_width = int(height * 1.5)
target_height = height
if target_width > width:
    target_width = width
    target_height = int(width / 1.5)

left = (width - target_width) / 2
top = (height - target_height) / 2
right = (width + target_width) / 2
bottom = (height + target_height) / 2

# 2. Process all frames: Crop, Resize to 600x400, and aggressively Quantize colors for <5MB size
print(f"Processing {len(frames)} frames for 3:2 ratio and 5MB limit compression...")
processed_frames = []
for frame in frames:
    # Center crop
    cropped = frame.crop((left, top, right, bottom)).convert('RGB')
    # Resize down mathematically to guarantee massive size reductions
    resized = cropped.resize((600, 400), Image.Resampling.LANCZOS)
    # Quantize lowers the color palette to drastically save size (GIF optimization)
    quantized = resized.quantize(colors=128, method=Image.Quantize.FASTOCTREE)
    processed_frames.append(quantized)

out_name = 'devpost_gallery_video.gif'
original_duration = im.info.get('duration', 100)

print("Encoding output GIF...")
processed_frames[0].save(
    out_name,
    save_all=True,
    append_images=processed_frames[1:],
    optimize=True,
    duration=original_duration,
    loop=0
)

# 3. Safety Fallback: Drop every other frame if it magically stays above 4.5MB
size_mb = os.path.getsize(out_name) / (1024*1024)
if size_mb > 4.5:
    print(f"Size {size_mb:.2f}MB is still too close to 5MB limit! Halving the framerate...")
    # Skip every other video frame, but double the delay so the playback speed looks normal
    half_frames = processed_frames[::2]
    half_frames[0].save(
        out_name,
        save_all=True,
        append_images=half_frames[1:],
        optimize=True,
        duration=original_duration * 2, 
        loop=0
    )
    size_mb = os.path.getsize(out_name) / (1024*1024)

print(f"SUCCESS! Devpost 3:2 Animated GIF created at {size_mb:.2f} MB")
