import { useState, useEffect } from "react"

export default function PolishOnlyPopup() {
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('merch-polish-popup-seen')
    if (!hasSeenPopup) {
      setShowPopup(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('merch-polish-popup-seen', 'true')
    setShowPopup(false)
  }

  if (!showPopup) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
            If you're from Poland, feel free to browse our collection!
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
