# Task 2 — Wix technical investigation

This folder preserves the current coding baseline, completed technical investigation, and final user-facing response for the custom Wix Stores order-request investigation. User-interface redesign is outside this scope.

## Deliverables

- [Task 2 — Technical investigation and proposed solutions](INVESTIGATION_AND_SOLUTIONS.md)
- [Final user-facing response](USER_FACING_RESPONSE.md)
- [Cart page code](CartPage.js)
- [Backend web module](orderRequests.web.js)
- [Success page code](SuccessPage.js)

## Current files

- `CartPage.js` — validates a non-empty cart, calls the backend without passing browser cart data, deletes the submitted cart, refreshes Wix cart state, and redirects using the generated order ID.
- `orderRequests.web.js` — authenticates the member, loads the authoritative current cart, formats product variants, writes the approved CMS fields, and provides an ownership-checked order lookup.
- `SuccessPage.js` — loads the payment link through the protected backend method rather than reading the CMS collection directly.

These files are repository references. They must be copied into the matching Wix page/backend locations and published before live testing.

## CSV evidence boundary

The supplied `OrderRequests (3).csv` export contains a header and no data rows. It confirms only the visible export schema:

```text
paymentLink, ID, Created date, Updated date, Owner, orderId,
customerName, customerEmail, products, Status, Paymentlink, Memberid
```

Because the export is empty, it does not prove that the current version created a CMS record, captured variants, deleted the cart, or completed the redirect. Those behaviors still require a published live test.

The backend therefore writes only the corresponding custom data:

| Code field | CSV column or role |
| --- | --- |
| `title` | Primary column currently labelled `paymentLink` |
| `orderId` | `orderId` |
| `customerName` | `customerName` |
| `customerEmail` | `customerEmail` |
| `products` | `products` Tags field |
| `status` | `Status` |
| `paymentLink` | `Paymentlink` |
| `memberId` | `Memberid` |

The two payment-link-looking columns should be checked in the CMS field manager. Wix code uses field IDs, while CSV headers show field labels. The current code assumes the primary field ID is `title` and the actual payment-link field ID is `paymentLink`.

## Findings and replacements

| Original implementation | Problem | Current implementation |
| --- | --- | --- |
| `lineItems.length === 1` | One valid product line was reported as an empty cart | Empty means `lineItems.length === 0` |
| `createOrderRequest(cart)` | Browser data could define products and prices | Backend calls `currentCart.getCurrentCart()` |
| `TestOrderRequest` insert and `OrderRequests` update | The write used two different collection IDs | Both operations use `OrderRequests` |
| `item.product?.name` | Unsupported on the current eCommerce line-item type | Uses localized `productName` and catalog ID fallback |
| Product name only | Size/color variants appeared identical | Formats `descriptionLines`, such as `Size: XL, Color: Green` |
| Clear only when more than one line exists | A one-line cart remained after submission | Deletes the complete submitted cart after CMS success |
| Direct success-page `wixData.query()` | Required broad collection read permission and exposed other records | Backend lookup uses `suppressAuth` and verifies `memberId` |
| Unencoded redirect value | Order ID was inserted directly into the URL | Uses `encodeURIComponent(orderId)` |

## Product variant format

Wix exposes human-readable product options through each cart line's `descriptionLines`. The backend converts those lines into the existing `products` Tags field.

Expected values now look like:

```text
Minimalist Tote Bag × 1 — €20.00 each
Knitted Golf Sweater (Size: XL, Color: Green) × 1 — €275.00 each
Knitted Golf Sweater (Size: XL, Color: Blue) × 1 — €275.00 each
```

The `variantId` alone is not sufficient for a readable export. `descriptionLines` provides the option names and values shown to the member.

## Permission elevation and collection security

This implementation uses `suppressAuth: true` only inside the backend web module. It does not make the collection readable or writable from page code.

The security sequence is:

1. `Permissions.SiteMember` restricts the exported web method.
2. `currentMember.getMember({ fieldsets: ['FULL'] })` identifies the authenticated member.
3. The backend loads the current member's Wix cart.
4. Backend Wix Data operations use `suppressAuth` against a restrictive collection.
5. `getOrderRequest()` checks `order.memberId === member._id` before returning the limited success-page data.

This is the relevant Wix Data pattern for this implementation. `wix-auth.elevate()` is intended for restricted API methods that specifically require elevation; it is not a replacement that needs to be added around these `wixData` calls.

References:

- [Wix security best practices and `suppressAuth`](https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices)
- [Wix `elevate()`](https://dev.wix.com/docs/velo/apis/wix-auth/elevate)
- [Web methods and `Permissions.SiteMember`](https://dev.wix.com/docs/velo/apis/wix-web-module/introduction)

## Cart deletion

The original code removed selected line items and skipped cleanup for a one-line cart. The current code calls `deleteCurrentCart()` only after the CMS request succeeds, then calls `wixEcomFrontend.refreshCart()`.

Deleting is appropriate here because the complete cart is submitted as one order request. The next product added by the member creates a new current cart. If the CMS write fails, deletion is never attempted.

References:

- [Current Cart API](https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart)
- [`deleteCurrentCart()`](https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart)
- [Refresh Cart](https://dev.wix.com/docs/velo/apis/wix-ecom-frontend/refresh-cart)

## Remaining coding verification

The following tests are still required on the published site:

1. One product line, quantity one.
2. One product line, quantity greater than one.
3. Multiple products, including two variants of the same product.
4. CMS row contains only the expected fields and readable variant values.
5. Submitted cart is deleted and the cart UI refreshes.
6. The next added product receives a new current cart.
7. A different member cannot load the order ID.
8. CMS failure leaves the cart intact.
9. Success-page refresh still retrieves the member-owned request.

The `https://testpayment.link/pay` base URL remains a placeholder. It demonstrates link generation but is not evidence of a payment integration.
