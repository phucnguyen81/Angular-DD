import { Product } from '../product';

export interface ProductListState {
  pageTitle: string;
  error: string;
  products: Product[];
  selectedProductId: number | null;
}

const DEFAULT_INITIAL_STATE: ProductListState = {
  pageTitle: '?',
  error: '',
  products: [],
  selectedProductId: null,
};

export function nextState(
  state: ProductListState, event: any
): ProductListState {
  switch(event.type) {
    case 'init':
      return {...state, ...DEFAULT_INITIAL_STATE, ...event.value};
    case 'pageTitle':
      return {...state, 'pageTitle': event.value};
    case 'error':
      return {...state, 'error': event.value};
    case 'products':
      return {...state, 'products': event.value};
    case 'selectedProductId':
      return {...state, 'selectedProductId': event.value};
    default:
      return state;
  }
}
