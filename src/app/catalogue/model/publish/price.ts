/**
 * Created by suat on 12-May-17.
 */

import {Amount} from "./amount";
import {Quantity} from "./quantity";

export class Price {
    constructor(public priceAmount: Amount,
                public baseQuantity: Quantity) {
    }
}
