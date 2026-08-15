import { useState, useCallback } from 'react'
import axios from 'axios'

/**
 * Generic hook for making POST requests to the detection API.
 */
export function useDetection() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [result, setResult]   = useState(null)

  const detect = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await axios.post('/api/detect', params)
      setResult(data)
      return data
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { detect, loading, error, result }
}
