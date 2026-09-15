import { VALID_CHECKOUT_DETAILS } from '@ui/data/const/checkout.const';
import type { CartPage } from '@ui/page/cart.page';
import type { CheckoutCompletePage } from '@ui/page/checkout-complete.page';
import type { CheckoutInformationPage } from '@ui/page/checkout-information.page';
import type { CheckoutOverviewPage } from '@ui/page/checkout-overview.page';
import type { InventoryPage } from '@ui/page/inventory.page';
import type { CheckoutDetails } from '@ui/types/checkout.interface';
import type { Product } from '@ui/types/product.interface';

/**
 * Composes page objects into the multi-step journeys specs need repeatedly.
 *
 * Why this is a util and not a page object: it spans five pages and owns no locators of its
 * own. Without it, every checkout spec repeats the same six navigation steps and a change to
 * the flow means editing every spec.
 *
 * Flows navigate and orchestrate. They never assert - validators own that.
 */
export class CheckoutFlow {
  constructor(
    private readonly inventoryPage: InventoryPage,
    private readonly cartPage: CartPage,
    private readonly informationPage: CheckoutInformationPage,
    private readonly overviewPage: CheckoutOverviewPage,
    private readonly completePage: CheckoutCompletePage,
  ) {}

  /** Adds products, then opens the cart. */
  async addProductsAndOpenCart(productsToOrder: readonly Product[]): Promise<void> {
    await this.inventoryPage.addProductsToCart(productsToOrder.map((product) => product.name));
    await this.inventoryPage.openCart();
    await this.cartPage.waitUntilReady();
  }

  /** Adds products and stops on checkout step one. */
  async goToInformationStep(productsToOrder: readonly Product[]): Promise<void> {
    await this.addProductsAndOpenCart(productsToOrder);
    await this.cartPage.checkout();
    await this.informationPage.waitUntilReady();
  }

  /**
   * Reaches checkout step one with nothing in the cart. The app permits this - see the
   * defect-characterising test in checkout.test.ts.
   */
  async goToInformationStepWithEmptyCart(): Promise<void> {
    await this.inventoryPage.openCart();
    await this.cartPage.waitUntilReady();
    await this.cartPage.checkout();
    await this.informationPage.waitUntilReady();
  }

  /** Adds products, fills in buyer details, and stops on the overview. */
  async goToOverview(
    productsToOrder: readonly Product[],
    buyerDetails: CheckoutDetails = VALID_CHECKOUT_DETAILS,
  ): Promise<void> {
    await this.goToInformationStep(productsToOrder);
    await this.informationPage.submitBuyerDetails(buyerDetails);
    await this.overviewPage.waitUntilReady();
  }

  /** Runs the whole journey through to the confirmation page. */
  async completeOrder(
    productsToOrder: readonly Product[],
    buyerDetails: CheckoutDetails = VALID_CHECKOUT_DETAILS,
  ): Promise<void> {
    await this.goToOverview(productsToOrder, buyerDetails);
    await this.overviewPage.finishOrder();
    await this.completePage.waitUntilReady();
  }
}
