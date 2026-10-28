/**
 * Task 2 cart-page code.
 *
 * Replaces the original implementation that:
 * - treated one product line as an empty cart (`length === 1`);
 * - sent the complete browser cart to the backend;
 * - removed line items only when more than one line existed.
 *
 * The backend now loads the authoritative Wix cart. After the CMS request is
 * created, this page deletes the submitted current cart and refreshes Wix's
 * cart UI.
 *
 * Wix Current Cart:
 * https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart
 * Wix deleteCurrentCart():
 * https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart
 */

import { currentCart } from 'wix-ecom-backend';
import wixEcomFrontend from 'wix-ecom-frontend';
import wixLocation from 'wix-location-frontend';
import { createOrderRequest } from 'backend/orderRequests.web';

$w.onReady(function () {
    $w('#text1').hide();

    $w('#buttonSubmitOrder').onClick(async () => {
        $w('#text1').hide();
        $w('#buttonSubmitOrder').disable();

        let result;

        // Stage 1: Validate the cart and create the CMS request.
        try {
            const cart = await currentCart.getCurrentCart();
            const lineItems = cart?.lineItems ?? [];

            // `lineItems.length` counts distinct product lines, not quantity.
            if (lineItems.length === 0) {
                showError('Your cart is empty.');
                $w('#buttonSubmitOrder').enable();
                return;
            }

            // No cart argument: the backend retrieves the trusted current cart.
            result = await createOrderRequest();

            if (!result?.orderId) {
                throw new Error('The backend did not return an order ID.');
            }
        } catch (error) {
            console.error('Could not create the order request:', error);

            showError(
                'We could not complete your order. Please try again.'
            );

            $w('#buttonSubmitOrder').enable();
            return;
        }

        // Stage 2: Delete the complete cart only after the CMS write succeeds.
        try {
            await currentCart.deleteCurrentCart();
            await wixEcomFrontend.refreshCart();
        } catch (error) {
            console.error(
                'The order request was created, but the cart could not be deleted:',
                error
            );

            showError(
                `Your order request ${result.orderId} was created, but we could not clear your cart. Please do not submit it again.`
            );

            // Keep the button disabled because the CMS request already exists.
            return;
        }

        // Stage 3: Open the success page with the generated CMS record ID.
        wixLocation.to(
            `/success?orderId=${encodeURIComponent(result.orderId)}`
        );
    });
});

function showError(message) {
    $w('#text1').text = message;
    $w('#text1').show();
}
