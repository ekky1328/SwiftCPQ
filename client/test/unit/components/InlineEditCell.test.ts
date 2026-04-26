import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import InlineEditCell from '../../../src/ui/InlineEditCell.vue';

async function startEditing(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('.iec').trigger('click');
  await flushPromises();
}

describe('InlineEditCell', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders display mode by default', () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 'hello', type: 'text' },
    });
    expect(wrapper.find('.iec__display').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.find('.iec__display').text()).toBe('hello');
  });

  it('formats currency values', () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 1234.5, type: 'price' },
    });
    expect(wrapper.find('.iec__display').text()).toMatch(/1,234\.50/);
  });

  it('formats percent values', () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 38.42, type: 'percent' },
    });
    expect(wrapper.find('.iec__display').text()).toBe('38.4%');
  });

  it('renders em-dash for null numeric values', () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: null, type: 'price' },
    });
    expect(wrapper.find('.iec__display').text()).toBe('—');
  });

  it('enters edit mode on click', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 5, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    expect(wrapper.find('input').exists()).toBe(true);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('5');
  });

  it('does not enter edit mode when disabled', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 5, type: 'qty', disabled: true },
    });
    await startEditing(wrapper);
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('Tab commits and emits nav next-cell', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 1, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('7');
    await input.trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('commit')?.[0]).toEqual([7]);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([7]);
    expect(wrapper.emitted('nav')?.[0]).toEqual(['next-cell']);
  });

  it('Shift+Tab commits and emits nav prev-cell', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 1, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('3');
    await input.trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(wrapper.emitted('nav')?.[0]).toEqual(['prev-cell']);
  });

  it('Enter commits and emits nav next-row', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 1, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('9');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('commit')?.[0]).toEqual([9]);
    expect(wrapper.emitted('nav')?.[0]).toEqual(['next-row']);
  });

  it('Shift+Enter commits and emits nav prev-row', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 1, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('2');
    await input.trigger('keydown', { key: 'Enter', shiftKey: true });
    expect(wrapper.emitted('nav')?.[0]).toEqual(['prev-row']);
  });

  it('Escape reverts and does not emit commit/update', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 1, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('999');
    await input.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('commit')).toBeUndefined();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('revert')).toBeTruthy();
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('blur commits when value changed', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 5, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('10');
    await input.trigger('blur');
    expect(wrapper.emitted('commit')?.[0]).toEqual([10]);
    expect(wrapper.emitted('nav')).toBeUndefined();
  });

  it('does not emit commit when value unchanged', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 5, type: 'qty' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('commit')).toBeUndefined();
    expect(wrapper.emitted('nav')?.[0]).toEqual(['next-cell']);
  });

  it('reverts non-numeric input in numeric cell', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 5, type: 'price' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('abc');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('commit')).toBeUndefined();
    expect(wrapper.emitted('revert')).toBeTruthy();
    expect(wrapper.emitted('nav')).toBeUndefined();
  });

  it('commits text values without numeric parsing', async () => {
    const wrapper = mount(InlineEditCell, {
      props: { modelValue: 'old', type: 'text' },
      attachTo: document.body,
    });
    await startEditing(wrapper);
    const input = wrapper.find('input');
    await input.setValue('new value');
    await input.trigger('keydown', { key: 'Tab' });
    expect(wrapper.emitted('commit')?.[0]).toEqual(['new value']);
  });
});
