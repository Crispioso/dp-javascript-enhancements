import { HTMLElementEvent } from '../types/types';

export function autoSubmitSearchFilters(): void {
    const forms: NodeListOf<HTMLFormElement> = document.querySelectorAll('.js-auto-submit__form');
    
    if (forms.length === 0) {
        return;
    }
    
    let searchInputTimer: number;
    let hasUnsubmittedChanges: Boolean = false;

    function submitForm(form: HTMLFormElement): void {
        const submitButton: HTMLElement = form.querySelector('input[type="submit"], button[type="submit"]');
        submitButton.click();
    }

    function handleInputChange(event: HTMLElementEvent<HTMLFormElement>): void {
        const form: HTMLFormElement = <HTMLFormElement>event.target.closest('form.js-auto-submit__form');
        
        hasUnsubmittedChanges = true;
        
        if (event.target.getAttribute('type') === "search") {
            window.clearTimeout(searchInputTimer);
            searchInputTimer = window.setTimeout(() => {
                submitForm(form);
            }, 500);
            return;
        }
        
        submitForm(form);
    };

    forms.forEach(form => {
        const inputs: NodeListOf<HTMLFormElement> = form.querySelectorAll('.js-auto-submit__input');
        
        // Prevents a double submit (e.g. if someone is typing and then presses enter after they've stopped)
        form.addEventListener('submit', event => {
            if (!hasUnsubmittedChanges) {
                event.preventDefault();
            }
            hasUnsubmittedChanges = false;
        });
        inputs.forEach(input => {
            ['change', 'paste', 'search'].forEach(eventType => {
                input.addEventListener(eventType, (event: HTMLElementEvent<HTMLFormElement>) => {
                    handleInputChange(event);
                });
            })
        });
    });
}