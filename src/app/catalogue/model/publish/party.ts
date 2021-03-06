import {Person} from "./person";
import {Contact} from "./contact";
import {Certificate} from "./certificate";
import {Address} from "./address";
import {PartyIdentification} from './party-identification';
import {PartyName} from './party-name';
import {TradingPreferences} from './trading-preferences';
/**
 * Created by suat on 12-May-17.
 */
export class Party {
    constructor(
        public hjid = null,
        public ppapCompatibilityLevel: number = 0,
        public contact:Contact = new Contact(),
        public postalAddress: Address = null,
        public person:Person[] = [new Person()],
        public certificate: Certificate[] = null,
        public partyIdentification: PartyIdentification[] = null,
        public partyName: PartyName[] = null,
        public salesTerms:TradingPreferences = null,
        public processID:string[] = [],
        public federationInstanceID:string = null
    ) {  }

}
