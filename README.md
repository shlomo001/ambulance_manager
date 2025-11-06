# 🚑 מערכת ניהול אמבולנסים - Ambulance Manager

מערכת ניהול מתקדמת לחברת אמבולנסים פרטית עם תמיכה מלאה בעברית, אינטגרציה עם Google Sheets, והתראות בזמן אמת.

## 📋 תוכן עניינים

- [תכונות עיקריות](#תכונות-עיקריות)
- [טכנולוגיות](#טכנולוגיות)
- [התקנה מהירה](#התקנה-מהירה)
- [התקנה מפורטת](#התקנה-מפורטת)
- [שימוש במערכת](#שימוש-במערכת)
- [API Documentation](#api-documentation)
- [בדיקות](#בדיקות)
- [פריסה](#פריסה)
- [תמיכה](#תמיכה)
- [רישיון](#רישיון)

## ✨ תכונות עיקריות

### 👥 ניהול משתמשים מתקדם
- **היררכיה גמישה**: Super Admin → Sub Admin → Admin → Driver → Client
- **הרשאות מותאמות אישית**: Super Admin יכול להגדיר הרשאות ספציפיות לכל משתמש
- **ניהול תפקידים**: יצירה, עריכה ומחיקה של תפקידים והרשאות
- **אימות מאובטח**: JWT עם refresh tokens ו-bcrypt

### 🚗 ניהול נסיעות
- **מחזור חיים מלא**: Pending → Assigned → Accepted → On the way → Completed/Canceled
- **שדה משימה**: הזנת פרטי החולה, מיקום, מספר זהות ושם
- **הצפנת נתונים רגישים**: פרטי חולים מוצפנים במסד הנתונים
- **הקצאת נהגים**: הקצאה אוטומטית או ידנית
- **מעקב סטטוס**: עדכון סטטוס בזמן אמת

### 📊 דשבורדים ותצוגות
- **דשבורד לפי תפקיד**: מותאם לכל סוג משתמש
- **לוח שנה**: תצוגה יומית, שבועית וחודשית
- **פילטרים מתקדמים**: לפי תאריך, נהג, לקוח, סטטוס
- **סטטיסטיקות**: נסיעות, הכנסות, ביצועים

### 📱 PWA - Progressive Web App
- **התקנה על מובייל**: התקנה כאפליקציה מקומית
- **עבודה לא מקוונת**: תמיכה במצב offline
- **התראות push**: התראות בזמן אמת
- **ממשק מותאם למובייל**: ניווט bottom navigation

### 📈 אינטגרציה עם Google Sheets
- **ייצוא אוטומטי**: נסיעות שהושלמו מיוצאות אוטומטית
- **גיליונות חודשיים**: יצירה אוטומטית של גיליונות חדשים
- **מיפוי שדות**: מיפוי אוטומטי לעברית (תאריך, משימה, מחיר, סה"כ)
- **היסטוריית ייצוא**: מעקב אחר כל הייצואים

### 🔔 מערכת התראות
- **התראות בזמן אמת**: WebSocket ו-Firebase Cloud Messaging
- **התראות לפי סוג**: הקצאה, אישור, דחייה, השלמה, ביטול
- **התראות לפי תפקיד**: התראות מותאמות לכל תפקיד
- **ממשק התראות**: צפייה, סימון כנקרא, מחיקה

### 🔒 אבטחה מתקדמת
- **הצפנת נתונים**: פרטי חולים רגישים מוצפנים
- **Rate Limiting**: הגנה מפני התקפות
- **Audit Logs**: מעקב אחר כל הפעולות
- **הרשאות מדויקות**: בקרת גישה ברמת API

## 🛠 טכנולוגיות

### Backend
- **Node.js** + **TypeScript** + **Express**
- **Prisma ORM** + **PostgreSQL**
- **JWT** + **bcrypt** לאימות
- **Socket.IO** להתראות בזמן אמת
- **Google Sheets API** לאינטגרציה
- **Redis** לקאשינג

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** לניהול state
- **React Query** לניהול API
- **PWA** עם Service Worker

### DevOps
- **Docker** + **Docker Compose**
- **Nginx** reverse proxy
- **SSL/TLS** encryption
- **Automated backups**
- **Health monitoring**

## 🚀 התקנה מהירה

### דרישות מערכת
- Docker & Docker Compose
- Git
- 4GB RAM (מומלץ 8GB+)
- 20GB שטח פנוי

### התקנה ב-5 דקות
```bash
# 1. שכפול הפרויקט
git clone <repository-url>
cd ambulance_manager

# 2. הגדרת משתני סביבה
cp env.production.example .env.production
# ערוך את .env.production עם הנתונים שלך

# 3. הפעלת הפריסה
chmod +x scripts/*.sh
./scripts/deploy.sh

# 4. בדיקת המערכת
./scripts/health-check.sh
```

**המערכת תהיה זמינה ב: http://localhost**

## 📖 התקנה מפורטת

### 1. הכנת הסביבה

#### התקנת Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

#### התקנת Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. הגדרת משתני סביבה

צור קובץ `.env.production`:
```bash
# Database
POSTGRES_DB=ambulance_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_32_chars_minimum
JWT_REFRESH_SECRET=your_super_secret_refresh_key_32_chars_minimum

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}

# Redis
REDIS_PASSWORD=your_redis_password
```

### 3. הגדרת Google Sheets

1. **יצירת Google Cloud Project**
   - לך ל-[Google Cloud Console](https://console.cloud.google.com/)
   - צור פרויקט חדש

2. **הפעלת Google Sheets API**
   - נווט ל-"APIs & Services" > "Library"
   - חפש "Google Sheets API" והפעל

3. **יצירת Service Account**
   - לך ל-"APIs & Services" > "Credentials"
   - לחץ "Create Credentials" > "Service Account"
   - הורד את קובץ ה-JSON

4. **הגדרת Spreadsheet**
   - צור Google Spreadsheet חדש
   - שתף אותו עם כתובת ה-Service Account
   - העתק את ה-Spreadsheet ID מה-URL

### 4. הפעלת המערכת

```bash
# פריסה מלאה
./scripts/deploy.sh

# או ידנית
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5. הגדרת נתונים ראשוניים

```bash
# הרצת migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# הזנת נתונים ראשוניים
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

## 💻 שימוש במערכת

### התחברות ראשונה
1. פתח את המערכת ב-http://localhost
2. התחבר עם המשתמש הראשוני שנוצר ב-seed
3. צור משתמשים נוספים לפי הצורך

### יצירת משתמשים
1. **Super Admin**: יכול ליצור כל סוג משתמש
2. **Sub Admin**: יכול ליצור Admins ו-Drivers
3. **Admin**: יכול ליצור Drivers ו-Clients

### ניהול נסיעות
1. **יצירת נסיעה**: הזן פרטי החולה, מיקום, תאריך ושעה
2. **הקצאת נהג**: הקצה נהג לנסיעה
3. **מעקב סטטוס**: עקוב אחר התקדמות הנסיעה
4. **השלמה**: סמן נסיעה כהושלמה

### ייצוא ל-Google Sheets
1. **הגדרות**: הגדר Spreadsheet ID ו-Service Account
2. **ייצוא ידני**: לחץ על "ייצא נסיעות"
3. **ייצוא אוטומטי**: הפעל Auto-Sync לנסיעות שהושלמו

## 📚 API Documentation

### Authentication
```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password",
  "firstName": "שם",
  "lastName": "משפחה",
  "role": "DRIVER"
}
```

### Rides Management
```bash
# Get all rides
GET /api/rides?page=1&limit=10&status=COMPLETED

# Create ride
POST /api/rides
{
  "task": "נסיעה דחופה",
  "pickupAddress": "תל אביב, רחוב הרצל 1",
  "dropoffAddress": "ירושלים, רחוב יפו 10",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "10:00",
  "estimatedFare": 150
}

# Update ride status
PUT /api/rides/:id/status
{
  "status": "COMPLETED"
}
```

### Google Sheets Integration
```bash
# Export rides
POST /api/sheets/export
{
  "rideIds": ["ride1", "ride2"],
  "dateFrom": "2024-01-01",
  "dateTo": "2024-01-31"
}

# Get settings
GET /api/sheets/settings

# Update settings
PUT /api/sheets/settings
{
  "spreadsheetId": "new_spreadsheet_id",
  "autoSyncEnabled": true
}
```

## 🧪 בדיקות

### הרצת בדיקות
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# All tests with coverage
npm run test:coverage
```

### סוגי בדיקות
- **Unit Tests**: בדיקת פונקציות בודדות
- **Integration Tests**: בדיקת אינטגרציה בין רכיבים
- **Component Tests**: בדיקת קומפוננטי React
- **API Tests**: בדיקת endpoints

## 🚀 פריסה

### פריסה אוטומטית
```bash
# פריסה מלאה
./scripts/deploy.sh

# בדיקת בריאות
./scripts/health-check.sh

# גיבוי
./scripts/backup.sh create
```

### פריסה ידנית
```bash
# בניית images
docker-compose -f docker-compose.prod.yml build

# הפעלת שירותים
docker-compose -f docker-compose.prod.yml up -d

# הרצת migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### SSL/HTTPS
```bash
# יצירת certificates עם Let's Encrypt
sudo certbot certonly --standalone -d your-domain.com

# העתקת certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
```

## 📊 ניטור ותחזוקה

### בדיקת בריאות המערכת
```bash
# בדיקה מלאה
./scripts/health-check.sh

# בדיקת רכיבים ספציפיים
./scripts/health-check.sh containers
./scripts/health-check.sh database
./scripts/health-check.sh performance
```

### גיבויים
```bash
# יצירת גיבוי
./scripts/backup.sh create

# רשימת גיבויים
./scripts/backup.sh list

# שחזור מגיבוי
./scripts/backup.sh restore /backup/backup_file.sql.gz
```

### לוגים
```bash
# צפייה בלוגים
docker-compose -f docker-compose.prod.yml logs -f

# לוגים של שירות ספציפי
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔧 פתרון בעיות

### בעיות נפוצות

#### 1. מסד נתונים לא מתחבר
```bash
# בדיקת סטטוס
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# הפעלה מחדש
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 2. Backend לא מגיב
```bash
# בדיקת לוגים
docker-compose -f docker-compose.prod.yml logs backend

# בדיקת בריאות
curl -f http://localhost:3001/api/health
```

#### 3. Google Sheets לא עובד
```bash
# בדיקת הגדרות
docker-compose -f docker-compose.prod.yml exec backend node -e "
const { GoogleSheetsService } = require('./dist/services/googleSheetsService');
new GoogleSheetsService().testConnection().then(console.log);
"
```

## 📞 תמיכה

### דרכי תמיכה
1. **תיעוד**: קרא את ה-DEPLOYMENT.md
2. **לוגים**: בדוק את הלוגים של המערכת
3. **בריאות**: הרץ health-check
4. **GitHub Issues**: פתח issue בפרויקט

### מידע נדרש לתמיכה
- גרסת המערכת
- לוגים רלוונטיים
- תיאור הבעיה
- צעדים לשחזור

## 📄 רישיון

פרויקט זה מוגן תחת רישיון MIT. ראה קובץ [LICENSE](LICENSE) לפרטים.

## 🤝 תרומה לפרויקט

אנו מעודדים תרומות לפרויקט! אנא קרא את [CONTRIBUTING.md](CONTRIBUTING.md) לפני התחלה.

### דרכי תרומה
- דיווח על באגים
- הצעת תכונות חדשות
- שיפור תיעוד
- כתיבת קוד

---

**מערכת ניהול אמבולנסים** - פתרון מתקדם לניהול חברת אמבולנסים פרטית 🚑