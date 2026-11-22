import PostListing from '@/components/PostListing'
import {getListingProps} from '@/helpers/listing-props'

export async function getStaticProps() {
  const {props} = await getListingProps()
  return {props: {...props, searchMode: true}}
}

export default PostListing
