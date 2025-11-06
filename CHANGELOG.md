# Changelog

כל השינויים המשמעותיים בפרויקט מערכת ניהול אמבולנסים יתועדו בקובץ זה.

הפורמט מבוסס על [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
והפרויקט עוקב אחר [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- תכונות חדשות שעדיין לא שוחררו

### Changed
- שינויים בתכונות קיימות

### Deprecated
- תכונות שיוסרו בגרסאות עתידיות

### Removed
- תכונות שהוסרו בגרסה זו

### Fixed
- תיקוני באגים

### Security
- שיפורי אבטחה

## [1.0.0] - 2024-01-15

### Added
- **מערכת ניהול משתמשים מתקדמת**
  - היררכיה גמישה: Super Admin → Sub Admin → Admin → Driver → Client
  - הרשאות מותאמות אישית לכל משתמש
  - ניהול תפקידים והרשאות
  - אימות מאובטח עם JWT ו-refresh tokens

- **מערכת ניהול נסיעות מלאה**
  - מחזור חיים מלא: Pending → Assigned → Accepted → On the way → Completed/Canceled
  - שדה משימה להזנת פרטי החולה
  - הצפנת נתונים רגישים
  - הקצאת נהגים אוטומטית וידנית
  - מעקב סטטוס בזמן אמת

- **דשבורדים ותצוגות**
  - דשבורד מותאם לכל תפקיד
  - לוח שנה עם תצוגות יומיות, שבועיות וחודשיות
  - פילטרים מתקדמים לפי תאריך, נהג, לקוח וסטטוס
  - סטטיסטיקות מפורטות

- **PWA מלא עם תמיכה במובייל**
  - התקנה כאפליקציה מקומית
  - תמיכה במצב offline
  - התראות push בזמן אמת
  - ממשק מותאם למובייל עם bottom navigation
  - Service Worker מתקדם עם caching

- **אינטגרציה עם Google Sheets**
  - ייצוא אוטומטי של נסיעות שהושלמו
  - יצירת גיליונות חודשיים אוטומטית
  - מיפוי שדות לעברית (תאריך, משימה, מחיר, סה"כ)
  - היסטוריית ייצוא מפורטת
  - הגדרות Google Sheets מתקדמות

- **מערכת התראות מתקדמת**
  - התראות בזמן אמת עם WebSocket ו-Firebase
  - התראות לפי סוג: הקצאה, אישור, דחייה, השלמה, ביטול
  - התראות מותאמות לכל תפקיד
  - ממשק התראות אינטואיטיבי

- **אבטחה מתקדמת**
  - הצפנת פרטי חולים רגישים
  - Rate limiting והגנה מפני התקפות
  - Audit logs מפורטים
  - בקרת גישה ברמת API
  - הגנה מפני brute force

- **מערכת בדיקות מקיפה**
  - Unit tests ל-Backend services
  - Integration tests ל-API endpoints
  - בדיקות Google Sheets עם mocking
  - בדיקות Frontend components
  - בדיקות API utilities ו-PWA utilities
  - Jest configuration מלא עם coverage reporting

- **מערכת פריסה מתקדמת**
  - Docker containers לכל השירותים
  - Docker Compose לפריסה מלאה
  - Nginx reverse proxy עם SSL
  - סקריפטי פריסה אוטומטיים
  - מערכת גיבוי אוטומטית
  - בדיקות בריאות המערכת
  - תמיכה ב-SSL/TLS
  - Redis לקאשינג

- **תמיכה מלאה בעברית**
  - ממשק משתמש בעברית
  - תמיכה ב-RTL
  - שמות עמודות בעברית ב-Google Sheets
  - הודעות שגיאה בעברית

### Technical Details

#### Backend
- Node.js + TypeScript + Express
- Prisma ORM + PostgreSQL
- JWT authentication עם refresh tokens
- Socket.IO להתראות בזמן אמת
- Google Sheets API integration
- Redis לקאשינג
- Comprehensive error handling
- Rate limiting ו-security middleware

#### Frontend
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand לניהול state
- React Query לניהול API
- PWA עם Service Worker
- Mobile-first responsive design
- Hebrew RTL support

#### DevOps
- Docker + Docker Compose
- Nginx reverse proxy
- SSL/TLS encryption
- Automated backups
- Health monitoring
- Production-ready deployment

### Documentation
- README מפורט עם הוראות התקנה
- OpenAPI specification מלא
- Postman collection
- Mermaid diagrams
- CONTRIBUTING guide
- DEPLOYMENT guide

## [0.9.0] - 2024-01-10

### Added
- גרסת Beta ראשונה
- מערכת אימות בסיסית
- ניהול נסיעות בסיסי
- ממשק משתמש בסיסי

### Fixed
- תיקוני באגים ראשוניים
- שיפורי ביצועים

## [0.8.0] - 2024-01-05

### Added
- פיתוח ראשוני
- הגדרת פרויקט
- תכנון ארכיטקטורה

---

## סוגי שינויים

- **Added** - תכונות חדשות
- **Changed** - שינויים בתכונות קיימות
- **Deprecated** - תכונות שיוסרו בגרסאות עתידיות
- **Removed** - תכונות שהוסרו בגרסה זו
- **Fixed** - תיקוני באגים
- **Security** - שיפורי אבטחה

## קישורים

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [GitHub Releases](https://github.com/your-repo/releases)
