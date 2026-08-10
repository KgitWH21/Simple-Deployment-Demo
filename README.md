# Deployment

Utilize this [project](<REPLACE-WITH-YOUR-REPO-URL>) as the baseline for this app.

> Deploy from a **standalone repo**, not the course monorepo. Cloning the whole
> monorepo onto a 1 GB instance is slow and makes every path longer than it needs
> to be.

## Steps

### 1. Create an EC2 instance

- Visit [AWS EC2 Console](https://us-east-2.console.aws.amazon.com/ec2/home)
- Before launching anything: use an **IAM admin user** (not root), enable **MFA**,
  and set a **budget alert** at $5–$20
- Create an instance with `t3.micro` and the **Ubuntu Server 24.04 LTS** image
- Create and Download a PEM KEY
- Networking:
  - **SSH (22) → My IP** — *not* `0.0.0.0`. Port 22 open to the world gets
    brute-forced within minutes.
  - **HTTP (80) → Anywhere** (`0.0.0.0/0`)
  - **HTTPS (443) → Anywhere** (`0.0.0.0/0`) — nothing listens there today, we
    open it now so we don't come back tomorrow
- Allocate an **Elastic IP** and associate it with the instance

> Without an Elastic IP, your public address changes every time the instance stops
> and starts. Tomorrow we point a domain at this machine — if the address moves
> underneath us, everything breaks.

### 2. Enter your EC2 instance through `ssh`

- Move the key somewhere sane and change its permissions

```bash
mv ~/Downloads/<name_of_key>.pem ~/.ssh/
chmod 600 ~/.ssh/<name_of_key>.pem
```

- Enter your EC2 instance through ssh

```bash
ssh -i ~/.ssh/<name_of_key>.pem ubuntu@<ipv4_address>
```

> SSH refuses to use a key other users could read. Without `chmod 600` you get
> `UNPROTECTED PRIVATE KEY FILE` and it quits.

### 3. Ensure your project is ready

#### Back-End

- Update `requirements.txt`
- Ensure no secrets are exposed — `.env` stays in `.gitignore`
- Commit a `server/.env.example` template so others know which variables are required
- Add `'*'` to `ALLOWED_HOSTS`
- `server/Dockerfile`: use `python:3.13-slim` (not `trixie` — 1.3 GB vs ~130 MB on an 8 GB disk)

> **`ALLOWED_HOSTS` is required, not optional.** Nginx forwards the browser's
> `Host` header to Django. On EC2 that's your public IP, which isn't in the
> default list — Django rejects **every API call with a 400** while the React app
> still loads fine. `DEBUG = True` does not bypass this; Django only falls back to
> localhost defaults when the list is *empty*.

> **Skip CORS.** Nginx serves the React build *and* proxies `/api/` to Django, so
> the browser only ever talks to one origin. There is no cross-origin request for
> CORS to permit. `django-cors-headers` here is a dependency that does nothing.

#### Front-End

- Leave your API requests **relative** — do not hardcode the IP:

```js
export const api = axios.create({
    baseURL: '/api/v1/'
})
```

- `client/Dockerfile`: use `node:22-alpine` and `npm ci` (respects the lockfile)

> A relative `baseURL` already works on localhost, on the raw IP, and — starting
> tomorrow — on a real domain over HTTPS, with no code change. Hardcoding
> `http://<ipv4>/api/v1/` breaks twice this week.

#### docker-compose.yml

- Remove the `./client/dist:/usr/share/nginx/html` volume

> `dist/` is gitignored. On a fresh clone Docker creates an **empty folder** and
> mounts it over the files the image build just produced — nginx then serves
> nothing. That mount is a local dev-loop convenience only.

### 4. Push up to Github

### 5. In EC2 Pull Down your Project from Github

```bash
git clone <REPLACE-WITH-YOUR-REPO-URL>
cd <repo-folder>
```

### 6. Install [Docker](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository) in EC2

```bash
sudo systemctl status docker    # verify: active (running)
```

### 7. Create your `.env` on the server

```bash
cp server/.env.example server/.env
nano server/.env                # fill in a real POSTGRES_PASSWORD
```

> **Do not skip this.** `docker-compose.yml` declares `env_file: ./server/.env`
> for two services, and that file is gitignored — it does not exist after a fresh
> clone. Without it `docker compose up` fails immediately with
> `env file ... not found` and no containers start.

### 8. Run `sudo docker compose up -d --build` to run your project

```bash
sudo docker compose up -d --build
sudo docker compose ps          # expect 3 containers Up
```

> `-d` is detached. Without it the containers die the moment you close your SSH
> session, which is not what you want from a web server.

### 9. Set Up your Database

- Apply migrations

```bash
sudo docker exec -it django-container python manage.py migrate
```

- Or, if you'd rather work inside the container:

```bash
sudo docker exec -it django-container bash
python manage.py migrate
exit
```

### 10. Visit your site and ensure it's working

```
http://<ipv4_address>
```

> Use `http://`, **not** `https://` — nothing is listening on 443 yet.

- Register an account, create a task
- Watch the logs while you click:

```bash
sudo docker logs -f nginx-container      # Ctrl+C to stop following
```

### 11. Exit

```bash
exit        # leaves SSH; containers keep running because of -d
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `UNPROTECTED PRIVATE KEY FILE` | `chmod 600 ~/.ssh/<key>.pem` |
| `Permission denied (publickey)` | use `ubuntu@`, not `ec2-user@` |
| `ssh: connect ... timed out` | your IP changed — update the SG's SSH rule |
| `env file ... not found` | step 7 — create `server/.env` |
| Page loads but register/login **400** | `ALLOWED_HOSTS` missing `'*'` |
| Site loads blank / 404 | `client/dist` bind mount still in compose |
| Build killed, `exit code 137` | out of RAM — add swap (below) |
| `502 Bad Gateway` | backend crashed — `sudo docker logs django-container` |

```bash
# add 2 GB swap if the vite build OOMs on t3.micro
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Known limitations (intentional)

- `/admin/` serves the React app, not Django admin — nginx proxies only `/api/`,
  everything else hits the SPA catch-all. Same reason the DRF browsable API is
  unstyled (no `STATIC_ROOT` / `collectstatic` / `/static/` block).

## What ships today is intentionally insecure

| # | Problem | Fixed |
|---|---|---|
| 1 | `DEBUG = True` — stack traces public | Day 3 |
| 2 | `SECRET_KEY` hardcoded in git | Day 3 |
| 3 | `ALLOWED_HOSTS = ['*']` | Day 3 |
| 4 | Postgres (5433) + Django (8000) published to host | Day 3 |
| 5 | `--reload` gunicorn (dev mode) | Day 3 |
| 6 | Password sent over plain HTTP | **Day 2** |
| 7 | Auth token in `localStorage` | Day 3 |
| 8 | No HTTPS | **Day 2** |

## Homework — before tomorrow

**Register a domain tonight.** You cannot get an SSL certificate for a raw IP
address. Route 53 is ~$13–15/yr for a `.com`.

- Route 53 → Hosted zones → Create record → type **A**, name blank, value = your Elastic IP
- Repeat with name `www`
- Verify: `dig +short <your-domain>`

DNS takes time to propagate. Do it tonight, not tomorrow morning.
