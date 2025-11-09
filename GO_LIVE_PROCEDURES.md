# Antystyki Go-Live Procedures

**Version**: 1.1  
**Updated**: November 8, 2025  
**Owner**: Product & Operations  

---

## 1. Pre-Launch Validation
- ✅ Security hardening complete (GL-S01–GL-S08)
- ✅ CI/CD pipeline green (build, test, deploy workflows)
- ✅ Legal documentation published (`/privacy`, `/terms`)
- ✅ Cookieless visitor metrics operational (VISITOR_METRICS_HASH_SECRET set)
- ✅ Centralized logging & alerting live (GL-LOG-01 → GL-LOG-03 aligned with Launch Guide §5)
  - `ssh -L 3001:localhost:3001 antystics@prod` → login with `GRAFANA_ADMIN_USER`
  - Dashboard `Logging / Antystyki Logging Overview` renders data (error rate, failed login, frontend JS panels)
  - Alert `Backend error rate > 5/min` shows `Active` and receiver `default-email → tmierzejowski@gmail.com`
- 🔒 **Verify Admin Statistics access control** (Feature F11)
  - Log in as tmierzejowski@gmail.com → confirm `/admin/statistics` renders dashboard
  - Attempt access with secondary admin/moderator account → expect redirect to `/?message=Access%20Denied`
  - Call `GET /api/admin/statistics/summary` with non-owner JWT → expect HTTP 403
- 📧 Email delivery smoke test (registration + verification)
- [ ] Configure Gmail App Password or SendGrid
- [ ] Test email verification in production
- [ ] Provision Kamatera server (2GB RAM, 20GB storage)
- [ ] Verify Google OAuth secrets (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are populated in GitHub Secrets and production `.env`
- [ ] Configure GitHub Actions CI/CD pipeline (automated deployment with approval gates)

## 2. Launch Day Checklist
1. Redeploy latest `main` via GitHub Actions approval gate
2. Run `docker-compose ... up -d` health verification script
3. Trigger `/api/health` and `/api/admin/statistics/summary` smoke tests
4. Confirm Grafana alert preview (Alerting → Backend error rate > 5/min → “Test rule”)
5. Announce soft-launch to beta cohort (Discord/Telegram group)
6. Monitor `logs/visitor-metrics/*`, GA4 realtime, and Grafana dashboard for first 24h

## 3. Post-Launch Monitoring (Day 0–3)
- Review Website Statistics dashboard twice daily (09:00 / 21:00 CET)
- Export daily summary JSON for archival (S3 / secure storage)
- Track anomalies >20% between human vs. bot traffic; flag in Ops channel
- Rebuild cache manually with `curl -H "Authorization: Bearer <token>" https://antystyki.pl/api/admin/statistics/summary`

## 4. Escalation & Support
- Severity 1 (dashboard inaccessible, 500 errors): page DevOps immediately
- Severity 2 (data stale >24h): clear cache + redeploy, investigate ETL
- Severity 3 (UI discrepancies): file ticket in Linear under “Analytics” epic

---

**References**
- `ANTYSTYKI_PRD.md` §3.1 (Feature F11)
- `ANTYSTYKI_LAUNCH_GUIDE.md` §7 (Implement Monitoring)
- `PRODUCTION_SETUP.md` Step 9 (Loki + Grafana verification)
- `monitoring/grafana/provisioning/*` (dashboard & alert-as-code)
- `ANALYTICS_GUIDE.md` (Server-Side Visitor Metrics)
- `User_Actions_After_Vibe_Coding_On_MVP.md` Action #28
