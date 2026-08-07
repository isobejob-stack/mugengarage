// テストサポート: `createAdminClient()` が返すSupabaseクライアントの最小限のフェイク実装。
//
// 方針（ISSUE-004 課題2対応）:
// 実DBに接続するE2Eではなく、`lib/supabase/admin.ts` の `createAdminClient` をモックした
// ユニット/統合テストとして書く。Route Handler内で直接 `supabase.from(table)...` と
// チェインされる呼び出しだけを対象にすれば十分なため、汎用のクエリビルダーは実装せず、
// 「テーブル名＋メソッド呼び出し履歴」を記録しつつ、事前に設定した結果を返すだけの
// フェイクを用意する。
//
// supabase-jsのクエリビルダーは `.select()` / `.update()` などのメソッドチェインの後、
// 最終的に `await` されることで初めて実行される「thenable」オブジェクトである
// （`.single()` / `.maybeSingle()` を挟む場合はそちらがPromiseを返す）。
// このフェイクも同様に、チェインの起点となる `.from(table)` ごとに新しいビルダーを作り、
// どのメソッドが呼ばれてもビルダー自身を返しつつ呼び出し内容を記録し、
// 最終的に await された時点で登録済みの結果を解決する。

export interface MockCall {
  table: string;
  method: string;
  args: unknown[];
}

export interface QueryResult<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

type ResultResolver = (calls: MockCall[]) => QueryResult;
type TableResultConfig = QueryResult | ResultResolver;

export interface SupabaseAdminMock {
  client: {
    from: (table: string) => unknown;
  };
  calls: MockCall[];
  callsFor: (table: string) => MockCall[];
  /** 指定テーブルへの最初の insert() 呼び出しの引数（挿入値）を取得する */
  firstInsertArg: (table: string) => unknown;
}

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "neq",
  "is",
  "in",
  "order",
  "limit",
  "returns",
] as const;

export function createSupabaseAdminMock(
  results: Record<string, TableResultConfig> = {},
): SupabaseAdminMock {
  const calls: MockCall[] = [];

  function makeBuilder(table: string) {
    const tableCalls: MockCall[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};

    for (const method of CHAIN_METHODS) {
      builder[method] = (...args: unknown[]) => {
        const call: MockCall = { table, method, args };
        calls.push(call);
        tableCalls.push(call);
        return builder;
      };
    }

    const resolve = (): QueryResult => {
      const config = results[table];
      if (!config) return { data: null, error: null };
      return typeof config === "function" ? config(tableCalls) : config;
    };

    // `.single()` / `.maybeSingle()` はそれ自体がPromiseを返す
    builder.single = () => Promise.resolve(resolve());
    builder.maybeSingle = () => Promise.resolve(resolve());

    // `.select().eq(...)` のように .single() を挟まず直接 await される場合に対応する
    builder.then = (
      onFulfilled?: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolve()).then(onFulfilled, onRejected);

    return builder;
  }

  const client = {
    from: (table: string) => makeBuilder(table),
  };

  return {
    client,
    calls,
    callsFor: (table: string) => calls.filter((c) => c.table === table),
    firstInsertArg: (table: string) =>
      calls.find((c) => c.table === table && c.method === "insert")
        ?.args?.[0],
  };
}
