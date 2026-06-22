# AR Restaurant Menu Platform

Multi-tenant WebAR SaaS that converts restaurant dish videos into AR-enabled digital menus.
Restaurants upload videos → platform produces 3D models → customers scan QR codes to view dishes in AR on their table.

**Co-founders:** Abubakar & Syed Ashher Majid (FAST-NUCES Islamabad)
**Primary developer working with Claude:** Abubakar
**Status:** Greenfield — no code written yet

---

## Two Core Systems

### 1. Production Pipeline (internal, local machine)
Runs on a local RTX 3050 GPU machine. Never exposed to the public.

```
dish_video.mp4
  → FFmpeg          (video → still frames at ~5fps)
  → Meshroom        (frames → raw 3D mesh .obj, GPU-heavy, 10–30 min per dish)
  → glTF-Transform  (raw mesh → optimized .glb, a few MB)
  → Upload .glb to Cloudflare R2
```

Orchestrated by a Python conductor script that polls the database for `status = "approved"` dishes.

### 2. Customer Platform (cloud, public-facing)
Next.js app serving the AR menu experience to diners and the upload portal to restaurant owners.

```
yourapp.com/menu/{restaurant-slug}   ← diner-facing menu page
yourapp.com/dashboard                ← restaurant owner portal (Phase 3)
yourapp.com/admin/review             ← internal review queue (Phase 3)
```

---

## Monorepo Structure

```
ar-restaurant-menu/
├── pipeline/                  # Python pipeline (runs on local RTX 3050)
│   ├── conductor.py           # Main polling loop — polls DB, runs pipeline per dish
│   ├── stages/
│   │   ├── extract_frames.py  # FFmpeg wrapper
│   │   ├── run_meshroom.py    # Meshroom wrapper
│   │   └── optimize_gltf.py  # glTF-Transform wrapper
│   ├── utils/
│   │   └── r2.py              # Cloudflare R2 upload/download helpers
│   ├── requirements.txt
│   └── .env.example
├── platform/                  # Next.js web app
│   ├── app/
│   │   ├── menu/[slug]/       # Diner-facing menu page (dynamic route per restaurant)
│   │   ├── dashboard/         # Restaurant owner portal
│   │   └── admin/             # Internal review queue
│   ├── components/
│   ├── lib/
│   │   ├── db.ts              # DB client (Supabase or Neon — TBD)
│   │   └── r2.ts              # R2 client for .glb URLs
│   ├── public/
│   ├── package.json
│   └── .env.example
├── CLAUDE.md
└── pnpm-workspace.yaml
```

---

## Tech Stack

### Production Pipeline
| Tool | Version | Role |
|------|---------|------|
| Python | 3.12 | Conductor/orchestration — no 3D math, just subprocess calls |
| FFmpeg | latest stable | Extracts still frames from dish video |
| Meshroom (AliceVision) | latest stable | GPU photogrammetry — frames → raw .obj mesh |
| glTF-Transform | latest (Node 20) | Compresses raw mesh → optimized .glb |
| `boto3` / `cloudflare-sdk` | latest | Uploading/downloading files from Cloudflare R2 |

### Customer Platform
| Tool | Version | Role |
|------|---------|------|
| Node.js | 20 LTS | Runtime |
| pnpm | latest | Package manager (monorepo workspaces) |
| Next.js | 15 (App Router) | Multi-tenant menu pages + restaurant dashboard |
| TypeScript | 5.x | All platform code |
| PostgreSQL | via Supabase or Neon (TBD) | System of record — restaurants, dishes, status, subscriptions |
| Cloudflare R2 | — | Object storage for raw videos (incoming) and finished .glb files |
| `<model-viewer>` | latest | WebAR component — renders .glb, triggers ARKit/ARCore |

### Package Manager
- **Platform:** `pnpm` (faster installs, better monorepo support)
- **Pipeline:** `pip` with `requirements.txt` (or `uv` for speed — preferred)

---

## Dish Status Lifecycle

```
uploaded → under_review → approved → processing → complete
                       ↘ rejected (with note) → re-upload possible
                                                        ↑ back to uploaded
                                              failed (pipeline error)
```

The conductor script only picks up dishes with `status = "approved"`. It never processes `uploaded` dishes directly — a manual human review gate sits between upload and processing.

---

## Key Architectural Decisions (settled)

| Decision | Choice | Why |
|----------|--------|-----|
| Multi-tenancy | Single Next.js app, dynamic routes | Scales without per-client engineering effort |
| Hosting model | Company hosts all menus | Justifies recurring subscription; keeps UX consistent |
| WebAR approach | `<model-viewer>` (not raw WebXR, not paid SDK) | Free, uses native ARKit/ARCore, switchable later without touching pipeline since all options share .glb |
| Pipeline trigger | DB polling (not direct push) | DB is single source of truth; decouples cloud app from local machine availability |
| Video upload | Restaurant uploads via portal, manual review gate | Low friction for restaurant + quality controlled before GPU time is spent |
| Build order | Pipeline first, then platform | Pipeline output quality is the highest-risk unknown; validate it before building the website |
| Revenue model | One-time onboarding fee + recurring subscription | Onboarding fee = easy first purchase tied to tangible deliverable; subscription = retention once value is proven |
| Non-payment behavior | Menu page and QR go dark | Creates real, immediate pressure to resubscribe — intentional |

---

## Build Roadmap

### Phase 1 — Prove the Pipeline Manually ← START HERE
- Install FFmpeg, Meshroom, Node.js + glTF-Transform on the RTX 3050 machine
- Confirm Meshroom uses the GPU (check logs — it will say so)
- Run each tool manually in sequence on a test video
- Inspect output `.glb` in a browser-based glTF viewer before writing any automation
- Repeat with an actual food dish to learn food-specific constraints (glossy sauces, steam, small details)

### Phase 2 — Automate the Pipeline
- Write `pipeline/conductor.py` chaining FFmpeg → Meshroom → glTF-Transform via `subprocess`
- Validate between stages: frames folder not empty, mesh file exists and has sane size, .glb exists in expected size range
- Wrap processing as a background job with a DB status field (not a blocking web request)
- Set up PostgreSQL and have conductor poll for `status = "approved"`, download video from R2, run pipeline, upload .glb

### Phase 3 — Build the Customer Platform
- Next.js multi-tenant menu page with dynamic `[slug]` route
- Integrate `<model-viewer>` for "View on Table" AR experience
- Connect Cloudflare R2 for .glb delivery
- QR code generation per restaurant pointing to their menu route
- Restaurant sign-in and dish video upload portal
- Internal review queue: preview submission, approve or reject with a note

### Phase 4 — Business Operations Layer
- Onboarding fee calculation (based on menu size)
- Recurring subscription billing and status tracking
- Non-payment behavior (grace period design, what the customer sees, reactivation flow)

### Phase 5 — Scale (revisit when there's real demand)
- Additional GPU capacity if throughput bottlenecks
- Restaurant self-service dashboard
- Evaluate paid WebAR SDK if in-page AR becomes a competitive need
- Formal job queue (e.g. Celery, BullMQ) if simple DB polling can't handle concurrent demand

---

## Pipeline Constraints to Know

- Meshroom takes **10–30 minutes per dish** on an RTX 3050 — never run it synchronously inside a web request
- Meshroom **fails silently on bad input** — always validate output (mesh file exists, size is >1MB) before proceeding
- Food-specific failure modes: glossy sauces, steam, repetitive textures (rice, fries), shaky camera motion
- Raw Meshroom output is typically **100MB+** — the glTF-Transform step is not optional
- Frame rate for FFmpeg extraction (~5fps) is tunable — too few = bad reconstruction, too many = wasted time on near-duplicate frames

---

## model-viewer Implementation Reference

```html
<model-viewer
  src="https://your-r2-bucket.com/dish.glb"
  ar
  ar-modes="webxr scene-viewer quick-look"
  camera-controls
  alt="3D model of dish name">
  <button slot="ar-button">View on Table</button>
</model-viewer>
```

`ar-modes` priority: WebXR (in-page, where supported) → Scene Viewer (Android) → Quick Look (iOS).

---

## Deferred Decisions (do not assume — confirm before implementing)

- Supabase vs Neon for PostgreSQL
- Deployment target for Next.js (Vercel, Cloudflare Pages, self-hosted, etc.)
- Domain name
- Pricing tiers (exact onboarding fee amounts, subscription pricing)
- Grace period length on non-payment and reactivation UX
- Whether to add a FastAPI layer between the cloud DB and the local conductor, or keep direct DB polling
