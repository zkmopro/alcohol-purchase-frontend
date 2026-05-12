const VERIFIER_TARGET = 'https://verifier-sandbox.wallet.gov.tw'
const ISSUER_TARGET = 'https://issuer-sandbox.wallet.gov.tw'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/issuer-api/')) {
      const apiPath = url.pathname.replace('/issuer-api', '')
      const target = new URL(apiPath + url.search, ISSUER_TARGET)
      return fetch(target.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      })
    }

    if (url.pathname.startsWith('/api/')) {
      const target = new URL(url.pathname + url.search, VERIFIER_TARGET)
      return fetch(target.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      })
    }

    return env.ASSETS.fetch(request)
  },
}
