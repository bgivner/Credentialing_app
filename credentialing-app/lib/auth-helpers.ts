import { clerkClient } from '@clerk/nextjs/server'
import { cache } from 'react'

/**
 * Cached function to get user role
 * This helps avoid multiple API calls for the same user
 */
export const getUserRole = cache(async (userId: string): Promise<string> => {
  try {
    const user = await clerkClient.users.getUser(userId)
    return (user.publicMetadata?.role as string) || 'client'
  } catch (error) {
    console.error('Error fetching user role:', error)
    return 'client' // default to client role on error
  }
})

/**
 * Check if user is admin
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId)
  return role === 'admin'
}

/**
 * Check if user is client
 */
export const isClient = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId)
  return role === 'client'
}