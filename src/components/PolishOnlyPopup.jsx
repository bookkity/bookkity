import {useSyncExternalStore} from 'react'

const storageKey = 'merch-polish-popup-seen'
const changeEvent = 'merch-popup-change'
const subscribe = notify => {
  window.addEventListener('storage', notify)
  window.addEventListener(changeEvent, notify)
  return () => {
    window.removeEventListener('storage', notify)
    window.removeEventListener(changeEvent, notify)
  }
}
const getSnapshot = () => !localStorage.getItem(storageKey)
const getServerSnapshot = () => false

export default function PolishOnlyPopup() {
  const showPopup = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const handleClose = () => {
    localStorage.setItem(storageKey, 'true')
    window.dispatchEvent(new Event(changeEvent))
  }

  if (!showPopup) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <div className="text-center">
          <div className="text-4xl mb-4">🇵🇱</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Polish Community Only
          </h2>
          <p className="text-gray-600 mb-6">
            This merch store is exclusively available for our Polish community members. 
            All products are handmade and shipped only within Poland.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            If you&apos;re from Poland, feel free to browse our collection!
          </p>
          <button
            onClick={handleClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Rozumiem / I understand
          </button>
        </div>
      </div>
    </div>
  )
}
