import { readdir, readFile } from 'fs'
import {promisify} from "util"

export const readDirectory = promisify(readdir)
export const readSpecificFile = promisify(readFile)
