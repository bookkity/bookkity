import Header from "@/components/Header"

export default function Layout({ children, dark = false }) {

  return (
    <main className={`${dark ? 'dark film-grain bg-ink text-parchment [color-scheme:dark]' : 'bg-gray-100'} flex min-h-screen flex-col transition-colors duration-500`}>
      <Header />
      <div className={`content grow mx-auto w-full max-w-[1400px] px-4`}>
        {children}
      </div>
      <div className={`footer h-14 flex justify-center w-full`}>
        <p></p>
      </div>
    </main>
  )
}
