import { Toaster } from 'sonner'
import './App.css'
import AudioRecorder from './components/AudioRecorder'

function App() {

  return (
    <>
      <AudioRecorder />
      <Toaster richColors />
    </>
  )
}

export default App
