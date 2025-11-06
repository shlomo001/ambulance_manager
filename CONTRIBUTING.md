# 🤝 מדריך תרומה לפרויקט - Contributing Guide

תודה על העניין שלך לתרום לפרויקט מערכת ניהול אמבולנסים! מדריך זה יעזור לך להבין איך לתרום בצורה הטובה ביותר.

## 📋 תוכן עניינים

- [איך לתרום](#איך-לתרום)
- [הגדרת סביבת פיתוח](#הגדרת-סביבת-פיתוח)
- [תהליך פיתוח](#תהליך-פיתוח)
- [כתיבת קוד](#כתיבת-קוד)
- [בדיקות](#בדיקות)
- [תיעוד](#תיעוד)
- [דיווח על באגים](#דיווח-על-באגים)
- [הצעת תכונות](#הצעת-תכונות)
- [שאלות נפוצות](#שאלות-נפוצות)

## 🚀 איך לתרום

### דרכי תרומה

1. **דיווח על באגים** - מצא באג? דווח עליו!
2. **הצעת תכונות** - יש לך רעיון לתכונה חדשה? שתף אותנו!
3. **שיפור תיעוד** - עזור לנו לשפר את התיעוד
4. **כתיבת קוד** - תרום קוד חדש או תיקונים
5. **בדיקות** - עזור לנו לבדוק את המערכת
6. **תרגום** - עזור לנו לתרגם למספר שפות

### לפני שתתחיל

- קרא את ה-[README](README.md) בעיון
- בדוק את ה-[Issues](https://github.com/your-repo/issues) הקיימים
- ודא שיש לך סביבת פיתוח מוכנה

## 🛠 הגדרת סביבת פיתוח

### דרישות מערכת

- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **Git**
- **VS Code** (מומלץ) או עורך קוד אחר

### התקנה מהירה

```bash
# 1. שכפול הפרויקט
git clone https://github.com/your-repo/ambulance-manager.git
cd ambulance-manager

# 2. התקנת dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. הגדרת משתני סביבה
cp env.production.example .env.development

# 4. הפעלת מסד נתונים
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 5. הרצת migrations
cd backend && npx prisma migrate dev

# 6. הזנת נתונים ראשוניים
npm run db:seed

# 7. הפעלת שרתי פיתוח
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### בדיקת ההתקנה

```bash
# בדיקת Backend
curl http://localhost:3001/api/health

# בדיקת Frontend
open http://localhost:5173

# בדיקת מסד נתונים
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d ambulance_manager
```

## 🔄 תהליך פיתוח

### 1. יצירת Branch

```bash
# עדכון main branch
git checkout main
git pull origin main

# יצירת branch חדש
git checkout -b feature/your-feature-name
# או
git checkout -b bugfix/issue-number
# או  
git checkout -b docs/improvement-description
```

### 2. פיתוח

- עבד על התכונה/תיקון
- כתב בדיקות
- עדכן תיעוד אם נדרש
- ודא שהקוד עובר את כל הבדיקות

### 3. Commit

```bash
# הוספת קבצים
git add .

# Commit עם הודעה ברורה
git commit -m "feat: add user notification preferences

- Add notification settings to user profile
- Implement email/SMS notification toggles
- Add tests for notification preferences
- Update API documentation

Closes #123"
```

### 4. Push ו-Pull Request

```bash
# Push ל-remote
git push origin feature/your-feature-name

# יצירת Pull Request ב-GitHub
```

## 📝 כתיבת קוד

### כללי כתיבה

#### Backend (Node.js/TypeScript)

```typescript
// ✅ טוב - פונקציה ברורה עם תיעוד
/**
 * Creates a new ride in the system
 * @param rideData - The ride data to create
 * @param userId - The ID of the user creating the ride
 * @returns Promise<Ride> - The created ride
 */
export async function createRide(
  rideData: CreateRideRequest,
  userId: string
): Promise<Ride> {
  try {
    // Validate input
    const validatedData = await validateRideData(rideData);
    
    // Create ride
    const ride = await prisma.ride.create({
      data: {
        ...validatedData,
        createdBy: userId,
        status: 'PENDING'
      },
      include: {
        driver: true,
        client: true
      }
    });

    // Send notification
    await notificationService.sendRideCreatedNotification(ride);
    
    return ride;
  } catch (error) {
    logger.error('Failed to create ride', { error, rideData, userId });
    throw new Error('Failed to create ride');
  }
}

// ❌ רע - פונקציה לא ברורה
export async function create(data: any, user: any) {
  return await prisma.ride.create({ data: { ...data, user } });
}
```

#### Frontend (React/TypeScript)

```typescript
// ✅ טוב - קומפוננטה ברורה עם TypeScript
interface RideCardProps {
  ride: Ride;
  onStatusChange: (rideId: string, status: RideStatus) => void;
  onEdit: (ride: Ride) => void;
  canEdit?: boolean;
}

export const RideCard: React.FC<RideCardProps> = ({
  ride,
  onStatusChange,
  onEdit,
  canEdit = false
}) => {
  const handleStatusChange = useCallback((newStatus: RideStatus) => {
    onStatusChange(ride.id, newStatus);
  }, [ride.id, onStatusChange]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {ride.task}
        </h3>
        <StatusBadge status={ride.status} />
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <p>📍 {ride.pickupAddress}</p>
        <p>🎯 {ride.dropoffAddress}</p>
        <p>📅 {formatDate(ride.scheduledDate)} {ride.scheduledTime}</p>
      </div>
      
      {canEdit && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => onEdit(ride)}>
            עריכה
          </Button>
          <StatusSelect 
            currentStatus={ride.status}
            onChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  );
};

// ❌ רע - קומפוננטה לא ברורה
export const RideCard = ({ ride, onStatusChange, onEdit }) => {
  return (
    <div>
      <h3>{ride.task}</h3>
      <button onClick={() => onEdit(ride)}>עריכה</button>
    </div>
  );
};
```

### כללי עיצוב

#### CSS/Tailwind

```css
/* ✅ טוב - שימוש ב-Tailwind classes */
.ride-card {
  @apply bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow;
}

.ride-card__header {
  @apply flex justify-between items-start mb-2;
}

.ride-card__title {
  @apply text-lg font-semibold text-gray-900;
}

/* ❌ רע - CSS מותאם אישית מיותר */
.ride-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
}
```

### כללי מסד נתונים

```sql
-- ✅ טוב - שאילתה ברורה עם indexes
SELECT 
  r.id,
  r.task,
  r.status,
  r.scheduled_date,
  u.first_name as driver_name
FROM rides r
LEFT JOIN users u ON r.driver_id = u.id
WHERE r.status = 'PENDING'
  AND r.scheduled_date >= CURRENT_DATE
ORDER BY r.scheduled_date ASC, r.scheduled_time ASC
LIMIT 10;

-- ❌ רע - שאילתה לא יעילה
SELECT * FROM rides WHERE status = 'PENDING';
```

## 🧪 בדיקות

### כתיבת בדיקות

#### Unit Tests

```typescript
// ✅ טוב - בדיקה מקיפה
describe('RideService', () => {
  describe('createRide', () => {
    it('should create a ride with valid data', async () => {
      // Arrange
      const rideData = {
        task: 'נסיעה דחופה',
        pickupAddress: 'תל אביב',
        dropoffAddress: 'ירושלים',
        scheduledDate: '2024-01-15',
        scheduledTime: '10:00'
      };
      const userId = 'user123';
      
      // Act
      const result = await rideService.createRide(rideData, userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.task).toBe(rideData.task);
      expect(result.status).toBe('PENDING');
      expect(result.createdBy).toBe(userId);
    });

    it('should throw error for invalid data', async () => {
      // Arrange
      const invalidData = {
        task: '',
        pickupAddress: '',
        dropoffAddress: '',
        scheduledDate: 'invalid-date'
      };
      
      // Act & Assert
      await expect(
        rideService.createRide(invalidData, 'user123')
      ).rejects.toThrow('Invalid ride data');
    });
  });
});
```

#### Integration Tests

```typescript
// ✅ טוב - בדיקת אינטגרציה
describe('Rides API', () => {
  describe('POST /api/rides', () => {
    it('should create a ride and return 201', async () => {
      // Arrange
      const rideData = {
        task: 'נסיעה דחופה',
        pickupAddress: 'תל אביב',
        dropoffAddress: 'ירושלים',
        scheduledDate: '2024-01-15',
        scheduledTime: '10:00'
      };
      
      // Act
      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rideData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task).toBe(rideData.task);
    });
  });
});
```

### הרצת בדיקות

```bash
# Backend tests
cd backend
npm test                    # כל הבדיקות
npm run test:watch         # בדיקות במצב watch
npm run test:coverage      # בדיקות עם coverage

# Frontend tests  
cd frontend
npm test                   # כל הבדיקות
npm run test:watch        # בדיקות במצב watch
npm run test:coverage     # בדיקות עם coverage

# E2E tests
npm run test:e2e          # בדיקות end-to-end
```

## 📚 תיעוד

### עדכון תיעוד

כשאתה מוסיף תכונה חדשה או משנה קוד קיים, ודא לעדכן:

1. **API Documentation** - `docs/openapi.yaml`
2. **README** - אם יש שינויים בהתקנה או שימוש
3. **Code Comments** - הסברים על קוד מורכב
4. **Type Definitions** - TypeScript interfaces ו-types

### דוגמה לעדכון תיעוד

```typescript
/**
 * Updates ride status and sends appropriate notifications
 * 
 * @param rideId - The ID of the ride to update
 * @param newStatus - The new status to set
 * @param userId - The ID of the user making the change
 * @returns Promise<Ride> - The updated ride
 * 
 * @throws {NotFoundError} When ride is not found
 * @throws {ValidationError} When status transition is invalid
 * @throws {PermissionError} When user lacks permission to update
 * 
 * @example
 * ```typescript
 * const updatedRide = await rideService.updateRideStatus(
 *   'ride123',
 *   'COMPLETED',
 *   'user456'
 * );
 * ```
 */
export async function updateRideStatus(
  rideId: string,
  newStatus: RideStatus,
  userId: string
): Promise<Ride> {
  // Implementation...
}
```

## 🐛 דיווח על באגים

### איך לדווח על באג

1. **חפש באגים קיימים** - ודא שהבאג לא דווח כבר
2. **צור Issue חדש** - השתמש בתבנית הבאג
3. **ספק מידע מפורט** - ככל שיש יותר מידע, כך קל יותר לתקן

### תבנית דיווח באג

```markdown
## 🐛 תיאור הבאג
תיאור קצר וברור של הבאג.

## 🔄 צעדים לשחזור
1. לך ל-'...'
2. לחץ על '...'
3. גלול למטה ל-'...'
4. ראה שגיאה

## ✅ התנהגות צפויה
תיאור של מה שהיית מצפה שיקרה.

## ❌ התנהגות בפועל
תיאור של מה שקורה בפועל.

## 📱 מידע נוסף
- **דפדפן**: Chrome 91.0
- **מערכת הפעלה**: Windows 10
- **גרסה**: 1.0.0
- **מסך**: Desktop/Mobile

## 📸 צילומי מסך
אם רלוונטי, הוסף צילומי מסך.

## 📋 מידע נוסף
כל מידע נוסף שיכול לעזור.
```

## 💡 הצעת תכונות

### איך להציע תכונה

1. **חפש תכונות קיימות** - ודא שהתכונה לא הוצעה כבר
2. **צור Issue חדש** - השתמש בתבנית התכונה
3. **ספק מידע מפורט** - הסבר למה התכונה נדרשת

### תבנית הצעת תכונה

```markdown
## 💡 תיאור התכונה
תיאור קצר וברור של התכונה.

## 🎯 הבעיה שזה פותר
תיאור של הבעיה או הצורך שהתכונה פותרת.

## 💭 הפתרון המוצע
תיאור מפורט של איך התכונה אמורה לעבוד.

## 🔄 חלופות שנחשבו
תיאור של חלופות אחרות שנחשבו.

## 📱 דוגמאות שימוש
דוגמאות של איך המשתמשים ישתמשו בתכונה.

## 🎨 עיצוב/UI
אם רלוונטי, הוסף wireframes או mockups.

## 🔧 מימוש טכני
אם יש לך רעיונות למימוש, שתף אותם.

## 📋 משימות
רשימת משימות למימוש התכונה:
- [ ] משימה 1
- [ ] משימה 2
- [ ] משימה 3
```

## ❓ שאלות נפוצות

### שאלות כלליות

**Q: איך אני מתחיל לתרום?**
A: התחל בקריאת ה-README והגדרת סביבת פיתוח. אחר כך חפש Issues עם התווית "good first issue".

**Q: איך אני בוחר מה לעבוד עליו?**
A: חפש Issues עם התוויות "help wanted" או "good first issue". אתה יכול גם להציע תכונות חדשות.

**Q: איך אני יודע אם הקוד שלי טוב?**
A: ודא שהקוד עובר את כל הבדיקות, עוקב אחר כללי הכתיבה, ומתועד היטב.

**Q: מה אם אני לא יודע איך לפתור משהו?**
A: שאל שאלות ב-Issues או ב-Discussions. הקהילה כאן לעזור!

### שאלות טכניות

**Q: איך אני מריץ את הבדיקות?**
A: ראה את הסעיף [בדיקות](#בדיקות) למעלה.

**Q: איך אני מתקן באג?**
A: צור branch חדש, תקן את הבאג, כתב בדיקות, וצור Pull Request.

**Q: איך אני מוסיף תכונה חדשה?**
A: צור branch חדש, פיתוח את התכונה, כתב בדיקות ותיעוד, וצור Pull Request.

## 📞 יצירת קשר

- **GitHub Issues**: לשאלות טכניות ובאגים
- **GitHub Discussions**: לשאלות כלליות ודיונים
- **Email**: support@ambulance-manager.com

## 🙏 תודה

תודה על התרומה שלך לפרויקט! כל תרומה, קטנה כגדולה, עוזרת לנו לבנות מערכת טובה יותר.

---

**זכור**: המטרה היא לבנות מערכת שתעזור לחברות אמבולנסים לנהל את העסק שלהן בצורה יעילה ובטוחה. כל תרומה שלך מקדמת את המטרה הזו! 🚑
