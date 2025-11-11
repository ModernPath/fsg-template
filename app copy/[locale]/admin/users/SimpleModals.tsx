'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

// REMOVED: Global style fix - now using JavaScript setProperty instead

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface EditModalProps extends ModalProps {
  user: {
    id: string
    email: string
    first_name?: string | null
    last_name?: string | null
    phone_number?: string | null
    is_admin: boolean
    is_partner: boolean
  }
}

interface DetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone_number: string | null
    created_at: string
    is_admin: boolean
    is_partner: boolean
  }
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPartner, setIsPartner] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Force text colors to be visible in Create Modal - AGGRESSIVE
  useEffect(() => {
    if (!isOpen) return

    const forceModalTextColors = () => {
      // Find all modal elements
      const modals = document.querySelectorAll('div[style*="position: fixed"][style*="zIndex: 1000"]')
      modals.forEach((modal) => {
        // Force ALL elements
        const allElements = modal.querySelectorAll('*')
        allElements.forEach((el: any) => {
          const tagName = el.tagName
          
          if (tagName === 'H2' || tagName === 'H3' || tagName === 'P' || tagName === 'LABEL' || tagName === 'SPAN' || tagName === 'DIV') {
            el.style.setProperty('color', '#1e293b', 'important')
            el.style.setProperty('background-color', 'transparent', 'important')
          }
          
          if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
            el.style.setProperty('color', '#1e293b', 'important')
            el.style.setProperty('background-color', '#ffffff', 'important')
            el.style.setProperty('border', '1px solid #e2e8f0', 'important')
          }
          
          if (tagName === 'BUTTON') {
            const isSubmit = el.type === 'submit' || el.textContent?.includes('Create') || el.textContent?.includes('Save')
            if (isSubmit) {
              el.style.setProperty('color', '#ffffff', 'important')
              el.style.setProperty('background-color', '#2563eb', 'important')
            } else {
              el.style.setProperty('color', '#1e293b', 'important')
              el.style.setProperty('background-color', '#ffffff', 'important')
            }
          }
        })
      })
    }

    // Run immediately
    forceModalTextColors()
    
    // Run again after delays to catch dynamic content
    setTimeout(forceModalTextColors, 50)
    setTimeout(forceModalTextColors, 100)
    setTimeout(forceModalTextColors, 200)
    setTimeout(forceModalTextColors, 500)

    // Keep running periodically while modal is open
    const interval = setInterval(forceModalTextColors, 500)
    
    return () => clearInterval(interval)
  }, [isOpen, email, firstName, lastName, phone, isAdmin, isPartner])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to create users')
        return
      }

      // Prepare user data
      const userData = {
        email,
        password,
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: phone || null,
        is_admin: isAdmin,
        is_partner: isPartner,
        email_confirm: sendEmail
      }

      console.log('Creating user with data:', {
        ...userData,
        password: '***'
      })

      // Call API endpoint to create user (with service role privileges)
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const result = await response.json()
      console.log('User created successfully:', result)
      
      alert('User created successfully!')
      onSuccess()
    } catch (err) {
      console.error('Error creating user:', err)
      alert('Failed to create user: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <style>{`
        .modal-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
        .modal-input:focus {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
      `}</style>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
          Create New User
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b !important', marginBottom: '1.5rem', backgroundColor: 'transparent !important' }}>
          Add a new user to the system
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+358 40 123 4567"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>

          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b !important', backgroundColor: 'transparent !important', marginBottom: '0.75rem' }}>
            Permissions
          </p>

          <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: '500', color: '#1e40af !important', backgroundColor: 'transparent !important' }}>Admin User</span>
                <p style={{ fontSize: '0.75rem', color: '#3b82f6 !important', backgroundColor: 'transparent !important', margin: 0 }}>
                  Full system access including user management
                </p>
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#d1fae5', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPartner}
                onChange={(e) => setIsPartner(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: '500', color: '#065f46 !important', backgroundColor: 'transparent !important' }}>Partner</span>
                <p style={{ fontSize: '0.75rem', color: '#10b981 !important', backgroundColor: 'transparent !important', margin: 0 }}>
                  Can earn commissions and access partner dashboard
                </p>
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: '500', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>Send Verification Email</span>
                <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', margin: 0 }}>
                  User will receive email confirmation link
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditModalProps) {
  const [email, setEmail] = useState(user.email)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isAdmin, setIsAdmin] = useState(user.is_admin)
  const [isPartner, setIsPartner] = useState(user.is_partner)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const loadUserData = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone_number')
            .eq('id', user.id)
            .maybeSingle()

          if (error) throw error
          
          if (data) {
            // Type assertion for profile data
            const profileData = data as { first_name: string | null; last_name: string | null; phone_number: string | null }
            setFirstName(profileData.first_name || '')
            setLastName(profileData.last_name || '')
            setPhone(profileData.phone_number || '')
          }
        } catch (err) {
          console.error('Error loading user data:', err)
        }
      }

      loadUserData()
      setEmail(user.email)
      setIsAdmin(user.is_admin)
      setIsPartner(user.is_partner)
      setNewPassword('')
    }
  }, [isOpen, user])

  // Force text colors to be visible in Edit Modal - AGGRESSIVE
  useEffect(() => {
    if (!isOpen) return

    const forceModalTextColors = () => {
      // Find all modal elements
      const modals = document.querySelectorAll('div[style*="position: fixed"][style*="zIndex: 1000"]')
      modals.forEach((modal) => {
        // Force ALL elements
        const allElements = modal.querySelectorAll('*')
        allElements.forEach((el: any) => {
          const tagName = el.tagName
          
          if (tagName === 'H2' || tagName === 'H3' || tagName === 'P' || tagName === 'LABEL' || tagName === 'SPAN' || tagName === 'DIV') {
            el.style.setProperty('color', '#1e293b', 'important')
            el.style.setProperty('background-color', 'transparent', 'important')
          }
          
          if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
            el.style.setProperty('color', '#1e293b', 'important')
            el.style.setProperty('background-color', '#ffffff', 'important')
            el.style.setProperty('border', '1px solid #e2e8f0', 'important')
          }
          
          if (tagName === 'BUTTON') {
            const isSubmit = el.type === 'submit' || el.textContent?.includes('Create') || el.textContent?.includes('Save')
            if (isSubmit) {
              el.style.setProperty('color', '#ffffff', 'important')
              el.style.setProperty('background-color', '#2563eb', 'important')
            } else {
              el.style.setProperty('color', '#1e293b', 'important')
              el.style.setProperty('background-color', '#ffffff', 'important')
            }
          }
        })
      })
    }

    // Run immediately
    forceModalTextColors()
    
    // Run again after delays to catch dynamic content
    setTimeout(forceModalTextColors, 50)
    setTimeout(forceModalTextColors, 100)
    setTimeout(forceModalTextColors, 200)
    setTimeout(forceModalTextColors, 500)

    // Keep running periodically while modal is open
    const interval = setInterval(forceModalTextColors, 500)
    
    return () => clearInterval(interval)
  }, [isOpen, firstName, lastName, phone, isAdmin, isPartner])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to update users')
        return
      }

      // Prepare update data - include ALL fields
      const updateData = {
        is_admin: isAdmin,
        is_partner: isPartner,
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: phone || null,
        password: newPassword && newPassword.length >= 6 ? newPassword : undefined
      }

      console.log('Updating user with data:', {
        ...updateData,
        password: updateData.password ? '***' : undefined
      })

      // Call API endpoint to update user (with service role privileges)
      const response = await fetch(`/api/admin/users/${user.id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }
      
      console.log('User updated successfully:', data)
      alert('User updated successfully!')
      onSuccess()
    } catch (err) {
      console.error('Error updating user:', err)
      alert('Failed to update user: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <style>{`
        .modal-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
        .modal-input:focus {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
      `}</style>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
          Edit User
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '1.5rem' }}>
          Update user information and permissions
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Email (read-only) */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>Email</p>
            <p style={{ fontWeight: '500', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>{user.email}</p>
          </div>

          {/* First Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Last Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+358 40 123 4567"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              New Password (optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave empty to keep current"
              minLength={6}
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem',
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            />
            {newPassword && newPassword.length < 6 && (
              <p style={{ fontSize: '0.75rem', color: '#dc2626 !important', backgroundColor: 'transparent !important', marginTop: '0.25rem' }}>
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>

          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b !important', backgroundColor: 'transparent !important', marginBottom: '0.75rem' }}>
            Permissions
          </p>

          {/* Admin */}
          <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: '500', color: '#1e40af !important', backgroundColor: 'transparent !important' }}>Admin User</span>
                <p style={{ fontSize: '0.75rem', color: '#3b82f6 !important', backgroundColor: 'transparent !important', margin: 0 }}>
                  Full system access including user management
                </p>
              </div>
            </label>
          </div>

          {/* Partner */}
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#d1fae5', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPartner}
                onChange={(e) => setIsPartner(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: '500', color: '#065f46 !important', backgroundColor: 'transparent !important' }}>Partner</span>
                <p style={{ fontSize: '0.75rem', color: '#10b981 !important', backgroundColor: 'transparent !important', margin: 0 }}>
                  Can earn commissions and access partner dashboard
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UserDetailsModal({ isOpen, onClose, user }: DetailsModalProps) {
  // Force text colors to be visible in View Modal - AGGRESSIVE
  useEffect(() => {
    if (!isOpen) return

    const forceModalTextColors = () => {
      // Find all modal elements
      const modals = document.querySelectorAll('div[style*="position: fixed"][style*="zIndex: 1000"]')
      modals.forEach((modal) => {
        // Force ALL elements
        const allElements = modal.querySelectorAll('*')
        allElements.forEach((el: any) => {
          const tagName = el.tagName
          const fontSize = window.getComputedStyle(el).fontSize
          
          if (tagName === 'H2' || tagName === 'H3') {
            el.style.setProperty('color', '#1e293b', 'important')
            el.style.setProperty('background-color', 'transparent', 'important')
          }
          
          if (tagName === 'P' || tagName === 'LABEL' || tagName === 'SPAN' || tagName === 'DIV') {
            // Small labels get gray color
            if (fontSize && parseFloat(fontSize) <= 12) {
              el.style.setProperty('color', '#64748b', 'important')
            } else {
              el.style.setProperty('color', '#1e293b', 'important')
            }
            el.style.setProperty('background-color', 'transparent', 'important')
          }
          
          if (tagName === 'BUTTON') {
            const isClose = el.textContent?.includes('Close')
            if (isClose) {
              el.style.setProperty('color', '#ffffff', 'important')
              el.style.setProperty('background-color', '#d42626', 'important')
            } else {
              el.style.setProperty('color', '#1e293b', 'important')
              el.style.setProperty('background-color', '#ffffff', 'important')
            }
          }
        })
      })
    }

    // Run immediately
    forceModalTextColors()
    
    // Run again after delays to catch dynamic content
    setTimeout(forceModalTextColors, 50)
    setTimeout(forceModalTextColors, 100)
    setTimeout(forceModalTextColors, 200)
    setTimeout(forceModalTextColors, 500)

    // Keep running periodically while modal is open
    const interval = setInterval(forceModalTextColors, 500)
    
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b !important' }}>
          User Details
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b !important', marginBottom: '1.5rem' }}>
          View detailed user information
        </p>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>User ID</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>{user.id}</p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>Email</p>
            <p style={{ fontWeight: '500', color: '#1e293b !important', backgroundColor: 'transparent !important' }}>{user.email}</p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>Name</p>
            <p style={{ color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              {user.first_name || user.last_name 
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : 'Not set'}
            </p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>Phone</p>
            <p style={{ color: '#1e293b !important', backgroundColor: 'transparent !important' }}>
              {user.phone_number || 'Not set'}
            </p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>Created</p>
            <p style={{ color: '#1e293b !important', backgroundColor: 'transparent !important' }}>{new Date(user.created_at).toLocaleString()}</p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>Admin Status</p>
            <p style={{ color: '#1e293b !important', backgroundColor: 'transparent !important' }}>{user.is_admin ? '✅ Admin User' : '❌ Regular User'}</p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b !important', backgroundColor: 'transparent !important', marginBottom: '0.25rem', fontWeight: '500' }}>Partner Status</p>
            <p style={{ color: '#1e293b !important', backgroundColor: 'transparent !important' }}>{user.is_partner ? '✅ Partner' : '❌ Not a Partner'}</p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

