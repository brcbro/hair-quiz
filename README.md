# Live Love Locks Hair Quiz (Local Rebuild)

Fully **offline** local rebuild of the personalized hair quiz (no Octane API at runtime). Includes a local appointment booking form that saves requests and can email the salon via SMTP.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173/

## Booking emails

Copy `.env.example` → `.env` and set SMTP + `BOOKING_TO_EMAIL`.  
Bookings are always saved to `data/bookings.json`. With SMTP configured, the salon and the client both get an email.