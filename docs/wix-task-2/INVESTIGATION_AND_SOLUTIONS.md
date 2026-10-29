# Task 2 — Technical investigation and proposed solutions

Cloned Wix test site: https://andrianb.wixsite.com/psstechtask2/category/all-products

## Investigation approach

I approached this investigation as I would approach a real technical escalation. I did not assume that the user’s diagnosis was correct, and I did not begin with the assumption that the behaviour was caused by Wix.

Based on my experience working with Velo APIs, I believe it is important to separate three things during an investigation:

- what the user reported;
- what can be reproduced and supported with evidence;
- what the custom implementation is actually doing.

I reviewed the original Cart page, backend web method and Success page, reproduced the initial failure, checked the Wix logs and compared the available CMS results.

The intended flow was:

```text
Member logs in
→ adds products to the cart
→ clicks Make order
→ order information is submitted to CMS
→ cart is cleared
→ member is redirected to the Success page
→ payment link is displayed
```

In my assessment, the flow was not prevented by one isolated issue. It failed at several sequential stages because of custom-code errors, inconsistent CMS configuration and an insecure frontend data-access approach.

The main failure sequence was:

```text
One-line cart rejected
→ inconsistent CMS collection IDs
→ orderId and paymentLink written to a different collection
→ Success page queries the wrong collection
→ frontend CMS read denied by collection permissions
```

I also identified additional issues affecting cart cleanup, product information, product variants, payment-link generation, record authorization and error handling.

Based on the available evidence and my understanding of the documented Velo behaviour, I found no indication of a Wix platform defect.

## 1. Main issues preventing a working checkout flow

### 1.1 A valid cart was incorrectly treated as empty

#### What I found

The first issue I identified was this condition on the Cart page:

```javascript
if (!cart.lineItems || cart.lineItems.length === 1) {
    showError('Your cart is empty.');
    $w('#buttonSubmitOrder').enable();
    return;
}
```

#### How I investigated it

I reproduced the issue with one product line in the cart. The product had a quantity greater than one, but after clicking **Make order**, the page displayed:

```text
Your cart is empty.
```

The execution stopped at this point:

- the backend web method was not called;
- no CMS request was created by that attempt;
- the cart was not cleared;
- the Success page was not opened;
- no payment link was displayed.

#### My technical assessment

In my opinion, this was the first and most visible blocker.

Based on the Wix Current Cart response structure, `cart.lineItems.length` represents the number of distinct product lines. It does not represent the total quantity of products.

For example, one product with a quantity of six still produces:

```javascript
cart.lineItems.length === 1
```

The quantity is stored on the individual line item:

```javascript
cart.lineItems[0].quantity === 6
```

The original condition therefore treated every cart containing exactly one product line as empty.

#### Recommended resolution

Based on the documented Velo structure, I would consider the cart empty only when it contains zero product lines:

```javascript
const lineItems = cart?.lineItems ?? [];

if (lineItems.length === 0) {
    showError('Your cart is empty.');
    $w('#buttonSubmitOrder').enable();
    return;
}
```

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart

**Classification:** Custom-code logic error.

**Escalation decision:** In my opinion, this issue should not be escalated to Wix. The custom frontend condition stopped the flow before the request reached the backend.

### 1.2 The implementation used inconsistent CMS collection IDs

#### What I found

The backend inserted the original record into `TestOrderRequest`, attempted to update `OrderRequests`, and the Success page then queried `TestOrderRequest`.

```javascript
const order = await wixData.insert(
    'TestOrderRequest',
    {
        customerName,
        customerEmail,
        memberId: member._id,
        products,
        status: 'Pending'
    },
    {
        suppressAuth: true
    }
);

const orderId = order._id;
const paymentLink =
    `testpayment.link/pay?orderId=${orderId}`;

await wixData.update(
    'OrderRequests',
    {
        ...order,
        orderId,
        paymentLink
    },
    {
        suppressAuth: true
    }
);
```

The Success page later performed:

```javascript
const result = await wixData
    .query('TestOrderRequest')
    .eq('orderId', orderId)
    .find();
```

#### How I investigated it

After correcting the Cart-page validation, the Wix logs reported:

```text
WDE0025: The TestOrderRequest collection does not exist.
```

The source code also confirmed that the flow used two different collection IDs.

#### My technical assessment

Based on my experience with Wix Data, I would expect one business record to have one authoritative collection and one consistent lifecycle.

In this implementation:

1. The initial record was inserted into `TestOrderRequest`.
2. The inserted record did not contain `orderId` or `paymentLink`.
3. The code attempted to add those fields to `OrderRequests`.
4. The Success page queried `TestOrderRequest` by `orderId`.

In my opinion, this is more than a naming inconsistency. Even if both collections existed, the Success page could still return no result because it searched for `orderId` in the collection where the original code had not written that field.

The record was effectively being created in one location, completed in another location and then searched for in the first location.

#### Recommended resolution

I would define the collection ID once:

```javascript
const COLLECTION_ID = 'OrderRequests';
```

The insert, update and protected Success-page lookup should all use that same value.

```javascript
const order = await wixData.insert(
    COLLECTION_ID,
    orderData,
    {
        suppressAuth: true
    }
);
```

```javascript
const order = await wixData.get(
    COLLECTION_ID,
    orderId,
    {
        suppressAuth: true,
        consistentRead: true
    }
);
```

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-data/introduction
- https://dev.wix.com/docs/velo/apis/wix-data/insert
- https://dev.wix.com/docs/velo/apis/wix-data/update
- https://dev.wix.com/docs/velo/apis/wix-data/get

**Classification:** Custom-code and CMS configuration error.

**Escalation decision:** Based on the evidence, I would not escalate this issue to Wix. Wix correctly reported that the requested collection did not exist.

### 1.3 The Success page did not have permission to read the collection

#### What I found

After using the correct collection, the Success page produced:

```text
WDE0027: The current user does not have permissions to read on the OrderRequests collection.
```

The original Success page imported and used `wix-data` directly:

```javascript
import wixData from 'wix-data';

const result = await wixData
    .query('TestOrderRequest')
    .eq('orderId', orderId)
    .find();
```

#### How I investigated it

The error occurred when the logged-in site member attempted to retrieve the CMS record from the Success page. The Wix error identified a collection read-permission failure.

#### My technical assessment

In my opinion, granting every site member general read access would solve only the visible permission error while creating a broader security problem.

The collection can contain member IDs, customer names, customer email addresses, products, request status and payment-link information. Based on Wix security guidance and my experience with backend web methods, I believe the collection should remain restrictive.

The page does not need general collection access. It only needs a controlled way to retrieve one authorized record.

#### Recommended resolution

I would move the lookup into a backend web method:

```javascript
export const getOrderRequest = webMethod(
    Permissions.SiteMember,
    async (orderId) => {
        // Controlled backend lookup.
    }
);
```

The Success page should call:

```javascript
const order = await getOrderRequest(orderId);
```

instead of using `wixData.query()` directly.

The original backend already used `suppressAuth: true` for its insert and update operations. Therefore, I would not describe the fix as simply adding `suppressAuth`. The important correction is moving the Success-page read into controlled backend code.

Documentation:

- https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices
- https://dev.wix.com/docs/velo/apis/wix-web-module/introduction
- https://dev.wix.com/docs/velo/apis/wix-data/get

**Classification:** CMS permission and implementation-security issue.

**Escalation decision:** In my assessment, this should not be escalated to Wix. The permission system worked as expected and prevented an unauthorized frontend read.

### 1.4 The original payment link was incomplete

#### What I found

The original backend generated:

```javascript
const paymentLink =
    `testpayment.link/pay?orderId=${orderId}`;
```

#### My technical assessment

In my opinion, this value is not a complete external URL because it does not include a protocol such as `https://`. Depending on how it is displayed or consumed, it can be treated as plain text or as a relative URL. The order ID was also inserted into the URL without encoding.

#### Recommended resolution

At minimum, I would generate it as:

```javascript
const paymentLink =
    `https://testpayment.link/pay?orderId=${encodeURIComponent(orderId)}`;
```

I would also encode the Success-page redirect value:

```javascript
wixLocation.to(
    `/success?orderId=${encodeURIComponent(result.orderId)}`
);
```

However, I would clearly state that `testpayment.link` remains a placeholder. Adding `https://` corrects the URL structure, but it does not create a real payment integration.

**Classification:** Custom-code and integration-scope issue.

**Escalation decision:** No Wix escalation is required.

### Main failure summary

```text
Cart with one product line is rejected
→ backend and Success page use inconsistent collection IDs
→ orderId and paymentLink are written to a different collection
→ Success page queries the wrong collection
→ frontend CMS read is rejected by collection permissions
→ generated payment link is not a complete external URL
```

In my opinion, these issues directly explain why the intended flow could not complete correctly.

## 2. Strongly recommended improvements

These findings were not always the first visible blockers, but based on my Velo experience, I would consider them strongly recommended because they affect security, data correctness and reliable processing.

### 2.1 Add record-level ownership validation

Moving the Success-page query into the backend solves the direct permission problem, but authentication alone is not enough. The order ID is included in the URL, so a logged-in member could potentially change this value and request another member’s record.

`Permissions.SiteMember` confirms that the caller is logged in. It does not prove that the caller owns the requested record. In my opinion, this distinction between authentication and authorization is essential when a backend method returns customer or order information.

I would verify that the CMS record belongs to the current member:

```javascript
if (!order || order.memberId !== member._id) {
    throw new Error('The order request was not found.');
}
```

I would also return only the minimum information required by the Success page:

```javascript
return {
    orderId: order.orderId || order._id,
    status: order.status || '',
    paymentLink: order.paymentLink
};
```

Documentation:

- https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices
- https://dev.wix.com/docs/velo/articles/getting-started/writing-backend-code

**Classification:** Authorization and security-design issue. **Escalation:** Not required.

### 2.2 Retrieve the authoritative cart in backend code

The original Cart page called `createOrderRequest(cart)`, and the backend accepted that browser-provided object. Based on my experience with Velo web methods, I would not treat a complete object supplied by frontend code as the authoritative source for an order request.

Frontend requests can be modified before they reach the backend. The browser should therefore not define authoritative product names, quantities, product IDs, selected variants or prices.

I would call the backend without sending the cart:

```javascript
const result = await createOrderRequest();
```

The backend should retrieve and validate the current cart itself:

```javascript
const cart = await currentCart.getCurrentCart();
```

In my opinion, this makes the Wix current cart the correct source of truth.

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-web-module/introduction
- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart
- https://dev.wix.com/docs/velo/articles/getting-started/writing-backend-code

**Classification:** Security and implementation-design issue. **Escalation:** Not required.

### 2.3 Correct the unsupported line-item property

The original backend contained `item.product?.name`, and the Wix editor reported:

```text
Property 'product' does not exist on type 'LineItem$5'.
```

Based on the documented Wix eCommerce line-item structure, there is no `item.product` property. The documented line-item fields include `productName`, `catalogReference`, `quantity`, `price` and `descriptionLines`. `productName` can also be a localized object instead of a normal string.

I would normalize the name using supported fields:

```javascript
const name =
    item.productName?.translated ||
    item.productName?.original ||
    item.catalogReference?.catalogItemId ||
    'Unnamed product';
```

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart
- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/cart/get-cart

**Classification:** Custom-code and API data-shape error. **Escalation:** Not required.

### 2.4 Store readable product variants

The original implementation did not clearly include quantity, size, colour or formatted unit price. Different variants could therefore appear identical.

Based on the Wix line-item structure, the human-readable selected options are available through `item.descriptionLines`. In my opinion, storing only the base product name is not enough if the CMS record is expected to represent what the member actually selected.

I would combine the selected options with the product name, quantity and price:

```text
Knitted Golf Sweater (Size: XL, Color: Green) × 1 — €275.00 each
Knitted Golf Sweater (Size: XL, Color: Blue) × 1 — €275.00 each
```

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart
- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/cart/get-cart

**Classification:** Custom-code and data-format issue. **Escalation:** Not required.

The final format still requires a published live test because the latest supplied CSV contained only its column headings.

### 2.5 Correct the cart-cleanup condition

The original code removed products only when more than one line-item ID existed:

```javascript
if (lineItemIds.length > 1) {
    await currentCart.removeLineItemsFromCurrentCart(lineItemIds);
}
```

Initially, this problem is hidden by the earlier validation because a one-line cart is rejected before the cleanup code can run. Once that validation is corrected, a successfully submitted one-line cart would still remain uncleared.

The direct correction could be:

```javascript
if (lineItemIds.length > 0)
```

However, based on the intended business flow, my preferred solution would be to delete the complete submitted cart after CMS creation succeeds:

```javascript
await currentCart.deleteCurrentCart();
await wixEcomFrontend.refreshCart();
```

In my opinion, this better represents the lifecycle of a cart that has been submitted as one complete request.

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/remove-line-items-from-current-cart
- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart
- https://dev.wix.com/docs/velo/apis/wix-ecom-frontend/refresh-cart

**Classification:** Custom-code logic error and implementation decision. **Escalation:** Not required.

### 2.6 Separate creation, cleanup and navigation failures

The original Cart page placed cart validation, CMS creation, cart cleanup, cart refresh and Success-page navigation inside one general `try/catch`.

If CMS creation succeeded but cleanup failed, the page still displayed `We could not complete your order.` In my opinion, this message is technically misleading because the CMS request may already exist. It can also encourage the member to submit again and create another record.

I would separate the flow into:

```text
Stage 1: Validate and create the CMS request
Stage 2: Delete and refresh the submitted cart
Stage 3: Open the Success page
```

If Stage 1 succeeds but Stage 2 fails, the page should confirm that the request exists and display its reference.

**Classification:** Error-handling and reliability issue. **Escalation:** Not required.

### 2.7 Confirm the CMS field IDs and member data

The original backend already attempted to insert `customerName`, `customerEmail`, `memberId`, `products` and `status`. Therefore, I would not describe these as fields that were completely absent from the original code.

If those values were missing in later CMS exports, I would investigate:

- which code version created the record;
- which collection received the insert;
- whether the CMS field IDs matched the code;
- whether the member profile contained the values;
- whether the record was only partially updated.

The CMS exports also appeared to contain similarly labelled fields such as `paymentLink` and `Paymentlink`. Wix code uses field IDs, while CSV exports display field labels.

I would confirm the actual CMS field IDs in the field manager before changing or deleting fields.

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-data/insert
- https://dev.wix.com/docs/velo/apis/wix-data/update
- https://dev.wix.com/docs/velo/apis/wix-members-backend/current-member/get-member

**Classification:** CMS schema and data-mapping issue. **Escalation:** Not required.

## 3. Advisory improvements

The following improvements were not the primary reasons the initial flow failed. However, in my opinion, they would make the implementation more reliable and easier to maintain.

### 3.1 Treat cart-ID reuse as expected behaviour

Removing all line items empties the cart but does not necessarily delete the cart object. Wix can therefore retain and reuse the same current cart ID. Based on the Wix documentation, I would classify this as expected behaviour rather than a platform defect. Using `deleteCurrentCart()` gives this custom flow a clearer lifecycle.

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/remove-line-items-from-current-cart
- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart

### 3.2 Describe `suppressAuth` accurately

The original backend already used `suppressAuth: true` for its insert and update operations. The security improvement was not simply adding `suppressAuth`. It was combining backend-controlled CMS access with `Permissions.SiteMember`, current-member validation, record-ownership validation and limited response fields.

This implementation does not call `wix-auth.elevate()`. I would describe it as backend-controlled permission suppression rather than elevation.

Documentation:

- https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices
- https://dev.wix.com/docs/velo/apis/wix-auth/elevate
- https://dev.wix.com/docs/overview/auth-permissions/elevation

### 3.3 Handle partial CMS writes

The backend uses `wixData.insert()` and then `wixData.update()`. If the insert succeeds but the update fails, a partial record may remain, the frontend may report that creation failed, and another attempt may create a duplicate record.

From a reliability perspective, I would treat this as a partial-success condition instead of assuming that the entire creation failed.

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-data/insert
- https://dev.wix.com/docs/velo/apis/wix-data/update

### 3.4 Add duplicate-submission protection

The initial code did not contain an idempotency mechanism. Possible duplicate scenarios include a successful insert followed by an update failure, a lost backend response, cart-cleanup failure, a page refresh, or two tabs submitting the same cart.

In my opinion, a production implementation should use a stable submission key or another duplicate-prevention mechanism.

### 3.5 Separate cart deletion from UI refresh

If deletion succeeds but `refreshCart()` fails, a shared catch block can incorrectly report that the cart was not deleted. I would treat these as two separate failure states:

```text
Cart deletion failed
```

and:

```text
Cart was deleted, but the visible cart UI did not refresh
```

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart
- https://dev.wix.com/docs/velo/apis/wix-ecom-frontend/refresh-cart

### 3.6 Handle a completely missing current cart

The corrected validation handles an existing cart with zero lines. However, `getCurrentCart()` may return a not-found response if no current cart exists. Based on the documented behaviour, I would treat this as another empty-cart condition instead of displaying a general creation failure.

Documentation:

- https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart/get-current-cart

### 3.7 Display success only after verifying the record

The original Success page immediately displayed `Order created successfully!` before validating the URL order ID, querying the collection, confirming that the record existed, or confirming that the payment link was available.

In my opinion, a more accurate state sequence is:

```text
Display loading state
→ validate orderId
→ retrieve the authorized record
→ display success
```

### 3.8 Clarify the implementation scope

The custom implementation creates a CMS record and clears the cart. It does not create a native Wix checkout or native Wix order.

Wix describes the standard flow as `Cart → Checkout → Order`. Based on that distinction, I would present the implementation as a custom **order-request flow**. I would not describe it as a complete Wix checkout unless the checkout and order APIs are also implemented.

Documentation:

- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/create-checkout-from-current-cart
- https://dev.wix.com/docs/velo/apis/wix-ecom-backend/checkout/create-checkout

### 3.9 Clarify the payment limitation

The corrected URL can be structurally valid, but it remains a placeholder. It does not prove that a real payment provider is connected, a payment session is created, the payment amount is validated, payment status is returned, or the CMS request is updated after payment.

In my opinion, this limitation should be explicitly stated in the presentation.

## Verification requirements

Before closing the investigation, I would test:

### Cart validation

1. No current cart exists.
2. The cart exists but contains zero product lines.
3. One product line with quantity one.
4. One product line with a larger quantity.
5. Multiple different product lines.

### Product information

6. Two variants of the same product.
7. A product with size and colour.
8. A product without variants.
9. Quantity and formatted price are stored correctly.
10. Product names are stored as readable strings.

### CMS creation

11. The correct collection ID is used.
12. Customer name is stored when available.
13. Customer email is stored when available.
14. `orderId` matches the CMS record ID.
15. `paymentLink` is written to the correct field.
16. The primary CMS field is populated as intended.
17. The CSV contains the expected values.

### Security

18. A logged-out visitor cannot call the member-only method.
19. A logged-in member can retrieve their own request.
20. A different member cannot retrieve that request.
21. Changing the URL order ID does not expose another record.
22. The frontend has no direct general collection access.

### Cleanup and navigation

23. CMS creation succeeds and the cart is deleted.
24. CMS creation fails and the cart remains intact.
25. Cart deletion fails after CMS creation.
26. Cart deletion succeeds but the cart UI refresh fails.
27. The Success page opens with an encoded order ID.
28. The Success page can be refreshed safely.
29. A missing or invalid order ID displays an appropriate error.

### Reliability

30. The insert succeeds but the update fails.
31. The submit button is clicked twice.
32. The page is refreshed after creation but before cleanup.
33. The same cart is submitted from two tabs.
34. An unintended duplicate is not silently created.
35. A partial record can be identified and recovered.

### Scope

36. The presentation distinguishes a CMS order request from a native Wix order.
37. The payment URL is identified as a placeholder.
38. No Wix platform defect is claimed without reproduction after the custom code has been corrected.

## Final investigation conclusion

### Main issues

- A valid one-line cart was treated as empty.
- Different CMS collection IDs were used.
- `orderId` and `paymentLink` were written to a different collection from the one queried.
- The Success page attempted a direct CMS read without permission.
- The generated payment link did not contain a protocol.

### Strongly recommended improvements

- Add record-level ownership validation.
- Retrieve the authoritative cart in backend code.
- Remove the unsupported `item.product` reference.
- Preserve readable product variants.
- Correct the one-line cart-cleanup logic.
- Separate creation, cleanup and navigation errors.
- Confirm the CMS field IDs and member data.

### Advisory improvements

- Treat cart-ID reuse as expected Wix behaviour.
- Describe `suppressAuth` accurately.
- Handle partial CMS writes.
- Add duplicate-submission protection.
- Separate cart deletion and UI-refresh failures.
- Handle a completely missing cart.
- Display success only after record verification.
- Clarify that this is an order-request flow.
- Clarify that the payment link remains a placeholder.

Based on the evidence available, I found no reason to escalate this case to Wix development.

In my opinion, escalation would only be appropriate if:

1. The corrected implementation is published.
2. The CMS collection and field configuration are verified.
3. The complete test matrix is executed.
4. The custom-code and configuration causes are excluded.
5. A remaining failure can still be reproduced as Wix platform behaviour.
