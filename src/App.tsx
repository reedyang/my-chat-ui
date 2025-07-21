import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useAppStore } from '@/store'

function App() {
  const { loadSessions, loadModels, loadSettings } = useAppStore()

  useEffect(() => {
    // Initialize app data on startup
    const initializeApp = async () => {
      try {
        // Load models and settings first, then sessions
        await Promise.all([
          loadModels(),
          loadSettings(),
        ])
        
        // Load sessions after models and settings are available
        await loadSessions()
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    initializeApp()
  }, [loadSessions, loadModels, loadSettings])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Layout />
    </div>
  )
}

export default App 