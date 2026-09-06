import { FLOW_ENTERPRISE_CONTACT_ENABLED, serviceEndpoint } from '../lib/living-services';

type Requirements = {
  name: string; email: string; company: string; requirements: string;
  licenses: number; heardAbout: string; website: string;
};

const unavailableMessage = 'Online enquiries are not available yet. Email manav@orionfold.com.';
const successMessage = 'Your requirements are saved. We’ll follow up by email.';
const endpoint = serviceEndpoint('flow-enterprise-request');
const timeoutMs = 20_000;

/** Availability comes only from the compiled service configuration, never DOM attributes. */
export function initFlowEnterpriseContact(): (() => void) | undefined {
  const dialog = document.querySelector<HTMLDialogElement>('#flow-enterprise-dialog');
  const form = document.querySelector<HTMLFormElement>('#flow-enterprise-form');
  const trigger = document.querySelector<HTMLButtonElement>('[data-flow-enterprise-open]');
  if (!dialog || !form || !trigger) return;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset');
  const submit = form.querySelector<HTMLButtonElement>('#flow-enterprise-submit');
  const error = form.querySelector<HTMLElement>('#flow-enterprise-error');
  const status = form.querySelector<HTMLElement>('#flow-enterprise-status');
  const success = dialog.querySelector<HTMLElement>('#flow-enterprise-success');
  const close = dialog.querySelector<HTMLButtonElement>('[data-flow-enterprise-close]');
  if (!fields || !submit || !error || !status || !success || !close) return;

  const controls = Array.from(fields.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([name="website"]), textarea'));
  const lifecycle = new AbortController();
  let request: AbortController | undefined;
  let disposed = false;
  let busy = false;
  let previousPayload = '';
  let previousRequestId = '';
  let returnFocus: HTMLElement | null = null;
  let backdropPress = false;

  function showError(message: string) {
    error!.textContent = message;
    error!.hidden = false;
  }
  function clearError() {
    error!.textContent = '';
    error!.hidden = true;
  }
  function setBusy(value: boolean) {
    busy = value;
    fields!.disabled = value;
    submit!.disabled = value || !FLOW_ENTERPRISE_CONTACT_ENABLED;
    submit!.textContent = value ? 'Saving requirements…' : 'Send requirements';
    form!.setAttribute('aria-busy', String(value));
    status!.textContent = value ? 'Saving your requirements…' : '';
  }
  function readPayload(): Requirements {
    const data = new FormData(form!);
    const text = (key: string) => String(data.get(key) ?? '').trim();
    return {
      name: text('name'), email: text('email').toLowerCase(), company: text('company'),
      requirements: text('requirements'), licenses: Number(text('licenses')),
      heardAbout: text('heardAbout'), website: text('website'),
    };
  }
  function validate(): boolean {
    for (const control of controls) {
      control.setCustomValidity('');
      if (control.required && !control.value.trim()) control.setCustomValidity('Please complete this field.');
      else if (control.maxLength > 0 && control.value.length > control.maxLength) control.setCustomValidity(`Use ${control.maxLength} characters or fewer.`);
      else if (control.name === 'licenses') {
        const count = Number(control.value);
        if (!Number.isInteger(count) || count < 1 || count > 100000) control.setCustomValidity('Enter a whole number from 1 to 100,000.');
      }
    }
    if (form!.checkValidity()) return true;
    showError('Please check the highlighted fields before sending your requirements.');
    const invalid = controls.find(control => !control.validity.valid);
    invalid?.focus();
    invalid?.reportValidity();
    return false;
  }

  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
    if (!success.hidden) {
      success.hidden = true;
      success.textContent = '';
      form.hidden = false;
    }
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    if (busy) close.focus();
    else controls[0]?.focus();
  }, { signal: lifecycle.signal });
  close.addEventListener('click', () => dialog.close(), { signal: lifecycle.signal });
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    if (!disposed && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }, { signal: lifecycle.signal });

  // Native closedby="any" handles modern engines; coordinates preserve light
  // dismissal on engines that support dialog but not that newer attribute.
  function outside(event: MouseEvent) {
    const rect = dialog!.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  dialog.addEventListener('pointerdown', event => { backdropPress = event.target === dialog && outside(event); }, { signal: lifecycle.signal });
  dialog.addEventListener('click', event => {
    if (backdropPress && event.target === dialog && outside(event)) dialog.close();
    backdropPress = false;
  }, { signal: lifecycle.signal });
  form.addEventListener('input', event => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) target.setCustomValidity('');
    clearError();
  }, { signal: lifecycle.signal });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || disposed) return;
    if (!FLOW_ENTERPRISE_CONTACT_ENABLED) {
      showError(unavailableMessage);
      submit.disabled = true;
      return;
    }
    clearError();
    if (!validate()) return;
    const payload = readPayload();
    const fingerprint = JSON.stringify(payload);
    if (fingerprint !== previousPayload || !previousRequestId) {
      previousPayload = fingerprint;
      previousRequestId = crypto.randomUUID();
    }
    const requestId = previousRequestId;
    request = new AbortController();
    const currentRequest = request;
    let timedOut = false;
    const timer = window.setTimeout(() => { timedOut = true; currentRequest.abort(); }, timeoutMs);
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', referrerPolicy: 'no-referrer',
        body: JSON.stringify({ requestId, ...payload }), signal: currentRequest.signal,
      });
      const result: unknown = await response.json();
      if (disposed) return;
      const body = result && typeof result === 'object' ? result as Record<string, unknown> : {};
      const saved = (response.status === 200 || response.status === 202) && body.success === true &&
        body.requestId === requestId && (body.notificationStatus === 'sent' || body.notificationStatus === 'pending');
      if (!saved) {
        showError(typeof body.error === 'string' && body.error.trim()
          ? body.error.slice(0, 600)
          : 'Your enquiry could not be confirmed as saved. Please try again.');
        return;
      }
      form.reset();
      controls.forEach(control => control.setCustomValidity(''));
      previousPayload = '';
      previousRequestId = '';
      form.hidden = true;
      success.textContent = successMessage;
      success.hidden = false;
      if (dialog.open) success.focus();
    } catch {
      if (disposed) return;
      showError(timedOut
        ? 'The request timed out. Your entries are still here. Please try again.'
        : 'We couldn’t confirm your enquiry was saved. Check your connection and try again.');
    } finally {
      window.clearTimeout(timer);
      if (!disposed) setBusy(false);
      if (request === currentRequest) request = undefined;
    }
  }, { signal: lifecycle.signal });

  setBusy(false);
  return () => {
    disposed = true;
    lifecycle.abort();
    request?.abort();
    if (dialog.open) dialog.close();
  };
}

let activeDialog: Element | null = null;
let dispose: (() => void) | undefined;
function mount() {
  const nextDialog = document.querySelector('#flow-enterprise-dialog');
  if (nextDialog === activeDialog) return;
  dispose?.();
  activeDialog = nextDialog;
  dispose = initFlowEnterpriseContact();
}
mount();
document.addEventListener('astro:page-load', mount);
document.addEventListener('astro:before-swap', () => {
  dispose?.();
  dispose = undefined;
  activeDialog = null;
});
