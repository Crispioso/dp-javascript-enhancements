import { HTMLElementEvent } from '../types/types';
import DynamicBrowseHistory from './dynamic-browse-history';

interface FilterFormData {
    q?: string,
    query?: string,
    filters?: string[],
    sortBy?: string,
    size?: string,
    fromDateDay?: string,
    fromDateMonth?: string,
    fromDateYear?: string,
    toDateDay?: string,
    toDateMonth?: string,
    toDateYear?: string,
}

const queryInputNames = [
    "q", "query", "filter", "sortBy", "size", "fromDateDay", "fromDateMonth", "fromDateYear", "toDateDay", "toDateMonth", "toDateYear"
];

const resultsErrorMessage: HTMLElement = document.createElement('div');
resultsErrorMessage.innerHTML = "<p>Sorry, something went wrong whilst trying to get your search results.</p>";

class DynamicSearchResults {
    resultsElement: HTMLElement;
    queryTextElement: HTMLElement;
    paginationElement: HTMLElement;
    currentQueries: FilterFormData;
    setCurrentQueries: Function;
    dynamicSearchForms: NodeListOf<HTMLFormElement>;

    constructor() {
        this.resultsElement = document.querySelector('.results');
        this.queryTextElement = document.querySelector('.search-page__results-text');
        this.paginationElement = document.querySelector('#js-pagination-container');
        this.dynamicSearchForms = document.querySelectorAll('form.js-auto-submit__form');
        this.currentQueries = {};
    }

    initialise(): void {
        if (this.dynamicSearchForms.length === 0) {
            return;
        }

        this.currentQueries = {
            ...this.currentQueries,
            ...this.mapQueryStringToFormData(location.search)
        };

        DynamicBrowseHistory.initialise((event: PopStateEvent) => {this.handleWindowPopState(event)});

        // Add our initial search state to the history API, so it is not undefined if a user 
        // goes all the way 'back' to the first search
        DynamicBrowseHistory.replace(location.pathname + location.search, {currentQueries: this.currentQueries});

        this.dynamicSearchForms.forEach(form => {
            form.addEventListener('submit', (event: HTMLElementEvent<HTMLFormElement>) => {
                event.preventDefault();
                const formData: FilterFormData = this.buildFormData(event.target);
                const newURL: string = location.pathname + this.mapFormDataToQueryString(formData);
                
                if (newURL === location.pathname + location.search) {
                    return;
                }

                DynamicBrowseHistory.push(newURL, {currentQueries: formData as object});
                this.updateResults(newURL);
                this.currentQueries = formData;
            });
        });
    }

    handleWindowPopState(event: PopStateEvent): void {
        if (!event.state) {
            console.error("No window.history state available to re-render screen and updated URL from");
            return;
        }

        const eventQueries: FilterFormData = event.state.currentQueries;

        this.updateResults(event.state.url);

        const eventFilters: string[] = eventQueries.filters || [];
        const currentFilters: string[] = this.currentQueries.filters || [];
        let changedFilters: string[] = [];
        let filtersHaveChanged: boolean = false;

        if (eventQueries.filters || this.currentQueries.filters) {
            if (!eventQueries.filters && this.currentQueries.filters) {
                filtersHaveChanged = true;
            }
            if (eventQueries.filters && !this.currentQueries.filters) {
                filtersHaveChanged = true;
            }
            if (!filtersHaveChanged && (eventQueries.filters.length !== this.currentQueries.filters.length)) {
                filtersHaveChanged = true;
            }
            if (!filtersHaveChanged && (eventQueries.filters.length > 0 && this.currentQueries.filters.length > 0)) {
                filtersHaveChanged = true;
            }
            
            changedFilters = eventFilters.filter(filter => {
                return currentFilters.indexOf(filter) === -1;
            });
            currentFilters.forEach(filter => {
                if (eventFilters.indexOf(filter) === -1) {
                    changedFilters.push(filter);
                }
            });
    
            filtersHaveChanged = filtersHaveChanged ? true : changedFilters.length > 0;
    
            if (filtersHaveChanged) {
                changedFilters.forEach(filter => {
                    const input: HTMLInputElement = document.querySelector('input[name="filter"][value="' + filter + '"]');
                    input.checked = eventFilters.indexOf(filter) >= 0;
                });
                this.currentQueries.filters = eventFilters;
            }
        }

        for (let index = 0; index < queryInputNames.length; index++) {
            const inputName = queryInputNames[index];
            if (inputName === "filters") {
                continue;
            }

            const input: HTMLInputElement = document.querySelector('input[name="' + inputName + '"]');
            if (!input) {
                continue;
            }

            input.value = eventQueries[inputName] || "";
            this.currentQueries[inputName] = eventQueries[inputName];
        }

        // if (eventQueries.query !== this.currentQueries.query) {
        //     const keywordInput: HTMLInputElement = document.querySelector('input[name="query"]');
        //     keywordInput.value = eventQueries.query || "";
        //     this.currentQueries.query = eventQueries.query;
        // }
        
        // if (eventQueries.fromDateDay !== this.currentQueries.fromDateDay) {
        //     const dateInput: HTMLInputElement = document.querySelector('input[name="fromDateDay"]');
        //     dateInput.value = eventQueries.fromDateDay || "";
        //     this.currentQueries.fromDateDay = eventQueries.fromDateDay;
        // }
        
        // if (eventQueries.fromDateMonth !== this.currentQueries.fromDateMonth) {
        //     const dateInput: HTMLInputElement = document.querySelector('input[name="fromDateMonth"]');
        //     dateInput.value = eventQueries.fromDateMonth || "";
        //     this.currentQueries.fromDateMonth = eventQueries.fromDateMonth;
        // }
        
        // if (eventQueries.fromDateYear !== this.currentQueries.fromDateYear) {
        //     const dateInput: HTMLInputElement = document.querySelector('input[name="fromDateYear"]');
        //     dateInput.value = eventQueries.fromDateYear || "";
        //     this.currentQueries.fromDateYear = eventQueries.fromDateYear;
        // }

        // if (eventQueries.sortBy !== this.currentQueries.sortBy) {
        //     const sortInput: HTMLInputElement = document.querySelector('select[name="sortBy"]');
        //     sortInput.value = eventQueries.sortBy || "";
        //     this.currentQueries.sortBy = eventQueries.sortBy;
        // }
        
        // if (eventQueries.size !== this.currentQueries.size) {
        //     const sizeInput: HTMLInputElement = document.querySelector('select[name="size"]');
        //     sizeInput.value = eventQueries.size || "";
        //     this.currentQueries.size = eventQueries.size;
        // }
    }

    fetchResults(url: string): Promise<{results: HTMLElement, queryText: HTMLElement, pagination: HTMLElement}> {
        
        const fetchOptions: RequestInit = {
            credentials: 'include',
            redirect: 'follow'
        };

        return new Promise((resolve, reject) => {
            fetch(url, fetchOptions).then(response => {
                if (!response.ok) {
                    throw "Invalid status code when fetching a page of search results: " + response.status;
                }
                return response.text();
            }).then((response: string) => {
                const element: HTMLElement = document.createElement('div');
                element.innerHTML = response;
                const results: HTMLElement = element.querySelector('.results');
                
                // Wrap our query text in an HTML element so the DOM can easily be updated with appendChild function
                const queryTextContainer: HTMLElement = document.createElement('div');
                const queryText: HTMLElement = element.querySelector('.search-page__results-text');
                queryTextContainer.innerHTML = queryText.innerHTML;
                
                const pagination: HTMLElement = element.querySelector('#js-pagination-container nav') || document.createElement('div');

                resolve({results, queryText: queryTextContainer, pagination});
            }).catch(error => {
                const errorMsg: HTMLElement = document.createElement("p");
                errorMsg.innerHTML = "There was an error fetching the results";
                reject(error);
            });
        });
    }

    emptyAllDynamicText(): void {
        if (this.resultsElement) {
            while (this.resultsElement.firstChild) {
                this.resultsElement.removeChild(this.resultsElement.firstChild);
            };
        }

        if (this.queryTextElement) {
            while (this.queryTextElement.firstChild) {
                this.queryTextElement.removeChild(this.queryTextElement.firstChild);
            };
        }

        if (this.paginationElement) {
            while (this.paginationElement.firstChild) {
                this.paginationElement.removeChild(this.paginationElement.firstChild);
            };
        }
    }

    updateResults(url: string): void {
        this.fetchResults(url).then((response: {results: HTMLElement, queryText: HTMLElement, pagination: HTMLElement}): void => {
            this.emptyAllDynamicText();
            this.resultsElement.appendChild(response.results);
            this.queryTextElement.appendChild(response.queryText);
            this.paginationElement.appendChild(response.pagination);
        }).catch(error => {
            this.emptyAllDynamicText();
            this.resultsElement.appendChild(resultsErrorMessage);
            this.queryTextElement.appendChild(resultsErrorMessage);
            console.error("Error whilst fetching results for page '" + url + "'", error);
        });
    }

    buildFormData(form: HTMLFormElement): FilterFormData {
        const inputs: NodeListOf<HTMLInputElement> = form.querySelectorAll('input, select');
        // const queriesNotInForm: string[] = [...queryInputNames];
        const currentFormData: FilterFormData = {...this.currentQueries};
        const filters: string[] = []; 
        let newFormData: FilterFormData = {...currentFormData};
        let index: number = 0;
        
        for (index; index < inputs.length; ++index) {
            const element: HTMLInputElement = inputs[index];
            const isHidden: boolean = element.getAttribute("type") === "hidden";
            
            if (element.name === '') {
                continue;
            }

            if (isHidden) {
                continue;
            }

            if (element.name === "filter" && element.checked) {
                // queriesNotInForm.splice(queriesNotInForm.indexOf(element.name), 1);
                filters.push(element.value);
                continue;
            }

            if (element.name === "filter" && !element.checked) {
                continue;
            }

            if (queryInputNames.indexOf(element.name) >= 0) {
                // queriesNotInForm.splice(queriesNotInForm.indexOf(element.name), 1);
                newFormData[element.name] = element.value;
                continue;
            }
        }

        newFormData.filters = filters;

        return newFormData;
    }

    mapQueryStringToFormData(query: string): FilterFormData {
        if (!query) {
            return {}
        }

        const queryParts: string[] = query.replace("?", "").split("&");
        const filters: string[] = [];
        let newFormData: FilterFormData = {};

        for (let index = 0; index < queryParts.length; index++) {
            const query = queryParts[index];
            const name: string = query.split('=')[0];
            const value: string = query.split('=')[1];

            if (name === "filter") {
                filters.push(value);
                continue;
            }

            if (queryInputNames.indexOf(name) >= 0) {
                newFormData[name] = value;
                continue;
            }
        };

        newFormData.filters = filters;
        
        return newFormData;
    }

    mapFormDataToQueryString(formData: FilterFormData): string {
        if (!formData) {
            return;
        };

        let filtersQueries: string = "";
        let queries: string = "";

        if (formData.filters && formData.filters.length > 0) {
            filtersQueries = "&filter=" + formData.filters.join("&filter=");
        }

        for (const key in formData) {
            if (key === "filters") {
                continue;
            }
            if (formData.hasOwnProperty(key)) {
                queries += ("&" + key + "=" + formData[key]);
            }
        }
        
        return queries.replace("&", "?") + filtersQueries;
    }
}

export default new DynamicSearchResults();