# Conduit AI — Web Platform

> AI-powered voice agent SaaS platform that answers missed calls and captures leads for service businesses.

**Live:** [conduitai.io](https://conduitai.io) · **Portal:** [app.conduitai.io](https://app.conduitai.io)

## Overview

Conduit AI is a multi-tenant SaaS platform that provides AI voice agents to service-based businesses (salons, barbershops, HVAC, plumbing, roofing, contractors). When a business misses a call, Conduit's AI agent answers, has a natural conversation with the caller, captures lead information, and books appointments — all automatically.

This repository contains the main website and customer portal, built with Next.js and deployed on Vercel.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, JavaScript
- **Backend API:** Python, FastAPI (deployed on Railway)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Stripe (subscriptions, billing portal, webhooks, coupons)
- **Voice AI:** Vapi.ai (conversational AI agents)
- **Telephony:** Twilio (phone numbers, call routing, SMS)
- **Deployment:** Vercel
- **Integrations:** Zapier (Google Calendar sync), Google Ads

## Portal Features

- **Dashboard** — Real-time analytics, call volume, lead conversion metrics
- **Lead Management** — View, filter, and manage captured leads with full call details
- **AI Agent Configuration** — Customize voice agent behavior per client
- **Affiliate System** — Referral tracking, commission management, unique referral codes
- **Billing** — Stripe-powered subscription management with free trials and coupon support
- **Onboarding** — 6-step guided walkthrough for new users

## Architecture

 User → conduitai.io (Next.js on Vercel)
↓
app.conduitai.io (Portal)
↓
FastAPI Backend (Railway)
↓
Supabase (Auth/DB) + Stripe (Payments) + Vapi.ai (Voice) + Twilio (Telephony) + Zapier (Calendar)
## Author

**Luis Garcia** — Solo founder & full-stack developer
[conduitai.io](https://conduitai.io) · [luis@conduitai.io](mailto:luis@conduitai.io)

*Built from scratch by a solo developer with no CS degree. Shipped and serving real customers.*
