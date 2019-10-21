import {Component, Input, OnInit} from '@angular/core';
import { BPEService } from "../../bpe.service";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { BPDataService } from "../bp-data-service";
import { DespatchAdvice } from "../../../catalogue/model/publish/despatch-advice";
import { CallStatus } from "../../../common/call-status";
import { Router } from "@angular/router";
import { copy } from "../../../common/utils";
import { Location } from "@angular/common";
import { ProcessInstanceGroup } from '../../model/process-instance-group';
import { ActivityVariableParser } from '../activity-variable-parser';
import {DocumentService} from "../document-service";
import {CookieService} from 'ng2-cookies';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {TranslateService} from '@ngx-translate/core';
import {DespatchLine} from '../../../catalogue/model/publish/despatch-line';

@Component({
    selector: 'dispatch-advice',
    templateUrl: './dispatch-advice.component.html'
})
export class DispatchAdviceComponent implements OnInit {

    dispatchAdvice: DespatchAdvice;

	callStatus: CallStatus = new CallStatus();
    initiatingDispatchAdvice: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    selectedProducts:boolean[];

    @Input() waitingQuantityValue: number = 0;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private router: Router,
                private cookieService: CookieService,
                private translate: TranslateService,
                private documentService: DocumentService) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        if(this.bpDataService.despatchAdvice == null) {
            this.initDispatchAdvice();
        }
        else{
            this.dispatchAdvice = this.bpDataService.despatchAdvice;
            this.populateSelectedProductsArray();
        }
    }

    private populateSelectedProductsArray(){
        this.selectedProducts = [];
        for(let dispatchAdviceLine of this.dispatchAdvice.despatchLine){
            this.selectedProducts.push(true);
        }
    }

    async initDispatchAdvice() {
        this.initiatingDispatchAdvice.submit();

        // since we start a new Despatch Advice after Receipt Advice step, bpDataService.copyDespatchAdvice is not null.
        if(this.bpDataService.copyDespatchAdvice){
            this.bpDataService.initDispatchAdviceWithCopyDispatchAdvice(this.waitingQuantityValue);
        }
        else{
            const processInstanceGroup = await this.bpeService.getProcessInstanceGroup(this.bpDataService.bpActivityEvent.containerGroupId) as ProcessInstanceGroup;
            let details = [];
            for(let id of processInstanceGroup.processInstanceIDs){
                details.push(await Promise.all([
                    this.bpeService.getLastActivityForProcessInstance(id),
                    this.bpeService.getProcessDetailsHistory(id)]
                ));
            }
            details = details.sort(function(a,b){
                let a_comp = a[0].startTime;
                let b_comp = b[0].startTime;
                return b_comp.localeCompare(a_comp);
            });

            // values are needed for despatch advice
            let handlingInst = null;
            let carrierName = null;
            let carrierContact = null;
            let endDate = null;

            for(let processDetails of details){
                const processInstanceId = ActivityVariableParser.getProcessInstanceId(processDetails[0]);
                // Previous process is the one used to create an Dispatch Advice
                // get details of the previous process instance
                if(processInstanceId == this.bpDataService.bpActivityEvent.previousProcessInstanceId){
                    const processType = ActivityVariableParser.getProcessType(processDetails[1]);

                    if(processType == "Transport_Execution_Plan"){
                        const tep: any = await this.documentService.getInitialDocument(processDetails[1]);

                        if(tep.consignment[0].consolidatedShipment[0].handlingInstructions.length > 0){
                            handlingInst = tep.consignment[0].consolidatedShipment[0].handlingInstructions[0];
                        }
                        carrierName = UBLModelUtils.getPartyDisplayName(tep.transportServiceProviderParty);
                        endDate = tep.serviceStartTimePeriod.endDate;
                        if(tep.transportServiceProviderParty.contact){
                            carrierContact = tep.transportServiceProviderParty.contact.telephone;
                        }
                    }
                }
            }

            this.bpDataService.initDispatchAdvice(handlingInst,carrierName,carrierContact, this.waitingQuantityValue, endDate);
        }

        this.dispatchAdvice = this.bpDataService.despatchAdvice;
        this.populateSelectedProductsArray();

        this.initiatingDispatchAdvice.callback("Dispatch Advice initiated", true);
    }

    /*
     * Event Handlers
     */

    onBack(): void {
        this.location.back();
    }

    onSendDispatchAdvice(): void {
        this.callStatus.submit();
        let dispatchAdvice: DespatchAdvice = this.setShipmentOfAllProducts(copy(this.dispatchAdvice));

        this.bpeService.startProcessWithDocument(dispatchAdvice)
            .then(res => {
                this.callStatus.callback("Dispatch Advice sent", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to send Dispatch Advice", error);
            });
    }

    onUpdateDispatchAdvice():void {
        this.callStatus.submit();

        let dispatchAdvice: DespatchAdvice = this.setShipmentOfAllProducts(copy(this.bpDataService.despatchAdvice));

        this.bpeService.updateBusinessProcess(JSON.stringify(dispatchAdvice),"DESPATCHADVICE",this.processMetadata.processInstanceId)
            .then(() => {
                this.documentService.updateCachedDocument(dispatchAdvice.id,dispatchAdvice);
                this.callStatus.callback("Dispatch Advice updated", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to update Dispatch Advice", error);
            });
    }

    /*
     * Getters & Setters
     */

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    setShipmentOfAllProducts(despatchAdvice:DespatchAdvice):DespatchAdvice{
        let dispatchAdviceLines:DespatchLine[] = [];
        let size = despatchAdvice.despatchLine.length;
        for(let i = 0 ; i < size ; i++){
            if(i != 0){
                despatchAdvice.despatchLine[i].shipment[0] = copy(despatchAdvice.despatchLine[0].shipment[0]);
            }
            if(this.selectedProducts[i]){
                dispatchAdviceLines.push(despatchAdvice.despatchLine[i]);
            }
        }

        despatchAdvice.despatchLine = dispatchAdviceLines;
        return despatchAdvice;
    }

    isAtLeastOneProductSelected():boolean{
        for(let isSelected of this.selectedProducts){
            if(isSelected){
                return true;
            }
        }
        return false;
    }
}
