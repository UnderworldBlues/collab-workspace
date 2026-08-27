A real-time chat application backend designed to support team collaboration. This project replaces standard HTTP polling with persistent bi-directional connections to deliver messages instantly, while offloading heavy processing to background workers to ensure the main server remains responsive.

---

## Tech Stack & Architecture

* **Core Framework:** Django 6.1 with Django REST Framework (DRF).
* **Real-Time Engine:** Django Channels with Daphne (ASGI server).
* **Message Broker:** Redis (handles WebSocket group broadcasting and task queues).
* **Task Queue:** Celery (processes background notifications without blocking the web thread).

---

## Local Development Setup

* **Step 1:** Clone the repository and create a `.env` file in the root directory containing your environment variables (e.g., `SECRET_KEY=your-secret`, `DEBUG=True`, `ALLOWED_HOSTS=*`, `CELERY_BROKER_URL=redis://redis:6379/0`).
* **Step 2:** Build and launch the containerized infrastructure by running `docker-compose up --build` in your terminal.
* **Step 3:** Apply database migrations and create your initial admin account by executing `docker-compose exec web python manage.py migrate` followed by `docker-compose exec web python manage.py createsuperuser`.

---

## Usage & Endpoints

Once the Docker containers are running, the backend services are completely exposed and available on `localhost:8000`.

**REST API (HTTP)**
Access the browsable API via `/api/chat/rooms/` and `/api/chat/messages/`. You can filter historical messages for a specific room using query parameters, such as `/api/chat/messages/?room=1`.

**WebSockets (WS)**
Connect your frontend application to a specific chat room via `ws://localhost:8000/ws/chat/<room_id>/`. The consumer expects JSON payloads containing an `action` key (either `send_message` or `set_typing`) to correctly route real-time events.