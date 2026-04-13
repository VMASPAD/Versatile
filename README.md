# Versatile

Versatile is an all-in-one scalable ad network, link-in-bio provider, and monetized shortlink platform. It consists of a high-performance NestJS backend, an interactive React frontend dashboard, and a custom NoSQL in-memory database built in Rust (SarychDB).

## Features

- **Ad Network & Widget**: Create and manage highly customizable display banners and inject them into any website via a lightweight JavaScript embed widget or direct React integration.
- **Versatile Bio**: A premium, "link-in-bio" module with glassmorphism design, custom themes, and animated background orbs. Users can host their personalized profile page with an optional embedded ad.
- **Versatile Fly**: A monetized shortlink service (like AdFly). Wraps any URL with a 5-second countdown timer page that displays the user's Versatile ad before redirecting to the target destination. 
- **Analytics & Tracking**: Lightweight tracking via a 1x1 transparent PNG pixel and `navigator.sendBeacon`. Captures impressions, viewability via `IntersectionObserver`, and clicks.
- **SarychDB Integration**: Powered by an ultra-fast in-memory NoSQL database written in Rust. Features automatic database creation, user management, and TCP-based JSON communication.

## Architecture

The platform is split into three main components:

1. **Backend** (NestJS): 
    - Handles JWT authentication, public endpoints, and widget serving.
    - Modules: `Auth`, `Ads`, `Tracker`, `Analytics`, `Widget`, `Bio` (Linktree clone), and `Fly` (AdFly clone).
    - Interfaces with SarychDB via a custom TCP service layer.

2. **Frontend** (React + Vite):
    - A modern User Dashboard styled with modern styling.
    - Manages ad creation, tracking stats viewing, and getting embed codes.

3. **SarychDB** (Rust): 
    - High-performance data store managing isolated databases per user, plus centralized registries (`registry`, `registry_bio`, `registry_fly`) for public entity resolution.

## Getting Started

### Prerequisites
- Node.js v18+
- Rust (for compiling SarychDB if running from source)

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/your-username/versatile.git
   cd versatile
   \`\`\`

2. **Install Backend Dependencies:**
   \`\`\`bash
   cd backend
   npm install
   npm run start:dev
   \`\`\`
   *(SarychDB binary will be automatically spawned by the NestJS bootstrap process on port 4040)*

3. **Install Frontend Dependencies:**
   \`\`\`bash
   cd ../frontend
   npm install
   npm run dev
   \`\`\`
   *(Accessible at http://localhost:5173)*

## Widget Integration (Vanilla JS)

\`\`\`html
<div id="my-ad-container"></div>
<script 
  src="http://localhost:3514/widget/versatile.js" 
  data-ad-id="YOUR_AD_ID" 
  data-api="http://localhost:3514" 
  data-target="my-ad-container">
</script>
\`\`\`

## Widget Integration (React)

\`\`\`tsx
import { useEffect } from 'react';

export default function MyAd() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "http://localhost:3514/widget/versatile.js"; 
    script.async = true;
    
    script.onload = () => {
      if (window.Versatile) {
        window.Versatile.init({
          adId: "YOUR_AD_ID",
          api: "http://localhost:3514",
          target: "my-ad-container"
        });
      }
    };
    
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="my-ad-container" />;
}
\`\`\`

## License
MIT License
