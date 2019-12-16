import { Product } from '../product';

const DEFAULT_INITIAL_STATE: {
  pageTitle: string;
  error: string;
  products: Product[];
  selectedProductId: number | null;
} = {
  pageTitle: '?',
  error: '',
  products: [],
  selectedProductId: null,
};

export function nextState(state, event): any {
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
