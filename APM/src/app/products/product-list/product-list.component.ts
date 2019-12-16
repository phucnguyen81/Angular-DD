import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { Observable, Subject, merge } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { ProductService } from '../product.service';
import { ProductListControl } from './product-list.control';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit, OnDestroy {

  cancel$ = new Subject<any>();

  selectedProductIdFromRoute$ = this.route.paramMap.pipe(
    map(params => +params.get('id')),
    map(productId => ({type: 'selectedProductId', value: productId}))
  );

  selectedProductIdFromService$ = this.productService.selectedProduct$.pipe(
    filter(product => !!product),
    map(product => ({type: 'selectedProductId', value: product.id}))
  );

  selectedProductId$: Observable<any> = merge(
    this.selectedProductIdFromRoute$,
    this.selectedProductIdFromService$
  );

  productList$ = new ProductListControl(
    this.productService,
    this.selectedProductId$,
    (productId: number) => {
      if (productId) {
        // Modify the URL to support deep linking
        this.router.navigate(['/products', productId]);
        this.productService.changeSelectedProduct(productId);
      }
    }
  );

  // Transform state to view for display
  view$ = this.productList$.output$.pipe(map(state => {
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
  }));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.productList$.initUntil(this.cancel$);
    this.productList$.send('pageTitle', 'Products');
  }

  ngOnDestroy(): void {
    this.cancel$.next(true);
    this.cancel$.complete();
  }

  selectProduct(productId: number): void {
    this.productList$.selectProduct(productId);
  }

}
