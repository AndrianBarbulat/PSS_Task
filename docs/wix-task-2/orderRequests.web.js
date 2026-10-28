/**
 * Task 2 backend web module.
 *
 * Security improvements over the original version:
 * - SiteMember permission is enforced by the web method.
 * - The cart and member are loaded on the backend instead of being trusted
 *   from browser arguments.
 * - CMS permission checks are suppressed only in backend code, after member
 *   authentication; collection-wide member read/write access is not required.
 * - getOrderRequest() verifies record ownership before returning a payment
 *   link, preventing one member from reading another member's request.
 *
 * Data improvements:
 * - One collection ID is used for both insert and update.
 * - Localized product names are converted to strings.
 * - Wix descriptionLines are included so size/color variants remain distinct.
 * - Only fields represented by the supplied OrderRequests CSV schema are
 *   written: title/primary value, orderId, customerName, customerEmail,
 *   products, status, paymentLink, and memberId.
 *
 * Wix web methods and permissions:
 * https://dev.wix.com/docs/velo/apis/wix-web-module/introduction
 * Wix security guidance for backend suppressAuth:
 * https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices
 * Wix current-cart line-item shape, including descriptionLines:
 * https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart
 */

import { webMethod, Permissions } from 'wix-web-module';
import { currentMember } from 'wix-members-backend';
import { currentCart } from 'wix-ecom-backend';
import wixData from 'wix-data';

const COLLECTION_ID = 'OrderRequests';

// Placeholder only. Replace when the real payment provider is confirmed.
const PAYMENT_BASE_URL = 'https://testpayment.link/pay';

export const createOrderRequest = webMethod(
    Permissions.SiteMember,
    async () => {
        const member = await currentMember.getMember({
            fieldsets: ['FULL']
        });

        if (!member?._id) {
            throw new Error('You must be logged in.');
        }

        // The backend is the source of truth for products, quantities and price.
        const cart = await currentCart.getCurrentCart();
        const lineItems = cart?.lineItems ?? [];

        if (lineItems.length === 0) {
            throw new Error('Your cart is empty.');
        }

        const customerName = [
                member.contactDetails?.firstName,
                member.contactDetails?.lastName
            ]
            .filter(Boolean)
            .join(' ') ||
            member.profile?.nickname ||
            'Site member';

        const customerEmail =
            member.contactDetails?.emails?.[0] ||
            member.loginEmail ||
            '';

        const products = lineItems.map(formatProductLine);

        // Insert first so Wix generates the CMS record ID used as orderId.
        const order = await wixData.insert(
            COLLECTION_ID,
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
        const paymentLink = createPaymentLink(orderId);

        /*
         * The CSV shows a primary column labelled `paymentLink` and a separate
         * Paymentlink field. `title` updates the collection's primary field;
         * `paymentLink` updates the payment-link field used by the success page.
         */
        const completedOrder = await wixData.update(
            COLLECTION_ID,
            {
                ...order,
                title: paymentLink,
                orderId,
                paymentLink,
                status: order.status || 'Pending'
            },
            {
                suppressAuth: true
            }
        );

        // Return only the values needed by the cart page.
        return {
            orderId: completedOrder.orderId,
            paymentLink: completedOrder.paymentLink
        };
    }
);

export const getOrderRequest = webMethod(
    Permissions.SiteMember,
    async (orderId) => {
        if (!orderId || typeof orderId !== 'string') {
            throw new Error('The order request was not found.');
        }

        const member = await currentMember.getMember({
            fieldsets: ['FULL']
        });

        if (!member?._id) {
            throw new Error('You must be logged in.');
        }

        const order = await wixData.get(
            COLLECTION_ID,
            orderId,
            {
                suppressAuth: true,
                consistentRead: true
            }
        );

        // Authorization check: the URL ID alone does not grant record access.
        if (!order || order.memberId !== member._id) {
            throw new Error('The order request was not found.');
        }

        // Return only fields required by the success page.
        return {
            orderId: order.orderId || order._id,
            status: order.status || '',
            paymentLink:
                order.paymentLink || createPaymentLink(order._id)
        };
    }
);

function formatProductLine(item) {
    const name =
        getLocalizedText(item.productName) ||
        item.catalogReference?.catalogItemId ||
        'Unnamed product';

    const options = (item.descriptionLines ?? [])
        .map(formatDescriptionLine)
        .filter(Boolean);

    const optionText = options.length > 0
        ? ` (${options.join(', ')})`
        : '';

    const quantity = item.quantity || 0;
    const price = item.price?.formattedAmount
        ? ` — ${item.price.formattedAmount} each`
        : '';

    // Example: Knitted Golf Sweater (Size: XL, Color: Green) × 1 — €275.00 each
    return `${name}${optionText} × ${quantity}${price}`;
}

function formatDescriptionLine(line) {
    const label = getLocalizedText(line?.name);
    const value =
        getLocalizedText(line?.plainText) ||
        getLocalizedText(line?.plainTextValue) ||
        getLocalizedText(line?.colorInfo) ||
        line?.color ||
        '';

    if (!value) {
        return '';
    }

    return label ? `${label}: ${value}` : value;
}

function getLocalizedText(value) {
    if (typeof value === 'string') {
        return value;
    }

    return value?.translated || value?.original || '';
}

function createPaymentLink(orderId) {
    return (
        `${PAYMENT_BASE_URL}?orderId=` +
        encodeURIComponent(orderId)
    );
}
