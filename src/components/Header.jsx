import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faDiscord, faGithub} from "@fortawesome/free-brands-svg-icons"
import {useState} from "react"
import {useRouter} from "next/router"

const discordIcons = {
  default: <FontAwesomeIcon icon={faDiscord} size="lg" color={'white'} className={`icon`}/>,
  pl: <div className={`icon`}>🇵🇱</div>,
  en: <div className={`icon`}>🌎</div>
}

const menuItems = [
  {name: 'Articles', link: '/'},
  {name: 'About Us', link: '/about'},
]

export default function Header() {
  const router = useRouter()
  const currentPath = router.pathname
  const [discordIcon, setDiscordIcon] = useState(discordIcons.default)

  return (
    <div className={`header flex flex-col md:flex-row items-center justify-center md:justify-between h-18 border-b border-b-gray-200 shadow-xs w-full`}>
      <a href={"/"} className={`w-1/4`}>
        <div className={'flex items-center px-4 py-4'}>
          <div className={``}>
            <img
              src={`/images/boo.png`}
              alt={'Bookkity'}
              className={`rounded-xl h-10 min-w-10`}
            />
          </div>
          <p className={'font-semibold text-md pl-3'}>Bookkity</p>
        </div>
      </a>
      <div className={`w-2/4 flex justify-center`}>
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={item.link}
            className={`px-3 py-4 hover:text-black ${currentPath === item.link ? 'font-semibold' : ''}`}
          >
            {item.name}
          </a>
        ))}
      </div>
      <div className={`w-1/4 flex flex-col md:flex-row justify-center md:justify-end items-center pt-1`}>
        <div className={`discord-parent bg-gray-200 rounded-lg h-7 flex items-center justify-between text-xs`}>
          <div className={`bg-purple-900 px-1.5 w-8 flex items-center justify-center h-full rounded-l-lg`}>
            {discordIcon}
          </div>
          <div className={`px-3 flex font-semibold text-gray-700`}>
            <a
              href={`https://discord.gg/CYvyq3u`}
              className={`px-2 hover:text-black`}
              onMouseEnter={() => setDiscordIcon(discordIcons.pl)}
              onMouseLeave={() => setDiscordIcon(discordIcons.default)}
            >
              <span className={`px-1`}>POLSKI</span>
            </a>
            <div className={`text-gray-400`}>
              |
            </div>
            <a
              href={`https://discord.gg/qGRqmGjUFX`}
              className={`px-3 hover:text-black`}
              onMouseEnter={() => setDiscordIcon(discordIcons.en)}
              onMouseLeave={() => setDiscordIcon(discordIcons.default)}
            >
              <span className={`px-1`}>ENGLISH</span>
            </a>
          </div>
        </div>
        <div className={`pt-3 pb-3 px-5`}>
          <a href={`https://github.com/bookkity`}>
            <FontAwesomeIcon icon={faGithub} size="xl"/>
          </a>
        </div>
      </div>
    </div>
  )
}
