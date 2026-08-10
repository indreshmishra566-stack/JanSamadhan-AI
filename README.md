# 🇮🇳 Jan Samadhan AI
### AI-Powered Citizen Grievance Management Platform

> A production-ready intelligent grievance classification system that democratizes citizen complaint resolution across Indian government agencies. Built with modern AI/ML, it processes complaints in 24 Indian languages, automatically routes them to correct departments, and enforces SLA compliance with real-time tracking.

---

## 🎯 The Problem We Solve

**Impact:** India processes millions of citizen complaints annually across fragmented government systems. Without intelligent routing, complaints get lost, misclassified, or delayed.

**Our Solution:** Automated AI-driven complaint classification that:
- ⚡ Processes complaints in **24 Indian languages** (including RTL scripts like Urdu)
- 🎯 Achieves **intelligent routing** using LLM-based semantic understanding
- 📊 Enforces **SLA compliance** with real-time tracking and escalation
- 💰 Uses **free Groq LLaMA3** API (cost-effective at scale)
- 👥 Empowers citizens with complaint tracking and status updates

---

## 🚀 Key Features

### AI & NLP
- **Free LLM Integration**: Groq LLaMA3 for complaint classification and understanding
- **Multi-Language Support**: All 24 official Indian languages + English
- **Smart Routing**: Semantic understanding of complaints to route to correct departments
- **Complaint Categorization**: Automatic classification for faster resolution

### System Architecture
- **Real-time Updates**: WebSocket support for live complaint status
- **SLA Enforcement**: Automated escalation and deadline tracking
- **Department Hierarchy**: Multi-level organizational structure with permission management
- **Officer Ratings**: Feedback system for continuous improvement
- **Citizen Registration**: Secure authentication with OTP-based login
- **Dashboard Analytics**: Role-based views for Citizens, Officers, and Admins

### Tech Stack
- **Backend**: Django + Django REST Framework + Celery (async tasks)
- **Frontend**: React + Vite + Tailwind CSS (modern, performant UI)
- **Database**: PostgreSQL (production-grade)
- **Containerization**: Docker & Docker Compose
- **Deployment**: Render.yaml ready for cloud deployment
- **Real-time**: Django Channels for WebSocket communication

---

## 💻 Tech Highlights for Engineers

### Why This Project is Interesting
- **Real-world Impact**: Powers citizen grievance system in government context
- **AI Integration**: Practical implementation of LLMs at scale
- **Full-Stack**: Well-architected frontend-backend separation
- **Scalability**: Celery for async processing, designed for high-volume grievances
- **Multilingual**: Complex i18n implementation across Indic scripts
- **Security**: Role-based access control, OTP authentication, permission layers

### Architecture Decisions
- **Async Processing**: Celery for complaint classification jobs (scales with demand)
- **Django Channels**: Real-time WebSocket updates without external services
- **React Hooks**: Modern frontend patterns with custom hooks (useAuth, useLanguage)
- **Clean Separation**: API-driven backend, completely decoupled frontend
- **Docker-first**: Production-ready containerization for easy deployment

---

## 📦 Quick Start for Developers

### Prerequisites
- Docker & Docker Compose
- Node.js 16+ (for frontend development)
- Python 3.9+ (for backend development)

### One-Command Setup
```bash
docker-compose up -d
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Demo Data
```bash
python manage.py seed.py          # Populate demo data
python manage.py seed_admin_setup.py # Setup initial admin
```

---

## 👥 User Roles & Workflows

| Role | Capabilities | Use Cases |
|------|-------------|-----------|
| **Citizen** | File complaints, track status, rate officers | Public portal access, status updates |
| **Grievance Officer** | View assigned complaints, update status, write responses | Handle & resolve complaints |
| **Department Head** | Monitor department performance, view analytics | Oversight, SLA tracking |
| **Admin** | System management, user roles, configuration | Platform administration |

---

## 🌍 Multilingual Support

Seamlessly serves users in their native language:
- **Devanagari Scripts**: Hindi, Marathi, Nepali, Sanskrit, Konkani, Dogri, Bodo, Maithili
- **Regional Scripts**: Bengali, Odia, Gujarati, Punjabi, Tamil, Telugu, Kannada, Malayalam, Assamese, Manipuri, Santali
- **RTL Scripts**: Urdu, Sindhi, Kashmiri
- **English**: Complete English interface

Real-time language switching with automatic RTL support where needed.

---

## 🔒 Security & Governance

- **OTP-based Login**: Secure citizen authentication
- **Role-Based Access Control**: Fine-grained permission system
- **Department Hierarchy**: Multi-level organizational structure
- **Audit Trail**: Track complaint lifecycle and user actions
- **Data Privacy**: Secure storage and transmission

---

## 📊 Core Models

- **Complaint**: Core grievance with status tracking, SLA deadlines, routing history
- **User**: Citizens and officers with role-based permissions and designations
- **Department**: Hierarchical department structure with jurisdiction mapping
- **ComplaintOfficerRating**: Feedback system for accountability
- **LoginOTP**: Secure authentication mechanism

---

## 🛠️ Project Commands

```bash
# Clear demo data (keep admin)
python manage.py clear_demo_data

# Clear everything except admin
python manage.py clear_all_except_admin

# Seed initial data
python manage.py seed

# Admin setup
python manage.py seed_admin_setup
```

---

## 🚢 Deployment

Pre-configured for cloud deployment:
- **Render.yaml**: Deploy frontend and backend to Render with one click
- **Docker Compose**: Local development or on-premise deployment
- **Environment Variables**: Configurable for different environments
- **Scalable**: Designed to handle high-volume complaint processing

---

## 📈 What's Next

- 📱 Mobile app for officers
- 🤖 Advanced ML-based complaint routing
- 📊 Predictive analytics for bottleneck identification
- 🔔 SMS/WhatsApp notifications
- 🌐 API for third-party integration

---

## 🤝 Contributing

This is a high-impact project that bridges citizens and government. Contributions in AI/ML optimization, multilingual support, and scalability are welcome!

---

## 📝 License

Open source project for public good.

---

**Built with ❤️ to empower citizens and streamline government service delivery.**

