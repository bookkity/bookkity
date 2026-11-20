import Header from "@/components/Header"

export default function Layout({ children, dark = false }) {

  return (
    <main className={`${dark ? 'dark film-grain bg-ink text-parchment [color-scheme:dark]' : 'bg-gray-100'} flex min-h-screen max-w-screen flex-col transition-colors duration-500`}>
      <Header />
      <div className={`content grow container mx-auto px-4 pb-14 md:px-x-[2rem]`}>
        {children}
      </div>
    </main>
  )
}
