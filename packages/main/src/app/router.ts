import { AppContext } from "./context.js";
import { appRouter } from "../api/index.js";
import { isFunction } from "remeda";

export type RouteResult = {
    ok: boolean;
    data?: any;
    error?: Error;
};

export async function applyRoute(
    ctx: AppContext,
    reqPath: string,
    ...args: any[]
): Promise<RouteResult> {
    try {
        // 修复1：使用新的API替代pathOr
        const pathSegments = reqPath.split(".");
        let func: any = appRouter;
        
        for (const segment of pathSegments) {
            if (func && typeof func === 'object') {
                func = func[segment];
            } else {
                func = undefined;
                break;
            }
        }
        
        if (!isFunction(func)) {
            return {
                ok: false,
                error: new Error("路径不存在"),
            };
        }
        
        // 修复2：正确处理apply的参数类型
        const result = await (func as Function)(ctx, ...args);
        
        return {
            ok: true,
            data: result,
        };
    } catch (error) {
        return {
            ok: false,
            error: error as Error,
        };
    }
}

export type AppRouter = typeof appRouter;