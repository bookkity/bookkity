import Header from "@/components/Header"

export default function Layout({ children }) {

  return (
    <main className={`flex min-h-screen max-w-screen flex-col bg-gray-100`}>
      <Header />
      <div className={`content flex-grow container.xl mx-auto px-4 md:px-x-[2rem]`}>
        {children}
      </div>
      <div className={`footer h-14 flex justify-center w-full`}>
        <p></p>
      </div>
    </main>
  )
}
