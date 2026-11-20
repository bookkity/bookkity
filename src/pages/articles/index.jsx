import PostListing from '@/components/PostListing'
import {getListingProps} from '@/helpers/listing-props'

export async function getStaticProps() { return getListingProps() }
export default PostListing
