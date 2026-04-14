export const featuredBikes = []

export function getBikeById(id) {
  return featuredBikes.find((bike) => bike.id === id)
}
