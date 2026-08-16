import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/ui/markdown";
import { Editable } from "@/components/live-edit/editable";
import {
  getPublicVehicleBySlug,
  getVehiclePhotos,
  getVehicleVideos,
  getLeadVehiclePhotoPaths,
} from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { VehicleStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/engagement/favorite-button";
import { getSessionId } from "@/lib/engagement/session";
import { listFavoriteVehicleIds } from "@/lib/engagement/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import {
  KnowledgeLinksSection,
  SimilarVehiclesSection,
} from "@/components/related/related-discovery";
import { getAutoRelatedForVehicle } from "@/lib/related/auto";
import { VehicleMediaGallery } from "@/components/inventory/vehicle-media-gallery";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CarIcon } from "@/components/ui/car-icon";
import { getSeoMeta } from "@/lib/seo/queries";
import { buildPublicPath } from "@/lib/seo/paths";
import {
  buildVehicleStructuredData,
  serializeStructuredData,
} from "@/lib/seo/structured-data";
import {
  SITE_NAME,
  SITE_URL,
  buildLineConsultationUrl,
} from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings/queries";
import { absoluteTitle } from "@/lib/seo/metadata";
import {
  formatMileage,
  formatModelYear,
  formatShakenValue,
  formatLegalMaintenanceValue,
  formatRecycleFeeValue,
  formatSteeringSideValue,
} from "@/lib/inventory/display";

type SpecRow = {
  label: string;
  value: string;
  fullWidth?: boolean;
  breakAll?: boolean;
};

// 主要諸元の1行分。値が未登録（null/空文字）なら null を返し、呼び出し側で行ごと落とす。
// 「未設定」「-」といったプレースホルダを並べても購入判断の材料にならず、
// 実際に登録されている情報を埋もれさせるため（BR-DISP-001）。
function spec(
  label: string,
  value: string | null,
  options: { fullWidth?: boolean; breakAll?: boolean } = {},
): SpecRow | null {
  if (!value) return null;
  return { label, value, ...options };
}

// 修復歴・記録簿のような「あり／なし」項目。
// なしであることにも購入判断上の価値があるため、falseも表示する。
function formatYesNo(value: boolean | null): string | null {
  if (value === null) return null;
  return value ? "あり" : "なし";
}

function buildVehicleDisplayName(vehicle: {
  manufacturers: { name: string } | null;
  models: { name: string } | null;
  model_year: number | null;
}) {
  return [
    vehicle.manufacturers?.name,
    vehicle.models?.name,
    vehicle.model_year ? `${vehicle.model_year}年` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

// FR-INV-011 / FR-SEO-001: 車両ごとに設定されたSEOメタ情報（Title/Description/OGP/Canonical）を
// generateMetadataで反映する。未設定の場合は車両情報から自動生成した値をフォールバックとして使う。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);

  if (!vehicle) {
    return {};
  }

  const seoMeta = await getSeoMeta("vehicle", vehicle.id);
  const displayName = buildVehicleDisplayName(vehicle);
  // ルートlayoutの title.template（"%s｜エムガレージ"）が適用されるため、ここで店舗名を
  // 付けると「◯◯｜エムガレージ｜エムガレージ」と二重になる。車両名のみを渡す。
  // 管理画面でSEOタイトルが明示指定されている場合は、その文言をそのまま出したいので
  // template を適用させない（absolute）。
  const title = displayName;
  const description =
    seoMeta?.description ||
    vehicle.sales_comment ||
    vehicle.appeal_points ||
    `${displayName}の車両詳細ページです。`;
  const canonicalPath = buildPublicPath("vehicle", slug) ?? `/vehicles/${slug}`;
  const canonicalUrl = seoMeta?.canonical_url || `${SITE_URL}${canonicalPath}`;

  return {
    title: seoMeta?.title ? absoluteTitle(seoMeta.title) : title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      // openGraph.title には title.template が効かないため、明示的に店舗名まで含める
      title: seoMeta?.title || `${title}｜${SITE_NAME}`,
      description,
      url: canonicalUrl,
      images: seoMeta?.og_image_url ? [seoMeta.og_image_url] : undefined,
    },
  };
}

// SCR-PUB-003: 車両詳細（FR-VEH-001, 002, 003, 005, 006, 008。FR-INV-010: 動画埋め込み）
// FR-SEO-002: Schema.org構造化データ（JSON-LD）をVehicle/Productスキーマ（Car型）で出力する
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  const settings = await getSiteSettings();
  const lineConsultUrl = buildLineConsultationUrl(
    settings.line_url,
    "purchase",
    buildVehicleDisplayName(vehicle),
  );

  const sessionId = await getSessionId();
  const [favoriteIds, related, photos, videos] = await Promise.all([
    sessionId ? listFavoriteVehicleIds(sessionId) : Promise.resolve([]),
    listRelatedContents("vehicle", vehicle.id),
    getVehiclePhotos(vehicle.id),
    getVehicleVideos(vehicle.id),
  ]);
  const isFavorited = favoriteIds.includes(vehicle.id);

  // 自動関連（回遊の土台）。手動指定と重複するものは自動側を落とす。
  const { similarVehicles, knowledge } = await getAutoRelatedForVehicle({
    id: vehicle.id,
    model_id: vehicle.model_id,
    model_year: vehicle.model_year,
    models: vehicle.models,
  });
  const manualKeys = new Set(related.map((r) => `${r.type}:${r.id}`));
  const autoKnowledge = knowledge.filter(
    (item) => !manualKeys.has(`${item.type}:${item.id}`),
  );

  const similarPhotoPaths = await getLeadVehiclePhotoPaths(
    similarVehicles.map((v) => v.id),
  );
  const similarPhotoUrls = similarVehicles.map((v) => {
    const path = similarPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : undefined;
  });
  const photosWithUrl = photos.map((photo) => ({
    id: photo.id,
    public_url: getVehiclePhotoPublicUrl(photo.storage_path),
  }));
  // UIUXデザイナーレビュー指摘: ギャラリー画像のalt属性に使う車両名（メーカー・モデル・年式）
  const vehicleName = buildVehicleDisplayName(vehicle);

  // 第3要素は車両テーブルの列名。ライブ編集（管理画面から公開画面を見ながら直す）で
  // 「画面のこの文章」と「DBのどの列」を対応付けるために持つ（lib/live-edit/registry.ts）。
  // storyだけは許可リストに載せていないため、編集対象にはならない（nullを渡す）。
  const markdownSections: Array<[string, string | null, string | null]> = [
    ["この車の魅力", vehicle.appeal_points, "appeal_points"],
    ["販売コメント", vehicle.sales_comment, "sales_comment"],
    ["店長コメント", vehicle.manager_comment, "manager_comment"],
    ["ストーリー", vehicle.story, null],
    ["エンジンの特徴", vehicle.engine_features, "engine_features"],
    ["よくある故障", vehicle.common_issues, "common_issues"],
    ["維持費", vehicle.maintenance_cost, "maintenance_cost"],
  ];

  // FR-SEO-002: 構造化データ（JSON-LD）。canonical URLはgenerateMetadataと同じ導出ロジックを使う
  const seoMeta = await getSeoMeta("vehicle", vehicle.id);
  const canonicalPath = buildPublicPath("vehicle", slug) ?? `/vehicles/${slug}`;
  const canonicalUrl = seoMeta?.canonical_url || `${SITE_URL}${canonicalPath}`;
  const structuredData = buildVehicleStructuredData({
    vehicle,
    name: vehicleName,
    description: seoMeta?.description ?? vehicle.sales_comment,
    images: photosWithUrl.map((p) => p.public_url),
    url: canonicalUrl,
  });

  // レビュー指摘対応（必須修正4）: JSON-LDの中身は車両詳細（管理者入力を含む）から組み立てているため、
  // `</script>` 等のシーケンスが紛れ込んでいた場合にscriptタグを閉じてしまう
  // スクリプトインジェクションを防ぐ。エスケープ処理は他ページのJSON-LDと共有する
  // （ページごとに書くと1箇所で忘れた瞬間に穴になるため）。
  const structuredDataJson = serializeStructuredData(structuredData);

  // 価格の直下に出す要約4項目。下の主要諸元表と同じ表示関数を通すため、
  // 「車検整備付」等の文言が2箇所でずれることはない。
  const summarySpecs = [
    { label: "年式", value: formatModelYear(vehicle.model_year) },
    { label: "走行距離", value: formatMileage(vehicle.mileage_km) },
    {
      label: "車検",
      value: formatShakenValue(vehicle.shaken_status, vehicle.shaken_expiry),
    },
    { label: "修復歴", value: formatYesNo(vehicle.accident_history) },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  );

  // 主要諸元（ISSUE-006）。カーセンサー・グーネット等の中古車サイトと同じく、
  // 全項目を1つの表に並べるのではなく意味のまとまりごとに見出しを付ける。
  // 項目数が多いため、フラットに並べると「どこを見れば良いか」が分からなくなり、
  // 年齢層の高い購入検討者ほど読み飛ばしが起きやすいための構成。
  //
  // 値が未登録の項目は行ごと出さない（BR-DISP-001）。
  // その結果1項目も残らなかったグループは、見出しだけが浮かないようグループごと出さない。
  const specGroups = [
    {
      title: "基本情報",
      rows: [
        spec("年式", formatModelYear(vehicle.model_year)),
        spec(
          "登録年",
          vehicle.registration_year === null
            ? null
            : `${vehicle.registration_year}年`,
        ),
        spec("走行距離", formatMileage(vehicle.mileage_km)),
        spec(
          "車検",
          formatShakenValue(vehicle.shaken_status, vehicle.shaken_expiry),
        ),
        spec("修復歴", formatYesNo(vehicle.accident_history)),
        spec("記録簿", formatYesNo(vehicle.has_record_book)),
        spec("型式", vehicle.model_code),
        spec("ハンドル", formatSteeringSideValue(vehicle.steering_side)),
        spec("ボディタイプ", vehicle.body_type),
        spec(
          "乗車定員",
          vehicle.capacity === null ? null : `${vehicle.capacity}名`,
        ),
        spec(
          "ドア数",
          vehicle.door_count === null ? null : `${vehicle.door_count}ドア`,
        ),
        spec("燃料", vehicle.fuel_type),
      ],
    },
    {
      title: "エンジン・駆動",
      rows: [
        spec("エンジン", vehicle.engine),
        spec("エンジン型式", vehicle.engine_model_code),
        spec(
          "排気量",
          vehicle.displacement_cc === null
            ? null
            : `${vehicle.displacement_cc.toLocaleString()}cc`,
        ),
        spec(
          "馬力",
          vehicle.horsepower === null ? null : `${vehicle.horsepower}ps`,
        ),
        spec("トルク", vehicle.torque),
        spec("ミッション", vehicle.transmission),
        spec("駆動方式", vehicle.drivetrain),
      ],
    },
    {
      title: "外装・内装",
      rows: [
        spec("外装色", vehicle.exterior_color),
        spec("内装色", vehicle.interior_color),
        spec("シート素材", vehicle.seat_material),
      ],
    },
    {
      title: "販売条件",
      rows: [
        spec(
          "法定整備",
          formatLegalMaintenanceValue(vehicle.legal_maintenance),
        ),
        spec("リサイクル料金", formatRecycleFeeValue(vehicle.recycle_fee)),
        spec(
          "保管状況",
          vehicle.indoor_storage === null
            ? null
            : vehicle.indoor_storage
              ? "屋内保管"
              : "屋外保管",
        ),
        spec(
          "オーナー数",
          vehicle.owner_count === null ? null : `${vehicle.owner_count}人`,
        ),
        // 「禁煙車」は該当する場合のみ価値のある情報。falseのときに「喫煙車」と
        // 掲げるのは実車の状態以上に不利な印象を与えるため、trueのときだけ出す。
        spec("禁煙車", vehicle.is_non_smoking === true ? "禁煙車" : null),
        spec("車両所在地", vehicle.location_text),
        spec("車台番号", vehicle.vin, { fullWidth: true, breakAll: true }),
      ],
    },
  ]
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => row !== null),
    }))
    .filter((group) => group.rows.length > 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      {/* FR-SEO-006: 検索結果から直接開かれることが多いページのため、
          今どの分類にいるのかと一覧への戻り先を最初に示す */}
      <Breadcrumb
        items={[
          { label: "在庫車両", href: "/vehicles" },
          { label: vehicleName },
        ]}
      />
      <div className="mt-4">
        <VehicleStatusBadge status={vehicle.status} />
      </div>
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold">
        {vehicle.manufacturers?.name} {vehicle.models?.name}
        {vehicle.model_year ? `（${vehicle.model_year}年）` : ""}
      </h1>
      {/* 購入検討者が最終的に比較するのは支払総額のため、登録されていればそちらを主役にし、
          車両本体価格を併記する。支払総額が未確定のあいだは本体価格のみを出す
          （諸費用が分からない段階で総額らしき数字を見せない）。 */}
      <div className="mt-2">
        {vehicle.total_price !== null ? (
          <>
            <p className="text-primary-700 font-mono text-3xl font-bold tabular-nums">
              ¥{vehicle.total_price.toLocaleString()}
              <span className="text-foreground-muted ml-2 font-sans text-base font-medium">
                支払総額（税込）
              </span>
            </p>
            <p className="text-foreground-muted mt-1 font-mono text-lg tabular-nums">
              ¥{vehicle.price.toLocaleString()}
              <span className="ml-2 font-sans text-base">車両本体価格</span>
            </p>
            {/* 支払総額と本体価格の差額＝諸費用（ISSUE-006 3.2）。
                差額を説明せずに2つの金額だけを並べると「この差は何なのか」という
                不信につながるため、金額と主な内訳の名目まで出す。
                総額が本体価格以下（諸費用込みの表記等）の場合は出さない。 */}
            {vehicle.total_price > vehicle.price && (
              <p className="text-foreground-muted mt-1 font-mono text-lg tabular-nums">
                ¥{(vehicle.total_price - vehicle.price).toLocaleString()}
                <span className="ml-2 font-sans text-base">
                  諸費用
                  <span className="ml-1 text-sm">
                    （登録費用・自動車税・自賠責保険料等）
                  </span>
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="text-primary-700 font-mono text-3xl font-bold tabular-nums">
            ¥{vehicle.price.toLocaleString()}
            <span className="text-foreground-muted ml-2 font-sans text-base font-medium">
              車両本体価格（税込）
            </span>
          </p>
        )}
      </div>

      {/* 価格の直下に、購入検討で最初に確認される4項目だけを並べる。
          下の主要諸元表にも同じ値は載っているが、そこまで読み進めないと
          「年式と走行距離はいくつか」が分からないのは往復が多い。
          中古車サイトが例外なく価格の隣にこの4点を置いているのと同じ理由。
          未登録の項目は枠ごと出さない（空欄を並べると情報の無さが強調されるため）。 */}
      {summarySpecs.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {summarySpecs.map((item) => (
            <div
              key={item.label}
              className="bg-cream-100 rounded-xl border border-neutral-200 px-3 py-2.5"
            >
              <dt className="text-foreground-muted text-sm">{item.label}</dt>
              <dd className="text-charcoal-900 mt-0.5 text-base font-semibold">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <FavoriteButton vehicleId={vehicle.id} initialFavorited={isFavorited} />
        {/* FR-LINE-002: 車両詳細ページでは「購入」カテゴリに固定した相談導線を表示する。
            レビュー指摘対応（必須修正3）: プリフィル文言に車両名を含め、ボタン文言と送信内容を一致させる */}
        {lineConsultUrl && (
          <Button href={lineConsultUrl} variant="line" size="md">
            この車をLINEで相談する
          </Button>
        )}
      </div>

      {/* 写真の枠ごと編集対象にする。写真が1枚も無いときの「準備中」表示も含めて囲むのは、
          写真ゼロの車両こそ写真を足したい相手であり、囲まないと押す場所が無くなるため。 */}
      <Editable
        type="vehicle_photos"
        id={vehicle.id}
        field="photos"
        label="この車両の写真"
        as="div"
        className="mt-8 block"
      >
        {photosWithUrl.length === 0 && videos.length === 0 ? (
          // 写真も動画も未登録のとき、ギャラリーは何も描画しないため
          // 価格の直後にいきなり諸元表が来て「作りかけのページ」に見えていた。
          // 一覧カードには「写真準備中」のフォールバックがあるのに詳細には無く、
          // 一覧で写真準備中を見て開いた人ほど落差を感じる状態だった。
          //
          // 写真が無いこと自体は今すぐ解消できないが、
          // 「写真が見たい」という最も強い購入検討サインを相談に変換できる場面でもある。
          // 写真が登録されれば、この枠は自動的にギャラリーへ切り替わる。
          <div className="bg-cream-100 flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 px-6 text-center">
            <CarIcon className="text-foreground-muted h-12 w-12" />
            <p className="text-charcoal-900 text-base font-medium">
              この車両の写真は準備中です
            </p>
            <p className="text-foreground-muted text-sm">
              現車の写真をご希望の方は、お気軽にお問い合わせください。
              個別にお送りいたします。
            </p>
            {lineConsultUrl && (
              <Button href={lineConsultUrl} variant="line" size="md">
                写真をLINEで請求する
              </Button>
            )}
          </div>
        ) : (
          <VehicleMediaGallery
            photos={photosWithUrl}
            videos={videos}
            vehicleName={vehicleName}
          />
        )}
      </Editable>

      {specGroups.map((group) => (
        <section key={group.title} className="mt-14">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            {group.title}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.rows.map((row) => (
              <div
                key={row.label}
                className={
                  row.fullWidth ? "col-span-2 sm:col-span-3" : undefined
                }
              >
                <Row
                  label={row.label}
                  value={row.value}
                  breakAll={row.breakAll}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {markdownSections
        .filter(([, body]) => Boolean(body))
        .map(([title, body, field]) => (
          <section key={title} className="mt-14">
            <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h2>
            <div className="prose mt-3 max-w-none">
              {field ? (
                <Editable
                  type="vehicle"
                  id={vehicle.id}
                  field={field}
                  label={title}
                  as="div"
                >
                  <Markdown>{body as string}</Markdown>
                </Editable>
              ) : (
                <Markdown>{body as string}</Markdown>
              )}
            </div>
          </section>
        ))}

      {/* 店主が手で選んだ関連は従来どおり最優先で出す */}
      <RelatedContentList items={related} title="関連コンテンツ" />

      {/* 手動で紐付いていないぶんを自動判定で補う（lib/related/auto.ts）。
          「この車をもっと知りたい」から図鑑・年表・整備実績へ進めるようにする。 */}
      <KnowledgeLinksSection
        items={autoKnowledge}
        title={`${vehicle.models?.name ?? "この車"}をもっと知る`}
        description="この車種にまつわる解説・歴史・整備の記録です。"
      />

      <SimilarVehiclesSection
        vehicles={similarVehicles}
        photoUrls={similarPhotoUrls}
      />

      <div className="mt-16 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-8">
        <FavoriteButton vehicleId={vehicle.id} initialFavorited={isFavorited} />
        {/* 読み終えた位置から一覧に戻れるようにする。
            検索結果から直接開いた利用者にはブラウザバック以外の戻り手段が無かった。 */}
        <Button href="/vehicles" variant="outline" size="md">
          在庫車両一覧に戻る
        </Button>
      </div>

      {/* レビュー指摘対応（必須修正4）: 01_public_ui_spec.md 5章（SCR-PUB-003, FR-VEH-007）
          「LINE相談CTAは常に画面下部に固定表示することを推奨」に基づく画面下部固定バー。
          冒頭のインラインCTAは早期離脱者への導線として維持したまま併存させる。
          ヘッダーは固定表示ではないため干渉なし。ライトボックス（z-50）より低いz-indexとし、
          モーダル表示中はこのバーの上にライトボックスが正しく重なるようにする。
          fixedを使用（sticky+100vwのフルブリードは縦スクロールバー幅分の横スクロールが
          発生するため不採用）。<main>側にバー高さ分のpadding-bottomを確保済み。 */}
      {/* LINE・電話とも未設定のあいだは、空のバーだけが残らないよう固定バーごと非表示にする。
          数百万円の商材で連絡手段がLINEのみだと、LINEを使わない層を取りこぼす。
          店舗の電話番号が設定されていれば併記する（設定は管理画面 > 店舗情報・リンク）。 */}
      {(lineConsultUrl || settings.phone) && (
        <div className="shadow-strong fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-center gap-3 px-4 sm:h-16">
            {settings.phone && (
              <Button
                href={`tel:${settings.phone}`}
                variant="outline"
                size="md"
                className="w-full max-w-xs"
              >
                電話で問い合わせる
              </Button>
            )}
            {lineConsultUrl && (
              <Button
                href={lineConsultUrl}
                variant="line"
                size="md"
                className="w-full max-w-xs"
              >
                この車をLINEで相談する
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// スペック1件分の表示。カード風の背景・角丸・薄い罫線で「ショールーム的な高級感」を演出する。
// 既存のlabel/value propsは維持したまま、表示方法（table row → gridアイテム）のみ変更している。
// UIUXレビュー指摘: VIN等スペースを含まない連続文字列がgridトラックを押し広げ横スクロールを
// 引き起こしうるため、breakAll（VIN専用）とデフォルトのbreak-words（日本語の色名等）で対応する。
function Row({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="bg-cream-50 shadow-soft rounded-xl border border-neutral-200 px-4 py-3">
      {/* 項目名と値を同じ大きさで置くと、拾い読みする表で視線が値に落ちない。
          項目名を一段小さく、値を大きくして主従を付ける
          （本文16px以上の原則は「読ませる文章」に対するもので、
          表の項目名は値に添えるラベルのため14pxを許容する） */}
      <p className="text-foreground-muted text-sm font-medium">{label}</p>
      <p
        className={`text-charcoal-900 mt-1 text-lg font-semibold ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
