import axios from 'axios'
import { ENDPOINTS } from '../config/apiConfig'

const cg = axios.create({ baseURL: ENDPOINTS.coingecko, timeout: 10000 })

export const getGlobalMarket = async () => {
  const { data } = await cg.get('/global')
  return data.data
}

export const getCoinMarkets = async (page = 1, perPage = 50) => {
  const { data } = await cg.get('/coins/markets', {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: perPage,
      page,
      sparkline: true,
      price_change_percentage: '1h,24h,7d',
    },
  })
  return data
}

export const searchCoins = async (query) => {
  const { data } = await cg.get('/search', { params: { query } })
  return data
}

export const getCoinDetail = async (id) => {
  const { data } = await cg.get(`/coins/${id}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: true,
      developer_data: false,
      sparkline: true,
    },
  })
  return data
}

export const getCoinChart = async (id, days = 7) => {
  const { data } = await cg.get(`/coins/${id}/market_chart`, {
    params: { vs_currency: 'usd', days, interval: days <= 1 ? 'hourly' : 'daily' },
  })
  return data
}

export const getTrending = async () => {
  const { data } = await cg.get('/search/trending')
  return data
}

export const getFearGreed = async () => {
  const { data } = await axios.get(ENDPOINTS.fearGreed + '?limit=7')
  return data
}

export const getCoinsByCategory = async (category) => {
  const { data } = await cg.get('/coins/markets', {
    params: {
      vs_currency: 'usd',
      category,
      order: 'market_cap_desc',
      per_page: 20,
      page: 1,
      sparkline: false,
    },
  })
  return data
}

export const getExchangeRates = async () => {
  const { data } = await cg.get('/exchange_rates')
  return data.rates
}
