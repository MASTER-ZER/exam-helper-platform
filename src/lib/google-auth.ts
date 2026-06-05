'use client'

let scriptLoaded = false
let scriptLoading: Promise<void> | null = null

function loadGsiScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve()
  if (scriptLoading) return scriptLoading

  scriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      scriptLoaded = true
      resolve()
    }
    script.onerror = () => {
      scriptLoading = null
      reject(new Error('Failed to load Google Identity Services'))
    }
    document.head.appendChild(script)
  })

  return scriptLoading
}

export async function signInWithGoogle(): Promise<string> {
  await loadGsiScript()

  return new Promise((resolve, reject) => {
    const google = (window as unknown as Record<string, unknown>).google as {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; id_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }

    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not available'))
      return
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: '382029459424-9uf56jhfki59equnr26lq3qa5gnjh3po.apps.googleusercontent.com',
      scope: 'openid profile email',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        if (response.id_token) {
          resolve(response.id_token)
        } else {
          reject(new Error('No ID token received'))
        }
      },
    })

    client.requestAccessToken()
  })
}
