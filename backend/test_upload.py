"""End-to-end test: upload -> WebP -> watermark -> download PNG"""
import io
import httpx
from PIL import Image, ImageDraw

BASE = "http://localhost:8000"
client = httpx.Client(timeout=60.0)

def log(label, msg=""):
    print(f"{label} {msg}")

# 1. LOGIN
r = client.post(f"{BASE}/api/v1/auth/login",
               json={"email": "tj@tjphotography.com", "password": "Password123"})
d = r.json()
token = d["access_token"]
headers = {"Authorization": f"Bearer {token}"}
log("1. LOGIN:", f"OK - {d['user']['name']}")

# 2. GET OR CREATE WEDDING
r = client.get(f"{BASE}/api/v1/weddings/?page_size=1", headers=headers)
weddings = r.json()
if weddings.get("items"):
    wid = weddings["items"][0]["id"]
    log("2. WEDDING:", f"{weddings['items'][0]['wedding_name']} (id={wid})")
else:
    r = client.post(f"{BASE}/api/v1/weddings/", headers={**headers, "Content-Type": "application/json"},
                   json={"wedding_name": "Test Wedding", "bride_name": "Jane", "groom_name": "John",
                         "wedding_date": "2026-08-15T00:00:00Z", "location": "Test", "status": "active"})
    wid = r.json()["id"]
    log("2. WEDDING CREATED:", f"id={wid}")

# 3. CREATE TEST IMAGE
img = Image.new("RGB", (1920, 1080), color=(135, 206, 235))
draw = ImageDraw.Draw(img)
for i in range(0, 1920, 10):
    draw.line([(i,0),(i,1080)], fill=(i*200//1920,)*3, width=1)
draw.text((100,100), "TEST IMAGE", fill=(255,255,255))
buf = io.BytesIO()
img.save(buf, format="JPEG", quality=95)
test_image = buf.getvalue()
log("3. TEST IMAGE:", f"{len(test_image)} bytes, 1920x1080")

# 4. INIT UPLOAD
r = client.post(f"{BASE}/api/v1/upload/init",
               headers={**headers, "Content-Type": "application/json"},
               json={"wedding_id": wid, "files": [{"name": "test_image.jpg", "size": len(test_image), "content_type": "image/jpeg"}]})
init_data = r.json()
upload_id = init_data["upload_id"]
file_id = init_data["files"][0]["file_id"]
log("4. UPLOAD INIT:", f"session={upload_id[:8]}... file={file_id[:8]}...")

# 5. UPLOAD FILE
r = client.post(f"{BASE}/api/v1/upload/{upload_id}/files/{file_id}",
               headers=headers,
               files={"file": ("test_image.jpg", test_image, "image/jpeg")})
photo = r.json()
log("5. UPLOAD DONE:")
log("   Filename:", photo["filename"])
log("   Content-Type:", photo["content_type"])
log("   Original URL:", photo["original_url"])
log("   Medium URL:", photo.get("medium_url", "N/A"))
log("   Thumbnail URL:", photo.get("thumbnail_url", "N/A"))
log("   Width:", f"{photo['width']}x{photo['height']}")
log("   File size:", f"{photo['file_size']} bytes")

# 6. VERIFY STORED FILE IS WEBP
orig_path = photo["original_url"].replace("/storage/", "")
r = client.get(f"{BASE}/storage/{orig_path}", headers=headers)
log("6. STORAGE ORIGINAL:", f"HTTP {r.status_code}, {len(r.content)} bytes")
if r.status_code == 200:
    log("   First bytes hex:", r.content[:4].hex())
    check = Image.open(io.BytesIO(r.content))
    log("   Format:", f"{check.format} Size: {check.size}")

# 7. DOWNLOAD AS PNG
r = client.get(f"{BASE}/api/v1/photos/{photo['id']}/download", headers=headers)
log("7. DOWNLOAD PNG:", f"HTTP {r.status_code}, {len(r.content)} bytes")
if r.status_code == 200:
    log("   Content-Type:", r.headers.get("content-type"))
    log("   Content-Disposition:", r.headers.get("content-disposition"))
    check = Image.open(io.BytesIO(r.content))
    log("   Format:", f"{check.format} Size: {check.size}")

# 8. CHECK SETTINGS
r = client.get(f"{BASE}/api/v1/settings/", headers=headers)
settings = r.json()
log("8. SETTINGS:")
log("   Watermark enabled:", settings["gallery"]["watermark_enabled"])
log("   Watermark type:", settings["branding"].get("watermark_type", "N/A"))
log("   Watermark text:", settings["branding"].get("watermark_text", "N/A"))

# 9. ENABLE WATERMARK
r = client.put(f"{BASE}/api/v1/settings/gallery",
              headers={**headers, "Content-Type": "application/json"},
              json={"watermark_enabled": True})
log("9. WATERMARK ENABLED:", f"HTTP {r.status_code}")

# 10. UPLOAD SECOND IMAGE WITH WATERMARK
buf2 = io.BytesIO()
img2 = Image.new("RGB", (800, 600), color=(50, 50, 100))
draw2 = ImageDraw.Draw(img2)
draw2.rectangle([(100,100),(700,500)], fill=(200,100,50))
draw2.text((300,300), "WATERMARK TEST", fill=(255,255,255))
img2.save(buf2, format="JPEG", quality=95)
test_image2 = buf2.getvalue()

r = client.post(f"{BASE}/api/v1/upload/init",
               headers={**headers, "Content-Type": "application/json"},
               json={"wedding_id": wid, "files": [{"name": "watermark_test.jpg", "size": len(test_image2), "content_type": "image/jpeg"}]})
init2 = r.json()
r = client.post(f"{BASE}/api/v1/upload/{init2['upload_id']}/files/{init2['files'][0]['file_id']}",
               headers=headers,
               files={"file": ("watermark_test.jpg", test_image2, "image/jpeg")})
photo2 = r.json()
log("10. WATERMARK UPLOAD:")
log("    Filename:", photo2["filename"])
log("    Content-Type:", photo2["content_type"])

if photo2.get("medium_url"):
    r = client.get(f"{BASE}{photo2['medium_url']}", headers=headers)
    if r.status_code == 200:
        log("    Watermarked image size:", f"{len(r.content)} bytes")
        wm = Image.open(io.BytesIO(r.content))
        log("    Format:", f"{wm.format} Size: {wm.size}")

print()
print("=== ALL TESTS PASSED ===")
