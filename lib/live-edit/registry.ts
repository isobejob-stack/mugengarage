// 公開画面から直接書き換えてよい項目の許可リスト。
//
// ライブ編集（管理画面の中に公開画面を出し、クリックしてその場で直す機能）は、
// 「画面に出ている文字」と「DBの列」を対応付けないと成立しない。
// その対応をここ1箇所に集め、APIはこの表に載っている組み合わせしか書き込まない。
//
// テーブル名・列名をリクエストから受け取らないのが重要な点で、
// 表に無い組み合わせは問答無用で拒否される（任意の列を書き換えられる口にしないため）。

export type EditableInputKind =
  // 1行のテキスト（見出し・タイトル）
  | "text"
  // 複数行のテキスト（Markdownではない説明文）
  | "textarea"
  // Markdown本文
  | "markdown"
  // 整数（価格・年式など）
  | "number"
  // 画像。列の書き換えではなくファイルのアップロードになるため、保存の経路が他と異なる
  | "image";

export type EditableFieldConfig = {
  /** 編集パネルの見出し。店主に伝わる言葉にする */
  label: string;
  input: EditableInputKind;
  /** 入力欄の下に出す補足。単位や注意点がある項目にだけ付ける */
  help?: string;
};

export type EditableTargetConfig = {
  /** 書き込み先のテーブル。リクエストからは受け取らない */
  table: string;
  /** パネルに出す対象の呼び名 */
  label: string;
  /**
   * 単一行テーブル（店舗設定）の固定ID。
   * 指定があるとき、リクエストのidは無視してこの行だけを更新する。
   */
  singletonId?: string;
  /**
   * idではなくkey（文字列）で1行を特定し、無ければ作るテーブル。
   * 画面の固定文言（site_texts）専用で、編集して初めて行ができる。
   */
  keyed?: boolean;
  /**
   * 画像を差し替え・追加するときの送り先。
   * 画像は列の書き換えではなくファイルのアップロードなので、既存のアップロードAPIへ
   * そのままFormDataを送る（写真の圧縮・Storage保存・並び順の採番はそちらが持っている）。
   * `{id}` は対象のIDに置き換える。
   */
  upload?: {
    pathTemplate: string;
    /** FormDataのフィールド名。既存APIの受け口に合わせる */
    fieldName: string;
    multiple: boolean;
    /** 編集パネルから既存の管理画面へ送るときの行き先（並び替え・削除はそちらで行う） */
    manageePathTemplate?: string;
  };
  fields: Record<string, EditableFieldConfig>;
};

export const EDITABLE_TARGETS: Record<string, EditableTargetConfig> = {
  vehicle: {
    table: "vehicles",
    label: "車両",
    fields: {
      // 公開ステータス・スラッグ・関連付けは、その場のクリックで変えると
      // 影響範囲が大きいためライブ編集の対象にしない（従来の編集画面で行う）。
      price: { label: "車両本体価格", input: "number", help: "円" },
      total_price: { label: "支払総額", input: "number", help: "円・諸費用込み" },
      model_year: { label: "年式", input: "number", help: "西暦" },
      mileage_km: { label: "走行距離", input: "number", help: "km" },
      engine: { label: "エンジン", input: "text" },
      transmission: { label: "ミッション", input: "text" },
      exterior_color: { label: "外装色", input: "text" },
      interior_color: { label: "内装色", input: "text" },
      seat_material: { label: "シート素材", input: "text" },
      location_text: { label: "車両所在地", input: "text" },
      sales_comment: { label: "販売コメント", input: "markdown" },
      manager_comment: { label: "店長コメント", input: "markdown" },
      appeal_points: { label: "この車の魅力", input: "markdown" },
      engine_features: { label: "エンジンの特徴", input: "markdown" },
      common_issues: { label: "よくある故障", input: "markdown" },
      maintenance_cost: { label: "維持費", input: "markdown" },
    },
  },
  // 車両の写真。列ではなく vehicle_photos への追加なので、保存経路が他と違う。
  // 在庫21台に対して写真が1枚しか登録されていない状態が続いており（2026-08-17時点）、
  // 「公開画面を見て、写真が無いことに気付いたその場で足せる」ことに一番価値がある。
  vehicle_photos: {
    table: "vehicle_photos",
    label: "車両の写真",
    upload: {
      pathTemplate: "/api/admin/vehicles/{id}/photos",
      fieldName: "files",
      multiple: true,
      manageePathTemplate: "/admin/vehicles/{id}/edit",
    },
    fields: {
      photos: {
        label: "写真",
        input: "image",
        help: "複数枚まとめて選べます。並び替え・削除・トリミングは編集画面で行えます",
      },
    },
  },
  article: {
    table: "articles",
    label: "記事",
    fields: {
      title: { label: "記事タイトル", input: "text" },
      category: { label: "カテゴリ", input: "text" },
      body: { label: "本文", input: "markdown" },
    },
  },
  encyclopedia_entry: {
    table: "encyclopedia_entries",
    label: "図鑑",
    fields: {
      title: { label: "見出し", input: "text" },
      body: { label: "本文", input: "markdown" },
    },
  },
  library_entry: {
    table: "library_entries",
    label: "ライブラリ",
    fields: {
      title: { label: "用語", input: "text" },
      reading_kana: { label: "読みがな", input: "text" },
      body: { label: "解説", input: "markdown" },
    },
  },
  timeline_event: {
    table: "timeline_events",
    label: "年表",
    fields: {
      title: { label: "出来事", input: "text" },
      body: { label: "説明", input: "markdown" },
    },
  },
  // 画面に直接書かれていた固定文言。keyでupsertする（supabase/migrations/20260817020000）。
  // 「本番画面と同じものを見ながら一言一句を直せる」ようにするための受け皿。
  site_text: {
    table: "site_texts",
    label: "画面の文言",
    keyed: true,
    fields: {
      value: { label: "文言", input: "textarea" },
    },
  },
  site_settings: {
    table: "site_settings",
    label: "店舗情報",
    singletonId: "singleton",
    fields: {
      address: { label: "住所", input: "text" },
      postal_code: { label: "郵便番号", input: "text" },
      phone: { label: "電話番号", input: "text" },
      business_hours: { label: "営業時間", input: "text" },
      closed_days: { label: "定休日", input: "text" },
      access_info: { label: "アクセス", input: "textarea" },
      representative_name: { label: "代表者名", input: "text" },
    },
  },
};

export function resolveEditableField(type: string, field: string) {
  const target = EDITABLE_TARGETS[type];
  if (!target) return null;
  const config = target.fields[field];
  if (!config) return null;
  return { target, config };
}
