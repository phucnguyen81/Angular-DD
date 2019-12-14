import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import {
  merge, of, Subject, ReplaySubject, Observable, combineLatest
} from 'rxjs';
import {
  catchError, filter, map, tap, startWith, skipWhile, scan
} from 'rxjs/operators';

import { ProductService } from '../product.service';
import { Product } from '../product';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {

  pageTitle$ = of('Products');

  selectedProductSensor$ = new ReplaySubject<number | null>(1);

  errorSensor$ = new Subject<string>();

  // products combined with their categories
  products$: Observable<Product[]> = this.productService.productsWithCategory$.pipe(
    catchError(error => {
      this.errorSensor$.next(error);
      return of(null);
  }));

  selectedProductActuator$ = this.selectedProductSensor$.pipe(
    tap((productId) => {
      // Modify the URL to support deep linking
      this.router.navigate(['/products', productId]);
      this.productService.changeSelectedProduct(productId);
    })
  );

  inputEvent$ = merge(
    this.pageTitle$.pipe(map(pageTitle => ({pageTitle}))),
    this.errorSensor$.pipe(map(error => ({error}))),
    this.products$.pipe(map(products => ({products}))),
    this.productService.selectedProduct$.pipe(
      filter(product => !!product),
      map(selectedProduct => ({selectedProduct}))
    ),
    this.selectedProductActuator$.pipe(
      map(selectedProductId => ({selectedProductId}))
    )
  );

  state$ = this.inputEvent$.pipe(
    scan<any,any>(
      (state, event) => ({...state, ...event}), {}
    )
  );

  view$ = this.state$.pipe(map(state => {
    const product = state.selectedProduct;
    const productId = product ? product.id : state.selectedProductId;
    const products = state.products || [];
    const productViews = products.map(prod => ({
        id: prod.id,
        name: prod.productName,
        category: prod.category,
        ngClass: {active: (prod.id === productId)},
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
    // Read the parameter from the route - supports deep linking
    this.route.paramMap.subscribe(params => {
      const id = +params.get('id');
      this.selectedProductSensor$.next(id);
    });
  }

  selectProduct(productId: number): void {
    this.selectedProductSensor$.next(productId);
  }

}
