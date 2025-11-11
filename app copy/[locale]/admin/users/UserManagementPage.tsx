'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { CreateUserModal, EditUserModal, UserDetailsModal } from './SimpleModals'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  created_at: string
  is_admin: boolean
  is_partner: boolean
  partner_id: string | null
}

export default function UserManagementPage() {
  const t = useTranslations('AdminUsers')
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'partner' | 'user'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  
  // Bulk actions state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  // Force stats box text colors to be visible
  useEffect(() => {
    const forceStatsColors = () => {
      // Wait a bit for DOM to render
      setTimeout(() => {
        const statsBoxes = document.querySelectorAll('.admin-stats-box')
        statsBoxes.forEach((box, boxIndex) => {
          const paragraphs = box.querySelectorAll('p')
          paragraphs.forEach((p) => {
            // Set color based on text content
            const text = p.textContent || ''
            
            if (text.includes('Total Users')) {
              p.style.setProperty('color', '#64748b', 'important')
              p.style.setProperty('background-color', 'transparent', 'important')
            } else if (text.includes('Admins')) {
              p.style.setProperty('color', '#3b82f6', 'important')
              p.style.setProperty('background-color', 'transparent', 'important')
            } else if (text.includes('Partners')) {
              p.style.setProperty('color', '#10b981', 'important')
              p.style.setProperty('background-color', 'transparent', 'important')
            } else {
              // This is a number (value)
              if (boxIndex === 0) {
                // Total Users value
                p.style.setProperty('color', '#1e293b', 'important')
              } else if (boxIndex === 1) {
                // Admins value
                p.style.setProperty('color', '#1e40af', 'important')
              } else if (boxIndex === 2) {
                // Partners value
                p.style.setProperty('color', '#065f46', 'important')
              }
              p.style.setProperty('background-color', 'transparent', 'important')
            }
          })
        })
      }, 100)
    }
    
    forceStatsColors()
  }, [filteredUsers, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone_number, created_at, is_admin, is_partner, partner_id')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') {
        filtered = filtered.filter(user => user.is_admin)
      } else if (roleFilter === 'partner') {
        filtered = filtered.filter(user => user.is_partner)
      } else if (roleFilter === 'user') {
        filtered = filtered.filter(user => !user.is_admin && !user.is_partner)
      }
    }

    setFilteredUsers(filtered)
  }

  const handleDeleteUser = async (userId: string) => {
    const userEmail = users.find(u => u.id === userId)?.email || 'this user'
    if (!confirm(`Are you sure you want to permanently delete ${userEmail}?\n\nThis will remove the user from both the database and authentication system.`)) return

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to delete users')
        return
      }

      // Call API endpoint to delete user (with service role)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }
      
      await fetchUsers()
      alert('User deleted successfully!')
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setIsDetailsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  // Bulk actions handlers
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUserIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedUserIds.size} user(s)?`)) {
      return
    }

    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in')
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const userId of selectedUserIds) {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to delete user ${userId}`)
          }
        } catch (err) {
          errorCount++
          console.error(`Error deleting user ${userId}:`, err)
        }
      }

      alert(`Deleted ${successCount} user(s). Failed: ${errorCount}`)
      setSelectedUserIds(new Set())
      await fetchUsers()
    } catch (err) {
      console.error('Bulk delete error:', err)
      alert('Failed to delete users')
    } finally {
      setLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedUserIds(new Set())
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {t('title') || 'User Management'}
          </h1>
          <p style={{ color: '#666' }}>
            {t('subtitle') || 'Manage user accounts and permissions'}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#d4af37',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          + {t('createUser.button') || 'Create User'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder') || 'Search by email...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1',
            minWidth: '250px',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          style={{
            padding: '0.75rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '1rem',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="all">{t('filters.all') || 'All Users'}</option>
          <option value="admin">{t('filters.admin') || 'Admins Only'}</option>
          <option value="partner">{t('filters.partner') || 'Partners Only'}</option>
          <option value="user">{t('filters.user') || 'Regular Users'}</option>
        </select>
        <button
          onClick={fetchUsers}
          style={{
            padding: '0.75rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          🔄 {t('refresh') || 'Refresh'}
        </button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedUserIds.size > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#eff6ff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '600', color: '#1e40af', fontSize: '1rem' }}>
              ✓ {selectedUserIds.size} user(s) selected
            </span>
            <button
              onClick={clearSelection}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              Clear Selection
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleBulkDelete}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🗑️ Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading users...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '6px', 
          marginBottom: '1rem' 
        }}>
          <p style={{ color: '#c00', fontWeight: '500' }}>Error: {error}</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <>
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px', width: '50px', textAlign: 'center', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>Email</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>Name</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>Phone</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>Created</th>
                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>Admin</th>
                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>Partner</th>
                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '14px', color: '#1e293b' }}>{user.email}</td>
                    <td style={{ padding: '14px', color: '#1e293b' }}>
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : '—'}
                    </td>
                    <td style={{ padding: '14px', color: '#1e293b' }}>
                      {user.phone_number || '—'}
                    </td>
                    <td style={{ padding: '14px', color: '#1e293b' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center', color: '#1e293b' }}>
                      {user.is_admin ? '✅' : '—'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center', color: '#1e293b' }}>
                      {user.is_partner ? '✅' : '—'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewDetails(user)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#4a5568',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                          }}
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                <p style={{ fontSize: '1.1rem' }}>
                  {searchTerm || roleFilter !== 'all' 
                    ? 'No users found matching your filters' 
                    : 'No users found'}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <div className="admin-stats-box" style={{ 
              flex: 1, 
              padding: '1rem', 
              backgroundColor: '#ffffff', 
              border: '2px solid #e2e8f0', 
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#64748b', backgroundColor: 'transparent' }}>Total Users</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', backgroundColor: 'transparent' }}>
                {filteredUsers.length}
              </p>
            </div>
            <div className="admin-stats-box" style={{ 
              flex: 1, 
              padding: '1rem', 
              backgroundColor: '#ffffff', 
              border: '2px solid #dbeafe', 
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#3b82f6', backgroundColor: 'transparent' }}>Admins</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af', backgroundColor: 'transparent' }}>
                {users.filter(u => u.is_admin).length}
              </p>
            </div>
            <div className="admin-stats-box" style={{ 
              flex: 1, 
              padding: '1rem', 
              backgroundColor: '#ffffff', 
              border: '2px solid #d1fae5', 
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#10b981', backgroundColor: 'transparent' }}>Partners</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46', backgroundColor: 'transparent' }}>
                {users.filter(u => u.is_partner).length}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            fetchUsers()
          }}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setIsEditModalOpen(false)
            setSelectedUser(null)
            fetchUsers()
          }}
        />
      )}

      {isDetailsModalOpen && selectedUser && (
        <UserDetailsModal
          isOpen={isDetailsModalOpen}
          user={selectedUser}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}
