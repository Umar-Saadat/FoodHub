import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { orderService } from '../services/orderService'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const EMPTY_CART = {
  items: [],
  subtotal: 0,
  delivery_fee: 0,
  item_count: 0,
  promo_discount: 0,
  promo_code: null,
  total: 0,
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(false)
  const [promoState, setPromoState] = useState({ code: null, discount: 0 })

  const refresh = useCallback(async () => {
    if (!user) { setCart(EMPTY_CART); return }
    try {
      setLoading(true)
      const { data } = await orderService.cart()
      setCart(data)
    } catch {
      setCart(EMPTY_CART)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const addItem = useCallback(async (foodId, quantity = 1, specialInstructions = '') => {
    const { data } = await orderService.addItem({
      food_id: foodId,
      quantity,
      special_instructions: specialInstructions,
    })
    setCart(data)
    return data
  }, [])

  const updateItem = useCallback(async (itemId, quantity, specialInstructions) => {
    if (quantity <= 0) {
      return removeItem(itemId)
    }
    const payload = { quantity }
    if (specialInstructions !== undefined) payload.special_instructions = specialInstructions
    const { data } = await orderService.updateItem(itemId, payload)
    setCart(data)
    return data
  }, []) // eslint-disable-line

  const removeItem = useCallback(async (itemId) => {
    const { data } = await orderService.removeItem(itemId)
    setCart(data)
    return data
  }, [])

  const clearCart = useCallback(async () => {
    const { data } = await orderService.clear()
    setCart(data)
    setPromoState({ code: null, discount: 0 })
    return data
  }, [])

  const applyPromo = useCallback(async (code) => {
    const { data } = await orderService.promo(code)
    if (data.valid) {
      setPromoState({ code, discount: data.discount })
      setCart(prev => ({
        ...prev,
        promo_discount: data.discount,
        delivery_fee: data.delivery_fee,
        total: data.total,
        promo_code: code,
      }))
    }
    return data
  }, [])

  return (
    <CartContext.Provider
      value={{ cart, loading, addItem, updateItem, removeItem, clearCart, applyPromo, refresh, promoState }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
