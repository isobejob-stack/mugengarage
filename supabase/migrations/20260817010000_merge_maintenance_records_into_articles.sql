-- 整備実績（maintenance_records）をブログ（articles）へ統合する（発注者要望 2026-08-17）。
--
-- 【なぜ統合するのか】
-- 整備実績とブログは「店主が書く読み物」という点で同じもので、
-- 入口・管理画面・SEO（Article構造化データ）を二重に持つ理由が無かった。
-- 実データも整備実績1件に対しブログ7件で、独立した導線を維持するほどの量が無い。
-- 統合後は articles.category = '整備記録' として同じ一覧の中で絞り込める（lib/content/categories.ts）。
--
-- 【冪等性】
-- 何度実行しても結果が変わらないように書いてある。
--   - 移行済み判定は「同じタイトルの『整備記録』カテゴリの記事があるか」で行う
--     （articles に移行元IDを持つカラムが無いため、タイトル＋カテゴリを移行済みマーカーとして使う）
--   - カテゴリ正規化のUPDATEは、2回目以降は対象行が無くなる書き方にしてある
--
-- 【物理削除しない】
-- BR-DEL-001に従い、移行元の maintenance_records は deleted_at を立てるだけにする。
-- 移行結果に問題があったときに元の本文を突き合わせられる状態を残す。

-- ── 1〜3. 整備実績を記事へ移し、関連コンテンツを張り替え、移行元を論理削除する ──────
-- 3ステップをひとつのDOブロックにまとめる。途中で失敗したときに
-- 「記事は作られたが関連の張り替えだけ漏れた」という中途半端な状態を残さないため
-- （DOブロック全体がひとつのトランザクションとして実行される）。
do $$
declare
  rec record;
  target_slug text;
  new_body text;
  new_article_id uuid;
begin
  for rec in
    select id, title, slug, issue_description, cost, body, created_at
    from maintenance_records
    where deleted_at is null
    order by created_at
  loop
    -- 移行済みなら何もしない（このSQLを2回流しても記事が二重に増えない）
    if exists (
      select 1 from articles
      where category = '整備記録' and title = rec.title
    ) then
      continue;
    end if;

    -- slugは可能な限りそのまま引き継ぐ（既存URLとの対応が追いやすい）。
    -- articles.slug は UNIQUE のため、記事側に同じslugが既にある場合だけ接頭辞を付ける。
    target_slug := rec.slug;
    if exists (select 1 from articles where slug = target_slug) then
      target_slug := 'maintenance-' || rec.slug;
    end if;

    -- それでも衝突する場合は、勝手に別のslugを作らずスキップして人間に判断を委ねる
    -- （URLは後から直すのが最も高くつくため、機械的な連番付与はしない）。
    if exists (select 1 from articles where slug = target_slug) then
      raise notice 'slug衝突のため移行をスキップしました: %', rec.slug;
      continue;
    end if;

    -- 整備実績だけが持っていた「症状」「費用」は、記事にはカラムが無い。
    -- 落とすと情報が消えるため、本文の冒頭に見出し付きで織り込む
    -- （公開側はMarkdownとして描画されるので、そのまま節として読める）。
    new_body := '';
    if rec.issue_description is not null and btrim(rec.issue_description) <> '' then
      new_body := new_body || '## 症状' || E'\n\n' || rec.issue_description || E'\n\n';
    end if;
    if rec.cost is not null then
      new_body := new_body || '## 費用' || E'\n\n'
        || to_char(rec.cost, 'FM999,999,999') || '円（税込）' || E'\n\n';
    end if;
    new_body := new_body || rec.body;

    -- 整備実績は「公開／下書き」を持たず、存在すれば公開されていた。
    -- 移行後も同じ見え方になるよう status='published' とし、
    -- 公開日は記事の並び順が変わらないよう作成日をそのまま使う。
    insert into articles (
      title, slug, body, status, category, published_at, created_at, updated_at
    )
    values (
      rec.title,
      target_slug,
      new_body,
      'published',
      '整備記録',
      rec.created_at,
      rec.created_at,
      now()
    )
    returning id into new_article_id;

    -- related_contents はポリモーフィック参照（BR-DOM-004）。
    -- 移行元を指したままにすると、公開側で解決できない関連（=無言で消える関連）になるため、
    -- 新しい記事へ張り替える。from側・to側の両方向を直す。
    update related_contents
    set from_type = 'article', from_id = new_article_id
    where from_type = 'maintenance_record' and from_id = rec.id;

    update related_contents
    set to_type = 'article', to_id = new_article_id
    where to_type = 'maintenance_record' and to_id = rec.id;

    -- 移行元は論理削除（BR-DEL-001: 物理削除しない）。
    -- この行が「移行済み」の目印も兼ねる。
    update maintenance_records
    set deleted_at = now()
    where id = rec.id;
  end loop;
end $$;

-- ── 4. 既存記事のカテゴリを5分類へ正規化する ─────────────────────────────
-- カテゴリは自由入力だったため「モデル紹介」「歴史」「ブランドストーリー」等が混在していた。
-- 表記が割れていると、公開側のカテゴリ絞り込みが同じ内容で複数のchipに分かれてしまう。
-- 対応表は lib/content/categories.ts の5分類に合わせる。
-- 2回目以降の実行では左辺（旧カテゴリ）の行が残っていないため、何も更新されない＝冪等。
update articles
set category = case category
    -- 車種そのものの読み物・歴史・ブランドの話は、読者から見ると同じ「読み物」なので
    -- トリビア・豆知識にまとめる（新着入庫は「今売っている個体の紹介」に限定して使う）
    when 'モデル紹介' then 'トリビア・豆知識'
    when '歴史' then 'トリビア・豆知識'
    when 'ブランドストーリー' then 'トリビア・豆知識'
    -- 維持・メンテナンスは整備記録と同じ内容を指していた
    when '維持・メンテナンス' then '整備記録'
    else category
  end
where category in ('モデル紹介', '歴史', 'ブランドストーリー', '維持・メンテナンス');

-- カテゴリ未設定の既存記事（「クラシックJaguarの魅力とは」）も分類に載せる。
-- 未設定のままだとカテゴリchipのどれを押しても出てこない記事になり、実質埋もれる。
-- created_at の条件は、このSQLを流した後に作られた記事まで巻き込まないためのもの
-- （新規記事のカテゴリ未設定は運用上ありうる状態で、後から勝手に決めてはいけない）。
update articles
set category = 'トリビア・豆知識'
where category is null
  and deleted_at is null
  and created_at < timestamptz '2026-08-17 00:00:00+09';
