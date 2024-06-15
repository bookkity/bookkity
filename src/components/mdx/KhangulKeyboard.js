import { HangulContext } from "khangul"
import Keyboard from 'react-simple-keyboard'
import {useRef, useState} from "react";

import 'react-simple-keyboard/build/css/index.css';

export default function KhangulKeyboard() {
    const hangulContext = useRef(new HangulContext())
    const keyboard = useRef(null)
    const [userInput, setUserInput] = useState('')
    const [layoutName, setLayoutName] = useState('default')

    const onKeyPress = (button) => {
        if (button === "{shift}" || button === "{lock}") {
            setLayoutName(layoutName === "default" ? "shift" : "default")
            return
        }
        else if (button === "{bksp}") {
            hangulContext.current.removeLastLetter()
            setUserInput(hangulContext.current.getValue())
            return
        }
        hangulContext.current.appendLetter(button)
        setUserInput(hangulContext.current.getValue())
    }

    return (
        <div className={'pt-2 pb-4 text-2xl'}>
            <input
                className={'w-full px-2 py-2 rounded mb-2 text-3xl text-center bg-white placeholder:text-lg'}
                placeholder='Use keyboard to type Korean'
                value={userInput}
                disabled={true}
                onChange={() => {}}
            />
            <Keyboard
                keyboardRef={ref => (keyboard.current = ref)}
                enableLayoutCandidates={false}
                layoutName={layoutName}
                onChange={() => {}}
                onKeyPress={onKeyPress}
                layout={{
                    default: [
                        "ㅂ ㅈ ㄷ ㄱ ㅅ ㅛ ㅕ ㅑ ㅐ ㅔ",
                        "ㅁ ㄴ ㅇ ㄹ ㅎ ㅗ ㅓ ㅏ ㅣ",
                        "ㅋ ㅌ ㅊ ㅍ ㅠ ㅜ ㅡ",
                        "{shift} {bksp}",
                    ],
                    shift: [
                        "ㅃ ㅉ ㄸ ㄲ ㅆ ㅒ ㅖ",
                        "{shift} {bksp}",
                    ],
                }}
            />
        </div>
    )
}