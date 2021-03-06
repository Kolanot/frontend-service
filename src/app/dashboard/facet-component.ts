import {Component, EventEmitter, Input, Output} from "@angular/core";
import {TranslateService} from '@ngx-translate/core';
/**
 * Created by suat on 28-Mar-18.
 */

@Component({
    selector: "facet",
    templateUrl: "./facet-component.html",
    styleUrls: ["./facet-component.css"]
})
export class FacetComponent {
    @Input() title: string;
    @Input() dataType: "string" | "boolean" = "string";
    @Input() booleanValue: boolean = false;
    @Input() stringValues: string[] = [];
    @Input() selectedStringValues: string[] = [];
    @Input() filterActive: boolean = false; // true means user already selected a value for this facet, in this case we check the checkboxes
    @Input() loading: boolean = false
    @Input() disableMultipleSelection:boolean = false;

    @Output() booleanValueChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() triggerCriteriaChanged: EventEmitter<void> = new EventEmitter<void>();

    expanded: boolean = false;
    maxFacets = 5;

    constructor(
        private translate: TranslateService
    ) {
    }


    selectStringValue(value: string): void {
        if(this.disableMultipleSelection){
            this.selectedStringValues.splice(0,1);
            this.selectedStringValues.push(value);
            return;
        }
        let index = this.selectedStringValues.indexOf(value);
        if(index == -1) {
            this.selectedStringValues.push(value);
        } else {
            this.selectedStringValues.splice(index, 1);
        }
    }

    noResults(): boolean {
        if(this.loading) {
            return false;
        }
        return this.dataType === "string" && (!this.stringValues || this.stringValues.length === 0);
    }
}
