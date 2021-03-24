import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock: Stock = await api.get<Stock>(`stock/${productId}`).then(response => response.data);
      //check localStorage
      const itemInCart = cart.find(item => item.id === productId);
      if (itemInCart) {
        if (stock.amount > 1) {
          updateProductAmount({ productId, amount: itemInCart.amount += 1 });
          return;
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else if (stock.amount > 0) {
        //addProduct
        const product: Product = await api.get<Product>(`products/${productId}`).then(response => response.data);
        if (product) {
          const updatedCart = [...cart, { ...product, amount: 1 }];
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

    } catch (err) {
      // console.log(err);
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      if (cart.find(item => item.id === productId)) {
        const updatedCart = cart.filter(item => item.id !== productId);
        if (updatedCart.length > 0) {
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
          toast.error('Erro na remoção do produto')
          return;
        }
      } else {
        toast.error('Erro na remoção do produto')
        return;
      }

    } catch (err) {
      // console.log(err);
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const stock = await api.get(`stock/${productId}`).then(response => response.data) as Stock;
      if (stock.amount > 0 && stock.amount >= amount) {
        const udpatedCart = [...cart];
        const updatedCartItemIndex = udpatedCart.findIndex(item => item.id === productId);
        udpatedCart[updatedCartItemIndex].amount = amount;
        setCart(udpatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(udpatedCart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
    } catch (err) {
      // console.log(err);
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
