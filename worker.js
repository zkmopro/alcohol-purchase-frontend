const API_TARGET = 'https://verifier-sandbox.wallet.gov.tw'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      const target = new URL(url.pathname + url.search, API_TARGET)
      return fetch(target.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      })
    }

    return env.ASSETS.fetch(request)
  },
}
