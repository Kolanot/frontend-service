import {Component, AfterViewInit, Input, OnChanges, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import { ExplorativeSearchService } from './explorative-search.service';
import { Router } from '@angular/router';


export class Leaf {
    name: string;
    url: string;
    color: string;
    conceptSource: string;
    propertySource: string;
    objectPropertySource: string;
    children: Leaf[] = [];
}

@Component({
    selector: 'explore-search-details',
    templateUrl: './explorative-search-details.component.html',
    styleUrls: ['./explorative-search-details.component.css'],
    providers: [ExplorativeSearchService],
    encapsulation: ViewEncapsulation.None
})


export class ExplorativeSearchDetailsComponent implements AfterViewInit, OnChanges {
    @Input() config: Object; // this comes from `explorative-search-form.component` (Parent)
    @Input() lang: string; // language selection which comes from the Parent
    private hiddenElement = false; // to hide the graph or table
    /*Parameters that will be passed to `explorative-search-filter.component (Child)*/
    arrayPassedToChild: any[] = []; // this is passed to the child NOW
    private filterQueryRoot: string;
    private filterQueryRootUrl: string;
    filterQuery: string;
    private nodeFilterName: string;
    private filterJSON: Object;
    /* To store selected properties*/
    private selectedProperties: Array<string> = [];
    private selectedNodeKeys: any[] = [];
    private _nodeKeysBackup: any[] = [];
    /* SPARQL TABLE Variables */
    private sparqlSelectedOption: Object;
    private _temp_path_Json = { urlOfProperty: '', path: []};
    private tableJSON: Object = {
        parametersIncludingPath: [],
        parameters: [],
        parametersURL: [],
        filters: [],
        language: '',
        propertySources: []
    };
    private _tableJSONPaths = []; // for storing Paths when the figure is rendered again..
    private collectionOfFiltersFromChildren: any[] = []; // filters from the Children Components
    private _optSelectJSON = {};
    private _negotiation_id;
    private _negotiation_catalogue_id;
    public negotiationEnable = false;

    /*Final Data to be sent back to parent for processing.*/
    finalSelectionJSON: Object;

    /*The API response from tableJSON will be stored in tableResult*/
    tableResult: any;

    private _error_detected_getProperties = false;
    private _error_detected_getLogicalView = false;
    private _error_detected_getSPARQLSelect = false;
    private _error_detected_getTableValues = false;
    private _warning_table_results = false;
    private _warning_selection = false;
    private root: any;
    // BackEnd Service + Modal Service declared here
    constructor(private expSearch: ExplorativeSearchService, private router: Router) { }

    /**
     * using OnChanges LifeCycle Hook for incoming Configuration
     * from the Parent Component
     */
    ngOnChanges(): void {
        if (!this.config) { return; }
        // console.log(this.config['viewStructure']); // DEBUG -CHECK
        // recApproach.generateGraphRecApproach(this.config, this.myDiagram, this.$, 2);
        // Reset Selections for New Diagram.. Usually when the user clicks the button about the product..
        this.selectedProperties = [];
        this.tableResult = {};
        this.filterJSON = {};
        this.filterQueryRoot = '';
        this.filterQueryRootUrl = '';
        this.filterQuery = '';
        this.nodeFilterName = '';
        this.selectedNodeKeys = [];
        // reset errors/warnings too since this is a fresh start.
        this._error_detected_getSPARQLSelect = false;
        this._error_detected_getTableValues = false;
        this._error_detected_getProperties = false;
        this._error_detected_getLogicalView = false;
        this._warning_table_results = false;
        this._warning_selection = false;
        this.arrayPassedToChild = [];
        this.tableJSON = {
            parametersIncludingPath: [],
            parameters: [],
            parametersURL: [],
            filters: [],
            language: '',
            propertySources: []
        };
        d3.selectAll('svg > *').remove();
        this.ngAfterViewInit();
    }

    /**
     * AfterViewInit LifeCycle Hook for diagram initialization for GoJS
     */
    ngAfterViewInit(): void {
        const self = this;
        const svg = d3.select('svg'),
            width = +svg.attr('width'),
            height = +svg.attr('height'),
            g = svg.append('g').attr('transform', 'translate(' + (width / 3 + 240) + ',' + (height / 3 + 140) + ')');

        const tree = d3.tree()
            .size([2 * Math.PI, 375])
            .separation(function(a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; });
        const root = tree(d3.hierarchy(this.parse_node(this.config['viewStructure'])));
        this.root = root;
        // root.children.forEach(collapse);
        // update(root);
        const link = g.selectAll('.link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', <any>d3.linkRadial()
                .angle(function(d) { return d['x']; })
                .radius(function(d) { return d['y']; }));

        const node = g.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', function(d) { return 'node' + (d.children ? ' node--internal' : ' node--leaf'); })
            .attr('transform', function(d) { return 'translate(' + radialPoint(d.x, d.y) + ')'; })
            .on('click', click)
            .on('dblclick', dblclick);

        node.append('circle')
            .attr('r', 5)
            .style('fill', (d) => {
                if (d.data['color'] === 'green') {
                    return '#0f0';
                } else {
                    if (d.depth === 0) {
                        return '#999';
                    }
                    return '#f00';
                }
            });

        node.append('text')
            .attr('dy', '0.31em')
            .attr('x', function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
            .attr('text-anchor', function(d) { return d.x < Math.PI === !d.children ? 'start' : 'end'; })
            .attr('transform', function(d) {
                return 'rotate(' + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ')'; })
            .text(function(d) { return d.data['name']; });


        function radialPoint(x, y) {
            return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
        }


        function click(d) {
            if (d.depth === 1 && d.data.objectPropertySource !== '') {
                console.log('objectproperty directly connected to root');
                console.log('do nothing');
                console.log(d.id());
            } else {
                d3.select(this).select('circle').transition()
                    .duration(1000)
                    .attr('r', 6);
                self.removePropertyFilter(d);
            }
        }

        function dblclick(d) {
            if (d.depth === 1 && d.data.objectPropertySource !== '') {
                console.log('objectproperty directly connected to root');
                console.log('do nothing');
            } else {
                // console.log(d.data, d.depth);
                // console.log(d.parent);
                d3.select(this).select('circle').transition()
                    .duration(1000)
                    .attr('r', 16);
                self.obtainProperties(d);
            }
        }
    }

    removePropertyFilter(nodeToRemove) {
        console.log(nodeToRemove.data.url);
        let indexToRemove = this.arrayPassedToChild.findIndex(node => node.fName === nodeToRemove.data.name);
        if (indexToRemove > -1) {
            console.log('removing property', indexToRemove);
            this.arrayPassedToChild.splice(indexToRemove, 1);
            this.tableJSON['parametersIncludingPath'].splice(indexToRemove, 1);
            this.tableJSON['parameters'].splice(indexToRemove, 1);
            this.tableJSON['parametersURL'].splice(indexToRemove, 1);
            this.tableJSON['propertySources'].splice(indexToRemove, 1);
        }
        let fIndex = this.tableJSON['filters'].findIndex(node => node.property === encodeURIComponent(nodeToRemove.data.url));
        if (fIndex > -1) {
            this.tableJSON['filters'].splice(fIndex, 1);
        }

    }

    obtainProperties(nodeInfo: any) {
        const self = this;
        let _jsonForFilter = {'concept': '', 'property': '', 'amountOfGroups': 3, 'language': this.lang};
        let jsonFilterForEachChild = {'fName': '', 'fQuery': '', 'fQueryRoot': '', 'fQueryRootUrl': ''};
        let pathForSparqlJson = {'urlOfProperty': '', path: []};
        // console.log(nodeInfo);
        if (nodeInfo.depth === 1 && nodeInfo.data.objectPropertySource === '') { // direct dataproperties to root
            console.log('dataproperty directly connected to the root');
            _jsonForFilter.concept = encodeURIComponent(nodeInfo.parent.data.url);
            _jsonForFilter.property = encodeURIComponent(nodeInfo.data.url);
            jsonFilterForEachChild['fName'] = nodeInfo.data.name;
            jsonFilterForEachChild['fQuery'] = nodeInfo.data.url;
            jsonFilterForEachChild['fQueryRoot'] = nodeInfo.parent.data.name;
            jsonFilterForEachChild['fQueryRootUrl'] = nodeInfo.parent.data.url;
            // console.log(_jsonForFilter);
            this.expSearch.getPropertyValues(_jsonForFilter)
                .then(res => {
                    console.log(res, typeof(res));
                    if (Object.keys(res).length !== 0) {
                        this.filterJSON = res;
                        jsonFilterForEachChild['filterJSON'] = this.filterJSON;
                    }
                });
            setTimeout(() => { // necessary for loading the checkboxes in Filter
                this.tableJSON['language'] = this.lang;
                this.arrayPassedToChild.push(jsonFilterForEachChild);
                // console.log(this.arrayPassedToChild);
                pathForSparqlJson.path.push({'concept': _jsonForFilter.concept});
                pathForSparqlJson.urlOfProperty = _jsonForFilter.property;
                this.tableJSON['parametersIncludingPath'].push(pathForSparqlJson);
                this.tableJSON['concept'] = _jsonForFilter.concept;
                this.tableJSON['parameters'].push(nodeInfo.data.name);
                this.tableJSON['parametersURL'].push(encodeURIComponent(nodeInfo.data.url));
                this.tableJSON['propertySources'].push(nodeInfo.data.propertySource);
            }, 1000);
        } else if (nodeInfo.depth > 1 && nodeInfo.data.objectPropertySource === '') {
            console.log('dataprop -> objectproperty dir -> root');
            let ancestors = nodeInfo.ancestors();
            let rootNode = ancestors.pop();
            console.log(rootNode.data);
            pathForSparqlJson.path.push({concept: encodeURIComponent(rootNode.data.url)});
            pathRec(ancestors);
            console.log(pathForSparqlJson);
            _jsonForFilter.concept = encodeURIComponent(nodeInfo.parent.data.url);
            _jsonForFilter.property = encodeURIComponent(nodeInfo.data.url);
            jsonFilterForEachChild['fName'] = nodeInfo.data.name;
            jsonFilterForEachChild['fQuery'] = nodeInfo.data.url;
            jsonFilterForEachChild['fQueryRoot'] = nodeInfo.parent.data.name;
            jsonFilterForEachChild['fQueryRootUrl'] = nodeInfo.parent.data.url;
            // console.log(_jsonForFilter);
            this.expSearch.getPropertyValues(_jsonForFilter)
                .then(res => {
                    console.log(res, typeof(res));
                    if (Object.keys(res).length !== 0) {
                        this.filterJSON = res;
                        jsonFilterForEachChild['filterJSON'] = this.filterJSON;
                    }
                });
            setTimeout(() => { // necessary for loading the checkboxes in Filter
                this.tableJSON['language'] = this.lang;
                this.arrayPassedToChild.push(jsonFilterForEachChild);
                // console.log(this.arrayPassedToChild);
                // pathForSparqlJson.path.push({'concept': _jsonForFilter.concept});
                // pathForSparqlJson.urlOfProperty = _jsonForFilter.property;
                this.tableJSON['parametersIncludingPath'].push(pathForSparqlJson);
                this.tableJSON['concept'] = encodeURIComponent(rootNode.data.url);
                this.tableJSON['parameters'].push(nodeInfo.data.name);
                this.tableJSON['parametersURL'].push(encodeURIComponent(nodeInfo.data.url));
                this.tableJSON['propertySources'].push(nodeInfo.data.propertySource);
            }, 1000);
        } else if (nodeInfo.depth > 1 && nodeInfo.data.objectPropertySource !== '') {
            console.log('objprop -> objprop -> root');
            console.log(nodeInfo.ancestors());
            askExtension();
        }

        function askExtension() {
            let newJSON = {};
            newJSON['concept'] = nodeInfo.data.url;
            newJSON['conceptURIPath'] = [];
            self.config['completeStructure']
                ['objectproperties'][nodeInfo.parent.data.url]['objectproperties']
                [nodeInfo.data.url]['conceptURIPath'].forEach(u => {
                newJSON['conceptURIPath'].push(u);
            });
            newJSON['language'] = self.lang;
            newJSON['stepRange'] = 1;
            newJSON['frozenConcept'] = self.config['completeStructure']
                ['objectproperties'][nodeInfo.parent.data.url]['frozenConcept'];
            newJSON['distanceToFrozenConcept'] = nodeInfo.depth;
            newJSON['oldJsonLogicalView'] = self.config['completeStructure'];
            newJSON['currentSelections'] = [];
            self.tableJSON['parametersURL'].forEach(u => {
                newJSON['currentSelections'].push([encodeURIComponent(u)]);
            });
            console.log('newJSON', newJSON);
            self.expSearch.getLogicalView(newJSON)
                .then(res => {
                    // console.log(res['viewStructure']);
                    self.config = res;
                });
            setTimeout(() => {
                d3.selectAll('svg > *').remove();
                self.ngAfterViewInit();
                console.log(nodeInfo.parent.data.name + '/' + nodeInfo.data.name);
            }, 1000);
        }

        function pathRec(ances) {
            if (ances.length !== 1) {
                let immediateParent = ances.pop();
                pathForSparqlJson.path.push(
                    {concept: encodeURIComponent(immediateParent.data.url),
                        urlOfProperty: encodeURIComponent(immediateParent.data.objectPropertySource)
                    });
                pathRec(ances);
            }
            pathForSparqlJson.urlOfProperty = encodeURIComponent(ances[0].data.url);
        }
    }

    handleFilterSelectionUpdated(ev: any) {
        console.log(ev);
        for (let eachFilterObtained of ev.filter) {
            let targetProperty = encodeURIComponent(eachFilterObtained.property);
            let indexForInsertion = this.tableJSON['parametersURL'].findIndex(ind => ind === targetProperty);
            console.log('index', indexForInsertion);
            if (indexForInsertion > -1) {
                this.tableJSON['filters'].splice(indexForInsertion, 0, {
                    'property': encodeURIComponent(eachFilterObtained['property']),
                    'min': eachFilterObtained['values'][0],
                    'max': eachFilterObtained['values'][1]
                });
            }
        }
    }

    genTable() {
        this.expSearch.getTableValues(this.tableJSON)
            .then(res => {
                this.tableResult = res;
            });
    }

    getSparqlOptionalSelect(indexUUID) {
        console.log(indexUUID);
        let optSPARQLQuery = {uuid: encodeURIComponent(this.tableResult.uuids[indexUUID].trim()), 'language': this.lang};
        console.log(optSPARQLQuery);
        this.expSearch.getOptionalSelect(optSPARQLQuery)
            .then(res => {
                this.sparqlSelectedOption = res;
                if (this.sparqlSelectedOption['columns'].findIndex(i => i === 'id') >= 0 &&
                    this.sparqlSelectedOption['columns'].findIndex(j => j === 'catalogueId') >= 0) {
                    console.log('Negotiation can exist');
                    this.negotiationEnable = true;
                    let index_id = this.sparqlSelectedOption['columns'].findIndex(i => i === 'id');
                    let index_catalogue = this.sparqlSelectedOption['columns'].findIndex(i => i === 'catalogueId');
                    this._negotiation_id = this.sparqlSelectedOption['rows'][0][index_id];
                    this._negotiation_catalogue_id = this.sparqlSelectedOption['rows'][0][index_catalogue];
                    console.log(this._negotiation_catalogue_id, this._negotiation_id);
                } else {
                    this.negotiationEnable = false;
                }
            });
        this.hiddenElement = true;
    }

    negotiation(): void {
        this.router.navigate(['/simple-search/details'],
            { queryParams: {catalogueId: this._negotiation_catalogue_id, id: this._negotiation_id} });
    }

    parse_node(jsonVal: any): any {
        let node = new Leaf();
        node.name = jsonVal.concept.translatedURL;
        node.url = jsonVal.concept.url;
        node.conceptSource = jsonVal.concept.conceptSource;
        node.objectPropertySource = jsonVal.objectPropertySource;


        // adding dataproperties
        for (let datProp of jsonVal['dataproperties']) {
            node.children.push({name: datProp['translatedURL'], url: datProp['url'],
                color: 'green', conceptSource: datProp['conceptSource'], propertySource: datProp['propertySource'],
                objectPropertySource: '',
                children: []});
        }

        // adding objectproperties
        for (let objKey in jsonVal['objectproperties']) {
            if (jsonVal['objectproperties'].hasOwnProperty(objKey)) {
                // recursion..
                node.children.push(
                    this.parse_node(jsonVal['objectproperties'][objKey])
                );
            }
        }
        return {name: node.name,
            url: node.url, color: node.color,
            conceptSource: node.conceptSource,
            propertySource: node.propertySource,
            objectPropertySource: node.objectPropertySource,
            children: node.children};
    }
}
