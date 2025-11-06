import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const secretKey = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'

/**
 * הצפנת טקסט רגיש
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, secretKey)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

/**
 * פענוח טקסט מוצפן
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipher(algorithm, secretKey)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * הצפנת פרטי חולה
 */
export function encryptPatientDetails(details: string): string {
  if (!details) return ''
  return encrypt(details)
}

/**
 * פענוח פרטי חולה
 */
export function decryptPatientDetails(encryptedDetails: string): string {
  if (!encryptedDetails) return ''
  try {
    return decrypt(encryptedDetails)
  } catch (error) {
    console.error('Error decrypting patient details:', error)
    return ''
  }
}
