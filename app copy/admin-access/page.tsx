'use client'

import { useState } from 'react'

export default function AdminAccessPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const getAdminAccess = async () => {
    setLoading(true)
    setResult('Haetaan admin-kirjautumislinkkiä...')
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success && data.loginUrl) {
        setResult('Admin-linkki luotu! Ohjataan...')
        // Redirect to the magic link
        window.location.href = data.loginUrl
      } else {
        setResult('Virhe: ' + (data.error || 'Tuntematon virhe'))
      }
    } catch (error) {
      setResult('Verkkovirhe: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    setResult('Tarkistetaan kirjautumistilaa...')
    
    try {
      const response = await fetch('/api/admin/debug-auth', {
        credentials: 'include'
      })
      
      const data = await response.json()
      setResult('Tila: ' + JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Virhe tilantarkistuksessa: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const goToAdmin = () => {
    window.location.href = '/fi/admin'
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      margin: '40px auto', 
      maxWidth: '600px',
      textAlign: 'center'
    }}>
      <h1>🔑 Admin Access Helper</h1>
      
      <p>Käytä tätä sivua päästäksesi hallintapaneeliin:</p>
      
      <div style={{ margin: '30px 0' }}>
        <button 
          onClick={getAdminAccess}
          disabled={loading}
          style={{ 
            padding: '15px 30px', 
            margin: '10px', 
            background: '#007BFF', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Ladataan...' : '🚀 Kirjaudu Adminiksi'}
        </button>
        
        <button 
          onClick={checkStatus}
          disabled={loading}
          style={{ 
            padding: '15px 30px', 
            margin: '10px', 
            background: '#28A745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: loading ? 0.6 : 1
          }}
        >
          📊 Tarkista Tila
        </button>
        
        <button 
          onClick={goToAdmin}
          style={{ 
            padding: '15px 30px', 
            margin: '10px', 
            background: '#6F42C1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🏢 Siirry Adminiin
        </button>
      </div>
      
      {result && (
        <div 
          style={{ 
            margin: '30px 0', 
            padding: '20px', 
            border: '1px solid #ddd',
            background: '#f8f9fa',
            borderRadius: '5px',
            textAlign: 'left'
          }}
        >
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result}</pre>
        </div>
      )}
      
      <div style={{ 
        marginTop: '40px', 
        padding: '20px',
        background: '#e9ecef',
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h3>📝 Käyttöohjeet:</h3>
        <ol style={{ textAlign: 'left', margin: '10px 0' }}>
          <li><strong>Kirjaudu Adminiksi</strong> - Luo magic link ja kirjaudu automaattisesti</li>
          <li><strong>Tarkista Tila</strong> - Näytä nykyinen kirjautumistila</li>
          <li><strong>Siirry Adminiin</strong> - Mene suoraan admin-paneeliin (toimii kun olet kirjautunut)</li>
        </ol>
        <p><em>💡 Jos "Siirry Adminiin" ei toimi, käytä ensin "Kirjaudu Adminiksi" nappia.</em></p>
      </div>
    </div>
  )
} 