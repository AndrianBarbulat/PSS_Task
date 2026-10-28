/**
 * Task 2 success-page code.
 *
 * Replaces the original direct wixData query. The page now calls a protected
 * backend web method, which uses backend-only CMS access and confirms that the
 * current member owns the requested record before returning the payment link.
 *
 * Wix web methods and permissions:
 * https://dev.wix.com/docs/velo/apis/wix-web-module/introduction
 * Wix security best practices:
 * https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices
 */

import wixLocation from 'wix-location-frontend';
import { getOrderRequest } from 'backend/orderRequests.web';

$w.onReady(async function () {
    $w('#text1').hide();

    $w('#text2').text = 'Loading your order...';
    $w('#text2').show();

    const orderId = wixLocation.query.orderId;

    if (!orderId) {
        showPageError('The order could not be found.');
        return;
    }

    try {
        // No direct collection read occurs in page code.
        const order = await getOrderRequest(orderId);

        $w('#text2').text = 'Order created successfully!';
        $w('#text2').show();

        $w('#text1').text =
            order.paymentLink ||
            'No payment link was generated.';

        $w('#text1').show();
    } catch (error) {
        console.error('Could not load order:', error);
        showPageError('We could not load your payment link.');
    }
});

function showPageError(message) {
    $w('#text2').text = 'Something went wrong.';
    $w('#text2').show();

    $w('#text1').text = message;
    $w('#text1').show();
}
