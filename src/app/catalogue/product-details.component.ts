import {Component, Input, OnInit} from "@angular/core";
import { CatalogueLine } from "./model/publish/catalogue-line";
import {ItemProperty} from "./model/publish/item-property";
import {Property} from "./model/category/property";
import {Code} from "./model/publish/code";

@Component({
    selector: 'product-details',
    templateUrl: './product-details.component.html',
})

// Component that displays category and custom properties inside the "product details" tab in CatalogueLin

export class ProductDetailsComponent implements OnInit{

    PROPERTY_BLOCK_FIELD_NAME: string = "name";
    PROPERTY_BLOCK_FIELD_ISCOLLAPSED = "isCollapsed";
    PROPERTY_BLOCK_FIELD_PROPERTIES = "properties";

    @Input() catalogueLine: CatalogueLine;

    /*
     * hash storing the blocks of each category
     * For eClasses, base block is held at propertyBlocks[itemClassificationCode.value][0]
     * and specific block at propertyBlocks[itemClassificationCode.value][1]
     * For others, the block is held at propertyBlocks[itemClassificationCode.listID][0]
     */
    propertyBlocks: any = {};

    ngOnInit(): void {
        this.refreshPropertyBlocks();
    }

    refreshPropertyBlocks(): void {
        this.propertyBlocks = {};

        // determine categories the item belongs to
        for (let classification of this.catalogueLine.goodsItem.item.commodityClassification) {

            if (classification.itemClassificationCode.listID == "eClass") {
                this.createEClassPropertyBlocks(classification.itemClassificationCode);
             }
        }

        // put all properties into their blocks
        for (let property of this.catalogueLine.goodsItem.item.additionalItemProperty) {

            if (property.itemClassificationCode.listID === "eClass") {
                if (ProductDetailsComponent.isBaseEClassProperty(property.id)) {
                    this.propertyBlocks[property.itemClassificationCode.value][0]
                        [this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);
                }
                else {
                    this.propertyBlocks[property.itemClassificationCode.value][1]
                        [this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);
                }
            }
            else {
                if (this.propertyBlocks[property.itemClassificationCode.listID] === undefined) {
                    this.createPropertyBlock(property.itemClassificationCode);
                }

                this.propertyBlocks[property.itemClassificationCode.listID][0][this.PROPERTY_BLOCK_FIELD_PROPERTIES].push(property);
            }
        }

        // strip the hash into an array of its values
        let propertyBlocksValues = this.propertyBlocks = (<any>Object).values(this.propertyBlocks);

        // empty property blocks
        this.propertyBlocks = [];

        // flatten the array of arrays and put it into propertyBlocks
        for (let block of propertyBlocksValues)
            this.propertyBlocks = this.propertyBlocks.concat(block);
    }

    private createEClassPropertyBlocks(code: Code) {
        let basePropertyBlock: any = {};
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = code.name + " (" + code.listID + " - Base)";
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        basePropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];

        let specificPropertyBlock: any = {};
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = code.name + " (" + code.listID + " - Specific)";
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        specificPropertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];

        let eClassGroup = [basePropertyBlock, specificPropertyBlock];
        this.propertyBlocks[code.value] = eClassGroup;
    }

    private createPropertyBlock(itemClassificationCode: Code) {
        let propertyBlock: any = {};
        propertyBlock[this.PROPERTY_BLOCK_FIELD_NAME] = itemClassificationCode.listID;
        propertyBlock[this.PROPERTY_BLOCK_FIELD_ISCOLLAPSED] = true;
        propertyBlock[this.PROPERTY_BLOCK_FIELD_PROPERTIES] = [];

        this.propertyBlocks[itemClassificationCode.listID] = [];
        this.propertyBlocks[itemClassificationCode.listID].push(propertyBlock);
    }

    private static isBaseEClassProperty(id: string): boolean {
        let pid: string = id;
        if (pid == "0173-1#02-AAD931#005" ||
            pid == "0173-1#02-AAO663#003" ||
            pid == "0173-1#02-BAB392#012" ||
            pid == "0173-1#02-AAO677#002" ||
            pid == "0173-1#02-AAO676#003" ||
            pid == "0173-1#02-AAO736#004" ||
            pid == "0173-1#02-AAO735#003" ||
            pid == "0173-1#02-AAP794#001" ||
            pid == "0173-1#02-AAQ326#002" ||
            pid == "0173-1#02-BAE391#004" ||
            pid == "0173-1#02-AAP796#004" ||
            pid == "0173-1#02-BAF831#002" ||
            pid == "0173-1#02-AAM551#002" ||
            pid == "0173-1#02-AAU734#001" ||
            pid == "0173-1#02-AAU733#001" ||
            pid == "0173-1#02-AAU732#001" ||
            pid == "0173-1#02-AAU731#001" ||
            pid == "0173-1#02-AAU730#001" ||
            pid == "0173-1#02-AAU729#001" ||
            pid == "0173-1#02-AAU728#001" ||
            pid == "0173-1#02-AAO742#002" ||
            pid == "0173-1#02-AAW336#001" ||
            pid == "0173-1#02-AAW337#001" ||
            pid == "0173-1#02-AAW338#001" ||
            pid == "0173-1#02-AAO057#002") {
            return true;
        } else {
            return false;
        }
    }
}
