import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id?: number
  idProducto: number
  nombre: string
  cantidad: number
  precioUnitario: number
  imagen?: string
  idAtributo?: number
}

interface CartState {
  items: CartItem[]
  idCarrito: number | null
  sesionId: string | null
  addItem: (item: CartItem) => void
  updateItem: (idProducto: number, cantidad: number) => void
  removeItem: (idProducto: number) => void
  clearCart: () => void
  setIdCarrito: (id: number) => void
  setSesionId: (id: string) => void
  getTotal: () => number
  getCount: () => number
  mergeCart: (items: CartItem[]) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      idCarrito: null,
      sesionId: null,
      addItem: (item) => {
        const { items } = get()
        const existingIndex = items.findIndex(
          (i) => i.idProducto === item.idProducto && i.idAtributo === item.idAtributo
        )

        if (existingIndex >= 0) {
          const updatedItems = [...items]
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            cantidad: updatedItems[existingIndex].cantidad + item.cantidad,
          }
          set({ items: updatedItems })
        } else {
          set({ items: [...items, item] })
        }
      },
      updateItem: (idProducto, cantidad) => {
        const { items } = get()
        if (cantidad <= 0) {
          set({ items: items.filter((i) => i.idProducto !== idProducto) })
        } else {
          set({
            items: items.map((i) =>
              i.idProducto === idProducto ? { ...i, cantidad } : i
            ),
          })
        }
      },
      removeItem: (idProducto) => {
        set({ items: get().items.filter((i) => i.idProducto !== idProducto) })
      },
      clearCart: () => {
        set({ items: [], idCarrito: null })
      },
      setIdCarrito: (id) => {
        set({ idCarrito: id })
      },
      setSesionId: (id) => {
        set({ sesionId: id })
      },
      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.cantidad * item.precioUnitario,
          0
        )
      },
      getCount: () => {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0)
      },
      mergeCart: (items) => {
        const currentItems = get().items
        const merged = [...currentItems]

        for (const incomingItem of items) {
          const existingIndex = merged.findIndex(
            (i) =>
              i.idProducto === incomingItem.idProducto &&
              i.idAtributo === incomingItem.idAtributo
          )

          if (existingIndex >= 0) {
            merged[existingIndex] = {
              ...merged[existingIndex],
              cantidad: merged[existingIndex].cantidad + incomingItem.cantidad,
            }
          } else {
            merged.push(incomingItem)
          }
        }

        set({ items: merged })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        idCarrito: state.idCarrito,
        sesionId: state.sesionId,
      }),
    }
  )
)