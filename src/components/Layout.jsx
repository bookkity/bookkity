import {Inter} from "next/font/google"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

const inter = Inter({ subsets: ["latin"] })

export default function Layout({ children }) {
  return (
    <main className={`flex min-h-screen flex-col bg-gray-100 ${inter.className}`}>
      <div className={`header flex items-center justify-between h-18 border-b border-b-gray-200 shadow-xs w-full`}>
        <a href={"/"}>
          <div className={'flex items-center p-4'}>
            <div className={``}>
              <img
                src={`/images/boo.png`}
                alt={'Bookkity'}
                className={`rounded-xl h-10`}
              />
            </div>
            <p className={'font-semibold text-md px-3'}>Bookkity</p>
          </div>
        </a>
        <div className={`pt-4 pb-3 px-5`}>
          <a href={`https://github.com/bookkity`}>
            <FontAwesomeIcon icon={faGithub} size="xl"/>
          </a>
        </div>
      </div>
      <div className={`content flex-grow container mx-auto`}>
        {children}
      </div>
      <div className={`footer h-14 flex justify-center w-full`}>
        <p></p>
      </div>
    </main>
  )
}
