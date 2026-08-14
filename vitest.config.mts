import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// docs/development/testing_strategy.md: 業務ルール（BR-ID）に関わるロジックを
// 最優先でカバーする自動テストの実行基盤。
// 対象は現状すべてRoute Handler / サーバー側ロジックのため environment は "node" とする
// （React Testing Libraryを使うコンポーネントテストを追加する場合はプロジェクト単位の
// environmentOptions またはファイル冒頭の `// @vitest-environment jsdom` で切り替える）。
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // "server-only" はimportされるだけでErrorをthrowするマーカーパッケージ
      // （Next.jsのバンドラのみが "react-server" exports conditionで空ファイルに
      // 差し替える）。Vitest環境ではNext.jsのバンドラを介さないため、
      // パッケージ自身が提供する空実装（empty.js）に差し替える。
      "server-only": path.resolve(dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: false,
  },
});
