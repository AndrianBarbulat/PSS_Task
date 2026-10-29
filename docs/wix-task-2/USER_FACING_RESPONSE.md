# User-facing response

Hello,

This is Andrian from Wix, and I hope you are having a fabulous day!

I’m sorry to hear about the problem you encountered with your custom order flow. I recreated the reported behaviour and reviewed the Cart page, backend web method, Success page and CMS configuration.

During my investigation, I found several implementation issues contributing to the failure. Correcting the following points should allow you to continue working on the project.

The first issue is the Cart-page validation:

```javascript
if (!cart.lineItems || cart.lineItems.length === 1)
```

This condition treats a cart containing exactly one product line as empty. It should check whether the cart contains zero line items instead:

```javascript
const lineItems = cart?.lineItems ?? [];

if (lineItems.length === 0) {
    // The cart is empty.
}
```

The second issue concerns the CMS collection IDs. The backend creates the record in `TestOrderRequest`, updates `OrderRequests`, and the Success page then searches `TestOrderRequest`.

Consequently, the order ID and payment link can be written to a different collection from the one queried by the Success page. In my opinion, the clearest solution is to use one collection ID consistently throughout the entire flow—for example:

```javascript
const COLLECTION_ID = 'OrderRequests';
```

The third issue is the way the Success page retrieves the order. It queries the collection directly from frontend code, but the logged-in member does not have permission to read that collection. This produces the reported permissions error.

I would not recommend opening the CMS collection to general member access simply to make this query work. Based on my experience with Velo APIs, the more secure solution is to keep the collection restricted and retrieve the request through a protected backend web method:

```javascript
export const getOrderRequest = webMethod(
    Permissions.SiteMember,
    async (orderId) => {
        // Retrieve the record and verify that it belongs
        // to the currently logged-in member.
    }
);
```

This approach keeps the CMS data protected and prevents one member from retrieving another member’s request by changing the order ID in the page URL.

Relevant documentation:

Wix Web Methods:
https://dev.wix.com/docs/velo/apis/wix-web-module/introduction

Velo security best practices:
https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices

Writing backend code:
https://dev.wix.com/docs/velo/articles/getting-started/writing-backend-code

Wix Data Get:
https://dev.wix.com/docs/velo/apis/wix-data/get

I also identified a second, related condition in the cart-cleanup logic:

```javascript
if (lineItemIds.length > 1)
```

This condition clears the cart only when it contains two or more line items. Initially, this problem is hidden by the earlier validation because a one-line cart is rejected before the cleanup code can run. Once the validation is corrected, however, a successfully submitted one-line cart would still remain uncleared.

If the submitted cart should be removed completely, I recommend:

```javascript
await currentCart.deleteCurrentCart();
await wixEcomFrontend.refreshCart();
```

Alternatively, if the implementation should remove only the submitted line items, the existing condition should be changed from:

```javascript
if (lineItemIds.length > 1)
```

to:

```javascript
if (lineItemIds.length > 0)
```

Relevant documentation:

Delete Current Cart:
https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart

Remove Line Items From Current Cart:
https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/remove-line-items-from-current-cart

Refresh Cart:
https://dev.wix.com/docs/velo/apis/wix-ecom-frontend/refresh-cart

As an additional recommendation, the product information stored in the CMS should include the selected variants, quantity and price. This would make products with different options—for example, the same sweater in different colours or sizes—clearly distinguishable in the collection.

After applying the corrections, I recommend testing the complete flow again.

If you have further questions, don’t hesitate to contact us. We will be happy to assist you!

Kind regards,\
Andrian | Wix Customer Care
