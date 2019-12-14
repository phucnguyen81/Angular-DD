import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import {
  Observable, Subject, ReplaySubject, merge, of
} from 'rxjs';
import {
  catchError, distinctUntilChanged, filter, map, mapTo, tap, startWith, scan
} from 'rxjs/operators';

import { ProductService } from '../product.service';
import { Product } from '../product';

function nextState(state, event): any {
  switch(event.type) {
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

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {

  // collect internal events from inside the component
  inputControl$ = new ReplaySubject<any>(2);

  // re-direct state to create feedback loop
  stateFeedback$ = new Subject<any>();

  // side-effect
  selectedProductActuator$ = this.stateFeedback$.pipe(
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
    mapTo({})   // open loop, no feedback
  );

  selectedProductId$ = this.productService.selectedProduct$.pipe(
    filter(product => !!product),
    map(product => ({type: 'selectedProductId' value: product.id}))
  );

  // products combined with their categories
  products$ = this.productService.productsWithCategory$.pipe(
    map(products => ({type: 'products', value: products})),
    catchError(error => {
      this.inputControl$.next({error});
      return of(null);
  }));

  // collect all events
  inputEvent$ = merge(
    this.inputControl$,
    this.products$,
    this.selectedProductId$,
    this.selectedProductActuator$,
  );

  // reduce state from event stream
  state$ = this.inputEvent$.pipe(
    scan<any,any>(nextState, {}),
    tap((state) => this.stateFeedback$.next(state))
  );

  // transform state to view for display
  view$ = this.state$.pipe(map(state => {
    const selectedId = state.selectedProductId;
    const products = state.products || [];
    const productViews = products.map(product => ({
        id: product.id,
        name: product.productName,
        category: product.category,
        ngClass: {active: (product.id === selectedId)},
    }));
    return {
      pageTitle: state.pageTitle,
      error: state.error,
      products: productViews
    };
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.inputControl$.next({type: 'pageTitle', value: 'Products'});

    // Read the parameter from the route - supports deep linking
    this.route.paramMap.subscribe(params => {
      const id = +params.get('id');
      this.inputControl$.next({type: 'selectedProductId', value: id});
    });
  }

  selectProduct(productId: number): void {
    this.inputControl$.next({type: 'selectedProductId', value: productId});
  }

}
