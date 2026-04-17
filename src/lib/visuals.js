const imageSourcePrefixes = ['blob:', 'data:', 'http://', 'https://', '/']

export function isImageSource(value) {
  const source = `${value || ''}`.trim()
  return imageSourcePrefixes.some((prefix) => source.startsWith(prefix))
}

export function getVisualStyle(value) {
  const source = `${value || ''}`.trim()

  if (isImageSource(source)) {
    return {
      backgroundImage: `url("${source}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  return {
    background: source || 'linear-gradient(135deg, #441111 0%, #1a1a1a 100%)',
  }
}
