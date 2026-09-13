/* Shared behavior is copied into each page's independent script. */
(() => {
  'use strict';
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-navigation');
  const smallScreen = window.matchMedia('(max-width: 820px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const setMenu = (open, restoreFocus = false) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.hidden = !open;
    document.body.classList.toggle('nav-open', open);
    toggle.querySelector('[data-menu-open]').hidden = open;
    toggle.querySelector('[data-menu-close]').hidden = !open;
    if (restoreFocus) toggle.focus();
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (toggle?.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { setMenu(false, true); return; }
    if (event.key !== 'Tab') return;
    const focusable = [toggle, ...menu.querySelectorAll('a[href],button:not([disabled])')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  smallScreen.addEventListener('change', () => { if (!smallScreen.matches) setMenu(false); });
  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('is-pending');
      observer.observe(element);
    });
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending'));
    });
  }
})();

/* Contact page */
/* Local-only enquiry preparation. No network requests or browser storage. */
(() => {
  'use strict';

  const form = document.getElementById('project-form');
  if (!form) return;

  const fields = {
    name: document.getElementById('contact-name'),
    email: document.getElementById('contact-email'),
    company: document.getElementById('contact-company'),
    service: document.getElementById('contact-service'),
    message: document.getElementById('contact-message'),
  };
  const serviceLabels = {
    web: 'Web Solutions',
    mobile: 'Mobile Applications',
    software: 'Custom Software',
    consulting: 'Collaboration & Consulting',
    unsure: 'I’m still exploring',
  };
  const review = document.getElementById('enquiry-review');
  const status = document.getElementById('contact-status');
  const formError = document.getElementById('contact-form-error');
  const prepareButton = document.getElementById('prepare-enquiry');
  let enquiry = null;

  const requestedService = new URLSearchParams(window.location.search).get('service');
  if (Object.prototype.hasOwnProperty.call(serviceLabels, requestedService)) {
    fields.service.value = requestedService;
  }

  function validateField(key) {
    const field = fields[key];
    const value = field.value.trim();
    let message = '';
    if (key === 'name' && !value) message = 'Please enter your name.';
    if (key === 'email') {
      if (!value) message = 'Please enter your email address.';
      else if (field.validity.typeMismatch) message = 'Please enter a valid email address.';
    }
    if (key === 'service' && !Object.prototype.hasOwnProperty.call(serviceLabels, value)) {
      message = 'Please select a service, or choose “I’m still exploring”.';
    }
    if (key === 'message' && !value) message = 'Please tell us a little about your project.';

    document.getElementById(`contact-${key}-error`).textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !message;
  }

  ['name', 'email', 'service', 'message'].forEach((key) => {
    fields[key].addEventListener(key === 'service' ? 'change' : 'input', () => {
      if (fields[key].getAttribute('aria-invalid') === 'true') validateField(key);
      if (!form.querySelector('[aria-invalid="true"]')) formError.textContent = '';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = '';
    const invalidKeys = ['name', 'email', 'service', 'message'].filter((key) => !validateField(key));
    if (invalidKeys.length) {
      formError.textContent = 'Please check the highlighted fields before continuing.';
      fields[invalidKeys[0]].focus();
      return;
    }
    formError.textContent = '';
    enquiry = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value.trim()]));
    Object.keys(fields).forEach((key) => {
      document.getElementById(`review-${key}`).textContent = key === 'service' ? serviceLabels[enquiry[key]] : enquiry[key];
    });
    document.getElementById('review-company-row').hidden = !enquiry.company;
    form.hidden = true;
    review.hidden = false;
    document.getElementById('enquiry-review-title').focus();
  });

  document.getElementById('edit-enquiry').addEventListener('click', () => {
    review.hidden = true;
    form.hidden = false;
    status.textContent = '';
    fields.name.focus();
  });

  document.getElementById('download-enquiry').addEventListener('click', () => {
    if (!enquiry) return;
    const lines = [
      'VSPH — Project enquiry',
      'Prepared locally. This enquiry has not been sent to VSPH.',
      '',
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      ...(enquiry.company ? [`Company: ${enquiry.company}`] : []),
      `Service: ${serviceLabels[enquiry.service]}`,
      '',
      'Project details',
      enquiry.message,
      '',
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vsph-project-enquiry.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Your download has started. This enquiry has not been sent to VSPH.';
  });

  prepareButton.type = 'submit';
  prepareButton.disabled = false;
})();
