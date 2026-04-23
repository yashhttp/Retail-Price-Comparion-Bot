# Retail Price Comparison Bot - Project Report

## 1. Project Overview

Retail Price Comparison Bot is a full-stack MERN application that helps users compare product prices across local shops, track price changes, and receive useful updates in real time.

The project supports two primary user groups:

- Customers: Search products, compare prices, save products to watchlist, get directions to shops, and ask product questions through a chatbot.
- Shopkeepers: Manage shops, products, and price listings through a protected dashboard with subscription-based limits.

The system combines location-aware search, price analytics, maps, notifications, and role-based access control in a single platform.

## 2. Problem Statement

In local retail markets, buyers often do not know which nearby shop offers the best price for a product. They spend time visiting multiple stores or calling manually. Shopkeepers also need a simple way to list and update pricing digitally.

This project solves that by:

- Centralizing product and price data across shops.
- Showing best available prices and trends.
- Supporting local discovery with geolocation and maps.
- Sending updates when prices change.
- Giving shopkeepers a structured panel to manage listings.

## 3. Objectives

- Build a scalable MERN-based application for local price comparison.
- Provide secure authentication and role-based authorization.
- Offer near real-time user experience with notifications and sockets.
- Support analytics (history and trend) for smarter purchase decisions.
- Add monetization through subscription upgrades for shopkeepers.

## 4. Technology Stack

### Frontend

- React 18
- Vite
- React Router DOM
- Axios
- ApexCharts + React ApexCharts (price trend visualization)
- Leaflet + Leaflet Routing Machine (maps and route display)
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- Helmet, CORS, Morgan (security + middleware)
- Razorpay (subscription payment integration)

### Tooling and Repo Setup

- npm workspaces for monorepo-style setup (client + server)
- concurrently for running frontend and backend together

## 5. High-Level Architecture

1. React frontend sends API requests through Axios.
2. Express backend handles business logic via routes and controllers.
3. Mongoose models interact with MongoDB collections.
4. Socket.IO provides authenticated realtime channels per user.
5. External integrations:
   - Geolocation + maps for nearby shop routes.
   - Razorpay for subscription checkout and verification.

## 6. Project Structure and What Comes Under This Project

### Root Level

- client: Frontend React application.
- server: Backend Express application.
- start.sh: Quick startup script.
- README and docs: Setup and feature documentation.

### Frontend Modules (client/src)

- pages
  - Home: Product search, comparison table, chatbot, trend chart, directions map.
  - Dashboard: Shopkeeper management panel for shops, products, prices, and plan upgrade.
  - Profile: Watchlist management and user insights.
  - Login/Register: Authentication pages.
  - ShopSearch/NotFound: Additional user flows.
- components
  - SearchBar, ComparisonTable, PriceTrendChart, ChatbotPanel, DirectionsMap.
  - NotificationPanel, SubscriptionModal, ProtectedRoute, Header.
- context
  - AuthContext for token, user state, refresh, login/logout.
- api
  - Central Axios instance and grouped API service functions.
- services
  - Socket connection helper and geolocation utilities.

### Backend Modules (server/src)

- index.js
  - Express app creation, middleware setup, route mounting, DB connection, socket init.
- routes
  - authRoutes, userRoutes, shopRoutes, productRoutes, priceRoutes, chatbotRoutes, notificationRoutes, subscriptionRoutes.
- controllers
  - Business logic for each module (auth, users, shops, products, prices, chatbot, notifications, subscriptions).
- middleware
  - auth: JWT verification.
  - roles: Role-based authorization.
  - errorHandler + notFound: centralized API error handling.
- models
  - User, Shop, Product, PriceListing, PriceHistory, Notification.
- socket.js
  - Token-authenticated websocket handling and per-user room join.
- utils
  - JWT helper and subscription plan helper.

## 7. Core Features and How They Work

### 7.1 Authentication and Authorization

- Register and login endpoints create authenticated user sessions using JWT.
- Frontend stores token locally and attaches it in Authorization header via Axios interceptor.
- Protected frontend routes prevent unauthorized page access.
- Backend middleware enforces roles (shopkeeper/admin) for management endpoints.

### 7.2 Product Search and Comparison

- User enters search query from Home page.
- Optional location/address is converted and sent to search API.
- Backend fetches matched products and relevant shop listings.
- UI displays comparison table with prices and shop details.

### 7.3 Price History and Analytics

- On product selection, frontend requests price history endpoint.
- Backend returns timeline data and analytics summary.
- Chart component visualizes trend so users can see price movement.

### 7.4 Watchlist and Notifications

- Logged-in users can add products to watchlist.
- Profile page shows tracked products and best current price.
- Backend stores notifications and exposes read/mark-as-read APIs.
- Socket.IO supports real-time event delivery to user-specific channels.

### 7.5 Chatbot Query

- User asks a natural language question.
- Backend cleans the text, performs product search, optionally filters nearby shops, and returns best listing response.
- Result is shown as a conversational message on Home page.

### 7.6 Shopkeeper Dashboard

- Shopkeepers create shops, products, and update price listings.
- Shop location can be auto-geocoded and manually fixed when needed.
- Product duplicate validation reduces accidental repeated entries.

### 7.7 Directions and Map Integration

- User location is captured from browser geolocation.
- If coordinates exist, in-app map route is shown.
- If coordinates are missing but address exists, fallback opens Google Maps directions URL.

### 7.8 Subscription and Payment

- Shopkeepers can view current subscription and available paid plans.
- Frontend initiates Razorpay order creation.
- Backend verifies Razorpay signature and activates selected plan.
- Plan limits influence allowed resource creation (example: shops/products).

## 8. Data Model Summary

The key entities are:

- User: identity, role, watchlist, subscription details, activity data.
- Shop: owner, name/address/contact, geolocation.
- Product: owner-linked catalog entry with searchable attributes.
- PriceListing: current price of product at a shop.
- PriceHistory: historical snapshots for trend analysis.
- Notification: user-specific alerts for important events.

This model supports both transactional data (latest prices) and analytical data (price timeline).

## 9. API Modules (Functional View)

- Auth APIs: register/login.
- User APIs: profile, insights, watchlist CRUD, recent activity cleanup.
- Product APIs: list, search, create, delete, my products.
- Shop APIs: nearby/search/create/delete/mine/geocode/location update.
- Price APIs: list, upsert, history.
- Chatbot API: query.
- Notification APIs: list and mark as read.
- Subscription APIs: current plan, create order, verify payment.

## 10. Security and Reliability Practices

- JWT verification for protected APIs.
- Role checks for restricted operations.
- Helmet and CORS middleware.
- Centralized error and not-found handlers.
- Input validation and controlled response messages in controllers.
- Payment signature verification before plan activation.

## 11. End-to-End User Journeys (Demo Flow)

### Customer Flow

1. Register or login.
2. Search for a product from Home.
3. Compare shops and select best price.
4. Open route map to selected shop.
5. Add product to watchlist.
6. Check trend chart and notifications.

### Shopkeeper Flow

1. Login as shopkeeper.
2. Open Dashboard.
3. Create shop and verify location.
4. Add products and create/update price listings.
5. Upgrade subscription plan if limits are reached.

## 12. How To Explain This Project in an Interview or Presentation

Use this simple speaking structure:

1. What it is:
   A MERN platform that compares local product prices and helps both customers and shopkeepers.

2. Why it matters:
   It reduces effort in finding best prices and digitizes local shop pricing.

3. How it works:
   React frontend -> Express API layer -> MongoDB data layer, with JWT auth, Socket.IO updates, maps, and payment integration.

4. Key engineering points:
   Role-based access, geolocation search, price analytics, chatbot-assisted discovery, and Razorpay subscription flow.

5. Business value:
   Better customer decisions and a monetizable model for shopkeeper features.

## 13. Future Enhancements

- Recommendation engine based on user behavior and historical trends.
- Advanced chatbot with semantic understanding and multilingual support.
- Admin analytics dashboard for platform-wide insights.
- Better notification rules (threshold alerts, frequency control).
- Caching and pagination optimizations for large-scale data.

## 14. Conclusion

Retail Price Comparison Bot is a complete full-stack product that demonstrates practical MERN architecture, real-world integrations, and role-based workflows. It is suitable to present as both a technical portfolio project and a business-oriented product prototype.


YASH SAINI 💀
