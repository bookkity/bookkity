import Layout from "@/components/Layout"
import Head from "next/head"
import { getMerchItems, getMerchItem } from "@/helpers/merch"
import { useState } from "react"
import PolishOnlyPopup from "@/components/PolishOnlyPopup"

export async function getStaticPaths() {
  const merchItems = await getMerchItems()
  const paths = merchItems.map((item) => ({
    params: { id: item.id }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const item = await getMerchItem(params.id)
  return {
    props: {
      item
    }
  }
}

export default function MerchProduct({ item }) {
  const [selectedImage, setSelectedImage] = useState(0)
  // Handle both string URLs and object format
  const images = item.images?.map(img => typeof img === 'string' ? img : img.url) || [item.image] || ['/images/boo.png']
  const imageAuthors = item.images?.map(img => typeof img === 'object' ? img : null) || []
  const hasMultipleImages = images.length > 1

  const goToPrevious = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <Head>
        <title>{item.title} | X Merch</title>
        <meta name="description" content={item.description} />
        <meta property="og:title" content={`${item.title} | Bookkity Merch`} />
        <meta property="og:description" content={item.description} />
        <meta property="og:image" content={images[0]} />
      </Head>
      <Layout>
        <PolishOnlyPopup />
        <div className="py-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <a href="/merch" className="hover:text-purple-600 transition-colors">
                  Merch
                </a>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{item.title}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-md relative group">
                <img
                  src={images[selectedImage]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/boo.png'
                  }}
                />
                {/* Gallery Navigation Arrows - only visible on hover */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {/* Dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === selectedImage ? 'bg-purple-600' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`View image ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Thumbnail strip */}
              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === idx ? 'border-purple-600' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt={`${item.title} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {item.category === 'Collectibles' ? 'Kolekcjonerskie' : item.category}
                </span>
                {item.limitedEdition && (
                  <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                    ⭐ Limitowana Edycja
                  </span>
                )}
                {/* {item.region && (
                  <span className="inline-block bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    {item.region === 'PL' && '🇵🇱'} Tylko Polska
                  </span>
                )} */}
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                {item.title}
              </h1>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-600">
                    {item.price} {item.currency}
                  </span>
                </div>
                {item.deliveryPrice && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <img src="/images/inpost.png" alt="InPost" className="w-5 h-5" />
                    { /* {item.deliveryPrice} {item.currency} */ } Dostawa InPost wliczona w cenę
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-gray">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Opis</h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Product Details */}
              {item.details && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Szczegóły produktu</h3>
                  <dl className="space-y-3">
                    {item.author?.instagram && (
                      <div className="flex">
                        <dt className="w-32 flex-shrink-0 text-gray-500">Artysta</dt>
                        <dd className="text-gray-900">
                          <a
                            href={item.author.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                          >
                            {item.author.instagram.includes('instagram') && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            )}
                            {item.author.name}
                          </a>
                        </dd>
                      </div>
                    )}
                    {item.details.material && (
                      <div className="flex">
                        <dt className="w-32 flex-shrink-0 text-gray-500">Materiał</dt>
                        <dd className="text-gray-900">{item.details.material}</dd>
                      </div>
                    )}
                    {item.details.dimensions && (
                      <div className="flex">
                        <dt className="w-32 flex-shrink-0 text-gray-500">Wymiary</dt>
                        <dd className="text-gray-900">{item.details.dimensions}</dd>
                      </div>
                    )}
                    {item.details.care && (
                      <div className="flex">
                        <dt className="w-32 flex-shrink-0 text-gray-500">Pielęgnacja</dt>
                        <dd className="text-gray-900">{item.details.care}</dd>
                      </div>
                    )}
                    {item.details.handmade && (
                      <div className="flex">
                        <dt className="w-32 flex-shrink-0 text-gray-500">Handmade</dt>
                        <dd className="text-gray-900">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Tak
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Contact/Order Info */}
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Jak zamówić?
                  </h3>
                  <p className="text-purple-700 text-sm mb-3">
                    Skontaktuj się z nami na Discordzie, aby złożyć zamówienie.
                    Liczba sztuk jest ograniczona, zgłoszenia bedą rozpatrywane w kolejności ich otrzymania.
                  </p>
                  <a
                    href="https://discord.gg/bookkity"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Napisz na Discordzie
                  </a>
                </div>
              </div>

              {/* Shipping Notice */}
              <div className="text-sm text-gray-500">
                <p>📦 Wysyłka tylko na terenie Polski</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
