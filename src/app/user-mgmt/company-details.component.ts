import { Component, OnInit, Input } from "@angular/core";
import { UserService } from "./user.service";
import { ActivatedRoute, Router} from "@angular/router";
import { CookieService } from "ng2-cookies";
import * as myGlobals from "../globals";
import * as moment from "moment";
import { CallStatus } from "../common/call-status";
import { CompanySettings } from "./model/company-settings";
import { AppComponent } from "../app.component";
import {selectValueOfTextObject, sanitizeLink} from '../common/utils';
import {TranslateService} from '@ngx-translate/core';
import {CredentialsService} from './credentials.service';
import {FEDERATIONID} from '../catalogue/model/constants';
import {AgentService} from "./agent.service";

type SelectedTab = "SELLING_AGENT"
    | "BUYING_AGENT";

@Component({
    selector: "company-details",
    templateUrl: "./company-details.component.html"
})
export class CompanyDetailsComponent implements OnInit {

	@Input() details: CompanySettings = null;
	@Input() hideTitle: boolean = false;
    @Input() platformManagerMode: boolean = true;
    managementMode: boolean = false;
    imgEndpoint = myGlobals.user_mgmt_endpoint+"/company-settings/image/";
    initCallStatus: CallStatus = new CallStatus();
    vatCallStatus: CallStatus = new CallStatus();
    party : any = {};
    selectValueOfTextObject = selectValueOfTextObject;
    getLink = sanitizeLink;
	config = myGlobals.config;
    debug = myGlobals.debug;
    agentList = [];
    buyingAgentList = [];
    selectedTab: SelectedTab = "BUYING_AGENT";

    showAgents = this.config.showAgent
    showEmptyPageSA = false;
    showEmptyPageBA = false;

    constructor(private cookieService: CookieService,
                private agentService: AgentService,
                private userService: UserService,
                public appComponent: AppComponent,
                private translate: TranslateService,
                private credentialsService: CredentialsService,
                public route: ActivatedRoute,
                public router: Router) {
    }

    ngOnInit() {
  		if(!this.details) {
  			this.route.queryParams.subscribe(params => {
          const viewMode = params['viewMode'];
          const id = params['id'];
          let federationId = params['delegateId'];
          if(!federationId){
              federationId = FEDERATIONID()
          }
          if (viewMode && viewMode == 'mgmt') {
            this.managementMode = true;
          }
  				if (id) {

            if (this.config.loggingEnabled) {
              let cID = "";
              if (id)
              cID = id;
	            let userId = this.cookieService.get("user_id");
              let log = {
                "@timestamp": moment().utc().toISOString(),
                "level": "INFO",
                "serviceID": "frontend-service",
                "userId": userId,
                "companyId": cID,
                "activity": "company_visit"
              };

              if (this.debug)
                console.log("Writing log "+JSON.stringify(log));
              this.credentialsService.logUrl(log)
                .then(res => {})
                .catch(error => {});
            }

            this.party.partyId = id;
            this.party.federationInstanceID = federationId;
            this.initCallStatus.submit();
  					this.userService.getSettingsForParty(id,federationId).then(details => {
  						if (myGlobals.debug) {
  							console.log("Fetched details: " + JSON.stringify(details));
  						}
  						this.details = details;
  						this.initCallStatus.callback("Details successfully fetched", true);
  					})
  					.catch(error => {
  						this.initCallStatus.error("Error while fetching company details", error);
  					});
  				}
  			});
  		}
      else {
        this.party.partyId = this.details.companyID;
      }

        this.getAllSellingAgents(this.party.partyId);
        this.getAllBuyingAgents(this.party.partyId);
    }

    validateVAT() {
      this.vatCallStatus.submit();
      this.userService.validateVAT(this.details.details.vatNumber)
        .then(response => {
          this.vatCallStatus.callback("VAT checked", true);
          setTimeout(function(){
            if (response.IsValid) {
                if (response.BusinessName && response.BusinessName != "" && response.BusinessName != "---")
                    alert("The VAT is valid and registered for "+response.BusinessName+".");
                else
                  alert("The VAT is valid.");
            }
            else {
              alert("The VAT is invalid.");
            }
          },50);
        })
        .catch(error => {
            this.vatCallStatus.error("Error while checking VAT", error);
        });
    }

    formatDate(date:string) {
      return moment(date).format("YYYY-MM-DD");
    }

    openSearchPage() {
      //var fq = "manufacturer.legalName:\""+selectValueOfTextObject(this.details.details.legalName)+"\"";
      var fq = "manufacturer.id:\""+this.details.companyID+"\"";
      this.router.navigate(['/simple-search'], {
  			queryParams: {
  				q: "*",
  				fq: encodeURIComponent(fq),
          p: 1,
          searchContext: null,
          cat: "",
  				catID: "",
          sIdx: "Products",
          sTop: "prod"
        }
  		});
    }

    getAllSellingAgents(id){
        this.agentService.getAllSellingAgents(id).then((data) => {
            this.agentList = data;
            if(data.length == 0){
                this.showEmptyPageSA = true;
            }
        }).catch(err => {
            console.log('Error when retrieving selling agents')
        });
    }

    getAllBuyingAgents(id){
        this.agentService.getAllBuyingAgents(id).then((data) => {
            this.buyingAgentList = data;
            if(data.length == 0){
                this.showEmptyPageBA = true;
            }
        }).catch(err => {
            console.log('Error when retrieving selling agents')
        });
    }

    deactivateAllAgents() {

    }

    onSelectTab(event: any, id: any) {
        event.preventDefault();
        this.selectedTab = id;
    }

}
