# StepSync — Production Deployment Checklist

## PRE-DEPLOY
- [x] TypeScript passes (
px tsc --noEmit)
- [x] Prisma validates (
px prisma validate)
- [x] Prisma generates (
px prisma generate)
- [x] Production build passes (
pm run build)
- [x] Environment variables configured in hosting platform
- [x] Secrets not in source code
- [x] .env and .env.local in .gitignore
- [x] Migrations verified (single baseline)
- [x] Static assets verified
- [x] No debug logs in production code
- [x] No localhost references in production code

## DATABASE
- [x] Migration workflow: 
px prisma migrate deploy
- [ ] Backups configured (Neon auto-backup or manual)
- [ ] Production DATABASE_URL with ?sslmode=require
- [ ] Separate production database from development

## DEPLOYMENT
- [ ] Vercel project configured
- [ ] Environment variables set in Vercel dashboard:
  - DATABASE_URL
  - NEXTAUTH_URL (production domain)
  - NEXTAUTH_SECRET (32+ chars, generated with openssl rand -base64 32)
  - OPENAI_API_KEY
- [ ] Custom domain configured
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Post-deploy: run 
px prisma migrate deploy (via Vercel build command or manual)

## POST-DEPLOY
- [ ] Login works
- [ ] Registration works
- [ ] Password reset flow works (requires email provider)
- [ ] Dashboard loads
- [ ] Study plan creation works
- [ ] Task completion works
- [ ] AI recommendations work
- [ ] Partner discovery works
- [ ] Messaging works
- [ ] Groups work
- [ ] Notifications work
- [ ] Admin panel works (admin role only)
- [ ] /api/health returns { "status": "ok" }
- [ ] obots.txt blocks private routes
- [ ] RTL and Arabic display correct

## EMAIL (Deferred)
- [ ] Email provider configured (Resend / SendGrid)
- [ ] Email verification flow tested
- [ ] Password reset email tested
- [ ] EMAIL_FROM configured
