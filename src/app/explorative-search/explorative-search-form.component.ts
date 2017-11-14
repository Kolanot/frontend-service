/**
 * This file takes care of the Search button and delete Button
 * Search button: upon clicking the keyword response is fetched
 * from server and displayed on the HTML page.
 * 
 * Delete button: appears once the checkbox beside the keyword is checked
 * upon clicking it the content and the keyword itself are removed from 
 * the HTML file
 *
 * Parent for this class: explorative-search.component
 * Child for this class: explorative-search-details.component
 */

import { Component, OnInit } from '@angular/core';
import { ExplorativeSearchService } from './explorative-search.service';
import { Explorative } from './model/explorative';

/**
 * Array for storing incoming HTTP responses
 * FORMAT: [{keyword: val1, response: someResponse1},
 *  {keyword: val2, response: someResponse2} ..
 * ]
 * A JSON list of searched Keywords and their respective responses
 */
export const OUTPUT: Explorative[] = [];

@Component({
    selector: 'explore-search-form',
    templateUrl: './explorative-search-form.component.html',
    styleUrls: ['./explorative-search-form.component.css'],
    providers: [ExplorativeSearchService]
})


export class ExplorativeSearchFormComponent implements OnInit {

    // checkbox for every keyword in Search History
    // remember: the variable name is same as in the HTML file
    cbInput = true;
    langInput = true;
    language: string = 'en'; // default search in english
    availableLanguages = {};
    // Use the stored data which might further
    // data visualization
    // remember: the variable `Output` is the same as in the HTML file
    Output = OUTPUT;
    visData: Object; // send this to details component
    // For response which constitutes more than one option..
    showMore: boolean[] = [];
    // when unchecked in search history, do not show respective keywords
    showParticularKeyword: boolean[] = [];
    private _error_detected_kw = false;
    private _error_detected_query = false;
    private _warning_kw = false;

    constructor(private expSearch: ExplorativeSearchService) {}

    ngOnInit(): void {
        this.showMore = new Array(this.Output.length);
        this.showMore.fill(false);
        this.showParticularKeyword = new Array(this.Output.length);
        this.showParticularKeyword.fill(false);
        this.expSearch.getLanguageSupport()
            .then(res => this.availableLanguages = res);
    }
    /**
     * Search: will get a HTTP response from the server (HTTP GET)
     *          of the keyword which user inputs.
     * @param inputVal string obtained from the input bar of the HTML file
     * @param inpLang string which language the user queries
     */
    Search(inputVal: string, inpLang: string): void {
        if (!inpLang) {
            // default is english
            inpLang = this.language;
        }
        this.language = inpLang;
        inputVal = inputVal.trim(); // trim whitespaces
        if (!inputVal) { return; } // if no input; do nothing

        // Let the Service do its fetching of data from server
        // console.log(lang)
        this.expSearch.searchData(inputVal, this.language)
                .then(res => {
                    // push the data in to List
                    if (res['conceptOverview'].length !== 0) { // if the keyword does exist..
                        // only then push
                        this.Output.push(<Explorative> {kw: inputVal, resp: res});
                        this._warning_kw = false;
                    } else { // display warning
                        this._warning_kw = true;
                    }
                    this._error_detected_kw = false;
                })
            .catch(error => {
                console.log(error);
                this._error_detected_kw = true;
            });
        // console.log('OUTPUT', this.Output);
    }

    /**
     * deleteKW: if the checkbox(cbInput) is checked then the delete button
     * will appear. On clicking the delete button remove the data from the
     * Output List.
     * @param inputVal string of the selected keyword to be removed
     */
    deleteKW(inputVal: string) {
        // find the matching keyword in the List Output
        const index = this.Output.findIndex(op => op.kw === inputVal);
        if (index > -1) {
            // remove the whole entry from the list
            this.Output.splice(index, 1);
        }
    }

    /**
     * hideKW: if unchecked the resultant keywords should be hidden
     * @param inputIndex index number of the output keyword that needs to hidden
     */
    hideKW(inputIndex: number) {
        if (inputIndex > -1) {
            this.showParticularKeyword[inputIndex] = !this.showParticularKeyword[inputIndex];
        }
    }

    /**
     * getQuery: for the when the user will click a specific keyword button
     * the parameter will be sent as JSON request to get the Visualization values
     * @param inputVal the name of the Button clicked by the User
     */

    getQuery(inputVal: string) {
        // console.log(inputVal);
        // HTTP GET to backend Server for visualization
        // create a JSON request for the queried button
        let temp = {'concept': inputVal.trim(), 'stepRange': 2, 'frozenConcept': inputVal.trim(),
            'language': this.language, 'distanceToFrozenConcept': 0,
            'conceptURIPath': [inputVal.trim()]
        };
        // console.log(JSON.stringify(temp)); // Debug: check
        // get the requested query
        this.expSearch.getLogicalView(temp)
            .then(res => {
                // console.log(res);
                // this.visData = new Array();
                this.visData = res;
                // console.log(this.visData);
                this._error_detected_query = false;
            }
        )
            .catch(error => {
                console.log(error);
                this._error_detected_query = true;
            });
    }

    previousStateRestore() {
        if (!this.visData || !this.language) {
            this.visData = JSON.parse(localStorage.getItem('prevVisData'));
            this.language = localStorage.getItem('prevLanguage');
        }
    }

    previousStateStore() {
        localStorage.setItem('prevVisData', JSON.stringify(this.visData));
        localStorage.setItem('prevLanguage', this.language);
    }
}
