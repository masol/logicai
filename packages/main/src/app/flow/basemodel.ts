import type { AbstractModel, ExecutionContext } from "../task/index.type.js";
import objpath from "object-path";
import { isEmpty } from "remeda";

// 新版装饰器签名（TS 5+）
export function refprop(path: string, defval: any = "") {
    return function (_: unknown, context: ClassFieldDecoratorContext) {
        if (context.kind !== "field") return;

        context.addInitializer(function (this: any) {
            const propertyKey = String(context.name);
            const actualPath = path || propertyKey;

            Object.defineProperty(this, propertyKey, {
                get() {
                    // 保留原行为，同时允许返回任意类型
                    const value = this.get(actualPath, defval);
                    return value;
                },
                set(v: any) {
                    // 允许任意类型写入
                    this.set(actualPath, v);
                },
                enumerable: true,
                configurable: true,
            });
        });
    };
}

// 独立纯函数：判断任意值是否“有内容”（深度）
export function hasValueDeep(val: any): boolean {
    if (val == null) return false;
    if (isEmpty(val)) return false;
    if (typeof val === "string") return val.trim().length > 0;

    if (Array.isArray(val)) {
        return val.some(hasValueDeep);
    }

    if (typeof val === "object") {
        return Object.values(val).some(hasValueDeep);
    }

    // number, boolean, function, symbol 等都认为“有值”
    return true;
}

export function hasValueEmpty(val: any): boolean {
    if (val == null) return true;
    if (isEmpty(val)) return true;
    if (typeof val === "string") return val.trim().length === 0;

    if (Array.isArray(val)) {
        return val.some(hasValueEmpty);
    }

    if (typeof val === "object") {
        return Object.values(val).some(hasValueEmpty);
    }

    // number, boolean, function, symbol 等都认为“有值”.因此返回false.
    return false;
}

/**
 * 流程模型的抽象基类，提供运行时上下文管理、基于路径的数据访问，以及任务链的单例工厂逻辑。
 *
 * @说明
 * - 继承 `BaseModel` 的模型可访问共享运行时上下文（`refctx`）和基础路径（`base`），用于数据作用域操作。
 * - 静态方法 `inst` 保证每个执行上下文只实例化一个模型（单例），优先使用静态 `key` 属性，否则用类名。
 * - 提供深层路径访问工具方法（`get`、`set`、`has`、`hasValue`）和模型数据导出方法（`dump`）。
 *
 * @类型参数 T - 派生模型类的类型。
 *
 * @示例
 * ```typescript
 * class MyModel extends BaseModel { ... }
 * const instance = MyModel.inst(executionContext);
 * instance.set('foo.bar', 42);
 * ```
 */
export abstract class BaseModel implements AbstractModel {
    /** 运行期共享数据，由框架注入 */
    protected readonly refctx: Record<string, any>;
    /** 基础路径． */
    protected readonly base: string;

    /**
     * 运行期只允许派生类调用，但类型系统里当成 public，
     * 这样 `typeof BaseModel` 才能满足 `new (...args: any) => any`
     */
    public constructor(ctx: Record<string, any>, base: string) {
        this.refctx = ctx;
        this.base = base;
    }

    /* ---------------------------------------------------------- */
    /*  任务链级单例工厂：类型自动推导、零样板                          */
    // ✅ 优先使用静态 key（若有），否则使用类名
    // 必须类成员声明了basePath,如果没声明，则默认从根路径开始．
    /* ---------------------------------------------------------- */
    static inst<T extends typeof BaseModel>(
        this: T,
        exeCtx: ExecutionContext
    ): InstanceType<T> {
        const key =
            "key" in this && typeof (this as any).key === "string"
                ? (this as any).key
                : this.name;

        // 若上下文中尚无该模型实例，则创建
        if (!exeCtx.models[key]) {
            const basePath =
                "basePath" in this && typeof (this as any).basePath === "string"
                    ? (this as any).basePath
                    : "";

            const PublicCtor = this as unknown as new (
                ctx: Record<string, any>,
                basePath: string
            ) => InstanceType<T>;

            exeCtx.models[key] = new PublicCtor(exeCtx.task.sharedContext, basePath);
        }

        return exeCtx.models[key] as InstanceType<T>;
    }

    protected buildPath(path: string) {
        const subPath = path ? `.${path}` : path;
        return this.base ? `${this.base}${subPath}` : path;
    }

    get(path: string, defval: any) {
        return objpath.get(this.refctx, this.buildPath(path), defval);
    }

    has(path: string): boolean {
        return objpath.has(this.refctx, this.buildPath(path));
    }

    set(path: string, val: any) {
        objpath.set(this.refctx, this.buildPath(path), val);
    }

    /**
     * 检查 base 路径下的指定路径是否存在且具有“非空”值。
     * 使用独立的纯函数进行深度空值判断。
     */
    hasValue(path: string = ""): boolean {
        const value = objpath.get(this.refctx, this.buildPath(path));
        return hasValueDeep(value);
    }

    /**
     * 
     * @returns 导出自身值．
     */
    dump(): any {
        return this.get("", {});
    }
}

/**
 * 
class UserModel extends BaseModel {
  getUser(id: string) { return this.refctx.db.collection('user').findOne({ id }) }
}

const user = UserModel.inst(exeCtx,"a.b").getUser('u123')
 */
