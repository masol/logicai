import { setEmit } from "@app/preload";
// lib/events/bus.ts

/**
 * 将storage变动事件，封装为标准的mitt event bus.
 */

import mitt from 'mitt';
import type { Events, StorageEvent } from './evtbus.type';
import { browser } from '$app/environment';

class EventBus {
	private static instance: EventBus;
	private emitter = mitt<Events>();
	private initialized = false;

	private constructor() { }

	static getInstance() {
		if (!this.instance) {
			this.instance = new EventBus();
		}
		return this.instance;
	}

	init() {
		if (this.initialized || !browser) {
			return;
		}

		window.addEventListener('storage', (e) => {
			this.emitter.emit('storage', {
				key: e.key,
				newValue: e.newValue,
				oldValue: e.oldValue
			});
		});

		// 创建一个包装函数来调用 eventBus
		const emitEventBusEvent = (name: string, data: Record<string, any>) => {
			EventBus.getInstance().emit(name, data);
		};

		setEmit(emitEventBusEvent);


		this.initialized = true;
	}

	on<K extends keyof Events>(type: K, handler: (event: Events[K]) => void) {
		this.emitter.on(type, handler);
	}

	off<K extends keyof Events>(type: K, handler: (event: Events[K]) => void) {
		this.emitter.off(type, handler);
	}

	emit<K extends keyof Events>(type: K, event: Events[K]) {
		this.emitter.emit(type, event);

		if (type === 'storage' && browser && this.isStorageEvent(event) && event.key) {
			if (event.newValue === null) {
				localStorage.removeItem(event.key);
			} else if (event.newValue) {
				localStorage.setItem(event.key, event.newValue);
			}
		}
	}

	private isStorageEvent(event: unknown): event is StorageEvent {
		return (
			typeof event === 'object' &&
			event !== null &&
			'key' in event &&
			'newValue' in event &&
			'oldValue' in event
		);
	}

	// 辅助方法：包装 localStorage 操作
	public setItem(key: string, value: string): void {
		if (browser) {
			const oldValue = localStorage.getItem(key);
			localStorage.setItem(key, value);
			// 手动触发存储事件（因为同一个窗口的 localStorage 操作不会触发 storage 事件）
			this.emit('storage', {
				key,
				newValue: value,
				oldValue
			});
		}
	}

	public getItem(key: string): string | null {
		if (browser) {
			return localStorage.getItem(key);
		}
		return null;
	}

	public removeItem(key: string): void {
		if (browser) {
			const oldValue = localStorage.getItem(key);
			localStorage.removeItem(key);
			this.emit('storage', {
				key,
				newValue: null,
				oldValue
			});
		}
	}
}


export const eventBus = EventBus.getInstance();

