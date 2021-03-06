import {Component, OnInit, Input} from "@angular/core";
import {CatalogueLine} from "../model/publish/catalogue-line";
import {CURRENCIES,PRICE_OPTIONS} from "../model/constants";
import {PriceOptionCountPipe} from "../../product-details/price-option/price-option-count.pipe";
import {PriceOptionPipe} from "../../product-details/price-option/price-option.pipe";
import {CompanyNegotiationSettings} from '../../user-mgmt/model/company-negotiation-settings';
import {CatalogueService} from "../catalogue.service";
import {TaxCategory} from "../model/publish/tax-category";
import {UserService} from "../../user-mgmt/user.service";
import {CookieService} from "ng2-cookies";
import {Party} from "../model/publish/party";
import {TranslateService} from '@ngx-translate/core';
import { getISObyCountry } from "../../common/utils";
import * as myGlobals from '../../globals';
import {FormControl, Validators} from '@angular/forms';
import {ChildFormBase} from '../../common/validation/child-form-base';
import {ValidatorFn} from '@angular/forms/src/directives/validators';
import {priceValidator} from '../../common/validation/validators';
import {FIELD_NAME_PRODUCT_PRICE_AMOUNT, FIELD_NAME_PRODUCT_PRICE_BASE_QUANTITY} from '../../common/constants';
const PRODUCT_PRICE_INPUT = 'product_price';
@Component({
    selector: "product-price-tab",
    templateUrl: "./product-price-tab.component.html",
    styleUrls: ["./product-price-tab.component.css"],
    providers: [PriceOptionCountPipe, PriceOptionPipe],
})
export class ProductPriceTabComponent extends ChildFormBase implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() companyNegotiationSettings:CompanyNegotiationSettings;
    @Input() disabled: boolean

    priceAmountFormControl: FormControl;
    baseQuantityFieldName: string = FIELD_NAME_PRODUCT_PRICE_BASE_QUANTITY;
    priceAmountStep = 0.01;

    // TODO: later, get these from a service?
    CURRENCIES = CURRENCIES;
    object = Object;

    discountUnits = [];
    defaultVatRate: number = 20;
    static vatRates: any = null;
    public config = myGlobals.config;

    constructor(private catalogueService: CatalogueService,
                private userService: UserService,
                private cookieService: CookieService,
                private translate: TranslateService) {
        super(PRODUCT_PRICE_INPUT);
    }

    ngOnInit() {

        if(this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory == null || this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory.length == 0) {
            this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory = [new TaxCategory()];
        }

        if (this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent == null) {
            let vatRatesPromise: Promise<any> = Promise.resolve(ProductPriceTabComponent.vatRates);
            if(ProductPriceTabComponent.vatRates == null) {
                vatRatesPromise = this.catalogueService.getTaxRates();
            }

            if(this.config.vatEnabled){
                let userId: string = this.cookieService.get("user_id");
                let userPartyPromise: Promise<Party> = this.userService.getUserParty(userId);

                Promise.all(
                    [vatRatesPromise, userPartyPromise])
                    .then(([rates, party]) => {
                        ProductPriceTabComponent.vatRates = rates;
                        this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent = this.getVatRateForCountry(party);

                    }).catch(error => {
                    this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent = this.defaultVatRate;
                });
            }
            else {
                this.catalogueLine.requiredItemLocationQuantity.applicableTaxCategory[0].percent = 0;
            }
        }

        this.initViewFormAndAddToParentForm();
    }

    initializeForm(): void {
        // set up price amount form control
        let validators: ValidatorFn[] = [Validators.min(this.priceAmountStep)];
        this.priceAmountFormControl = new FormControl(this.catalogueLine.requiredItemLocationQuantity.price.priceAmount.value, validators);
        // add the control to the parent
        this.addToCurrentForm(FIELD_NAME_PRODUCT_PRICE_AMOUNT, this.priceAmountFormControl);
        // set the price validator to the price form group
        this.formGroup.setValidators(priceValidator);
    }

    updateDiscountUnits(){
        this.discountUnits = [].concat([this.catalogueLine.requiredItemLocationQuantity.price.priceAmount.currencyID,"%"]);
    }

    private getVatRateForCountry(userParty: Party): number {
        if(ProductPriceTabComponent.vatRates != null) {
            for(let countryCode of Object.keys(ProductPriceTabComponent.vatRates.items)) {
                if(countryCode == getISObyCountry(userParty.postalAddress.country.name.value)) {
                    return ProductPriceTabComponent.vatRates.items[countryCode][0].rates.standard;
                }
            }
        }
        return this.defaultVatRate;
    }
}
