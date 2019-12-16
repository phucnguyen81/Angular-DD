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

  // Read the parameter from the route - supports deep linking.
  // Selected product id that comes from the route parameter.
  productIdFromRoute$ = this.route.paramMap.pipe(
    map(params => +params.get('id')),
    map(productId => ({type: 'selectedProductId', value: productId}))
  );

  // Selected product id that comes from the service.
  selectedProductId$ = this.productService.selectedProduct$.pipe(
    filter(product => !!product),
    map(product => ({type: 'selectedProductId', value: product.id}))
  );

  // products combined with their categories
  products$ = this.productService.productsWithCategory$.pipe(
    map(products => ({type: 'products', value: products})),
    catchError(error => {
      this.inputPort$.next({error});
      return of(null);
  }));

  // side-effect, open loop, no feedback
  selectProductAction$ = this.output$.pipe(
    distinctUntilChanged(
      (oldState, newState) => (
        oldState.selectedProductId === newState.selectedProductId
      )
    ),
    tap((state) => {
      const productId = state.selectedProductId;
      if (productId) {
        // Modify the URL to support deep linking
        this.router.navigate(['/products', productId]);
        this.productService.changeSelectedProduct(productId);
      }
    }),
    skipWhile(() => true)   // no feedback
  );

  // all inputs
  input$ = merge(
    this.inputPort$,
    this.products$,
    this.productIdFromRoute$,
    this.selectedProductId$,
    this.selectProductAction$,
  );

  // state reduced from inputs
  state$ = this.input$.pipe(
    scan<any,any>(nextState, {})
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
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
