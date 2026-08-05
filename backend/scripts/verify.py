"""Verify all backend modules import and routes register correctly."""

import app.main

routes = [r for r in app.main.app.routes if hasattr(r, "methods") and hasattr(r, "path")]
api_routes = [r for r in routes if r.path.startswith("/api/")]

print(f"Total routes: {len(routes)} (API: {len(api_routes)})")
print()

categories = {
    "Auth": lambda p: "/auth" in p,
    "Weddings": lambda p: "/weddings" in p and not any(x in p for x in ("/album", "/folder", "/photo", "/participant", "/permission")),
    "Albums": lambda p: "/album" in p.split("/")[-1] or (p.count("/") >= 3 and "albums" in p.split("/")[3]),
    "Folders": lambda p: "/folder" in p,
    "Photos": lambda p: "/photo" in p,
    "Participants": lambda p: "/participant" in p,
    "Uploads": lambda p: "/upload" in p,
    "Downloads/Share": lambda p: "/download" in p or "/share-link" in p,
    "Activity": lambda p: "/activity" in p,
    "Notifications": lambda p: "/notification" in p,
    "Users": lambda p: "/users" in p,
    "Settings": lambda p: "/settings" in p,
    "Dashboard": lambda p: "/dashboard" in p,
    "Permissions": lambda p: "/permission" in p,
}

for name, pred in categories.items():
    count = len([r for r in api_routes if pred(r.path)])
    print(f"  {name:25s}: {count:2d} endpoints")

print()
print("All modules import successfully!")