import { describe, expect, it } from "vitest";
import { inquiryFormSchema, emptyInquiryFormValues } from "@/lib/crm/schema";

// 問い合わせフォームの入力検証（lib/crm/schema.ts）。
//
// この画面は、公開サイトで唯一お客様に個人情報を入力させる場所。
// 預かる量を「返信に必要な連絡先1つ」に絞る設計にしてあり、
// その絞り込みが崩れていないことをここで固定する。
// 連絡先の欄が増える方向の変更は、漏れたときの被害を増やす変更でもある。

const base = {
  category: "purchase" as const,
  message: "XJの在庫について伺いたいです",
  name: "",
  website: "",
};

describe("問い合わせフォームの入力検証", () => {
  it("既定値は電話での返信", () => {
    expect(emptyInquiryFormValues.contact_method).toBe("phone");
    expect(emptyInquiryFormValues.contact).toBe("");
  });

  it("連絡先1つと相談内容だけで送信できる", () => {
    const result = inquiryFormSchema.safeParse({
      ...base,
      contact_method: "phone",
      contact: "090-1234-5678",
    });
    expect(result.success).toBe(true);
  });

  // 氏名は任意。無くても返信はできるため、必須にして預かる量を増やさない。
  it("お名前は空でも通る", () => {
    const result = inquiryFormSchema.safeParse({
      ...base,
      name: "",
      contact_method: "email",
      contact: "owner@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("連絡先が空なら弾く", () => {
    const result = inquiryFormSchema.safeParse({
      ...base,
      contact_method: "phone",
      contact: "",
    });
    expect(result.success).toBe(false);
  });

  it("相談内容が空なら弾く", () => {
    const result = inquiryFormSchema.safeParse({
      ...base,
      message: "",
      contact_method: "phone",
      contact: "090-1234-5678",
    });
    expect(result.success).toBe(false);
  });

  // 形式の検証は、選ばれた連絡方法に対してだけ行う。
  describe("選んだ連絡方法に応じた形式の検証", () => {
    it("メールを選んだらメールの形式を求める", () => {
      const result = inquiryFormSchema.safeParse({
        ...base,
        contact_method: "email",
        contact: "090-1234-5678",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["contact"]);
      }
    });

    it("電話を選んだら電話番号の形式を求める", () => {
      const result = inquiryFormSchema.safeParse({
        ...base,
        contact_method: "phone",
        contact: "owner@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("国番号付きの電話番号も受け付ける", () => {
      const result = inquiryFormSchema.safeParse({
        ...base,
        contact_method: "phone",
        contact: "+81 90-1234-5678",
      });
      expect(result.success).toBe(true);
    });
  });

  it("連絡方法は電話とメールのみ", () => {
    const result = inquiryFormSchema.safeParse({
      ...base,
      contact_method: "line",
      contact: "line-id",
    });
    expect(result.success).toBe(false);
  });

  // 以前の形（phone と email を別々に受け取る）では送れないことを固定する。
  // 両方を受け取る実装に戻ると、使わない連絡先まで預かる状態に戻る。
  it("電話番号とメールアドレスを同時に送る形は受け付けない", () => {
    const result = inquiryFormSchema.safeParse({
      category: "purchase",
      message: "両方送りたい",
      name: "磯部",
      phone: "090-1234-5678",
      email: "owner@example.com",
      website: "",
    });
    expect(result.success).toBe(false);
  });
});
