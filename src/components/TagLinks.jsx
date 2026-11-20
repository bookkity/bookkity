import {tagPath} from '@/helpers/tags'

export default function TagLinks({tags}) {
  return <nav aria-label="Topics" className="flex flex-wrap gap-3 py-4 text-sm text-purple-700">
    {tags.map(tag => <a key={tag} href={tagPath(tag)}>{tag}</a>)}
  </nav>
}
