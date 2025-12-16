import Layout from "@/components/Layout"
import Head from "next/head"
import { getMerchItems } from "@/helpers/merch"
import { useState } from "react"
import PolishOnlyPopup from "@/components/PolishOnlyPopup"

export async function getStaticProps() {
  const merchItems = await getMerchItems()
  return {
    props: {
      merchItems
    }
  }
}

function MerchCard({ item }) {
  const images = item.images?.map(img => typeof img === 'string' ? img : img.url) || [item.image] || ['/images/boo.png']
  const thumbnailIndex = item.images?.findIndex(img => typeof img === 'object' && img.thumbnail)
  const [currentImageIndex, setCurrentImageIndex] = useState(thumbnailIndex !== -1 ? thumbnailIndex : 0)
  const hasMultipleImages = images.length > 1

  const goToPrevious = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <a
      href={`/merch/${item.id}`}
      className="block cursor-pointer hover:scale-[1.02] transition-transform duration-200"
    >
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group flex flex-col">
        <div className="relative aspect-square">
          <img
            src={images[currentImageIndex]}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
            onError={(e) => {
              e.target.src = '/images/boo.png'
            }}
          />
          {/* Gallery Navigation Arrows - only visible on hover */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Next image"
              >
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          {/* Tags overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {item.featured && (
              <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                Featured
              </div>
            )}
            {item.limitedEdition && (
              <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-semibold">
                Limitowana Edycja
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
                {item.category === 'Collectibles' ? 'Kolekcjonerskie' : item.category}
              </p>
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">
                {item.title}
              </h3>
            </div>
            {!item.available && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-1.5" title="Sold out" />
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

export default function Merch({ merchItems }) {
  return (
    <>
      <Head>
        <title>Merch | Bookkity</title>
        <meta name="description" content="Merch Bookkity - Ręcznie robione produkty stworzone z myślą o naszej społeczności ✨" />
      </Head>
      <Layout>
        <PolishOnlyPopup />
        <div className="pt-4 px-4">
          <div className="w-full px-4 py-6 bg-white rounded-lg mb-6">
            <p className="text-center text-md text-gray-950">
                Ręcznie robione produkty stworzone z myślą o naszej społeczności ✨
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {merchItems.map((item) => (
              <MerchCard key={item.id} item={item} />
            ))}
          </div>

          {merchItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Brak dostępnych produktów. Wróć wkrótce!</p>
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}
