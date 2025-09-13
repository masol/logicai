// src/lib/stores/breadcrumb.svelte.ts
export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: string;
}

class BreadcrumbStore {
    private items = $state<BreadcrumbItem[]>([]);

    get value() {
        return this.items;
    }

    set(breadcrumbs: BreadcrumbItem[]) {
        this.items = breadcrumbs;
    }

    push(item: BreadcrumbItem) {
        this.items.push(item);
    }

    pop() {
        return this.items.pop();
    }

    clear() {
        this.items = [];
    }

    replace(index: number, item: BreadcrumbItem) {
        if (index >= 0 && index < this.items.length) {
            this.items[index] = item;
        }
    }

    remove(index: number) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
        }
    }

    length() {
        return this.items.length;
    }
}

export const breadcrumbStore = new BreadcrumbStore();