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
- 🔒 **Verify Admin Statistics access control** (Feature F11)
  - Log in as tmierzejowski@gmail.com → confirm `/admin/statistics` renders dashboard
  - Attempt access with secondary admin/moderator account → expect redirect to `/?message=Access%20Denied`
  - Call `GET /api/admin/statistics/summary` with non-owner JWT → expect HTTP 403
- 📧 Email delivery smoke test (registration + verification)

## 2. Launch Day Checklist
1. Redeploy latest `main` via GitHub Actions approval gate
2. Run `docker-compose ... up -d` health verification script
3. Trigger `/api/health` and `/api/admin/statistics/summary` smoke tests
4. Announce soft-launch to beta cohort (Discord/Telegram group)
5. Monitor `logs/visitor-metrics/*` and GA4 realtime for first 24h

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
- `ANALYTICS_GUIDE.md` (Server-Side Visitor Metrics)
- `User_Actions_After_Vibe_Coding_On_MVP.md` Action #28
