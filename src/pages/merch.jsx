import Layout from "@/components/Layout"
import Head from "next/head"
import { getMerchItems } from "@/helpers/merch"
import { useState } from "react"
import PolishOnlyPopup from "@/components/PolishOnlyPopup"
import { ArrowRight, HandHeart, MapPin, MessageCircle, Truck } from "lucide-react"

const perks = [
  { icon: HandHeart, title: 'Ręcznie robione' },
  { icon: Truck, title: 'Wysyłka InPost' },
  { icon: MapPin, title: 'Tylko Polska' },
  { icon: MessageCircle, title: 'Zamówienia na Discordzie' },
]

export async function getStaticProps() {
  const merchItems = await getMerchItems()
  return {
    props: {
      merchItems
    }
  }
}

function imagesOf(item) {
  return item.images?.map(img => typeof img === 'string' ? img : img.url) || ['/images/boo.png']
}

function thumbnailOf(item) {
  const thumbnail = item.images?.find(img => typeof img === 'object' && img.thumbnail) || item.images?.[0]
  return (typeof thumbnail === 'string' ? thumbnail : thumbnail?.url) || '/images/boo.png'
}

// The banner prefers a photo other than the thumbnail, which already opens the product card below
function bannerImageOf(item) {
  return item.banner?.url || imagesOf(item).find(img => img !== thumbnailOf(item)) || thumbnailOf(item)
}

// Halloween items switch the whole page to the dark theme while hovered
function halloweenHover(item, onHalloweenHover) {
  if (item.theme !== 'halloween') return {}
  return {
    onMouseEnter: () => onHalloweenHover(true),
    onMouseLeave: () => onHalloweenHover(false),
  }
}

function Banner({ item, onHalloweenHover }) {
  // Sampled from the photo, so the fade into the text panel has no visible seam
  const background = item.banner?.background || '#15120f'

  return (
    <a
      href={`/merch/${item.id}`}
      className="group flex flex-col md:block md:relative md:h-72 rounded-lg overflow-hidden shadow-md"
      style={{ backgroundColor: background }}
    >
      {/* On phones the photo sits above the text, on wider screens it fills the right side and fades into the panel */}
      <div className="relative h-56 md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-3/5">
        <img
          src={bannerImageOf(item)}
          alt=""
          style={{ objectPosition: item.banner?.position }}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 hidden md:block"
          style={{ background: `linear-gradient(to right, ${background}, ${background}b3 35%, transparent 75%)` }}
        />
        <div
          className="absolute inset-0 md:hidden"
          style={{ background: `linear-gradient(to top, ${background}, transparent 40%)` }}
        />
      </div>
      <div className="relative md:h-full flex flex-col justify-end p-6 md:p-10 text-white max-w-3xl gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">Nowa kolekcja</p>
        <h2 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight leading-none">{item.title}</h2>
        {item.shippingEstimate && (
          <p className="text-gray-200">Wysyłka {item.shippingEstimate}</p>
        )}
        {/* Only the button switches the theme, the banner is too big a hover target right after the page opens */}
        <span
          {...halloweenHover(item, onHalloweenHover)}
          className="mt-2 inline-flex items-center gap-2 self-start bg-purple-600 group-hover:bg-purple-500 dark:bg-ember dark:group-hover:bg-ember-400 px-6 py-3 rounded-lg font-semibold transition-colors duration-500"
        >
          {item.preorder ? 'Preorder' : 'Zobacz kolekcję'} <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </a>
  )
}

function ProductCard({ item, onHalloweenHover }) {
  return (
    <a href={`/merch/${item.id}`} className="group" {...halloweenHover(item, onHalloweenHover)}>
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-ink-800 transition-colors duration-500">
        <img src={thumbnailOf(item)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {item.preorder && <span className="bg-purple-600 text-white text-xs font-bold uppercase px-2 py-1 rounded">Preorder</span>}
          {item.limitedEdition && <span className="bg-purple-500 text-white text-xs font-bold uppercase px-2 py-1 rounded">Limitowana Edycja</span>}
        </div>
      </div>
      <p className="mt-3 text-xs uppercase tracking-wide text-gray-500 dark:text-parchment-500 transition-colors duration-500">
        {item.category === 'Collectibles' ? 'Kolekcjonerskie' : item.category}
      </p>
      <p className="font-semibold text-gray-900 dark:text-parchment group-hover:text-purple-600 dark:group-hover:text-ember-400 transition-colors duration-500">
        {item.title}{item.titleEmoji && ` ${item.titleEmoji}`}
      </p>
    </a>
  )
}

export default function Merch({ merchItems }) {
  const [dark, setDark] = useState(false)
  const [filter, setFilter] = useState('all')
  const current = merchItems.find(item => item.available)
  const visible = merchItems.filter(item => filter === 'all' || item.available)

  return (
    <>
      <Head>
        <title>Merch | Bookkity</title>
        <meta name="description" content="Merch Bookkity - Ręcznie robione produkty stworzone z myślą o naszej społeczności ✨" />
      </Head>
      <Layout dark={dark}>
        <PolishOnlyPopup />
        {/* Fill the screen between the header (73px) and layout footer (56px), so perks sit at the bottom */}
        <div className="pt-4 px-4 flex flex-col gap-6 md:min-h-[calc(100vh-129px)]">
          {current && <Banner item={current} onHalloweenHover={setDark} />}

          <div>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-ink-700 mb-4 transition-colors duration-500">
              <div className="flex gap-6">
                {[['all', 'Wszystko'], ['available', 'Dostępne']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors duration-500 ${
                      filter === key ? 'border-purple-600 dark:border-ember text-gray-900 dark:text-parchment' : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-parchment-500 dark:hover:text-parchment'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="pb-3 text-sm text-gray-500 dark:text-parchment-500 transition-colors duration-500">{visible.length} produkty</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {visible.map(item => (
                <ProductCard key={item.id} item={item} onHalloweenHover={setDark} />
              ))}
            </div>
            {visible.length === 0 && (
              <p className="text-center py-12 text-gray-500">Brak dostępnych produktów. Wróć wkrótce!</p>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 dark:border-ink-700 pt-6 transition-colors duration-500">
            {perks.map(({ icon: Icon, title }) => (
              <div key={title} className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-parchment-400 transition-colors duration-500">
                <Icon className="w-5 h-5 text-purple-600 dark:text-ember-400 transition-colors duration-500" /> {title}
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </>
  )
}
