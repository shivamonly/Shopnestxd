# Shopnestxd

ShopNestXD — A modern full-stack eCommerce platform delivering a sleek shopping experience with responsive UI, dynamic product browsing, secure authentication, cart management, and seamless checkout workflows.

## Technology Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** CSS
- **Deployment:** Netlify

### Backend
- **Framework:** Node.js, Express
- **Language:** TypeScript
- **Database:** MongoDB / JSON (Configurable)
- **Deployment:** Render (Persistent Web Service)

## Architecture
This project is built using a monorepo structure with a clear separation between the client and server components to enable independent development and deployment.

- **Client:** Hosted on Netlify for fast global distribution.
- **Server:** Hosted on Render to provide a persistent, always-on API backend.
- **Connectivity:** The frontend utilizes an environment variable (`VITE_API_URL`) to communicate securely with the production API hosted on Render.
