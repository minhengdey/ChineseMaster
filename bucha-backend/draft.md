Got it—here’s a clear, copy-ready guide to configure and run the backend in Cloudinary-only mode.

Cloudinary-only configuration guide
1) Prerequisites
A Cloudinary account (Cloud name, API key, API secret).
A MySQL database and credentials set via env vars.
This backend already refactored to Cloudinary-only migration.
Environment variables you’ll need:

DB_URL, DB_USERNAME, DB_PASSWORD
JWT_SECRET
CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET
Optional (if using Docker): set the same env vars in your compose file.

2) Cloudinary folder structure and resource types
We’ll host both JSON (raw files) and audio (video/auto resource type) on Cloudinary under one logical root, e.g., the upload folder configured in application.yml as cloudinary.upload-folder: chinese-master.

Recommended structure:

Raw JSON (resource_type: raw)
chinese-master/curricula/<curriculum-slug>/metadata.json
chinese-master/curricula/<curriculum-slug>/lessons/<lesson-file>.json
Audio assets (resource_type: video or auto)
chinese-master/audio/<curriculum-slug>/<lesson-slug-or-number>/<file>.<ext>
Examples:

JSON: chinese-master/curricula/hsk-1/metadata.json
JSON: chinese-master/curricula/hsk-1/lessons/lesson-1.json
Audio: chinese-master/audio/hsk-1/lesson-1/hello-ni-hao.mp3
Notes:

Cloudinary treats JSON as “raw” files—use raw upload for these or their UI “Other (raw file)” option.
Audio MP3 files are typically “video” or “auto” resource type in Cloudinary. Either works; the backend can build URLs if you provide a valid public_id.
3) Backend configuration (application.yml)
Update the initializer to use Cloudinary and specify the curricula slugs you want to migrate at startup.

Under app.data.initializer:

enabled: true
source: CLOUDINARY
curricula: a comma-separated list of slugs you have on Cloudinary
Your current application.yml shows:

app.data.initializer.source: LOCAL → change to CLOUDINARY
local keys base-path and extra-base-paths are ignored in Cloudinary mode
keep cloudinary.* as-is and set via environment variables
Minimal example (only the relevant parts):

app.data.initializer.enabled: true
app.data.initializer.source: CLOUDINARY
app.data.initializer.curricula: "hsk-1,hsk-2"
cloudinary.cloud-name: ${CLOUD_NAME}
cloudinary.api-key: ${CLOUD_API_KEY}
cloudinary.api-secret: ${CLOUD_API_SECRET}
cloudinary.upload-folder: chinese-master
You don’t need to remove the local keys; they’ll be ignored when source=CLOUDINARY.

4) JSON file formats
The backend expects two kinds of JSON files hosted on Cloudinary:

Curriculum metadata: chinese-master/curricula/<slug>/metadata.json
Used to upsert/update the curriculum itself.
The order is required and unique across curricula.
Example metadata.json: { "name": "HSK 1", "description": "Beginner level", "level": "HSK1", "order": 1, "lessonFiles": ["lesson-1.json", "lesson-2.json"] }

Notes:

If lessonFiles is present, it will drive which lesson JSON files are fetched.
If lessonFiles is omitted, the service may fall back to a simple pattern (e.g., lesson-1.json, lesson-2.json) if that behavior exists in your build. Prefer providing lessonFiles.
Lesson JSON: chinese-master/curricula/<slug>/lessons/<file>.json
Contains lesson content: title, order, conversations, vocabulary, etc.
Order on lesson and nested items must be present and valid (the migration enforces order).
Audio references inside lesson JSON:

The backend supports multiple audio types:
CLOUDINARY_AUTO: Provide a Cloudinary public_id; backend builds the URL.
CLOUDINARY_URL: Provide a direct Cloudinary URL.
EXTERNAL_URL: Provide any external URL.
Optional metadata: mime_type, duration.
Example lesson JSON (excerpt): { "order": 1, "title": "Hello", "conversations": [ { "order": 1, "lines": [ { "order": 1, "chinese": "你好", "pinyin": "nǐ hǎo", "english": "Hello", "audio": { "type": "CLOUDINARY_AUTO", "public_id": "chinese-master/audio/hsk-1/lesson-1/hello-ni-hao", "mime_type": "audio/mpeg", "duration": 1.25 } } ] } ], "vocabulary": [ { "order": 1, "word": "你好", "pinyin": "nǐ hǎo", "meaning": "hello", "audio": { "type": "CLOUDINARY_URL", "url": "https://res.cloudinary.com/<cloud_name>/video/upload/chinese-master/audio/hsk-1/lesson-1/ni-hao.mp3" } } ] }

Tips:

For CLOUDINARY_AUTO, omit the file extension in public_id; Cloudinary will resolve the asset by public_id and its stored format.
For CLOUDINARY_URL, paste the full URL you get from the Cloudinary UI.
5) Environment variables (Linux/bash)
Set env vars before running the app (example): export DB_URL=jdbc:mysql://localhost:3306/bucha?useSSL=false&serverTimezone=UTC export DB_USERNAME=your_user export DB_PASSWORD=your_pass export JWT_SECRET=your_jwt_secret export CLOUD_NAME=your_cloud_name export CLOUD_API_KEY=your_cloud_api_key export CLOUD_API_SECRET=your_cloud_api_secret

Optional: put these in your shell profile or Docker compose.

6) Run and verify
Ensure your Cloudinary paths exist and files are uploaded (metadata.json + lesson files under the correct slugs).
Start the Spring Boot app. On startup, the initializer:
Reads app.data.initializer.curricula (e.g., hsk-1,hsk-2)
Fetches metadata.json for each slug
Upserts the curriculum (by order)
Iterates lessonFiles and migrates each lesson JSON
Check logs for messages indicating fetched metadata and migrated lessons.
Validate DB tables for curricula/lessons/conversations/vocab entries.
AudioController behavior:
Audio references with CLOUDINARY_AUTO or CLOUDINARY_URL will redirect to Cloudinary.
If you provided EXTERNAL_URL, it will redirect there as well.
7) Common pitfalls and fixes
Wrong source: Make sure app.data.initializer.source: CLOUDINARY.
Missing curricula: Set app.data.initializer.curricula with the exact slugs used in your Cloudinary folder tree.
Public_id vs URL:
Use CLOUDINARY_AUTO + public_id if you prefer the backend to build URLs.
Use CLOUDINARY_URL if you already have a correct URL from Cloudinary.
Resource types:
JSON files should be uploaded as raw files.
Audio files are typically “video/auto” in Cloudinary; if you see 404s, double-check the public_id and the resource type.
Orders:
Ensure order fields exist and are unique inside their scope (curricula, lesson, lines, vocab). The migration requires order.
8) Optional Cloudinary tips
Unsigned upload presets:
For CI or scripts, consider a signed upload for raw JSON and audio.
Caching:
Consider enabling CDN caching for better performance.
File naming:
Keep public_id stable to preserve idempotency on re-migrate.
