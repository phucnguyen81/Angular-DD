import {
  Observable, Subject, ReplaySubject, merge, of
} from 'rxjs';

import {
  catchError, distinctUntilChanged, map, tap,
  scan, takeUntil, skipWhile
} from 'rxjs/operators';

import { nextState } from './product-list.state';

export class ProductListControl {

  // input port for external events
  input$ = new Subject<any>();

  // state as output
  stateLoop$ = new Subject<any>();

  // products combined with their categories
  products$ = this.productsInput$.pipe(
    catchError(error => {
      this.input$.next({error});
      return of(null);
  }));

  // side-effect, open loop, no feedback
  selectedProductAction$ = this.stateLoop$.pipe(
    distinctUntilChanged(
      (oldState, newState) => (
        oldState.selectedProductId === newState.selectedProductId
      )
    ),
    tap((state) => this.doOnSelectedProduct(state.selectedProductId)),
    skipWhile(() => true)   // no feedback
  );

  // state reduced from inputs
  state$ = merge(
    this.input$,
    this.products$,
    this.selectedProductId$,
    this.selectedProductAction$,
  ).pipe(
    scan<any,any>(nextState, {}),
    tap(state => this.stateLoop$.next(state))
  );

  constructor(
    private productsInput$: Observable<any>,
    private selectedProductId$: Observable<any>,
    private doOnSelectedProduct: (number) => void
  ) { }

  send(type: string, value: any): void {
    this.input$.next({type, value});
  }

  selectProduct(productId: number): void {
    this.input$.next({
      type: 'selectedProductId', value: productId
    });
  }

}
