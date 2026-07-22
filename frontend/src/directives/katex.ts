import type { Directive } from 'vue';
//import renderMathInElement from 'katex/dist/contrib/auto-render.min.js';


const render = async (el: HTMLElement, bindingValue: string) => {
    if (bindingValue) {
        el.style.visibility = 'hidden';
        el.textContent = bindingValue;

        const { default: renderMathInElement } = await import('katex/dist/contrib/auto-render.min.js');
        renderMathInElement(el, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true },
            ],
            throwOnError: false
        });
        el.style.visibility = 'visible';
    } else {
        el.innerHTML = '';
    }
};

export const vKatex: Directive<HTMLElement, string> = {
    async mounted(el, binding) {
        render(el, binding.value);
    },
    updated(el, binding) {
        if (binding.value !== binding.oldValue) {
            render(el, binding.value);
        }
    },
};
