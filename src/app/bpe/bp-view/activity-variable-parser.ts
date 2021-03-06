import { ProcessType } from "../model/process-type";
import {BpUserRole} from '../model/bp-user-role';
/**
 * Created by suat on 24-Oct-17.
 */

export class ActivityVariableParser {
    static getProcessType(processVariables): ProcessType {
        return processVariables[0]["processDefinitionKey"]
    }

    static getProcessInstanceId(processVariables): ProcessType {
        return processVariables["processInstanceId"]
    }

    static getUserRole(processType:string,buyerPartyId:any,partyId:string){
        let role:BpUserRole = buyerPartyId == partyId ? 'buyer' : 'seller';
        return role;
    }

    static getPrecedingDocumentId(activityVariables:any){
        for(let activityVariable of activityVariables){
            if(activityVariable.name == "responseDocumentID"){
                return activityVariable.value;
            }
        }
        return null;
    }
}
