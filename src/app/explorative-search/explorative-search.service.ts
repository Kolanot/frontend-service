/**
 * This is the Service File for the Explorative Search Component.
 * We Inject a simple HTTP GET Service which will perform a GET on
 * the User's keyword input to the backend server.
 * And return the response in JSON for further parsing.
 */

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';

@Injectable()
export class ExplorativeSearchService {
    private langUrl = myGlobals.languageEndPoint;
    private url = myGlobals.endpoint;
    private logicalUrl = myGlobals.logicalViewEndpoint;
    private propEndPoint = myGlobals.propertyEndPoint;
    private sparqlEndPoint = myGlobals.sparqlEndPoint;
    private sparqlOptionEndPoint = myGlobals.sparqlOptionalSelectEndPoint;
    private userLang: string;


    constructor(private http: Http) { }

    getLanguageSupport(): Promise<any> {
        return this.http.get(this.langUrl)
            .toPromise()
            .then(res => res.json())
            .catch(err => console.log(err));
    }
    // This is where the HTTP GET service is performed
    // for keyword search from user
    searchData(term: string, lang: string): Promise<any> {
        this.userLang = lang;
        console.log('Search term for language: ' + lang + ' and used backend url ' + this.url);
        let input = {'keyword': term, 'language': this.userLang};
        return this.http.get(`${this.url}?inputAsJson=${JSON.stringify(input)}`)
            .toPromise()
            .then(res => res.json())
            .catch(err => console.log(err));
    }

    getLogicalView(term: Object): Promise<any> {
        term['language'] = this.userLang;
        console.log('getlogicalview', this.userLang);
        return this.http.get(`${this.logicalUrl}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(err => console.log(err));
    }

    getPropertyValues(term: Object): Promise<any> {
        console.log('propvalue', term['language']);
        return this.http.get(`${this.propEndPoint}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(err => console.log(err));
    }

    getTableValues(term: Object): Promise<any> {
        console.log('gettableview', term['language']);
        return this.http.get(`${this.sparqlEndPoint}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(err => console.log(err));
    }

    getOptionalSelect(term: Object): Promise<any> {
         console.log('getoptselect', term['language']);
        return this.http.get(`${this.sparqlOptionEndPoint}?inputAsJson=${JSON.stringify(term)}`)
            .toPromise()
            .then(res => res.json())
            .catch(err => console.log);
    }
}
