import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import {
  Observable, Subject, ReplaySubject, merge, of
} from 'rxjs';
import {
  catchError, distinctUntilChanged, filter, map, mapTo, tap, startWith,
  scan, takeUntil, skipWhile
} from 'rxjs/operators';

import { ProductService } from '../product.service';
import { Product } from '../product';

import { nextState } from './product-list.state';
import { ProductListControl } from './product-list.control';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit, OnDestroy {

  cancel$ = new Subject<any>();

  control$ = new ProductListControl(
    this.route, this.router, this.productService
  );

  // transform state to view for display
  view$ = this.control$.output$.pipe(map(state => {
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
    this.control$.initUntil(this.cancel$);
    this.control$.send('pageTitle', 'Products');
  }

  ngOnDestroy(): void {
    this.cancel$.next(true);
    this.cancel$.complete();
  }

  selectProduct(productId: number): void {
    this.control$.send('selectedProductId', productId);
  }

}
