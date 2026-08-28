"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { patchJson, postJson } from "@/lib/api/client";
import { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/auth/schema";
import type { AdminAccount } from "@/lib/auth/queries";

// FR-ADM-002: 管理アカウントの追加・パスワード変更・停止／再開。
//
// この画面が無かったころ、管理者を1人増やすにはSupabaseのダッシュボードで
// ユーザーを作り、UIDをコピーしてSQLを書く必要があった。
// 実際にそれを行うのは開発者で、店主は自分では増やせなかった。

// 覚えるのではなく「控えて渡す」ことを前提にしたパスワードを作る。
//
// 紛らわしい文字（0とO、1とlとI）を最初から候補に入れない。
// 紙に書いて渡す・電話で読み上げるという渡し方をするため、
// 「打ち間違いようがない」ことのほうが、記号の多さより効いてくる。
const PASSWORD_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(length = 16) {
  // Math.random ではなく暗号用の乱数を使う。
  // 作られるのは管理画面のパスワードで、推測できる並びになってはいけない。
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(
    values,
    (v) => PASSWORD_ALPHABET[v % PASSWORD_ALPHABET.length],
  ).join("");
}

function formatDateTime(value: string | null) {
  if (!value) return "まだログインしていません";
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminAccountsManager({
  initialAccounts,
  currentUserId,
}: {
  initialAccounts: AdminAccount[];
  currentUserId: string;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // 作成直後だけ、渡すべき内容をそのまま読み上げられる形で見せる。
  // 画面を離れると二度と表示できないので、その旨も一緒に出す。
  const [justCreated, setJustCreated] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const [passwordTargetId, setPasswordTargetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordDone, setPasswordDone] = useState<string | null>(null);

  const [pendingDisable, setPendingDisable] = useState<AdminAccount | null>(
    null,
  );
  const [toggleError, setToggleError] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setJustCreated(null);

    setCreating(true);
    const result = await postJson<AdminAccount>("/api/admin/accounts", {
      name,
      email,
      password,
    });
    setCreating(false);

    if (!result.ok) {
      setCreateError(result.message);
      return;
    }

    setAccounts((prev) => [...prev, result.data]);
    setJustCreated({ name, email: result.data.email, password });
    setName("");
    setEmail("");
    setPassword("");
  };

  const savePassword = async (id: string) => {
    setPasswordError(null);
    setSavingPassword(true);
    const result = await patchJson(`/api/admin/accounts/${id}`, {
      password: newPassword,
    });
    setSavingPassword(false);

    if (!result.ok) {
      setPasswordError(result.message);
      return;
    }

    setPasswordDone(newPassword);
  };

  const setEnabled = async (account: AdminAccount, enabled: boolean) => {
    setToggleError(null);
    const result = await patchJson(`/api/admin/accounts/${account.id}`, {
      enabled,
    });

    if (!result.ok) {
      setToggleError(result.message);
      return;
    }

    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, enabled } : a)),
    );
  };

  const passwordTarget = accounts.find((a) => a.id === passwordTargetId);

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section>
        <h2 className="text-charcoal-900 font-serif text-lg font-bold">
          いまログインできる人
        </h2>
        {toggleError && (
          <p className="mt-3 text-base text-red-600" role="alert">
            {toggleError}
          </p>
        )}
        <ul className="mt-3 flex flex-col gap-3">
          {accounts.map((account) => (
            <li key={account.id}>
              <Card>
                <CardBody className="flex flex-row flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-charcoal-900 text-lg font-semibold">
                      {account.name}
                      {account.id === currentUserId && (
                        <span className="text-foreground-muted ml-2 text-base font-normal">
                          （いまログイン中のあなた）
                        </span>
                      )}
                    </p>
                    <p className="text-foreground-muted truncate text-base">
                      {account.email}
                    </p>
                    <p className="text-foreground-muted text-sm">
                      最終ログイン: {formatDateTime(account.last_sign_in_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <StatusBadge
                      label={account.enabled ? "使えます" : "停止中"}
                      tone={account.enabled ? "success" : "neutral"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPasswordTargetId(account.id);
                        setNewPassword(generatePassword());
                        setPasswordError(null);
                        setPasswordDone(null);
                      }}
                    >
                      パスワードを変える
                    </Button>
                    {account.id !== currentUserId &&
                      (account.enabled ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDisable(account)}
                        >
                          停止する
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void setEnabled(account, true)}
                        >
                          使えるように戻す
                        </Button>
                      ))}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-charcoal-900 font-serif text-lg font-bold">
          管理する人を増やす
        </h2>
        <p className="text-foreground-muted mt-2 text-base leading-relaxed">
          メールアドレスとパスワードを決めると、その場でログインできるようになります。
          確認メールは届きません。決めた内容をそのまま本人に伝えてください。
        </p>

        <Card className="mt-4">
          <CardBody>
            <form onSubmit={create} className="flex flex-col gap-4">
              <label className="block">
                <span className="text-charcoal-900 text-base font-medium">
                  名前
                </span>
                <span className="text-foreground-muted block text-sm">
                  管理画面と操作記録に表示されます（例: 磯部 太郎）
                </span>
                <input
                  type="text"
                  className="input mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </label>

              <label className="block">
                <span className="text-charcoal-900 text-base font-medium">
                  メールアドレス
                </span>
                <span className="text-foreground-muted block text-sm">
                  ログインするときに使います
                </span>
                <input
                  type="email"
                  className="input mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </label>

              <div>
                <label className="block">
                  <span className="text-charcoal-900 text-base font-medium">
                    パスワード
                  </span>
                  <span className="text-foreground-muted block text-sm">
                    {ADMIN_PASSWORD_MIN_LENGTH}文字以上。
                    思いつかないときは下のボタンで作れます
                  </span>
                  {/* 伏せ字にしない。ここは本人に伝えるために一度だけ見る値で、
                      伏せると書き写す前に打ち間違いへ気付けない。 */}
                  <input
                    type="text"
                    className="input mt-1 font-mono"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setPassword(generatePassword())}
                >
                  パスワードを自動で作る
                </Button>
              </div>

              {createError && (
                <p className="text-base text-red-600" role="alert">
                  {createError}
                </p>
              )}

              <div>
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? "追加中..." : "この内容で追加する"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {justCreated && (
          <div
            className="mt-4 rounded-2xl border border-green-300 bg-green-50 p-4"
            role="status"
          >
            <p className="text-charcoal-900 text-base font-bold">
              {justCreated.name}さんのアカウントを作りました
            </p>
            <p className="text-foreground-muted mt-1 text-base">
              この内容をご本人にお伝えください。
              <strong className="text-charcoal-900">
                パスワードをこの画面で見られるのは今だけです。
              </strong>
              分からなくなったときは、上の一覧から作り直せます。
            </p>
            <dl className="mt-3 flex flex-col gap-1 text-base">
              <div className="flex flex-wrap gap-2">
                <dt className="text-foreground-muted w-32">ログイン画面</dt>
                <dd className="text-charcoal-900 font-mono">/admin/login</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="text-foreground-muted w-32">
                  メールアドレス
                </dt>
                <dd className="text-charcoal-900 font-mono break-all">
                  {justCreated.email}
                </dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="text-foreground-muted w-32">パスワード</dt>
                <dd className="text-charcoal-900 font-mono break-all">
                  {justCreated.password}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      {/* パスワードの変更。作成フォームと同じ「見える入力欄＋自動生成」で揃える。 */}
      {passwordTarget && (
        <dialog
          open
          className="shadow-medium fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6"
        >
          <h2 className="text-charcoal-900 font-serif text-xl font-bold">
            {passwordTarget.name}さんのパスワードを変える
          </h2>

          {passwordDone ? (
            <>
              <p className="text-foreground-muted mt-2 text-base">
                変更しました。この内容をご本人にお伝えください。
                次にログインするときから、新しいパスワードが必要になります。
              </p>
              <p className="text-charcoal-900 mt-3 font-mono text-lg break-all">
                {passwordDone}
              </p>
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setPasswordTargetId(null);
                    setPasswordDone(null);
                    setNewPassword("");
                  }}
                >
                  閉じる
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-foreground-muted mt-2 text-base">
                新しいパスワードを決めます。今のパスワードは分からなくても構いません。
              </p>
              <input
                type="text"
                className="input mt-3 font-mono"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setNewPassword(generatePassword())}
              >
                パスワードを自動で作る
              </Button>

              {passwordError && (
                <p className="mt-3 text-base text-red-600" role="alert">
                  {passwordError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordTargetId(null);
                    setNewPassword("");
                    setPasswordError(null);
                  }}
                >
                  やめる
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={savingPassword}
                  onClick={() => void savePassword(passwordTarget.id)}
                >
                  {savingPassword ? "変更中..." : "この内容に変える"}
                </Button>
              </div>
            </>
          )}
        </dialog>
      )}

      <ConfirmDialog
        open={pendingDisable !== null}
        title="このアカウントを停止します"
        description={
          pendingDisable
            ? `${pendingDisable.name}さんは管理画面にログインできなくなります。これまでの操作の記録は残ります。停止したあとでも、この画面からいつでも元に戻せます。`
            : ""
        }
        confirmLabel="停止する"
        onCancel={() => setPendingDisable(null)}
        onConfirm={() => {
          const account = pendingDisable;
          setPendingDisable(null);
          if (account) void setEnabled(account, false);
        }}
      />
    </div>
  );
}
