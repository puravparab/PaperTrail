const savePaperBtn = () => {
  const te1 = document.querySelectorAll('h1.title.mathjax');
  const te2 = document.querySelectorAll('p.title.mathjax');
  const te3 = document.querySelectorAll('div.list-title.mathjax');
  
  const titleElements = [...te1, ...te2, ...te3];
  
  // Iterate through papers and determine if they are saved or not
  titleElements.forEach(titleElement => {
    const titleEl = titleElement as HTMLElement; // Type assertion
    const defaultColor = getComputedStyle(titleEl).color; // Save default color
    
    const plusMinusIcon = document.createElement('span');
    plusMinusIcon.textContent = '[save]';
    plusMinusIcon.style.color = 'green';
    plusMinusIcon.style.cursor = 'pointer';
    plusMinusIcon.style.marginLeft = '5px';
    
    let isTitleSaved = false;
    
    plusMinusIcon.addEventListener('click', () => {
      if (isTitleSaved) {
        titleEl.style.color = defaultColor; // Restore default color
        plusMinusIcon.textContent = '[save]';
        plusMinusIcon.style.color = 'green';
        isTitleSaved = false;
      } else {
        titleEl.style.color = 'green';
        plusMinusIcon.textContent = '[remove]';
        plusMinusIcon.style.color = 'red';
        isTitleSaved = true;
      }
    });
    
    titleEl.appendChild(plusMinusIcon);
  });
};

savePaperBtn();