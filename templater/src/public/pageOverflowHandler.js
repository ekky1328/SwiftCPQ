const DEBUG_MODE = false;

const SHEET_SELECTOR = '.sheet[data-overflow-scan]';
const LOCKED_SELECTOR = '[data-overflow-locked]'
const IGNORE_SELECTOR = '[data-overflow-ignore]'
const CONTENT_SELECTOR = '.content';

const handlePageOverflow = () => {

    const sheets = document.querySelectorAll(SHEET_SELECTOR);
    sheets.forEach(sheet => {
        const content = sheet.querySelector(CONTENT_SELECTOR);
        if (!content) return;

        let currentSheet = sheet;
        let currentSheetBounding = currentSheet.getBoundingClientRect();
        let contentChildren = [...content.children].reverse();
        let newSheet = null;
        let newSheetHeading = null;
        let newContent = null;

        let beforeContentLockedElements = [];
        let afterContentLockedElements = [];

        const lockedElements = sheet.querySelectorAll(LOCKED_SELECTOR);
        lockedElements.forEach(lockedElement => {
            const lockedElementBounding = lockedElement.getBoundingClientRect();
            const contentBounding = content.getBoundingClientRect();

            if (lockedElementBounding.bottom <= contentBounding.top) {
                beforeContentLockedElements.push(lockedElement);
            } 
            
            else if (lockedElementBounding.top >= contentBounding.top) {
                afterContentLockedElements.push(lockedElement);
            }

            if (DEBUG_MODE) {
                const debugLockedBox = document.createElement('div');
                debugLockedBox.style.pointerEvents = 'none';
                debugLockedBox.style.position = 'absolute';
                debugLockedBox.style.top = `${lockedElementBounding.top - currentSheetBounding.top}px`;
                debugLockedBox.style.left = '0';
                debugLockedBox.style.width = '100%';
                debugLockedBox.style.height = `${lockedElementBounding.height}px`;
                debugLockedBox.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                sheet.appendChild(debugLockedBox);
            }
        });

        const beforeContentHeight = beforeContentLockedElements.reduce((acc, el) => acc + el.getBoundingClientRect().height, 0);
        const afterContentHeight = afterContentLockedElements.reduce((acc, el) => acc + el.getBoundingClientRect().height, 0);
        if (DEBUG_MODE) {
            const debugBox = document.createElement('div');
            debugBox.style.pointerEvents = 'none'; 
            debugBox.style.position = 'absolute';
            debugBox.style.top = `${beforeContentHeight}px`;
            debugBox.style.left = '0';
            debugBox.style.right = '0';
            debugBox.style.height = `calc(100% - ${beforeContentHeight + afterContentHeight}px)`;
            debugBox.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            sheet.appendChild(debugBox);
        }

        for (let i = 0; i < contentChildren.length; i++) {
            const child = contentChildren[i];
            const childBounding = child.getBoundingClientRect();

            if (childBounding.bottom < (currentSheetBounding.bottom - afterContentHeight)) {
                break;
            }
            
            if (!newSheet) {
                newSheet = sheet.cloneNode(true);
                const elementsToIgnore = newSheet.querySelectorAll(IGNORE_SELECTOR);
                elementsToIgnore.forEach(element => element.remove());

                newSheetHeading = newSheet.querySelector('.heading');
                if (newSheetHeading) {
                    newSheetHeading.textContent = newSheetHeading.textContent + ' (Continued)'
                }
                newContent = newSheet.querySelector(CONTENT_SELECTOR);
                newContent.innerHTML = '';

                sheet.insertAdjacentElement('afterend', newSheet);

                const continuedMessage = document.createElement('div');
                continuedMessage.className = 'continued-message text-center text-gray-400 mt-4 w-full absolute bottom-8 left-0';
                continuedMessage.textContent = '** Continued on the next page **';
                content.appendChild(continuedMessage);
            }

            let isChildPriorAComment = child.previousElementSibling?.classList?.contains('item-comment');
            if (isChildPriorAComment) {
                newContent.insertBefore(child.previousElementSibling, newContent.firstChild);
            }

            newContent.insertBefore(child, newContent.firstChild);
            
            if (sheet.attributes.getNamedItem('')) {
                const continuedHeading = document.createElement('h3');
                continuedHeading.className = 'font-bold text-lg';
                continuedHeading.textContent = 'Continued';
                newContent.insertBefore(continuedHeading, newContent.firstChild);
            }
        }

        if (newSheet && !newSheetHeading && sheet.getAttribute('data-type') === 'cover_letter') {
            const coverLetterContinuedHeading = document.createElement('h3');
            coverLetterContinuedHeading.className = 'font-bold text-lg';
            coverLetterContinuedHeading.textContent = 'Cover Letter (Continued)';
            newSheet.insertBefore(coverLetterContinuedHeading, newSheet.querySelector(CONTENT_SELECTOR));
        }

    });
};

document.addEventListener('DOMContentLoaded', (event) => {

    setTimeout(() => {
        handlePageOverflow();
    }, 250)

});