
import 'server-only'

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'

const PREFIX = 'enc:v1:'

function getEncryptionKey(): Buffer {
  const secret = process.env.TICKET_PASSWORD_ENCRYPTION_KEY

  if (!secret || secret.length < 32) {
    throw new Error('Ticket password encryption key is not configured')
  }

  return createHash('sha256').update(secret, 'utf8').digest()
}

export function encryptTicketPassword(password: string): string {
  if (!password) return ''

  const key = getEncryptionKey()
  const iv = randomBytes(12)

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(password, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    'enc',
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

export function decryptTicketPassword(value: string): string {
  if (!value.startsWith(PREFIX)) {
    throw new Error('Password is not in the encrypted format')
  }

  const parts = value.split(':')
  if (parts.length !== 5) {
    throw new Error('Invalid encrypted password format')
  }

  const [, , ivText, tagText, encryptedText] = parts
  const iv = Buffer.from(ivText, 'base64url')
  const tag = Buffer.from(tagText, 'base64url')
  const encrypted = Buffer.from(encryptedText, 'base64url')

  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error('Invalid encrypted password data')
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8')
}
