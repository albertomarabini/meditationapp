// import * as InAppPurchases from 'expo-in-app-purchases';

// /**
//  * SettingsMonetizationHandler
//  * Handles IAP for ad removal and restoration, manages state, Expo purchase listeners, and callbacks.
//  * Used by SettingsMenu only.
//  */
// export class SettingsMonetizationHandler {
//   isPurchasing: boolean = false;
//   isRestoringPurchase: boolean = false;
//   private purchaseListenerRegistered: boolean = false;
//   private adRemovalProductId: string = '';
//   private purchaseListener?: (event: InAppPurchases.IAPQueryResponse<InAppPurchases.InAppPurchase>) => void;
//   private pendingOnSuccess?: (result: any) => void;
//   private pendingOnFailure?: (errorMsg: string) => void;
//   /**
//    * Initiates in-app purchase flow for ad removal.
//    * @param onSuccess callback when purchase succeeds
//    * @param onFailure callback when purchase fails
//    */
//   async startRemoveAdsPurchase(
//     onSuccess: (result: any) => void,
//     onFailure: (errorMsg: string) => void
//   ): Promise<void> {
//     this.isPurchasing = true;
//     this.pendingOnSuccess = onSuccess;
//     this.pendingOnFailure = onFailure;
//     try {
//       await InAppPurchases.connectAsync();
//       await InAppPurchases.purchaseItemAsync(this.adRemovalProductId);
//       // Listener will invoke success/failure callback
//     } catch (e: any) {
//       onFailure('Purchase failed: ' + (e?.message || e));
//       this.isPurchasing = false;
//     }
//   }

//   /**
//    * Initiates restore of previous ad removal purchase.
//    * @param onSuccess callback when restore succeeds
//    * @param onFailure callback when restore fails
//    */
//   async startRestorePurchase(
//     onSuccess: (result: any) => void,
//     onFailure: (errorMsg: string) => void
//   ): Promise<void> {
//     this.isRestoringPurchase = true;
//     this.pendingOnSuccess = onSuccess;
//     this.pendingOnFailure = onFailure;
//     try {
//       await InAppPurchases.connectAsync();
//       await InAppPurchases.getPurchaseHistoryAsync();
//       // Listener will invoke success/failure callback
//     } catch (e: any) {
//       onFailure('Restore failed: ' + (e?.message || e));
//       this.isRestoringPurchase = false;
//     }
//   }

//   /**
//    * Registers the in-app purchase listener for purchases and restorations.
//    * @param adRemovalProductId Product ID for ad removal
//    */
//   registerPurchaseListener(adRemovalProductId: string): void {
//     if (this.purchaseListenerRegistered) return;
//     this.adRemovalProductId = adRemovalProductId;
//     this.purchaseListener = ({ responseCode, results, errorCode }) => {
//       if (responseCode === InAppPurchases.IAPResponseCode.OK && Array.isArray(results)) {
//         for (const purchase of results) {
//           if (!purchase.acknowledged && purchase.productId === this.adRemovalProductId) {
//             this.pendingOnSuccess?.(purchase);
//             InAppPurchases.finishTransactionAsync(purchase, false);
//           }
//         }
//       } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
//         this.pendingOnFailure?.(String(errorCode) || 'Purchase cancelled.');
//       } else {
//         this.pendingOnFailure?.(String(errorCode) || 'Purchase failed.');
//       }
//       this.isPurchasing = false;
//       this.isRestoringPurchase = false;
//     };
//     InAppPurchases.setPurchaseListener(this.purchaseListener);
//     this.purchaseListenerRegistered = true;
//   }

//   /**
//    * Unregisters the in-app purchase listener.
//    */
//   unregisterPurchaseListener(): void {
//     if (!this.purchaseListenerRegistered) return;
//     InAppPurchases.setPurchaseListener(() => {});
//     this.purchaseListenerRegistered = false;
//   }
// }


/**
 * Mock version of SettingsMonetizationHandler
 * Simulates in-app purchase interactions without real dependencies.
 */
export class SettingsMonetizationHandler {
  isPurchasing: boolean = false;
  isRestoringPurchase: boolean = false;
  private purchaseListenerRegistered: boolean = false;
  private adRemovalProductId: string = '';
  private pendingOnSuccess?: (result: any) => void;
  private pendingOnFailure?: (errorMsg: string) => void;

  async startRemoveAdsPurchase(
    onSuccess: (result: any) => void,
    onFailure: (errorMsg: string) => void
  ): Promise<void> {
    this.isPurchasing = true;
    this.pendingOnSuccess = onSuccess;
    this.pendingOnFailure = onFailure;

    setTimeout(() => {
      const fakePurchase = {
        productId: this.adRemovalProductId,
        acknowledged: false,
        orderId: 'mock-order-id-1234',
        purchaseTime: Date.now(),
        transactionReceipt: 'mock-receipt',
      };
      this.isPurchasing = false;
      this.pendingOnSuccess?.(fakePurchase);
    }, 1000); // simulate 1s delay
  }

  async startRestorePurchase(
    onSuccess: (result: any) => void,
    onFailure: (errorMsg: string) => void
  ): Promise<void> {
    this.isRestoringPurchase = true;
    this.pendingOnSuccess = onSuccess;
    this.pendingOnFailure = onFailure;

    setTimeout(() => {
      const restoredPurchase = {
        productId: this.adRemovalProductId,
        acknowledged: true,
        orderId: 'restored-mock-order-id-5678',
        purchaseTime: Date.now() - 86400000, // 1 day ago
        transactionReceipt: 'restored-mock-receipt',
      };
      this.isRestoringPurchase = false;
      this.pendingOnSuccess?.(restoredPurchase);
    }, 1000);
  }

  registerPurchaseListener(adRemovalProductId: string): void {
    if (this.purchaseListenerRegistered) return;
    this.adRemovalProductId = adRemovalProductId;
    this.purchaseListenerRegistered = true;
    // No-op in mock
  }

  unregisterPurchaseListener(): void {
    if (!this.purchaseListenerRegistered) return;
    this.purchaseListenerRegistered = false;
    // No-op in mock
  }
}
