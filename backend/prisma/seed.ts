import { PrismaClient, UserRole, RideStatus, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 מתחיל יצירת נתוני דוגמה...')

  // יצירת הרשאות בסיסיות
  const permissions = [
    // הרשאות משתמשים
    { name: 'users.create', description: 'יצירת משתמשים', resource: 'users', action: 'create' },
    { name: 'users.read', description: 'צפייה במשתמשים', resource: 'users', action: 'read' },
    { name: 'users.update', description: 'עריכת משתמשים', resource: 'users', action: 'update' },
    { name: 'users.delete', description: 'מחיקת משתמשים', resource: 'users', action: 'delete' },
    
    // הרשאות נסיעות
    { name: 'rides.create', description: 'יצירת נסיעות', resource: 'rides', action: 'create' },
    { name: 'rides.read', description: 'צפייה בנסיעות', resource: 'rides', action: 'read' },
    { name: 'rides.update', description: 'עריכת נסיעות', resource: 'rides', action: 'update' },
    { name: 'rides.delete', description: 'מחיקת נסיעות', resource: 'rides', action: 'delete' },
    { name: 'rides.assign', description: 'הקצאת נסיעות', resource: 'rides', action: 'assign' },
    { name: 'rides.approve', description: 'אישור נסיעות', resource: 'rides', action: 'approve' },
    
    // הרשאות דוחות
    { name: 'reports.read', description: 'צפייה בדוחות', resource: 'reports', action: 'read' },
    { name: 'reports.export', description: 'ייצוא דוחות', resource: 'reports', action: 'export' },
    
    // הרשאות Google Sheets
    { name: 'sheets.export', description: 'ייצוא ל-Google Sheets', resource: 'sheets', action: 'export' },
    { name: 'sheets.settings', description: 'הגדרות Google Sheets', resource: 'sheets', action: 'settings' },
    
    // הרשאות מערכת
    { name: 'system.settings', description: 'הגדרות מערכת', resource: 'system', action: 'settings' },
    { name: 'system.audit', description: 'צפייה ביומן ביקורת', resource: 'system', action: 'audit' },
  ]

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    })
  }

  console.log('✅ הרשאות נוצרו בהצלחה')

  // יצירת Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@ambulance.com' },
    update: {},
    create: {
      email: 'admin@ambulance.com',
      password: hashedPassword,
      firstName: 'מנהל',
      lastName: 'מערכת',
      phone: '050-1234567',
      role: UserRole.SUPER_ADMIN,
    },
  })

  // מתן כל ההרשאות ל-Super Admin
  const allPermissions = await prisma.permission.findMany()
  for (const permission of allPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: superAdmin.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        userId: superAdmin.id,
        permissionId: permission.id,
        granted: true,
        grantedBy: superAdmin.id,
      },
    })
  }

  console.log('✅ Super Admin נוצר בהצלחה')

  // יצירת Sub Admin
  const subAdmin = await prisma.user.upsert({
    where: { email: 'subadmin@ambulance.com' },
    update: {},
    create: {
      email: 'subadmin@ambulance.com',
      password: hashedPassword,
      firstName: 'סגן',
      lastName: 'מנהל',
      phone: '050-2345678',
      role: UserRole.SUB_ADMIN,
      createdById: superAdmin.id,
    },
  })

  // מתן הרשאות חלקיות ל-Sub Admin
  const subAdminPermissions = [
    'users.create', 'users.read', 'users.update',
    'rides.create', 'rides.read', 'rides.update', 'rides.assign', 'rides.approve',
    'reports.read', 'reports.export', 'sheets.export'
  ]

  for (const permissionName of subAdminPermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName }
    })
    if (permission) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: subAdmin.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: subAdmin.id,
          permissionId: permission.id,
          granted: true,
          grantedBy: superAdmin.id,
        },
      })
    }
  }

  console.log('✅ Sub Admin נוצר בהצלחה')

  // יצירת Admin
  const admin = await prisma.user.upsert({
    where: { email: 'manager@ambulance.com' },
    update: {},
    create: {
      email: 'manager@ambulance.com',
      password: hashedPassword,
      firstName: 'מנהל',
      lastName: 'צוות',
      phone: '050-3456789',
      role: UserRole.ADMIN,
      createdById: subAdmin.id,
    },
  })

  // מתן הרשאות ל-Admin
  const adminPermissions = [
    'users.create', 'users.read', 'users.update',
    'rides.create', 'rides.read', 'rides.update', 'rides.assign',
    'reports.read', 'sheets.export'
  ]

  for (const permissionName of adminPermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName }
    })
    if (permission) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: admin.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: admin.id,
          permissionId: permission.id,
          granted: true,
          grantedBy: subAdmin.id,
        },
      })
    }
  }

  console.log('✅ Admin נוצר בהצלחה')

  // יצירת נהגים
  const drivers = [
    {
      email: 'driver1@ambulance.com',
      firstName: 'יוסי',
      lastName: 'כהן',
      phone: '050-4567890',
    },
    {
      email: 'driver2@ambulance.com',
      firstName: 'דוד',
      lastName: 'לוי',
      phone: '050-5678901',
    },
    {
      email: 'driver3@ambulance.com',
      firstName: 'אברהם',
      lastName: 'ישראלי',
      phone: '050-6789012',
    },
  ]

  for (const driverData of drivers) {
    const driver = await prisma.user.upsert({
      where: { email: driverData.email },
      update: {},
      create: {
        ...driverData,
        password: hashedPassword,
        role: UserRole.DRIVER,
        createdById: admin.id,
      },
    })

    // מתן הרשאות בסיסיות לנהג
    const driverPermissions = ['rides.read', 'rides.update']
    for (const permissionName of driverPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })
      if (permission) {
        await prisma.userPermission.upsert({
          where: {
            userId_permissionId: {
              userId: driver.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            userId: driver.id,
            permissionId: permission.id,
            granted: true,
            grantedBy: admin.id,
          },
        })
      }
    }
  }

  console.log('✅ נהגים נוצרו בהצלחה')

  // יצירת לקוחות מוסדיים
  const clients = [
    {
      email: 'hospital@example.com',
      firstName: 'בית חולים',
      lastName: 'הדסה',
      phone: '02-6777111',
    },
    {
      email: 'clinic@example.com',
      firstName: 'מרפאה',
      lastName: 'כללית',
      phone: '03-1234567',
    },
  ]

  for (const clientData of clients) {
    const client = await prisma.user.upsert({
      where: { email: clientData.email },
      update: {},
      create: {
        ...clientData,
        password: hashedPassword,
        role: UserRole.INSTITUTIONAL_CLIENT,
        createdById: admin.id,
      },
    })

    // מתן הרשאות ללקוח מוסדי
    const clientPermissions = ['rides.create', 'rides.read']
    for (const permissionName of clientPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })
      if (permission) {
        await prisma.userPermission.upsert({
          where: {
            userId_permissionId: {
              userId: client.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            userId: client.id,
            permissionId: permission.id,
            granted: true,
            grantedBy: admin.id,
          },
        })
      }
    }
  }

  console.log('✅ לקוחות מוסדיים נוצרו בהצלחה')

  // יצירת נסיעות לדוגמה
  const sampleRides = [
    {
      task: 'העברת חולה מבית חולים הדסה למרפאה כללית',
      pickupAddress: 'בית חולים הדסה, ירושלים',
      dropoffAddress: 'מרפאה כללית, תל אביב',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // מחר
      estimatedFare: 350.0,
      invoiceNumber: 'INV-2024-001',
      notes: 'חולה עם בעיות לב',
      patientDetails: 'שם: יוסף כהן, גיל: 65, מספר זהות: 123456789, בעיה: התקף לב',
      status: RideStatus.PENDING,
      createdById: admin.id,
    },
    {
      task: 'העברת חולה מבית לבית חולים',
      pickupAddress: 'רחוב הרצל 15, תל אביב',
      dropoffAddress: 'בית חולים איכילוב, תל אביב',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // בעוד יומיים
      estimatedFare: 280.0,
      invoiceNumber: 'INV-2024-002',
      notes: 'חולה עם שבר ברגל',
      patientDetails: 'שם: שרה לוי, גיל: 45, מספר זהות: 987654321, בעיה: שבר ברגל שמאל',
      status: RideStatus.ASSIGNED,
      createdById: admin.id,
    },
    {
      task: 'העברת חולה מבית חולים לבית',
      pickupAddress: 'בית חולים רמב"ם, חיפה',
      dropoffAddress: 'רחוב הגליל 22, חיפה',
      scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // אתמול
      estimatedFare: 200.0,
      invoiceNumber: 'INV-2024-003',
      notes: 'חולה לאחר ניתוח',
      patientDetails: 'שם: משה ישראלי, גיל: 70, מספר זהות: 456789123, בעיה: לאחר ניתוח לב',
      status: RideStatus.COMPLETED,
      createdById: admin.id,
    },
  ]

  for (const rideData of sampleRides) {
    const ride = await prisma.ride.create({
      data: rideData,
    })

    // יצירת היסטוריית סטטוס
    await prisma.rideStatusHistory.create({
      data: {
        rideId: ride.id,
        status: ride.status,
        timestamp: ride.createdAt,
        changedBy: ride.createdById,
      },
    })
  }

  console.log('✅ נסיעות לדוגמה נוצרו בהצלחה')

  // יצירת הגדרות מערכת
  const systemSettings = [
    { key: 'google_sheets_spreadsheet_id', value: '', type: 'string' },
    { key: 'auto_sync_enabled', value: 'false', type: 'boolean' },
    { key: 'default_timezone', value: 'Asia/Jerusalem', type: 'string' },
    { key: 'business_currency', value: '₪', type: 'string' },
    { key: 'acceptance_timeout_minutes', value: '30', type: 'number' },
    { key: 'company_name', value: 'אמבולנסים פרטיים בע"מ', type: 'string' },
    { key: 'company_phone', value: '03-1234567', type: 'string' },
    { key: 'company_email', value: 'info@ambulance.com', type: 'string' },
  ]

  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ הגדרות מערכת נוצרו בהצלחה')

  console.log('🎉 כל נתוני הדוגמה נוצרו בהצלחה!')
  console.log('\n📋 פרטי התחברות:')
  console.log('Super Admin: admin@ambulance.com / admin123')
  console.log('Sub Admin: subadmin@ambulance.com / admin123')
  console.log('Admin: manager@ambulance.com / admin123')
  console.log('Driver 1: driver1@ambulance.com / admin123')
  console.log('Driver 2: driver2@ambulance.com / admin123')
  console.log('Driver 3: driver3@ambulance.com / admin123')
  console.log('Client 1: hospital@example.com / admin123')
  console.log('Client 2: clinic@example.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ שגיאה ביצירת נתוני דוגמה:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
