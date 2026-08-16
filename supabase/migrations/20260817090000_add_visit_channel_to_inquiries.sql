-- FR-INQ-002 / event_flow.md 3.5: 管理画面からの問い合わせ手動登録に伴う変更。
--
-- 1) inquiries.channel に 'visit'（来店）を追加する。
--    従来のCHECK制約は公開フォームが作る 'form' と、想定していた 'line' / 'phone' / 'email'
--    の4値だけだった。実際にはこの店の相談は来店時に受けることが多く、来店を記録する値が
--    無いと 'phone' や 'other' に丸めるしかなく、チャネル別の集計が実態と合わなくなる。
--    このマイグレーションを適用するまで、管理画面で受付方法「来店」を選ぶと
--    CHECK制約違反になり保存できない（API側はその旨のメッセージを返す）。
--
-- 2) 未完了リマインダーを期日順に横断表示する一覧（FR-CRM-004）向けのインデックスを追加する。
--    既存のインデックスは customer_id のみで、顧客をまたいで期日順に並べる問い合わせを
--    支えるものが無かった。未完了だけを対象にする部分インデックスにしているのは、
--    完了済みが積み上がっても一覧の引き方は変わらないため。

-- drop に if exists を付けているのは、2回目以降の実行と、
-- 制約名が環境によって異なる場合に、途中で止まらないようにするため。
alter table inquiries
  drop constraint if exists inquiries_channel_check,
  add constraint inquiries_channel_check check (
    channel in ('line', 'phone', 'email', 'form', 'visit')
  );

comment on column inquiries.channel is
  '問い合わせの受付経路。form は公開フォーム経由（app/api/inquiries）専用で、管理画面の手動登録では選べない';

create index if not exists reminders_open_due_date_idx
  on reminders (due_date)
  where is_completed = false;
