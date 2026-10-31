import Header from "@/components/Header"

export default function Layout({ children, dark = false }) {

  return (
    <main className={`${dark ? 'dark film-grain bg-ink text-parchment [color-scheme:dark]' : 'bg-gray-100'} flex min-h-screen max-w-screen flex-col transition-colors duration-500`}>
      <Header />
      <div className={`content flex-grow container mx-auto px-4 md:px-x-[2rem]`}>
        {children}
      </div>
      <div className={`footer h-14 flex justify-center w-full`}>
        <p></p>
      </div>
    </main>
  )
}
