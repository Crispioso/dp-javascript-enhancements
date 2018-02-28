import {autoSubmitSearchFilters} from './features/auto-submit-search-filters';
import {polyfills, CustomPolyfills} from './polyfills';
import dynamicSearchResults from './features/dynamic-search-results';

function initialiseEnhancements(): void {
    CustomPolyfills.nodeListForEach();
    autoSubmitSearchFilters();
    dynamicSearchResults.initialise();
}

polyfills(initialiseEnhancements);