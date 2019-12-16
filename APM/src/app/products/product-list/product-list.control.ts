// TODO decouple Router from control
import { Router, ActivatedRoute } from '@angular/router';

import {
  Observable, Subject, ReplaySubject, merge, of
} from 'rxjs';

import {
  catchError, distinctUntilChanged, filter, map, mapTo, tap, startWith,
  scan, takeUntil, skipWhile
} from 'rxjs/operators';

import { ProductService } from '../product.service';

import { nextState } from './product-list.state';

export class ProductListControl {

  // input port for external events
  inputPort$ = new Subject<any>();

  // state as output
  output$ = new ReplaySubject<any>(1);

  // products combined with their categories
  products$ = this.productService.productsWithCategory$.pipe(
    map(products => ({type: 'products', value: products})),
    catchError(error => {
      this.inputPort$.next({error});
      return of(null);
  }));

  // side-effect, open loop, no feedback
  selectedProductAction$ = this.output$.pipe(
    distinctUntilChanged(
      (oldState, newState) => (
        oldState.selectedProductId === newState.selectedProductId
      )
    ),
    tap((state) => this.onSelectedId(state.selectedProductId)),
    skipWhile(() => true)   // no feedback
  );

  // all inputs
  input$ = merge(
    this.inputPort$,
    this.products$,
    this.selectedProductId$,
    this.selectedProductAction$,
  );

  // state reduced from inputs
  state$ = this.input$.pipe(
    scan<any,any>(nextState, {})
  );

  constructor(
    private productService: ProductService,
    private selectedProductId$: Observable<any>,
    private onSelectedId: number => void
  ) { }

  initUntil(cancel$: Observable<any>): void {
    this.state$.pipe(
      takeUntil(cancel$)
    ).subscribe(this.output$);

    this.inputPort$.next({
      type: 'pageTitle', value: 'Products'
    });
  }

  send(type: string, value: any): void {
    this.inputPort$.next({type, value});
  }

  selectProduct(productId: number): void {
    this.inputPort$.next({
      type: 'selectedProductId', value: productId
    });
  }

}
