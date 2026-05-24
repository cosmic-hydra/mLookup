// API configuration - keys stored in localStorage for user privacy
export const getApiKeys = () => ({
  alphaVantage: localStorage.getItem('mlookup_alpha_vantage_key') || '',
  finnhub: localStorage.getItem('mlookup_finnhub_key') || '',
  newsApi: localStorage.getItem('mlookup_news_api_key') || '',
  openai: localStorage.getItem('mlookup_openai_key') || '',
})

export const setApiKey = (name, value) => {
  localStorage.setItem(`mlookup_${name}`, value)
}

export const ENDPOINTS = {
  coingecko: 'https://api.coingecko.com/api/v3',
  fearGreed: 'https://api.alternative.me/fng/',
  alphaVantage: 'https://www.alphavantage.co/query',
  finnhub: 'https://finnhub.io/api/v1',
}
